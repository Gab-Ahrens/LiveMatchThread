import { fetchNextMatch } from "./api";
import { startPreMatchScheduler } from "./schedulePreMatchThread";
import { startScheduler } from "./schedulerMatchThread";
import { startPostMatchScheduler } from "./schedulerPostMatchThread";

async function main() {
  console.log("🚀 Starting LiveMatchThread bot...");

  const match = await fetchNextMatch();

  if (!match) {
    console.warn("⚠️ No upcoming match available. Exiting.");
    return;
  }

  // Pass the match to each scheduler
  startPreMatchScheduler(match);
  startScheduler(match);
  startPostMatchScheduler(match);
}

main();