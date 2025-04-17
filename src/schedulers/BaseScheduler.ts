import { DateTime } from "luxon";
import {
  isThreadPosted as fileIsThreadPosted,
  markThreadPosted as fileMarkThreadPosted,
} from "../utils/threadState";
import {
  isThreadPosted as kvIsThreadPosted,
  markThreadPosted as kvMarkThreadPosted,
} from "../utils/kvThreadState";
import { DRY_RUN } from "../config/appConfig";

export abstract class BaseScheduler {
  protected match: any;
  protected threadType:
    | "preMatchPosted"
    | "matchThreadPosted"
    | "postMatchPosted";
  protected env: any;

  constructor(
    match: any,
    threadType: "preMatchPosted" | "matchThreadPosted" | "postMatchPosted",
    env?: any
  ) {
    this.match = match;
    this.threadType = threadType;
    this.env = env;
  }

  /**
   * Start the scheduler (called by legacy continuous mode)
   */
  async start(): Promise<void> {
    // Preview thread content
    await this.previewThreadContent();

    // Check if already posted
    if (await this.isThreadPosted()) {
      console.log(`⏭️ ${this.getThreadTypeName()} already posted, skipping.`);
      return;
    }

    // Create and post the thread
    await this.createAndPostThread();
  }

  /**
   * Waits until the specified time
   */
  protected async waitUntil(targetTime: DateTime): Promise<void> {
    const now = DateTime.now().setZone("utc");
    const targetUtc = targetTime.setZone("utc");

    if (targetUtc <= now) {
      return; // Target time is in the past or now, no need to wait
    }

    const delayMs = targetUtc.diff(now).milliseconds;
    console.log(
      `⏱️ Waiting ${Math.round(delayMs / 1000 / 60)} minutes until ${targetUtc
        .setZone("local")
        .toFormat("HH:mm:ss")}`
    );

    return new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  /**
   * Marks the thread as posted
   */
  protected async markAsPosted(): Promise<void> {
    if (this.env) {
      // Cloudflare Worker environment
      await kvMarkThreadPosted(
        this.match.fixture.id,
        this.threadType,
        this.env
      );
    } else {
      // Node.js environment
      fileMarkThreadPosted(this.match.fixture.id, this.threadType);
    }
  }

  /**
   * Checks if the thread is already posted
   */
  protected async isThreadPosted(): Promise<boolean> {
    if (this.env) {
      // Cloudflare Worker environment
      return await kvIsThreadPosted(
        this.match.fixture.id,
        this.threadType,
        this.env
      );
    } else {
      // Node.js environment
      return fileIsThreadPosted(this.match.fixture.id, this.threadType);
    }
  }

  /**
   * Checks if the thread should be posted now based on timing rules
   * Job-based version to decide if action is needed
   */
  async shouldPostNow(): Promise<boolean> {
    // If already posted, don't post again
    if (await this.isThreadPosted()) {
      return false;
    }

    // Get the scheduled post time
    const postTime = this.getScheduledPostTime();
    if (!postTime) {
      return false; // No valid post time
    }

    // Check if it's time to post (within a 5-minute window)
    const now = DateTime.now().setZone("utc");
    const timeDiff = postTime.diff(now).as("minutes");

    // Post if we're within 5 minutes of the target time or past it
    return timeDiff <= 5 && timeDiff > -30; // 5 min early to 30 min late window
  }

  /**
   * Returns the human-readable thread type name
   */
  protected getThreadTypeName(): string {
    switch (this.threadType) {
      case "preMatchPosted":
        return "Pre-match thread";
      case "matchThreadPosted":
        return "Match thread";
      case "postMatchPosted":
        return "Post-match thread";
      default:
        return "Thread";
    }
  }

  /**
   * Gets the scheduled time when this thread should be posted
   * Each scheduler must implement this for their specific timing
   */
  abstract getScheduledPostTime(): DateTime | null;

  /**
   * Preview the thread content
   */
  abstract previewThreadContent(): Promise<void>;

  /**
   * Create and post the thread
   */
  abstract createAndPostThread(): Promise<void>;
}
