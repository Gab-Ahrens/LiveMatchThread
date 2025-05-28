/**
 * Emergency Thread Creation Script
 *
 * This script bypasses the normal scheduling and forces thread creation
 */
import { fetchNextMatch, fetchLineups } from "./api/apiClient";
import {
  formatMatchThread,
  formatMatchTitle,
} from "./formatters/matchFormatters";
import { postMatchThread } from "./reddit/redditClient";
import { USE_MOCK_DATA, DRY_RUN } from "./config/appConfig";
import fs from "fs";
import path from "path";

// Clear the thread state first
function clearThreadState() {
  const STATE_PATH = path.join(__dirname, "../data/thread-state.json");
  if (fs.existsSync(STATE_PATH)) {
    const state = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));

    // If fixture 1351105 exists, remove matchThreadPosted
    if (state["1351105"]) {
      delete state["1351105"].matchThreadPosted;
      console.log("✅ Cleared matchThreadPosted flag for fixture 1351105");
    }

    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
  }
}

// Force create match thread
async function createMatchThread() {
  console.log("🚨 EMERGENCY MATCH THREAD CREATION");

  // Get match data
  console.log("📡 Fetching match data...");
  const match = await fetchNextMatch();

  if (!match) {
    console.error("❌ No match data found!");
    return;
  }

  console.log(
    `📊 Found match: ${match.teams.home.name} vs ${match.teams.away.name}`
  );

  // Get lineups
  console.log("👥 Fetching lineups...");
  const lineups = await fetchLineups(match.fixture.id);

  // Generate content
  console.log("📝 Generating thread content...");
  const title = formatMatchTitle(match);
  const body = await formatMatchThread(match, lineups);

  // Post thread
  console.log("🚀 Posting match thread...");
  if (DRY_RUN) {
    console.log("🚧 [DRY RUN] Match thread would be posted with title:", title);
    console.log("🚧 [DRY RUN] Body preview:", body.substring(0, 200) + "...");
  } else {
    await postMatchThread(title, body, "Jogo");
    console.log("✅ Match thread posted successfully!");

    // Mark thread as posted
    const STATE_PATH = path.join(__dirname, "../data/thread-state.json");
    if (fs.existsSync(STATE_PATH)) {
      const state = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
      if (!state[match.fixture.id]) {
        state[match.fixture.id] = {};
      }
      state[match.fixture.id].matchThreadPosted = true;
      fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
    }
  }
}

// Execute
(async () => {
  try {
    clearThreadState();
    await createMatchThread();
  } catch (error) {
    console.error("❌ Error in emergency thread creation:", error);
  }
})();
