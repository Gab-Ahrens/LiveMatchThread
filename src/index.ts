import { fetchNextMatch } from "./api";
import { startScheduler as startMatchThreadScheduler } from "./schedulerMatchThread";
import { startPostMatchScheduler } from "./schedulerPostMatchThread";
import { DRY_RUN, USE_MOCK_DATA } from "./config";
import { PreMatchScheduler } from "./schedulers/PreMatchScheduler";

async function startAllSchedulers() {
  console.log(
    `🚦 Starting all schedulers in ${DRY_RUN ? "DRY RUN 🧪" : "LIVE MODE 🚀"}`
  );

  const match = await fetchNextMatch();

  if (!match) {
    console.log("❌ No upcoming match found. Exiting schedulers.");
    return;
  }

  // Use new class-based PreMatchScheduler
  const preMatchScheduler = new PreMatchScheduler(match);
  await preMatchScheduler.start();

  // Continue using existing function-based schedulers for now
  startMatchThreadScheduler(match);
  startPostMatchScheduler(match);
}

startAllSchedulers();
