/**
 * Bot Entry Point
 */
import { fetchNextMatch } from "./api/apiClient";
import { DRY_RUN, USE_MOCK_DATA } from "./config/appConfig";
import { PreMatchScheduler } from "./schedulers/PreMatchScheduler";
import { MatchThreadScheduler } from "./schedulers/MatchThreadScheduler";
import { PostMatchScheduler } from "./schedulers/PostMatchScheduler";

// Start the schedulers
async function startAllSchedulers() {
  console.log(
    `🚦 Starting all schedulers in ${DRY_RUN ? "DRY RUN 🧪" : "LIVE MODE 🚀"}`
  );

  // Fetch the next match
  const match = await fetchNextMatch();

  if (!match) {
    console.log("❌ No upcoming match found. Exiting schedulers.");
    return;
  }

  // Use class-based schedulers
  const preMatchScheduler = new PreMatchScheduler(match);
  await preMatchScheduler.start();

  const matchThreadScheduler = new MatchThreadScheduler(match);
  await matchThreadScheduler.start();

  const postMatchScheduler = new PostMatchScheduler(match);
  await postMatchScheduler.start();
}

// Start the bot
startAllSchedulers();
