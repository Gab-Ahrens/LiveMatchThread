import { DateTime } from "luxon";
import { isThreadPosted, markThreadPosted } from "../utils/threadState";
import { DRY_RUN } from "../config/appConfig";
import { formatDateTimeForConsole } from "../utils/dateUtils";

export abstract class BaseScheduler {
  protected match: any;
  protected threadType:
    | "preMatchPosted"
    | "matchThreadPosted"
    | "postMatchPosted";

  constructor(
    match: any,
    threadType: "preMatchPosted" | "matchThreadPosted" | "postMatchPosted"
  ) {
    this.match = match;
    this.threadType = threadType;
  }

  // Common method to check if thread is already posted
  protected isAlreadyPosted(): boolean {
    const matchId = this.match.fixture.id;
    if (isThreadPosted(matchId, this.threadType)) {
      console.log(`✅ Thread already posted. Skipping.`);
      return true;
    }
    return false;
  }

  // Common method to mark thread as posted
  protected markAsPosted(): void {
    if (!DRY_RUN) {
      const matchId = this.match.fixture.id;
      markThreadPosted(matchId, this.threadType);
    }
  }

  // Common method to wait until scheduled time
  protected async waitUntil(targetTime: DateTime): Promise<void> {
    // Make sure both times are in UTC for comparison
    const now = DateTime.utc();
    const targetUtc = targetTime.toUTC();

    // Calculate wait time in milliseconds
    const waitMs = targetUtc.diff(now).milliseconds;

    console.log(`⏳ Current time (UTC): ${now.toISO()}`);
    console.log(`⏳ Target time (UTC): ${targetUtc.toISO()}`);
    console.log(
      `⏳ Wait time: ${Math.round(waitMs / 1000)} seconds (${Math.round(
        waitMs / 60000
      )} minutes)`
    );

    if (waitMs > 0) {
      console.log(`⏳ Waiting until ${formatDateTimeForConsole(targetUtc)}...`);

      // For long waits (> 30 minutes), log periodic updates
      if (waitMs > 30 * 60 * 1000) {
        const updateInterval = 15 * 60 * 1000; // 15 minutes
        const updateTimer = setInterval(() => {
          const remainingMs = targetUtc.diff(DateTime.utc()).milliseconds;
          if (remainingMs <= 0) {
            clearInterval(updateTimer);
            return;
          }
          console.log(
            `⏳ Still waiting... ${Math.round(
              remainingMs / 60000
            )} minutes remaining`
          );
        }, updateInterval);

        // Don't forget to clear the interval when done
        setTimeout(() => clearInterval(updateTimer), waitMs + 1000);
      }

      await new Promise((res) => setTimeout(res, waitMs));
      console.log(`✅ Wait complete. Posting thread now.`);
      return;
    }

    console.warn(
      `⚠️ Scheduled time (${formatDateTimeForConsole(
        targetUtc
      )}) is in the past. Running immediately...`
    );
  }

  // Preview thread content - to be implemented by each scheduler
  abstract previewThreadContent(): Promise<void>;

  // Create and post the thread - to be implemented by each scheduler
  abstract createAndPostThread(): Promise<void>;

  // Start the scheduler
  async start(): Promise<void> {
    // Always preview the thread content first
    await this.previewThreadContent();

    // Skip posting if already posted
    if (this.isAlreadyPosted()) return;

    // Otherwise continue with posting
    await this.createAndPostThread();
  }
}
