import { BaseScheduler } from "./BaseScheduler";
import { DateTime } from "luxon";
import { postMatchThread } from "../reddit/redditClient";
import { DRY_RUN, USE_MOCK_DATA } from "../config/appConfig";
import { fetchLineups } from "../api/apiClient";
import {
  formatMatchThread,
  formatMatchTitle,
} from "../formatters/matchFormatters";
import { formatDateTimeForConsole } from "../utils/dateUtils";

export class MatchThreadScheduler extends BaseScheduler {
  private scheduledMatchId: number | null = null;
  private lineups: any = null;
  private title: string = "";
  private body: string = "";

  constructor(match: any) {
    super(match, "matchThreadPosted");
  }

  // Preview the thread content
  async previewThreadContent(): Promise<void> {
    console.log("\n[PREVIEW] Match Thread:");
    console.log(`Using ${USE_MOCK_DATA ? "mock data" : "live data"}`);

    // For preview, we'll try to get lineups, but it's okay if they're not available yet
    try {
      this.lineups = await this.fetchLineupsWithRetry(this.match.fixture.id);
      console.log(
        this.lineups && this.lineups.length > 0
          ? "Lineups available for preview"
          : "Lineups not available yet for preview"
      );
    } catch (err) {
      console.log(
        "Couldn't fetch lineups for preview (they may not be available yet)"
      );
    }

    // Generate the title and preview body
    this.title = formatMatchTitle(this.match);
    this.body = await formatMatchThread(this.match, this.lineups);

    // Show the preview
    console.log(`Title: ${this.title}`);
    console.log(`Body:\n${this.body}\n`);

    // Calculate posting time
    const matchDateUTC = DateTime.fromISO(this.match.fixture.date, {
      zone: "utc",
    });
    const postTimeUTC = matchDateUTC.minus({ minutes: 20 });

    console.log(
      `Would be posted at: ${formatDateTimeForConsole(postTimeUTC)} ${
        DRY_RUN ? "[DRY RUN]" : "[LIVE MODE]"
      }`
    );
    console.log("\n" + "=".repeat(80) + "\n");
  }

  async createAndPostThread(): Promise<void> {
    const matchId = this.match.fixture.id;

    // Calculate posting time
    const matchDateUTC = DateTime.fromISO(this.match.fixture.date, {
      zone: "utc",
    });
    const postTimeUTC = matchDateUTC.minus({ minutes: 20 });

    // Don't schedule if already scheduled
    if (this.scheduledMatchId === matchId) {
      console.log("Match already scheduled.");
      return;
    }

    // Wait until 1 hour before match to attempt to fetch lineups
    const lineupsAttemptTime = matchDateUTC.minus({ minutes: 60 });

    // First, wait until time to fetch lineups
    if (DateTime.now() < lineupsAttemptTime) {
      console.log("Waiting until 1 hour before kickoff to fetch lineups...");
      console.log(
        `Will attempt to fetch lineups at: ${formatDateTimeForConsole(
          lineupsAttemptTime
        )}`
      );

      await this.waitUntil(lineupsAttemptTime);
    }

    // Now try to get lineups
    console.log(
      "Attempting to fetch latest lineups (1 hour before kickoff)..."
    );
    this.lineups = await this.fetchLineupsWithRetry(matchId);

    // Generate content with the freshly fetched lineups
    this.title = formatMatchTitle(this.match);
    this.body = await formatMatchThread(this.match, this.lineups);

    // Wait until posting time
    await this.waitUntil(postTimeUTC);

    // One final attempt to get or update lineups right before posting
    // (Some lineups might be released very close to kickoff)
    console.log("Final attempt to fetch or update lineups before posting...");
    const finalLineups = await this.fetchLineupsWithRetry(matchId);

    // If we got new lineups in the final attempt, update the body
    if (
      finalLineups &&
      finalLineups.length > 0 &&
      (!this.lineups || this.lineups.length === 0)
    ) {
      console.log("Got lineups in final attempt, updating thread content");
      this.lineups = finalLineups;
      this.body = await formatMatchThread(this.match, this.lineups);
    }

    // Post thread
    await this.postThread(this.title, this.body);
    this.markAsPosted();
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
      console.log("[DRY RUN] Match thread would be posted to Reddit");
    } else {
      console.log("Posting match thread!");
      await postMatchThread(title, body, "Jogo");
    }
  }
}
