import { BaseScheduler } from "./BaseScheduler";
import { DateTime } from "luxon";
import { postMatchThread } from "../reddit/redditClient";
import { DRY_RUN, USE_MOCK_DATA } from "../config/appConfig";
import { fetchFinalMatchData, fetchMatchStatus } from "../api/apiClient";
import { formatCompetition } from "../formatters/matchFormatters";
import { isThreadPosted } from "../utils/threadState";

export class PostMatchScheduler extends BaseScheduler {
  private finalData: any = null;

  constructor(match: any, env?: any) {
    super(match, "postMatchPosted", env);
  }

  /**
   * Gets the scheduled time when this thread should be posted
   * For post-match thread: This is not fixed, depends on when match ends
   * Returns null since post time depends on match status
   */
  getScheduledPostTime(): DateTime | null {
    return null; // Post-match thread doesn't have a fixed schedule
  }

  /**
   * Gets the estimated end time of the match (2 hours after kickoff)
   */
  getEstimatedEndTime(): DateTime | null {
    const matchStartUTC = DateTime.fromISO(this.match.fixture.date, {
      zone: "utc",
    });
    return matchStartUTC.plus({ hours: 2 });
  }

  /**
   * Check if we should check the match status now
   */
  async shouldCheckMatchStatus(): Promise<boolean> {
    // If already posted, no need to check status
    if (isThreadPosted(this.match.fixture.id, this.threadType)) {
      return false;
    }

    // Get estimated end time
    const estimatedEndTime = this.getEstimatedEndTime();
    if (!estimatedEndTime) {
      return false;
    }

    // Only check status if we're past the estimated end time
    const now = DateTime.now().setZone("utc");
    return now >= estimatedEndTime;
  }

  /**
   * Check match status and post if finished
   * @returns true if posted, false if not
   */
  async checkAndPostIfFinished(): Promise<boolean> {
    const matchId = this.match.fixture.id;

    // Get current match status
    const status = await fetchMatchStatus(matchId);
    console.log(`📡 Match status: ${status}`);

    // If match is finished, post the thread
    if (["FT", "AET", "PEN"].includes(status)) {
      this.finalData = await fetchFinalMatchData(matchId);
      await this.renderAndPostThread(this.finalData);
      return true;
    }

    return false;
  }

  // Preview the thread content
  async previewThreadContent(): Promise<void> {
    console.log("\n📋 [PREVIEW] Post-Match Thread:");
    console.log(`🔍 Using ${USE_MOCK_DATA ? "mock data 🧪" : "live data ☁️"}`);

    // Fetch final match data if we haven't already
    if (!this.finalData) {
      this.finalData = await fetchFinalMatchData(this.match.fixture.id);
    }

    // Generate and show preview
    const { title, body } = this.formatThreadContent(this.finalData);
    console.log(`Title: ${title}`);
    console.log(`Body:\n${body}`);

    // Calculate posting time (typically right after match ends)
    const matchEndUTC = this.getEstimatedEndTime();

    console.log(
      `🕒 Would be posted at: ${matchEndUTC?.toFormat(
        "cccc, dd 'de' LLLL 'de' yyyy 'às' HH:mm:ss"
      )} (UTC) ${
        DRY_RUN ? "[DRY RUN 🚧]" : "[LIVE MODE 🚀]"
      } (after match ends)`
    );
    console.log("\n" + "=".repeat(80) + "\n");
  }

  async createAndPostThread(): Promise<void> {
    // For the post-match thread, this is triggered by match status
    // In job mode, this is handled by checkAndPostIfFinished
    const matchEndUTC = this.getEstimatedEndTime();

    if (DRY_RUN) {
      // In dry run mode, post a sample post-match thread
      if (!this.finalData) {
        this.finalData = await fetchFinalMatchData(this.match.fixture.id);
      }
      await this.renderAndPostThread(this.finalData);
      return;
    }

    console.log(
      `⏳ Post-match thread will be posted when match ends (estimated: ${matchEndUTC?.toFormat(
        "cccc, dd 'de' LLLL 'de' yyyy 'às' HH:mm:ss"
      )} UTC)`
    );
  }

  private async renderAndPostThread(finalData: any): Promise<void> {
    const { title, body } = this.formatThreadContent(finalData);

    if (DRY_RUN) {
      // In dry run mode, we've already shown the preview, so just show a brief message
      console.log("🚧 [DRY RUN] Post-match thread would be posted to Reddit");
    } else {
      console.log("🚀 Posting post-match thread!");
      await postMatchThread(title, body, this.env);
      await this.markAsPosted();
    }
  }

  private formatThreadContent(finalData: any) {
    const home = finalData.teams.home.name.toUpperCase();
    const away = finalData.teams.away.name.toUpperCase();
    const score = finalData.score.fulltime;
    const venue = finalData.fixture.venue;
    const kickoff = DateTime.fromISO(finalData.fixture.date, {
      zone: "America/Sao_Paulo",
    })
      .setLocale("pt-BR")
      .toFormat("cccc, dd 'de' LLLL 'de' yyyy 'às' HH:mm");

    // Use the league information from either the finalData or from the original match data
    const leagueName =
      finalData.league?.name || this.match.league?.name || "COMPETIÇÃO";
    const competition = formatCompetition(leagueName);

    // Get round from either finalData or original match data
    const roundValue =
      finalData.league?.round ||
      this.match.league?.round ||
      "Regular Season - 38";
    const round = this.formatOrdinalRound(roundValue);

    let scoreLine = `${home} ${score.home} x ${score.away} ${away}`;
    const status = finalData.fixture.status?.short || "FT";
    if (status === "AET") scoreLine += " (após prorrogação)";
    if (status === "PEN") {
      const pen = finalData.score.penalty;
      scoreLine += ` (pênaltis: ${pen.home} x ${pen.away})`;
    }

    const title = `[PÓS-JOGO] | ${competition} | ${home} ${score.home} X ${score.away} ${away} | ${round}`;
    const body = `
## 📊 Resultado Final: ${competition} - ${round}

**${scoreLine}**

📍 *${venue.name}, ${venue.city}*  
🕓 *Data: ${kickoff} (Brasília)*

---

### ⚽ Gols
${this.formatGoals(finalData)}

---

### 📈 Estatísticas
${this.formatStats(finalData)}

---

⚽️ Vamo Inter! ❤️

---
^(*Esse post foi criado automaticamente por um bot.*)
`.trim();

    return { title, body };
  }

  private formatGoals(finalData: any): string {
    const events = finalData.events || [];
    const goals = events.filter((e: any) => e.type === "Goal");
    if (goals.length === 0) return "_Nenhum gol registrado._";

    return goals
      .map(
        (g: any) => `⚽️ ${g.team.name}: ${g.player.name} (${g.time.elapsed}')`
      )
      .join("\n");
  }

  private formatStats(finalData: any): string {
    const stats = finalData.statistics;
    if (!stats || stats.length < 2) return "_Estatísticas indisponíveis._";

    const [homeStats, awayStats] = stats;
    const lines = [
      `| Estatística | ${homeStats.team.name.toUpperCase()} | ${awayStats.team.name.toUpperCase()} |`,
      "|-------------|------------------|------------------|",
    ];

    const translationMap: { [key: string]: string } = {
      "Ball Possession": "Posse de Bola",
      "Total Shots": "Finalizações",
      "Shots on Goal": "Finalizações no Gol",
      "Shots off Goal": "Finalizações para Fora",
      "Blocked Shots": "Finalizações Bloqueadas",
      "Shots insidebox": "Finalizações Dentro da Área",
      "Shots outsidebox": "Finalizações Fora da Área",
      Fouls: "Faltas",
      "Corner Kicks": "Escanteios",
      Offsides: "Impedimentos",
      "Yellow Cards": "Cartões Amarelos",
      "Red Cards": "Cartões Vermelhos",
      "Goalkeeper Saves": "Defesas do Goleiro",
      "Total passes": "Total de Passes",
      "Passes accurate": "Passes Certos",
      "Passes %": "Precisão de Passes",
      "Expected goals": "Expected Goals (xG)",
    };

    for (let i = 0; i < homeStats.statistics.length; i++) {
      const stat = homeStats.statistics[i];
      const awayStat = awayStats.statistics[i];
      const statName = translationMap[stat.type] || stat.type;
      lines.push(`| ${statName} | ${stat.value} | ${awayStat?.value ?? "-"} |`);
    }

    return lines.join("\n");
  }

  private formatOrdinalRound(round: string): string {
    const match = round.match(/Regular Season\s*-\s*(\d+)/i);
    if (match) return `${match[1]}ª RODADA`;
    const group = round.match(/Group Stage\s*-\s*(\w+)/i);
    if (group) return `GRUPO ${group[1]}`;
    return round.toUpperCase();
  }
}
