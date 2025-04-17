import { BaseScheduler } from "./BaseScheduler";
import { DateTime } from "luxon";
import { postMatchThread } from "../reddit/redditClient";
import { DRY_RUN } from "../config/appConfig";
import { formatCompetition } from "../formatters/matchFormatters";

export class PreMatchScheduler extends BaseScheduler {
  constructor(match: any) {
    super(match, "preMatchPosted");
  }

  async createAndPostThread(): Promise<void> {
    // Calculate target time (12 hours before match)
    const matchStart = DateTime.fromISO(this.match.fixture.date, {
      zone: "utc",
    });
    const postAt = matchStart.minus({ hours: 12 });

    // Wait until time to post
    await this.waitUntil(postAt);

    // Post thread logic
    const threadContent = this.formatThreadContent();
    await this.postThread(threadContent.title, threadContent.body);

    // Mark as posted
    this.markAsPosted();
  }

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

  private async postThread(title: string, body: string) {
    if (DRY_RUN) {
      console.log("🚧 [DRY RUN] Would post pre-match thread:\n");
      console.log(`Title: ${title}`);
      console.log(`Body:\n${body}`);
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
