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
import { getTeamNickname } from "../utils/nicknameUtils";

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
    // This functionality is now handled by our new polling system
    // Always return false to disable the old check system
    return false;
  }

  // Check match status and post if finished
  async checkAndPostIfFinished(): Promise<boolean> {
    try {
      console.log("📡 Checking match status (legacy method)...");
      // This is now handled by the new polling system
      return false;
    } catch (error) {
      console.error("❌ Error checking match status:", error);
      return false;
    }
  }

  // Create and post the thread
  async createAndPostThread(): Promise<void> {
    try {
      // Setup a polling interval to check match status
      console.log(
        "⏳ Setting up post-match thread scheduling and match status polling..."
      );

      // Get match kickoff time
      const matchDate = DateTime.fromISO(this.match.fixture.date, {
        zone: "utc",
      });
      const now = DateTime.now();

      // Start checking the match status at kickoff time
      // If kickoff time is in the past, start checking immediately
      if (now >= matchDate) {
        console.log(
          "🔄 Match already started. Starting match status polling immediately..."
        );
        this.startPollingMatchStatus();
      } else {
        const waitMs = matchDate.diff(now).milliseconds;
        console.log(
          `⏱️ Will start polling match status at kickoff time (in ${Math.round(
            waitMs / 60000
          )} minutes)`
        );

        // Wait until the match starts before polling
        setTimeout(() => {
          console.log(
            "⚽ Match kickoff time reached. Starting match status polling..."
          );
          this.startPollingMatchStatus();
        }, waitMs);
      }
    } catch (error) {
      console.error("❌ Error setting up post-match thread:", error);
    }
  }

  // Start polling for match status
  private startPollingMatchStatus(): void {
    // Check status every 1 minute during the match
    const checkInterval = 60_000; // 1 minute
    let statusCheckCount = 0;

    console.log(
      `🔄 Starting to poll for match end (interval: ${
        checkInterval / 1000
      }s)...`
    );

    const intervalId = setInterval(async () => {
      try {
        statusCheckCount++;
        console.log(`📡 Checking match status (check #${statusCheckCount})...`);
        const status = await fetchMatchStatus(this.match.fixture.id);
        console.log(`📡 Match status: ${status}`);

        // If match is finished (FT = full time, AET = after extra time, PEN = penalties)
        if (status === "FT" || status === "AET" || status === "PEN") {
          console.log("✅ Match has finished! Creating post-match thread...");
          clearInterval(intervalId);

          // Wait 2 minutes after the match ends before posting
          // This allows the API to update all the final statistics
          console.log(
            "⏱️ Waiting 2 minutes for final match data to be available..."
          );
          setTimeout(async () => {
            try {
              const { title, body } = await this.formatContent();
              await this.postThread(title, body);
              this.markAsPosted();
            } catch (postError) {
              console.error("❌ Error posting post-match thread:", postError);
            }
          }, 2 * 60 * 1000);
        } else if (
          ["NS", "PST", "TBD", "CANC", "ABD", "AWD", "WO"].includes(status)
        ) {
          // Match hasn't started, is postponed, cancelled, or other terminal non-playing state
          console.log(
            `⚠️ Match has unexpected status: ${status}. Slowing down polling.`
          );
          clearInterval(intervalId);

          // Slow down polling for non-started matches to once per hour
          setTimeout(() => this.startPollingMatchStatus(), 60 * 60 * 1000);
        } else {
          console.log(`⏳ Match in progress. Current status: ${status}`);
        }
      } catch (error) {
        console.error("❌ Error checking match status:", error);
      }
    }, checkInterval);
  }

  // Format the thread content
  private async formatContent(): Promise<{ title: string; body: string }> {
    try {
      const finalData = await fetchFinalMatchData(this.match.fixture.id);

      // Format the thread content
      const homeTeam = finalData.teams.home;
      const awayTeam = finalData.teams.away;
      const score = finalData.score.fulltime;
      const venue = finalData.fixture.venue;

      // Determine which team is Internacional and which is the opponent
      const isHomeInter = homeTeam.name.includes("Internacional");

      // Get appropriate team names (use nickname for opponent)
      let homeName = isHomeInter
        ? homeTeam.name.toUpperCase()
        : getTeamNickname(homeTeam.name).toUpperCase();

      let awayName = !isHomeInter
        ? awayTeam.name.toUpperCase()
        : getTeamNickname(awayTeam.name).toUpperCase();

      // If we're using a nickname, log it for visibility
      if (homeName !== homeTeam.name.toUpperCase()) {
        console.log(
          `🎭 Using nickname for opponent: ${homeName} (originally ${homeTeam.name})`
        );
      }
      if (awayName !== awayTeam.name.toUpperCase()) {
        console.log(
          `🎭 Using nickname for opponent: ${awayName} (originally ${awayTeam.name})`
        );
      }

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
      let scoreLine = `${homeName} ${score.home} x ${score.away} ${awayName}`;
      const status = finalData.fixture.status?.short || "FT";
      if (status === "AET") scoreLine += " (após prorrogação)";
      if (status === "PEN") {
        const pen = finalData.score.penalty;
        scoreLine += ` (pênaltis: ${pen.home} x ${pen.away})`;
      }

      const title = `[PÓS-JOGO] | ${competition} | ${homeName} ${score.home} X ${score.away} ${awayName} | ${round}`;

      // For the body content, use real team names to avoid confusion in statistics
      const realHomeName = homeTeam.name.toUpperCase();
      const realAwayName = awayTeam.name.toUpperCase();

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
${this.formatStats(finalData, realHomeName, realAwayName)}

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
  private formatStats(
    finalData: any,
    homeName: string,
    awayName: string
  ): string {
    const stats = finalData.statistics;
    if (!stats || stats.length < 2) return "_Estatísticas indisponíveis._";

    const [homeStats, awayStats] = stats;
    const lines = [
      `| Estatística | ${homeName} | ${awayName} |`,
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
