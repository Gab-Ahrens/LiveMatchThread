import { BaseScheduler } from "../BaseScheduler";
import { DateTime } from "luxon";
import { postMatchThread } from "../reddit";
import { DRY_RUN, USE_MOCK_DATA } from "../config";
import { fetchLineups } from "../api";
import { formatMatchThread, formatMatchTitle } from "../format";

export class MatchThreadScheduler extends BaseScheduler {
  private scheduledMatchId: number | null = null;

  constructor(match: any) {
    super(match, "matchThreadPosted");
  }

  async createAndPostThread(): Promise<void> {
    const now = DateTime.now()
      .setZone("Europe/Amsterdam")
      .toFormat("cccc, dd 'de' LLLL 'de' yyyy 'às' HH:mm:ss");

    console.log(
      `\n📅 [${now}] Iniciando checagem agendada para a próxima partida...`
    );
    console.log(`🔍 Using ${USE_MOCK_DATA ? "mock data 🧪" : "live data ☁️"}`);

    const matchId = this.match.fixture.id;

    // Calculate posting time
    const matchDateUTC = DateTime.fromISO(this.match.fixture.date, {
      zone: "utc",
    });
    const postTimeAmsterdam = matchDateUTC
      .setZone("Europe/Amsterdam")
      .minus({ minutes: 8 });

    // Prepare thread content
    const title = formatMatchTitle(this.match);
    const lineups = await this.fetchLineupsWithRetry(matchId);
    const body = await formatMatchThread(this.match, lineups);

    // Preview thread content
    this.previewThread(title, body, postTimeAmsterdam);

    // Don't schedule if already scheduled
    if (this.scheduledMatchId === matchId) {
      console.log("✅ Match already scheduled.");
      return;
    }

    // Wait until posting time
    await this.waitUntil(postTimeAmsterdam);

    // Post thread
    await this.postThread(title, body);
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
        "❌ All lineup fetch attempts failed. Posting without lineups."
      );
    }

    return lineups;
  }

  private previewThread(
    title: string,
    body: string,
    scheduledTime: DateTime
  ): void {
    console.log(`\n🖥️ [PREVIEW] Match Thread Preview:`);
    console.log(`Title: ${title}`);
    console.log(`Body:\n${body}\n`);

    console.log(
      `🕒 Thread will be created at: ${scheduledTime.toFormat(
        "cccc, dd 'de' LLLL 'de' yyyy 'às' HH:mm:ss"
      )} (Amsterdam) ${DRY_RUN ? "[DRY RUN 🚧]" : "[LIVE MODE 🚀]"}`
    );
  }

  private async postThread(title: string, body: string): Promise<void> {
    if (DRY_RUN) {
      console.log("🚧 [DRY RUN] Simulating post.");
      console.log(`Title: ${title}`);
      console.log(`Body:\n${body}`);
    } else {
      console.log("🚀 Posting match thread!");
      await postMatchThread(title, body);
    }
  }
}
