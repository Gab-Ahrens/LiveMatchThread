/**
 * Thread State Management
 *
 * Tracks which threads have been posted to avoid duplication
 */
import fs from "fs";
import path from "path";

const STATE_PATH = path.join(__dirname, "../..", "thread-state.json");

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
function readState(): ThreadState {
  if (!fs.existsSync(STATE_PATH)) return {};
  const raw = fs.readFileSync(STATE_PATH, "utf-8");
  return JSON.parse(raw);
}

/**
 * Writes the thread state to disk
 */
function writeState(state: ThreadState) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

/**
 * Checks if a thread has already been posted
 */
export function isThreadPosted(
  fixtureId: number,
  type: keyof ThreadState[string]
) {
  const state = readState();
  return state[fixtureId]?.[type] === true;
}

/**
 * Marks a thread as posted
 */
export function markThreadPosted(
  fixtureId: number,
  type: keyof ThreadState[string]
) {
  const state = readState();
  if (!state[fixtureId]) state[fixtureId] = {};
  state[fixtureId][type] = true;
  writeState(state);
}
