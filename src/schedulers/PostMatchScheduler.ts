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
    console.log("\n[PREVIEW] Post-Match Thread:");
    console.log(`Using ${USE_MOCK_DATA ? "mock data" : "live data"}`);

    // For preview, we'll create a simulated title since the match hasn't finished yet
    try {
      if (USE_MOCK_DATA) {
        // If using mock data, we can show the actual formatted content
        const { title, body } = await this.formatContent();
        console.log(`Title: ${title}`);
        console.log(`Body:\n${body}`);
      } else {
        // For live data, show a preview with placeholder scores since match hasn't finished
        const homeTeam = this.match.teams.home.name;
        const awayTeam = this.match.teams.away.name;
        const competition = formatCompetition(
          this.match.league?.name || "COMPETIÇÃO"
        );
        const roundValue = this.match.league?.round || "Regular Season - 38";
        const round = this.formatOrdinalRound(roundValue);

        // Determine which team is Internacional and use nicknames for opponents
        const isHomeInter = homeTeam.includes("Internacional");
        let homeName = isHomeInter
          ? homeTeam.toUpperCase()
          : getTeamNickname(homeTeam).toUpperCase();
        let awayName = !isHomeInter
          ? awayTeam.toUpperCase()
          : getTeamNickname(awayTeam).toUpperCase();

        const previewTitle = `[PÓS-JOGO] | ${competition} | ${homeName} X X ${awayName} | ${round}`;
        console.log(`Title: ${previewTitle}`);
        console.log(
          `Body: [Post-match content will be generated after the match ends with final scores, goals, and statistics]`
        );
      }

      // Show the estimated posting time
      const estimatedEnd = this.getEstimatedEndTime();
      if (estimatedEnd) {
        console.log(
          `Would be posted at: ${formatDateTimeForConsole(estimatedEnd)} ${
            DRY_RUN ? "[DRY RUN]" : "[LIVE MODE]"
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
      // Check if thread is already posted before setting up polling
      if (this.isAlreadyPosted()) {
        console.log("✅ Post-match thread already posted. Skipping setup.");
        return;
      }

      // Setup a polling interval to check match status
      console.log(
        "⏳ Setting up post-match thread scheduling and match status polling..."
      );

      // Get match kickoff time
      const matchDate = DateTime.fromISO(this.match.fixture.date, {
        zone: "utc",
      });
      const now = DateTime.now();

      // Check if match has already ended (in case of bot restart after match completion)
      const estimatedEndTime = this.getEstimatedEndTime();
      if (estimatedEndTime && now > estimatedEndTime) {
        console.log("🔍 Match likely already ended. Checking final status...");
        await this.checkFinalStatusAndPost();
        return;
      }

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
    // Check if thread is already posted before starting polling
    if (this.isAlreadyPosted()) {
      console.log("✅ Post-match thread already posted. Skipping polling.");
      return;
    }

    // Check status every 2 minutes during the match (reduced from 1 minute to save API calls)
    const checkInterval = 120_000; // 2 minutes
    let statusCheckCount = 0;
    let consecutiveErrors = 0;

    // Maximum polling duration (4 hours)
    const maxPollingDuration = 4 * 60 * 60 * 1000;

    console.log(
      `🔄 Starting to poll for match end (interval: ${
        checkInterval / 1000
      }s)...`
    );

    const intervalId = setInterval(async () => {
      try {
        // Double-check if thread was already posted (in case of concurrent execution)
        if (this.isAlreadyPosted()) {
          console.log("✅ Post-match thread already posted. Stopping polling.");
          clearInterval(intervalId);
          return;
        }

        statusCheckCount++;
        console.log(`📡 Checking match status (check #${statusCheckCount})...`);
        const status = await fetchMatchStatus(this.match.fixture.id);
        console.log(`📡 Match status: ${status}`);

        // Reset error counter on successful API call
        consecutiveErrors = 0;

        // Group statuses by category for easier handling
        const finishedStatuses = ["FT", "AET", "PEN"];
        const irregularEndingStatuses = [
          "CANC",
          "ABD",
          "AWD",
          "WO",
          "SUSP",
          "INT",
        ];
        const preMatchStatuses = ["NS", "PST", "TBD"];
        const inPlayStatuses = ["1H", "2H", "HT", "BT", "ET", "P", "LIVE"];

        // Match has finished normally
        if (finishedStatuses.includes(status)) {
          console.log("✅ Match has finished! Creating post-match thread...");
          clearInterval(intervalId);

          // Final check before posting to prevent race conditions
          if (this.isAlreadyPosted()) {
            console.log(
              "✅ Post-match thread already posted by another process. Skipping."
            );
            return;
          }

          // Wait 2 minutes after the match ends before posting
          // This allows the API to update all the final statistics
          console.log(
            "⏱️ Waiting 2 minutes for final match data to be available..."
          );
          setTimeout(
            async () => {
              try {
                // Final check before posting
                if (this.isAlreadyPosted()) {
                  console.log(
                    "✅ Post-match thread already posted. Skipping delayed post."
                  );
                  return;
                }

                const { title, body } = await this.formatContent();
                await this.postThread(title, body);
                this.markAsPosted();
              } catch (postError) {
                console.error("❌ Error posting post-match thread:", postError);
              }
            },
            2 * 60 * 1000
          );
        }
        // Match has ended irregularly
        else if (irregularEndingStatuses.includes(status)) {
          console.log(
            `⚠️ Match ended with irregular status: ${status}. Creating post-match thread with special notice.`
          );
          clearInterval(intervalId);

          // Final check before posting to prevent race conditions
          if (this.isAlreadyPosted()) {
            console.log(
              "✅ Post-match thread already posted by another process. Skipping."
            );
            return;
          }

          setTimeout(
            async () => {
              try {
                // Final check before posting
                if (this.isAlreadyPosted()) {
                  console.log(
                    "✅ Post-match thread already posted. Skipping delayed post."
                  );
                  return;
                }

                // Create a modified post-match thread that acknowledges the irregular ending
                const { title, body } = await this.formatContent(status);
                await this.postThread(title, body);
                this.markAsPosted();
              } catch (postError) {
                console.error(
                  "❌ Error posting post-match thread for irregular ending:",
                  postError
                );
              }
            },
            2 * 60 * 1000
          );
        }
        // Match hasn't started or is scheduled
        else if (preMatchStatuses.includes(status)) {
          console.log(
            `ℹ️ Match has not yet started (${status}). Continuing to poll...`
          );

          // If status is consistently showing match hasn't started for a while,
          // we might want to reduce polling frequency
          if (statusCheckCount > 30 && preMatchStatuses.includes(status)) {
            console.log(
              "⏱️ Match still not started after multiple checks. Reducing polling frequency..."
            );
            clearInterval(intervalId);
            setTimeout(() => this.startPollingMatchStatus(), 15 * 60 * 1000); // Check every 15 minutes
          }
        }
        // Match is in play
        else if (inPlayStatuses.includes(status)) {
          console.log(`⏳ Match in progress. Current status: ${status}`);

          // For specific in-play statuses, we might adjust polling behavior
          if (status === "HT" || status === "BT") {
            console.log(
              "⏱️ Match is at half-time or break. Continuing to poll..."
            );
          } else if (status === "ET" || status === "P") {
            console.log(
              "⚽ Match is in extra time or penalties. Continuing to poll with standard frequency..."
            );
          }
        }
        // Unknown status
        else {
          console.log(
            `⚠️ Unknown match status: ${status}. Continuing to poll...`
          );
        }
      } catch (error) {
        consecutiveErrors++;
        console.error(
          `❌ Error checking match status (error #${consecutiveErrors}):`,
          error
        );

        // Implement exponential backoff for errors
        if (consecutiveErrors > 5) {
          console.warn(
            `⚠️ Too many consecutive errors (${consecutiveErrors}). Slowing down polling...`
          );
          clearInterval(intervalId);
          // Retry after 5 minutes if we're hitting too many errors
          setTimeout(() => this.startPollingMatchStatus(), 5 * 60 * 1000);
        }
      }
    }, checkInterval);

    // Set a timeout to stop polling after max duration
    setTimeout(() => {
      console.log(
        `⚠️ Maximum polling duration reached (${
          maxPollingDuration / 3600000
        } hours). Stopping poll.`
      );
      clearInterval(intervalId);

      // Try one last time to check match status
      this.checkFinalStatusAndPost();
    }, maxPollingDuration);
  }

  // In case polling times out, make one final attempt to check status and post
  private async checkFinalStatusAndPost(): Promise<void> {
    try {
      // Check if thread is already posted before making final attempt
      if (this.isAlreadyPosted()) {
        console.log(
          "✅ Post-match thread already posted. Skipping final check."
        );
        return;
      }

      console.log(
        "🔍 Making final check of match status after polling timeout..."
      );
      const status = await fetchMatchStatus(this.match.fixture.id);

      const finishedStatuses = [
        "FT",
        "AET",
        "PEN",
        "CANC",
        "ABD",
        "AWD",
        "WO",
        "SUSP",
        "INT",
      ];
      if (finishedStatuses.includes(status)) {
        // Final check before posting to prevent race conditions
        if (this.isAlreadyPosted()) {
          console.log(
            "✅ Post-match thread already posted by another process. Skipping final post."
          );
          return;
        }

        console.log(
          `✅ Match has ended with status: ${status}. Creating post-match thread...`
        );
        const { title, body } = await this.formatContent(status);
        await this.postThread(title, body);
        this.markAsPosted();
      } else {
        console.log(
          `⚠️ Match still not ended (status: ${status}) after maximum polling time. No post-match thread created.`
        );
      }
    } catch (error) {
      console.error("❌ Error in final status check:", error);
    }
  }

  // Format the thread content
  private async formatContent(
    matchStatus?: string
  ): Promise<{ title: string; body: string }> {
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
      const status = matchStatus || finalData.fixture.status?.short || "FT";

      // Add extra information based on match status
      if (status === "AET") scoreLine += " (após prorrogação)";
      if (status === "PEN") {
        const pen = finalData.score.penalty;
        scoreLine += ` (pênaltis: ${pen.home} x ${pen.away})`;
      }

      // Handle irregular match endings
      let specialNotice = "";
      if (["CANC", "SUSP", "INT", "ABD", "AWD", "WO"].includes(status)) {
        let statusText = "";
        switch (status) {
          case "CANC":
            statusText = "CANCELADA";
            break;
          case "SUSP":
            statusText = "SUSPENSA";
            break;
          case "INT":
            statusText = "INTERROMPIDA";
            break;
          case "ABD":
            statusText = "ABANDONADA";
            break;
          case "AWD":
            statusText = "RESULTADO DECIDIDO";
            break;
          case "WO":
            statusText = "W.O.";
            break;
          default:
            statusText = status;
        }

        specialNotice = `
## ⚠️ ATENÇÃO: PARTIDA ${statusText}

**A partida não foi concluída normalmente.**
`;
      }

      const title = `[PÓS-JOGO] | ${competition} | ${homeName} ${score.home} X ${score.away} ${awayName} | ${round}`;

      // For the body content, use real team names to avoid confusion in statistics
      const realHomeName = homeTeam.name.toUpperCase();
      const realAwayName = awayTeam.name.toUpperCase();

      const body = `
## Resultado Final: ${competition} - ${round}
${specialNotice}
**${scoreLine}**

**Local:** ${venue.name}, ${venue.city}  
**Data:** ${kickoff} (Brasília)

---

### Gols
${this.formatGoals(finalData)}

---

### Estatísticas
${this.formatStats(finalData, realHomeName, realAwayName)}

---

Vamo Inter!

---
^(*Thread criado automaticamente*)
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

    if (!Array.isArray(events)) {
      console.warn("⚠️ Events data is not an array:", events);
      return "_Dados de eventos inválidos._";
    }

    const goals = events.filter((e: any) => {
      return e && e.type === "Goal" && e.team && e.player && e.time;
    });

    if (goals.length === 0) return "_Nenhum gol registrado._";

    return goals
      .map((g: any) => {
        const teamName = g.team?.name || "Time desconhecido";
        const playerName = g.player?.name || "Jogador desconhecido";
        const minute = g.time?.elapsed || "?";
        const extraTime = g.time?.extra ? `+${g.time.extra}` : "";

        return `${teamName}: ${playerName} (${minute}${extraTime}')`;
      })
      .join("\n");
  }

  // Helper method to format match statistics
  private formatStats(
    finalData: any,
    homeName: string,
    awayName: string
  ): string {
    const stats = finalData.statistics;
    if (!stats || !Array.isArray(stats) || stats.length < 2) {
      console.warn("⚠️ Statistics data is invalid or incomplete:", stats);
      return "_Estatísticas indisponíveis._";
    }

    const [homeStats, awayStats] = stats;

    if (!homeStats?.statistics || !awayStats?.statistics) {
      console.warn("⚠️ Team statistics data is missing");
      return "_Estatísticas indisponíveis._";
    }

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
      expected_goals: "Expected Goals (xG)",
    };

    for (let i = 0; i < homeStats.statistics.length; i++) {
      const stat = homeStats.statistics[i];
      const awayStat = awayStats.statistics[i];

      if (!stat || !stat.type) continue;

      const statName = translationMap[stat.type] || stat.type;
      const homeValue =
        stat.value !== null && stat.value !== undefined ? stat.value : "-";
      const awayValue =
        awayStat?.value !== null && awayStat?.value !== undefined
          ? awayStat.value
          : "-";

      lines.push(`| ${statName} | ${homeValue} | ${awayValue} |`);
    }

    return lines.join("\n");
  }

  // Post the thread
  private async postThread(title: string, body: string): Promise<void> {
    if (DRY_RUN) {
      console.log("[DRY RUN] Post-match thread would be posted to Reddit");
    } else {
      console.log("Posting post-match thread!");
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

  // Public method to immediately create post-match thread for finished matches
  async createPostMatchThreadNow(): Promise<void> {
    try {
      console.log(
        "🔍 Checking if match has finished and creating post-match thread..."
      );

      // Check if thread is already posted
      if (this.isAlreadyPosted()) {
        console.log("✅ Post-match thread already posted. Skipping.");
        return;
      }

      // Use the private method to check status and post
      await this.checkFinalStatusAndPost();
    } catch (error) {
      console.error("❌ Error creating post-match thread immediately:", error);
      throw error;
    }
  }
}
