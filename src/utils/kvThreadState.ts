/**
 * Thread state management using Cloudflare KV storage
 * This is a replacement for the file-based threadState.ts for Cloudflare Workers
 */

// Define the type for thread state
export type ThreadState = {
  [fixtureId: string]: {
    preMatchPosted?: boolean;
    matchThreadPosted?: boolean;
    postMatchPosted?: boolean;
  };
};

/**
 * Checks if a thread has already been posted
 */
export async function isThreadPosted(
  fixtureId: number,
  threadType: "preMatchPosted" | "matchThreadPosted" | "postMatchPosted",
  env: any
): Promise<boolean> {
  if (!env || !env.THREAD_STATE) {
    console.warn("⚠️ THREAD_STATE KV binding not available");
    return false;
  }

  try {
    const key = `fixture-${fixtureId}`;
    const stateJson = await env.THREAD_STATE.get(key);

    if (!stateJson) {
      return false;
    }

    const state = JSON.parse(stateJson);
    return state[threadType] === true;
  } catch (error) {
    console.error("❌ Error checking thread state:", error);
    return false;
  }
}

/**
 * Marks a thread as posted
 */
export async function markThreadPosted(
  fixtureId: number,
  threadType: "preMatchPosted" | "matchThreadPosted" | "postMatchPosted",
  env: any
): Promise<void> {
  if (!env || !env.THREAD_STATE) {
    console.warn("⚠️ THREAD_STATE KV binding not available");
    return;
  }

  try {
    const key = `fixture-${fixtureId}`;

    // Try to get existing state
    let stateJson = await env.THREAD_STATE.get(key);
    let state: any = {};

    if (stateJson) {
      state = JSON.parse(stateJson);
    }

    // Update state
    state[threadType] = true;

    // Write back to KV
    await env.THREAD_STATE.put(key, JSON.stringify(state));
    console.log(
      `✅ Thread state updated: fixture ${fixtureId}, ${threadType} = true`
    );
  } catch (error) {
    console.error("❌ Error updating thread state:", error);
  }
}
