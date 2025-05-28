/**
 * Force Post-Match Thread Creation Script
 *
 * This script finds recently finished Internacional matches and creates post-match threads
 */
import { fetchRecentlyFinishedMatch } from "./api/apiClient";
import { PostMatchScheduler } from "./schedulers/PostMatchScheduler";
import { USE_MOCK_DATA, DRY_RUN } from "./config/appConfig";
import { isThreadPosted } from "./utils/threadState";
import { DateTime } from "luxon";

async function forceCreatePostMatchThread() {
  console.log("🚨 FORCE POST-MATCH THREAD CREATION");
  console.log(`Running in ${DRY_RUN ? "DRY RUN 🧪" : "LIVE MODE 🚀"}`);

  try {
    // Look for recently finished matches
    console.log("🔍 Searching for recently finished Internacional matches...");
    const recentMatch = await fetchRecentlyFinishedMatch();

    if (!recentMatch) {
      console.log("❌ No recently finished matches found.");
      console.log(
        "💡 Try checking if there was a match today that finished recently."
      );
      return;
    }

    const matchId = recentMatch.fixture.id;
    const matchDate = DateTime.fromISO(recentMatch.fixture.date);

    console.log(
      `🏁 Found finished match: ${recentMatch.teams.home.name} vs ${recentMatch.teams.away.name}`
    );
    console.log(
      `📅 Match Date: ${matchDate.toFormat("dd/MM/yyyy HH:mm")} (UTC)`
    );
    console.log(`🆔 Match ID: ${matchId}`);
    console.log(`📊 Status: ${recentMatch.fixture.status.short}`);

    // Check if post-match thread was already created
    if (isThreadPosted(matchId, "postMatchPosted")) {
      console.log("✅ Post-match thread already exists for this match.");
      console.log("ℹ️ No action needed.");
      return;
    }

    console.log("📝 Post-match thread not found. Creating now...");

    // Create post-match scheduler
    const postMatchScheduler = new PostMatchScheduler(recentMatch);

    // Preview the thread first
    console.log("\n" + "=".repeat(60));
    await postMatchScheduler.previewThreadContent();
    console.log("=".repeat(60) + "\n");

    // Create the thread
    console.log("🚀 Creating post-match thread...");
    await postMatchScheduler.createPostMatchThreadNow();

    console.log("✅ Post-match thread creation completed!");
  } catch (error) {
    console.error("❌ Error in force post-match creation:", error);
    process.exit(1);
  }
}

// Run the script
forceCreatePostMatchThread();
