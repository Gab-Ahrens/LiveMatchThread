import dotenv from "dotenv";
import { fetchNextMatch } from "./api";
import { startPreMatchScheduler } from "./schedulerPreMatchThread";
import { startScheduler as startMatchThreadScheduler } from "./schedulerMatchThread";
import { startPostMatchScheduler } from "./schedulerPostMatchThread";

dotenv.config();

async function startAllSchedulers() {
  console.log("🚦 Starting all schedulers...");

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
