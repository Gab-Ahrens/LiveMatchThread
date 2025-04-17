import { BaseScheduler } from "./BaseScheduler";
import { DateTime } from "luxon";
import { postMatchThread } from "../reddit/redditClient";
import { DRY_RUN, USE_MOCK_DATA } from "../config/appConfig";
import { fetchLineups } from "../api/apiClient";
import {
  formatMatchThread,
  formatMatchTitle,
} from "../formatters/matchFormatters";
import fs from "fs";
import path from "path";

export class MatchThreadScheduler extends BaseScheduler {
  private scheduledMatchId: number | null = null;
  private lineups: any = null;
  private title: string = "";
  private body: string = "";
  private lineupCachePath: string;

  constructor(match: any) {
    super(match, "matchThreadPosted");
    // Set path for lineup cache
    this.lineupCachePath = path.join(
      __dirname,
      "../../data",
      `lineups-${match.fixture.id}.json`
    );
    // Try to load cached lineups
    this.loadCachedLineups();
  }

  /**
   * Gets the scheduled time when this thread should be posted
   * For match thread: 15 minutes before kickoff
   */
  getScheduledPostTime(): DateTime | null {
    const matchDateUTC = DateTime.fromISO(this.match.fixture.date, {
      zone: "utc",
    });
    return matchDateUTC.minus({ minutes: 15 });
  }

  /**
   * Gets the time when lineups should be fetched
   * 1 hour before kickoff
   */
  getLineupFetchTime(): DateTime | null {
    const matchDateUTC = DateTime.fromISO(this.match.fixture.date, {
      zone: "utc",
    });
    return matchDateUTC.minus({ minutes: 60 });
  }

  /**
   * Check if it's time to fetch lineups
   */
  async shouldFetchLineupsNow(): Promise<boolean> {
    // If already posted, no need to fetch lineups
    if (this.isMatchThreadPosted()) {
      return false;
    }

    // If we already have lineups, no need to fetch again
    if (this.lineups && this.lineups.length > 0) {
      return false;
    }

    // Get lineup fetch time
    const fetchTime = this.getLineupFetchTime();
    if (!fetchTime) {
      return false;
    }

    // Check if we're within the lineup fetch window (from 65 min before to 5 min before match)
    const now = DateTime.now().setZone("utc");
    const matchTime = DateTime.fromISO(this.match.fixture.date, {
      zone: "utc",
    });

    return now >= fetchTime && now <= matchTime.minus({ minutes: 5 });
  }

  /**
   * Fetches and caches lineups for later use
   */
  async fetchAndCacheLineups(): Promise<void> {
    const matchId = this.match.fixture.id;
    console.log("📋 Fetching lineups for match...");

    this.lineups = await this.fetchLineupsWithRetry(matchId);

    if (this.lineups && this.lineups.length > 0) {
      console.log("✅ Successfully fetched lineups, caching for later use");
      this.cacheLineups();
    } else {
      console.log(
        "⚠️ Could not fetch lineups at this time, will try again later"
      );
    }
  }

  /**
   * Cache the lineups to disk for persistence between job runs
   */
  private cacheLineups(): void {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.lineupCachePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(
        this.lineupCachePath,
        JSON.stringify(this.lineups, null, 2)
      );
    } catch (err) {
      console.error("❌ Failed to cache lineups:", err);
    }
  }

  /**
   * Load cached lineups from disk
   */
  private loadCachedLineups(): void {
    try {
      if (fs.existsSync(this.lineupCachePath)) {
        const data = fs.readFileSync(this.lineupCachePath, "utf8");
        this.lineups = JSON.parse(data);
        console.log("ℹ️ Loaded cached lineups from previous run");
      }
    } catch (err) {
      console.warn("⚠️ Failed to load cached lineups:", err);
    }
  }

  /**
   * Check if the match thread has already been posted
   */
  private isMatchThreadPosted(): boolean {
    return (
      this.match &&
      this.match.fixture &&
      this.match.fixture.id !== undefined &&
      this.scheduledMatchId === this.match.fixture.id
    );
  }

  // Preview the thread content
  async previewThreadContent(): Promise<void> {
    console.log("\n📋 [PREVIEW] Match Thread:");
    console.log(`🔍 Using ${USE_MOCK_DATA ? "mock data 🧪" : "live data ☁️"}`);

    // For preview, we'll try to get lineups, but it's okay if they're not available yet
    try {
      if (!this.lineups || this.lineups.length === 0) {
        this.lineups = await this.fetchLineupsWithRetry(this.match.fixture.id);
      }
      console.log(
        this.lineups && this.lineups.length > 0
          ? "✅ Lineups available for preview"
          : "ℹ️ Lineups not available yet for preview"
      );
    } catch (err) {
      console.log(
        "ℹ️ Couldn't fetch lineups for preview (they may not be available yet)"
      );
    }

    // Generate the title and preview body
    this.title = formatMatchTitle(this.match);
    this.body = await formatMatchThread(this.match, this.lineups);

    // Show the preview
    console.log(`Title: ${this.title}`);
    console.log(`Body:\n${this.body}\n`);

    // Calculate posting time
    const postTimeUTC = this.getScheduledPostTime();

    console.log(
      `🕒 Would be posted at: ${postTimeUTC?.toFormat(
        "cccc, dd 'de' LLLL 'de' yyyy 'às' HH:mm:ss"
      )} (UTC) ${DRY_RUN ? "[DRY RUN 🚧]" : "[LIVE MODE 🚀]"}`
    );
    console.log("\n" + "=".repeat(80) + "\n");
  }

  async createAndPostThread(): Promise<void> {
    const matchId = this.match.fixture.id;

    // Calculate posting time
    const postTimeUTC = this.getScheduledPostTime();

    // Don't schedule if already scheduled
    if (this.scheduledMatchId === matchId) {
      console.log("✅ Match already scheduled.");
      return;
    }

    // In job mode, if we're not within the posting window, don't wait
    // The scheduler will call us again at the appropriate time
    if (!postTimeUTC || DateTime.now().plus({ minutes: 5 }) < postTimeUTC) {
      console.log("⏳ Not yet time to post match thread");
      return;
    }

    // If we don't have lineups yet, try one final time
    if (!this.lineups || this.lineups.length === 0) {
      console.log(
        "🔄 Final attempt to fetch lineups before posting match thread..."
      );
      this.lineups = await this.fetchLineupsWithRetry(matchId);
    }

    // Generate content with the latest lineup data
    this.title = formatMatchTitle(this.match);
    this.body = await formatMatchThread(this.match, this.lineups);

    // Post thread
    await this.postThread(this.title, this.body);
    this.markAsPosted();

    // Clean up cached lineups after posting
    this.cleanupCachedLineups();
  }

  /**
   * Clean up cached lineups file after posting
   */
  private cleanupCachedLineups(): void {
    try {
      if (fs.existsSync(this.lineupCachePath)) {
        fs.unlinkSync(this.lineupCachePath);
      }
    } catch (err) {
      console.warn("⚠️ Failed to clean up cached lineups:", err);
    }
  }

  private async fetchLineupsWithRetry(matchId: number): Promise<any> {
    let lineups: any = null;

    // Try to fetch lineups up to 3 times with delay between attempts
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`📋 Fetching lineups, attempt ${attempt}/3...`);
        lineups = await fetchLineups(matchId);

        if (lineups && lineups.length > 0) {
          console.log(`✅ Successfully fetched lineups on attempt ${attempt}`);
          break;
        } else {
          console.warn(`⚠️ Lineup data empty or invalid on attempt ${attempt}`);

          if (attempt < 3) {
            const waitTime = attempt * 10000; // 10s, 20s, 30s
            console.log(
              `⏳ Waiting ${waitTime / 1000}s before next attempt...`
            );
            await new Promise((res) => setTimeout(res, waitTime));
          }
        }
      } catch (err) {
        console.warn(
          `⚠️ Failed to fetch lineups on attempt ${attempt}:`,
          err instanceof Error ? err.message : err
        );

        if (attempt < 3) {
          const waitTime = attempt * 10000; // 10s, 20s, 30s
          console.log(`⏳ Waiting ${waitTime / 1000}s before next attempt...`);
          await new Promise((res) => setTimeout(res, waitTime));
        }
      }
    }

    if (!lineups || lineups.length === 0) {
      console.warn(
        "❌ All lineup fetch attempts failed. Will continue without lineups."
      );
    }

    return lineups;
  }

  private async postThread(title: string, body: string): Promise<void> {
    if (DRY_RUN) {
      // In dry run mode, we've already shown the preview, so just show a brief message
      console.log("🚧 [DRY RUN] Match thread would be posted to Reddit");
    } else {
      console.log("🚀 Posting match thread!");
      await postMatchThread(title, body);
    }
  }
}
