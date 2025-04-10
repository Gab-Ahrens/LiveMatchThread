import { fetchNextMatch } from "./api";
import { startPreMatchScheduler } from "./schedulerPreMatchThread";
import { startScheduler as startMatchThreadScheduler } from "./schedulerMatchThread";
import { startPostMatchScheduler } from "./schedulerPostMatchThread";
import { DRY_RUN, USE_MOCK_DATA } from "./config";

async function startAllSchedulers() {
  console.log(
    `🚦 Starting all schedulers in ${DRY_RUN ? "DRY RUN 🧪" : "LIVE MODE 🚀"}`
  );

  const match = await fetchNextMatch();

  if (!match) {
    console.log("❌ No upcoming match found. Exiting schedulers.");
    return;
  }

  startPreMatchScheduler(match);
  startMatchThreadScheduler(match);
  startPostMatchScheduler(match);
}

startAllSchedulers();
