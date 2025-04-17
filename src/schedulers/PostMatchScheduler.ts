import { BaseScheduler } from "./BaseScheduler";
import { DateTime } from "luxon";
import { postMatchThread } from "../reddit/redditClient";
import { DRY_RUN, USE_MOCK_DATA } from "../config/appConfig";
import { fetchFinalMatchData, fetchMatchStatus } from "../api/apiClient";
import { formatCompetition } from "../formatters/matchFormatters";

export class PostMatchScheduler extends BaseScheduler {
  private finalData: any = null;

  constructor(match: any) {
    super(match, "postMatchPosted");
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
    const matchEndUTC = DateTime.fromISO(this.match.fixture.date, {
      zone: "utc",
    }).plus({ hours: 2 }); // Assuming match duration of ~2 hours

    console.log(
      `🕒 Would be posted at: ${matchEndUTC.toFormat(
        "cccc, dd 'de' LLLL 'de' yyyy 'às' HH:mm:ss"
      )} (UTC) ${
        DRY_RUN ? "[DRY RUN 🚧]" : "[LIVE MODE 🚀]"
      } (after match ends)`
    );
    console.log("\n" + "=".repeat(80) + "\n");
  }

  async createAndPostThread(): Promise<void> {
    // If in dry run mode, just post the thread without extra messages
    if (DRY_RUN) {
      // Fetch final data if we haven't already
      if (!this.finalData) {
        this.finalData = await fetchFinalMatchData(this.match.fixture.id);
      }

      await this.renderAndPostThread(this.finalData);
      return;
    }

    // Calculate when to start checking match status (2h after match start)
    const matchStartUTC = DateTime.fromISO(this.match.fixture.date, {
      zone: "utc",
    });
    const checkAfter = matchStartUTC.plus({ hours: 2 });

    // Wait until we should start checking
    await this.waitUntil(checkAfter);

    // Start polling for match status
    await this.pollUntilMatchFinished();
  }

  private async pollUntilMatchFinished(): Promise<void> {
    const matchId = this.match.fixture.id;

    // Get current match status
    const status = await fetchMatchStatus(matchId);
    console.log(`📡 Match status: ${status}`);

    // If match is finished, post the thread
    if (["FT", "AET", "PEN"].includes(status)) {
      this.finalData = await fetchFinalMatchData(matchId);
      await this.renderAndPostThread(this.finalData);
      return;
    }

    // Otherwise, check again in 2 minutes
    console.log("⏱️ Match not finished yet. Will check again in 2 minutes...");
    setTimeout(() => this.pollUntilMatchFinished(), 2 * 60 * 1000);
  }

  private async renderAndPostThread(finalData: any): Promise<void> {
    const { title, body } = this.formatThreadContent(finalData);

    if (DRY_RUN) {
      // In dry run mode, we've already shown the preview, so just show a brief message
      console.log("🚧 [DRY RUN] Post-match thread would be posted to Reddit");
    } else {
      console.log("🚀 Posting post-match thread!");
      await postMatchThread(title, body);
      this.markAsPosted();
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

    const leagueName = finalData.league?.name ?? "COMPETIÇÃO";
    const competition = formatCompetition(leagueName);
    const round = this.formatOrdinalRound(finalData.league?.round || "");

    let scoreLine = `${home} ${score.home} x ${score.away} ${away}`;
    const status = finalData.fixture.status?.short || "FT";
    if (status === "AET") scoreLine += " (após prorrogação)";
    if (status === "PEN") {
      const pen = finalData.score.penalty;
      scoreLine += ` (pênaltis: ${pen.home} x ${pen.away})`;
    }

    const title = `[PÓS-JOGO] | ${competition} | ${home} ${score.home} X ${score.away} ${away} | ${round}`;
    const body = `
## 📊 Resultado Final

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
