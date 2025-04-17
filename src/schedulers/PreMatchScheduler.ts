import { BaseScheduler } from "./BaseScheduler";
import { DateTime } from "luxon";
import { postMatchThread } from "../reddit/redditClient";
import { DRY_RUN } from "../config/appConfig";
import { formatCompetition } from "../formatters/matchFormatters";

export class PreMatchScheduler extends BaseScheduler {
  constructor(match: any) {
    super(match, "preMatchPosted");
  }

  // Generate thread content
  private formatThreadContent() {
    const home = this.match.teams.home.name.toUpperCase();
    const away = this.match.teams.away.name.toUpperCase();
    const venue = this.match.fixture.venue;
    const kickoff = DateTime.fromISO(this.match.fixture.date, {
      zone: "America/Sao_Paulo",
    })
      .setLocale("pt-BR")
      .toFormat("cccc, dd 'de' LLLL 'de' yyyy 'às' HH:mm");

    const competition = this.formatCompetitionName(
      this.match.league?.name ?? ""
    );
    const round = this.formatOrdinalRound(this.match.league?.round || "");

    const title = `[PRÉ-JOGO] | ${competition} | ${home} X ${away} | ${round}`;
    const body = `
## 📝 Informações da Partida

🏟️ *${venue.name}, ${venue.city}*  
🕓 *Data: ${kickoff} (Brasília)*

---

⚽️ Vamo Inter! ❤️

---
^(*Esse post foi criado automaticamente por um bot.*)
    `.trim();

    return { title, body };
  }

  /**
   * Gets the scheduled time when this thread should be posted
   * For pre-match thread: 24 hours before kickoff
   */
  getScheduledPostTime(): DateTime | null {
    const matchStart = DateTime.fromISO(this.match.fixture.date, {
      zone: "utc",
    });
    return matchStart.minus({ hours: 24 });
  }

  // Preview the thread content
  async previewThreadContent(): Promise<void> {
    console.log("\n📋 [PREVIEW] Pre-Match Thread:");
    const content = this.formatThreadContent();
    console.log(`Title: ${content.title}`);
    console.log(`Body:\n${content.body}`);

    // Calculate target time (24 hours before match)
    const postAt = this.getScheduledPostTime();

    console.log(
      `\n🕒 Would be posted at: ${postAt?.toFormat(
        "cccc, dd 'de' LLLL 'de' yyyy 'às' HH:mm:ss"
      )} (UTC) ${DRY_RUN ? "[DRY RUN 🚧]" : "[LIVE MODE 🚀]"}`
    );
    console.log("\n" + "=".repeat(80) + "\n");
  }

  async createAndPostThread(): Promise<void> {
    // Get scheduled time
    const postAt = this.getScheduledPostTime();

    // In job mode, if we're not within the posting window, don't wait
    // The scheduler will call us again at the appropriate time
    if (!postAt || DateTime.now().plus({ minutes: 5 }) < postAt) {
      console.log("⏳ Not yet time to post pre-match thread");
      return;
    }

    // Post thread logic
    const threadContent = this.formatThreadContent();
    await this.postThread(threadContent.title, threadContent.body);

    // Mark as posted
    this.markAsPosted();
  }

  private async postThread(title: string, body: string) {
    if (DRY_RUN) {
      // In dry run mode, we've already shown the preview, so just show a brief message
      console.log("🚧 [DRY RUN] Pre-match thread would be posted to Reddit");
    } else {
      console.log("🚀 Posting pre-match thread!");
      await postMatchThread(title, body);
    }
  }

  private formatCompetitionName(rawName: string): string {
    const normalized = rawName
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toUpperCase();
    return normalized.includes("SERIE A") ? "BRASILEIRÃO" : normalized;
  }

  private formatOrdinalRound(round: string): string {
    const rodadaMatch = round.match(
      /(Regular Season|Temporada Regular)\s*-\s*(\d+)/i
    );
    if (rodadaMatch) return `${rodadaMatch[2]}ª RODADA`;

    const groupMatch = round.match(/Group Stage - (\w)/i);
    if (groupMatch) return `GRUPO ${groupMatch[1]}`;

    return round.toUpperCase();
  }
}
