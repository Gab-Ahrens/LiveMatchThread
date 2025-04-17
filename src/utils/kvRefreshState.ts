/**
 * Refresh state management using Cloudflare KV storage
 * This tracks when match data was last refreshed
 */

const REFRESH_KEY = "last-refresh-time";

/**
 * Gets the last time match data was refreshed
 * @returns Date object representing the last refresh time
 */
export async function getLastRefreshTime(env: any): Promise<Date> {
  if (!env || !env.REFRESH_STATE) {
    console.warn("⚠️ REFRESH_STATE KV binding not available");
    // Return a date in the past to force refresh
    return new Date(0);
  }

  try {
    const lastTimeStr = await env.REFRESH_STATE.get(REFRESH_KEY);

    if (!lastTimeStr) {
      // If no refresh time stored, return a date in the past
      return new Date(0);
    }

    return new Date(parseInt(lastTimeStr, 10));
  } catch (error) {
    console.error("❌ Error reading refresh state:", error);
    // Return a date in the past to force refresh
    return new Date(0);
  }
}

/**
 * Updates the refresh time to now
 */
export async function updateRefreshTime(env: any): Promise<void> {
  if (!env || !env.REFRESH_STATE) {
    console.warn("⚠️ REFRESH_STATE KV binding not available");
    return;
  }

  try {
    const now = new Date().getTime();
    await env.REFRESH_STATE.put(REFRESH_KEY, now.toString());
    console.log(`✅ Refresh time updated to ${new Date().toISOString()}`);
  } catch (error) {
    console.error("❌ Error updating refresh time:", error);
  }
}

/**
 * Checks if a refresh is needed based on hours passed
 * @param hoursThreshold Number of hours before a refresh is needed
 */
export async function isRefreshNeeded(
  hoursThreshold: number,
  env: any
): Promise<boolean> {
  const lastRefresh = await getLastRefreshTime(env);
  const now = new Date();
  const hoursSinceRefresh =
    (now.getTime() - lastRefresh.getTime()) / (1000 * 60 * 60);

  return hoursSinceRefresh >= hoursThreshold;
}
