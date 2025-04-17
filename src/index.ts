import { fetchNextMatch } from "./api";
import { DRY_RUN, USE_MOCK_DATA } from "./config";
import { PreMatchScheduler } from "./schedulers/PreMatchScheduler";
import { MatchThreadScheduler } from "./schedulers/MatchThreadScheduler";
import { PostMatchScheduler } from "./schedulers/PostMatchScheduler";

async function startAllSchedulers() {
  console.log(
    `🚦 Starting all schedulers in ${DRY_RUN ? "DRY RUN 🧪" : "LIVE MODE 🚀"}`
  );

  const match = await fetchNextMatch();

  if (!match) {
    console.log("❌ No upcoming match found. Exiting schedulers.");
    return;
  }

  // Use new class-based schedulers
  const preMatchScheduler = new PreMatchScheduler(match);
  await preMatchScheduler.start();

  const matchThreadScheduler = new MatchThreadScheduler(match);
  await matchThreadScheduler.start();

  const postMatchScheduler = new PostMatchScheduler(match);
  await postMatchScheduler.start();
}

startAllSchedulers();
