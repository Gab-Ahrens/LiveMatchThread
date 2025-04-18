import { BaseScheduler } from "./BaseScheduler";
import { DateTime } from "luxon";
import { DRY_RUN, USE_MOCK_DATA } from "../config/appConfig";
import { postMatchThread } from "../reddit/redditClient";
import { fetchFinalMatchData, fetchMatchStatus } from "../api/apiClient";
import { formatCompetition } from "../formatters/matchFormatters";
import {
  formatDateTimeForConsole,
  formatThreadTime,
  TIMEZONE_BRASILIA,
} from "../utils/dateUtils";

export class PostMatchScheduler extends BaseScheduler {
  constructor(match: any) {
    super(match, "postMatchPosted");
  }

  // Preview the thread content
  async previewThreadContent(): Promise<void> {
    console.log("\n📋 [PREVIEW] Post-Match Thread:");
    console.log(`🔍 Using ${USE_MOCK_DATA ? "mock data 🧪" : "live data ☁️"}`);

    // We'll simulate a completed match for preview purposes
    try {
      const { title, body } = await this.formatContent();
      console.log(`Title: ${title}`);
      console.log(`Body:\n${body}`);

      // Show the estimated posting time
      const estimatedEnd = this.getEstimatedEndTime();
      if (estimatedEnd) {
        console.log(
          `🕒 Would be posted at: ${formatDateTimeForConsole(estimatedEnd)} ${
            DRY_RUN ? "[DRY RUN 🚧]" : "[LIVE MODE 🚀]"
          } (after match ends)`
        );
      }
      console.log("\n" + "=".repeat(80) + "\n");
    } catch (error) {
      console.error("❌ Error generating post-match thread preview:", error);
    }
  }

  // There is no scheduled post time, it depends on when the match finishes
  getScheduledPostTime(): DateTime | null {
    return null;
  }

  // Estimate when the match will end (2 hours after kickoff)
  getEstimatedEndTime(): DateTime | null {
    const matchDate = DateTime.fromISO(this.match.fixture.date, {
      zone: "utc",
    });
    // Typical match duration is 2 hours (including halftime, added time, etc.)
    return matchDate.plus({ hours: 2 });
  }

  // Check if we should poll for match status
  async shouldCheckMatchStatus(): Promise<boolean> {
    // If already posted, no need to check
    if (this.isAlreadyPosted()) {
      return false;
    }

    // Only check if we're past the estimated end time
    const estimatedEnd = this.getEstimatedEndTime();
    const now = DateTime.now();

    if (estimatedEnd && now >= estimatedEnd) {
      return true;
    }

    return false;
  }

  // Check match status and post if finished
  async checkAndPostIfFinished(): Promise<boolean> {
    try {
      console.log("📡 Checking match status...");
      const status = await fetchMatchStatus(this.match.fixture.id);
      console.log(`📡 Match status: ${status}`);

      // If match is finished (FT), post the thread
      if (status === "FT" || status === "AET" || status === "PEN") {
        console.log("✅ Match has finished! Creating post-match thread...");
        await this.createAndPostThread();
        return true;
      } else {
        console.log("⏳ Match not finished yet. Current status: " + status);
        return false;
      }
    } catch (error) {
      console.error("❌ Error checking match status:", error);
      return false;
    }
  }

  // Create and post the thread
  async createAndPostThread(): Promise<void> {
    try {
      const { title, body } = await this.formatContent();
      await this.postThread(title, body);
      this.markAsPosted();
    } catch (error) {
      console.error("❌ Error creating post-match thread:", error);
    }
  }

  // Format the thread content
  private async formatContent(): Promise<{ title: string; body: string }> {
    try {
      const finalData = await fetchFinalMatchData(this.match.fixture.id);

      // Format the thread content
      const home = finalData.teams.home.name.toUpperCase();
      const away = finalData.teams.away.name.toUpperCase();
      const score = finalData.score.fulltime;
      const venue = finalData.fixture.venue;

      // Format the kickoff time in Brasilia time zone
      const kickoff = formatThreadTime(finalData.fixture.date);

      // Get competition name - use the original match data for league info
      // since it might not be in the final data
      const leagueName = this.match.league?.name || "COMPETIÇÃO";
      const competition = formatCompetition(leagueName);

      // Format the round - use the original match data for round info
      const roundValue = this.match.league?.round || "Regular Season - 38";
      const round = this.formatOrdinalRound(roundValue);

      // Format the score line with extra info for AET or penalties
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
    } catch (error) {
      console.error("❌ Error fetching final match data:", error);
      throw error;
    }
  }

  // Helper method to format goals
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

  // Helper method to format match statistics
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

  // Post the thread
  private async postThread(title: string, body: string): Promise<void> {
    if (DRY_RUN) {
      console.log("🚧 [DRY RUN] Post-match thread would be posted to Reddit");
    } else {
      console.log("🚀 Posting post-match thread!");
      await postMatchThread(title, body);
    }
  }

  // Helper to format round number
  private formatOrdinalRound(round: string): string {
    const match = round.match(/Regular Season\s*-\s*(\d+)/i);
    if (match) return `${match[1]}ª RODADA`;
    const group = round.match(/Group Stage\s*-\s*(\w+)/i);
    if (group) return `GRUPO ${group[1]}`;
    return round.toUpperCase();
  }
}
