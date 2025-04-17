/**
 * Bot Entry Point
 */
import { fetchNextMatch } from "./api/apiClient";
import { DRY_RUN, USE_MOCK_DATA } from "./config/appConfig";
import { PreMatchScheduler } from "./schedulers/PreMatchScheduler";
import { MatchThreadScheduler } from "./schedulers/MatchThreadScheduler";
import { PostMatchScheduler } from "./schedulers/PostMatchScheduler";
import {
  getLastRefreshTime,
  updateRefreshTime,
  isRefreshNeeded,
} from "./utils/refreshState";

// Global variables to track active schedulers
let preMatchScheduler: PreMatchScheduler | null = null;
let matchThreadScheduler: MatchThreadScheduler | null = null;
let postMatchScheduler: PostMatchScheduler | null = null;

// Start the schedulers
async function startAllSchedulers() {
  console.log(
    `🚦 Starting all schedulers in ${DRY_RUN ? "DRY RUN 🧪" : "LIVE MODE 🚀"}`
  );

  // Check if we need to refresh match data
  if (!isRefreshNeeded(24)) {
    const lastRefresh = getLastRefreshTime();
    const hoursSince =
      (new Date().getTime() - lastRefresh.getTime()) / (1000 * 60 * 60);
    console.log(
      `ℹ️ Using cached match data (last refresh: ${hoursSince.toFixed(
        1
      )} hours ago)`
    );
  } else {
    console.log(`🔄 Fetching fresh match data (refresh needed)...`);
  }

  // Fetch the next match
  const match = await fetchNextMatch();

  if (!match) {
    console.log("❌ No upcoming match found. Will check again later.");
    return;
  }

  // Update the refresh state
  updateRefreshTime();

  console.log(
    `📅 Next match: ${match.teams.home.name} vs ${
      match.teams.away.name
    } (${new Date(match.fixture.date).toLocaleString()})`
  );

  // Initialize all schedulers first
  preMatchScheduler = new PreMatchScheduler(match);
  matchThreadScheduler = new MatchThreadScheduler(match);
  postMatchScheduler = new PostMatchScheduler(match);

  console.log(
    "\n🔍 Previewing all threads that will be created for this match:"
  );

  // Start each scheduler in sequence
  // This ensures previews appear in the correct order
  await preMatchScheduler.start();
  await matchThreadScheduler.start();
  await postMatchScheduler.start();

  console.log("\n✅ All schedulers have been started!");
}

/**
 * Periodically checks for match updates
 * Runs every 24 hours to refresh the match data
 */
async function checkForMatchUpdates() {
  // Check if refresh is needed
  if (isRefreshNeeded(24)) {
    console.log(`🔄 Checking for match updates...`);

    // Restart the schedulers with fresh data
    await startAllSchedulers();
  } else {
    const lastRefresh = getLastRefreshTime();
    const hoursSince =
      (new Date().getTime() - lastRefresh.getTime()) / (1000 * 60 * 60);
    console.log(
      `ℹ️ Skipping refresh (last refresh: ${hoursSince.toFixed(1)} hours ago)`
    );
  }

  // Schedule the next check
  setTimeout(checkForMatchUpdates, 1 * 60 * 60 * 1000); // Check every hour if refresh is needed
}

// Start the bot
startAllSchedulers();

// Start the update checker
setTimeout(checkForMatchUpdates, 1 * 60 * 60 * 1000); // First check after 1 hour
