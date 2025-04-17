import { DateTime } from "luxon";
import { isThreadPosted, markThreadPosted } from "../utils/threadState";
import { DRY_RUN } from "../config/appConfig";

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
    const now = DateTime.utc();
    const waitMs = targetTime.diff(now).milliseconds;

    if (waitMs > 0) {
      console.log(`⏳ Waiting until ${targetTime.toISO()} UTC...`);
      await new Promise((res) => setTimeout(res, waitMs));
      return;
    }

    console.warn("⚠️ Scheduled time is in the past. Running immediately...");
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
