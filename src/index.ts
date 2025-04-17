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

  console.log(
    `📅 Next match: ${match.teams.home.name} vs ${
      match.teams.away.name
    } (${new Date(match.fixture.date).toLocaleString()})`
  );

  // Initialize all schedulers first
  const preMatchScheduler = new PreMatchScheduler(match);
  const matchThreadScheduler = new MatchThreadScheduler(match);
  const postMatchScheduler = new PostMatchScheduler(match);

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

// Start the bot
startAllSchedulers();
