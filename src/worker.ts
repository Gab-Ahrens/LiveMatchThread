/**
 * Cloudflare Worker entry point
 * This handles scheduled executions and serves as the main entry point for the bot in a Workers environment
 */

// Import environment type
export interface Env {
  // KV Namespaces
  THREAD_STATE: KVNamespace;
  REFRESH_STATE: KVNamespace;

  // Environment variables
  RAPIDAPI_KEY: string;
  RAPIDAPI_HOST: string;
  REDDIT_CLIENT_ID: string;
  REDDIT_CLIENT_SECRET: string;
  REDDIT_USERNAME: string;
  REDDIT_PASSWORD: string;
  REDDIT_USER_AGENT: string;
  REDDIT_SUBREDDIT: string;
  TEAM_ID: string;
  SEASON: string;
}

// Import the main bot code
import { fetchNextMatch } from "./api/apiClient";
import { DRY_RUN, USE_MOCK_DATA } from "./config/appConfig";
import { PreMatchScheduler } from "./schedulers/PreMatchScheduler";
import { MatchThreadScheduler } from "./schedulers/MatchThreadScheduler";
import { PostMatchScheduler } from "./schedulers/PostMatchScheduler";
import {
  getLastRefreshTime,
  updateRefreshTime,
  isRefreshNeeded,
} from "./utils/kvRefreshState";

/**
 * Main bot function (adapted for Workers environment)
 */
export async function runBotJob(env: Env) {
  console.log(
    `🚦 Starting match thread bot job at ${new Date().toISOString()}`
  );
  console.log(`Mode: ${DRY_RUN ? "DRY RUN 🧪" : "LIVE MODE 🚀"}`);

  try {
    // Check if we need to refresh match data
    let match;
    if (!(await isRefreshNeeded(24, env))) {
      const lastRefresh = await getLastRefreshTime(env);
      const hoursSince =
        (new Date().getTime() - lastRefresh.getTime()) / (1000 * 60 * 60);
      console.log(
        `ℹ️ Using cached match data (last refresh: ${hoursSince.toFixed(
          1
        )} hours ago)`
      );

      // Load cached match data
      match = await fetchNextMatch(false, 3, env); // Pass false to indicate we don't need a fresh fetch
    } else {
      console.log(`🔄 Fetching fresh match data (refresh needed)...`);
      match = await fetchNextMatch(true, 3, env); // Pass true to force a fresh fetch
      if (match) {
        await updateRefreshTime(env);
      }
    }

    if (!match) {
      console.log("❌ No upcoming match found.");
      return;
    }

    console.log(
      `📅 Next match: ${match.teams.home.name} vs ${
        match.teams.away.name
      } (${new Date(match.fixture.date).toLocaleString()})`
    );

    // Create schedulers
    const preMatchScheduler = new PreMatchScheduler(match, env);
    const matchThreadScheduler = new MatchThreadScheduler(match, env);
    const postMatchScheduler = new PostMatchScheduler(match, env);

    // In mock mode or dry run, show full previews of all thread types
    if (USE_MOCK_DATA || DRY_RUN) {
      console.log("\n🔍 PREVIEWS of all threads for upcoming match:");
      await preMatchScheduler.previewThreadContent();
      await matchThreadScheduler.previewThreadContent();
      await postMatchScheduler.previewThreadContent();
    }

    // Check if any threads need to be posted right now
    await checkAndPostThreads(
      preMatchScheduler,
      matchThreadScheduler,
      postMatchScheduler
    );

    console.log(`✅ Bot job completed at ${new Date().toISOString()}`);
  } catch (error) {
    console.error("❌ Error running bot job:", error);
  }
}

/**
 * Checks if any threads need to be posted now and posts them
 */
async function checkAndPostThreads(
  preMatchScheduler: PreMatchScheduler,
  matchThreadScheduler: MatchThreadScheduler,
  postMatchScheduler: PostMatchScheduler
) {
  // Check if pre-match thread needs to be posted
  if (await preMatchScheduler.shouldPostNow()) {
    console.log("🔔 Time to post pre-match thread!");
    await preMatchScheduler.createAndPostThread();
  } else {
    const preMatchTime = preMatchScheduler.getScheduledPostTime();
    if (preMatchTime) {
      console.log(
        `⏳ Pre-match thread will be posted at ${preMatchTime.toISO()}`
      );
    } else {
      console.log("ℹ️ Pre-match thread already posted or not applicable");
    }
  }

  // Check if match thread needs to be posted
  // This includes fetching lineups if close to kickoff
  if (await matchThreadScheduler.shouldFetchLineupsNow()) {
    console.log("🔔 Time to fetch lineups for upcoming match!");
    await matchThreadScheduler.fetchAndCacheLineups();
  }

  if (await matchThreadScheduler.shouldPostNow()) {
    console.log("🔔 Time to post match thread!");
    await matchThreadScheduler.createAndPostThread();
  } else {
    const matchThreadTime = matchThreadScheduler.getScheduledPostTime();
    if (matchThreadTime) {
      console.log(
        `⏳ Match thread will be posted at ${matchThreadTime.toISO()}`
      );
    } else {
      console.log("ℹ️ Match thread already posted or not applicable");
    }
  }

  // Check if post-match thread needs to be posted
  if (await postMatchScheduler.shouldCheckMatchStatus()) {
    console.log("🔔 Checking if match has ended...");
    const hasPosted = await postMatchScheduler.checkAndPostIfFinished();
    if (!hasPosted) {
      console.log("⏳ Match not finished yet, will check on next run");
    }
  } else {
    const estimatedEndTime = postMatchScheduler.getEstimatedEndTime();
    if (estimatedEndTime) {
      console.log(
        `⏳ Will check for match end after ${estimatedEndTime.toISO()}`
      );
    } else {
      console.log("ℹ️ Post-match thread already posted or not applicable");
    }
  }
}

// Cloudflare Worker handlers
export default {
  // Handle scheduled trigger (runs on cron schedule)
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log(`🕒 Scheduled job triggered at ${new Date().toISOString()}`);
    ctx.waitUntil(runBotJob(env));
  },

  // Handle HTTP requests (for manual triggering via API)
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    // Only accept POST requests for security
    if (request.method === "POST") {
      try {
        ctx.waitUntil(runBotJob(env));
        return new Response("Bot job triggered successfully", { status: 200 });
      } catch (error: any) {
        return new Response(`Error: ${error.message}`, { status: 500 });
      }
    }

    // Return a simple message for GET requests
    return new Response("Send a POST request to trigger the match thread bot", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  },
};
