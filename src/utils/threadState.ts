/**
 * Thread State Management
 *
 * Tracks which threads have been posted to avoid duplication
 */
import fs from "fs";
import path from "path";

// Path to the state file in the data directory
const STATE_PATH = path.join(__dirname, "../../data/thread-state.json");

// Thread state type
type ThreadState = {
  [fixtureId: string]: {
    preMatchPosted?: boolean;
    matchThreadPosted?: boolean;
    postMatchPosted?: boolean;
  };
};

/**
 * Reads the current thread state from disk
 */
export function readState(): ThreadState {
  try {
    if (fs.existsSync(STATE_PATH)) {
      const rawData = fs.readFileSync(STATE_PATH, "utf8");
      return JSON.parse(rawData);
    }
  } catch (err) {
    console.error("Error reading thread state:", err);
  }

  return {};
}

/**
 * Writes the current thread state to disk
 */
export function writeState(state: ThreadState): void {
  try {
    // Ensure the directory exists
    const dir = path.dirname(STATE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error("Error writing thread state:", err);
  }
}

/**
 * Checks if a specific thread has been posted
 */
export function isThreadPosted(
  fixtureId: number,
  threadType: "preMatchPosted" | "matchThreadPosted" | "postMatchPosted"
): boolean {
  const state = readState();
  return Boolean(state[fixtureId]?.[threadType]);
}

/**
 * Marks a thread as posted
 */
export function markThreadPosted(
  fixtureId: number,
  threadType: "preMatchPosted" | "matchThreadPosted" | "postMatchPosted"
): void {
  const state = readState();

  // Initialize the fixture state if it doesn't exist
  if (!state[fixtureId]) {
    state[fixtureId] = {};
  }

  // Mark the thread as posted
  state[fixtureId][threadType] = true;

  // Write the updated state
  writeState(state);
}
