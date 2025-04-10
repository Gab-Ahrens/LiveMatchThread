import fs from "fs";
import path from "path";

const STATE_PATH = path.join(__dirname, "..", "thread-state.json");

type ThreadState = {
  [fixtureId: string]: {
    preMatchPosted?: boolean;
    matchThreadPosted?: boolean;
    postMatchPosted?: boolean;
  };
};

function readState(): ThreadState {
  if (!fs.existsSync(STATE_PATH)) return {};
  const raw = fs.readFileSync(STATE_PATH, "utf-8");
  return JSON.parse(raw);
}

function writeState(state: ThreadState) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

export function isThreadPosted(
  fixtureId: number,
  type: keyof ThreadState[string]
) {
  const state = readState();
  return state[fixtureId]?.[type] === true;
}

export function markThreadPosted(
  fixtureId: number,
  type: keyof ThreadState[string]
) {
  const state = readState();
  if (!state[fixtureId]) state[fixtureId] = {};
  state[fixtureId][type] = true;
  writeState(state);
}
