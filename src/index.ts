/**
 * Bot Entry Point
 */
import {
  fetchNextMatch,
  fetchLiveMatch,
  fetchRecentlyFinishedMatch,
} from "./api/apiClient";
import { DRY_RUN, USE_MOCK_DATA } from "./config/appConfig";
import { PreMatchScheduler } from "./schedulers/PreMatchScheduler";
import { MatchThreadScheduler } from "./schedulers/MatchThreadScheduler";
import { PostMatchScheduler } from "./schedulers/PostMatchScheduler";
import {
  getLastRefreshTime,
  updateRefreshTime,
  isRefreshNeeded,
} from "./utils/refreshState";
import { formatConsoleTime, formatDateTimeForConsole } from "./utils/dateUtils";
import { DateTime } from "luxon";
import { isThreadPosted } from "./utils/threadState";

// Global variables to track active schedulers
let preMatchScheduler: PreMatchScheduler | null = null;
let matchThreadScheduler: MatchThreadScheduler | null = null;
let postMatchScheduler: PostMatchScheduler | null = null;

// Start the schedulers
export async function startAllSchedulers() {
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

  // First, check for any live/ongoing Internacional matches
  console.log("🔍 Checking for live Internacional matches...");
  const liveMatch = await fetchLiveMatch();

  if (liveMatch) {
    console.log(
      `🔴 Found live match: ${liveMatch.teams.home.name} vs ${
        liveMatch.teams.away.name
      } (${formatDateTimeForConsole(DateTime.fromISO(liveMatch.fixture.date))})`
    );

    // Create a post-match scheduler for the live match
    console.log("⚽ Setting up post-match thread scheduler for live match...");
    const livePostMatchScheduler = new PostMatchScheduler(liveMatch);

    // Start the post-match scheduler which will handle polling and thread creation
    await livePostMatchScheduler.start();

    console.log("✅ Live match post-match scheduler started!");
  } else {
    // If no live match, check for recently finished matches that might need post-match threads
    console.log("🔍 Checking for recently finished Internacional matches...");
    const recentMatch = await fetchRecentlyFinishedMatch();

    if (recentMatch) {
      // Check if post-match thread was already posted
      const matchId = recentMatch.fixture.id;
      if (!isThreadPosted(matchId, "postMatchPosted")) {
        console.log(
          `🏁 Found recently finished match without post-match thread: ${recentMatch.teams.home.name} vs ${
            recentMatch.teams.away.name
          }`
        );

        // Create and immediately trigger post-match thread creation
        console.log(
          "📝 Creating post-match thread for recently finished match..."
        );
        const recentPostMatchScheduler = new PostMatchScheduler(recentMatch);

        // Preview the thread content
        await recentPostMatchScheduler.previewThreadContent();

        // Try to create the post-match thread immediately since the match already finished
        try {
          await recentPostMatchScheduler.createPostMatchThreadNow();
          console.log(
            "✅ Post-match thread created for recently finished match!"
          );
        } catch (error) {
          console.error(
            "❌ Error creating post-match thread for recently finished match:",
            error
          );
        }
      } else {
        console.log(
          "✅ Recently finished match already has a post-match thread."
        );
      }
    }
  }

  // Fetch the next upcoming match for regular scheduling
  const match = await fetchNextMatch();

  if (!match) {
    console.log("❌ No upcoming match found. Will check again later.");
    return;
  }

  // Update the refresh state
  updateRefreshTime();

  // Format match time in Amsterdam timezone for console output
  // Parse the date with Luxon to ensure proper formatting
  const matchDateTime = DateTime.fromISO(match.fixture.date);
  console.log(
    `📅 Next match: ${match.teams.home.name} vs ${
      match.teams.away.name
    } (${formatDateTimeForConsole(matchDateTime)})`
  );

  // Initialize all schedulers for the next match
  preMatchScheduler = new PreMatchScheduler(match);
  matchThreadScheduler = new MatchThreadScheduler(match);
  postMatchScheduler = new PostMatchScheduler(match);

  console.log(
    "\n🔍 Previewing all threads that will be created for the next match:"
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
