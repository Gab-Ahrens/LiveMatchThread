import { BaseScheduler } from "./BaseScheduler";
import { DateTime } from "luxon";
import { postMatchThread } from "../reddit/redditClient";
import { DRY_RUN } from "../config/appConfig";
import {
  formatCompetition,
  formatPreMatchThread,
} from "../formatters/matchFormatters";
import {
  formatThreadTime,
  formatDateTimeForConsole,
  TIMEZONE_BRASILIA,
} from "../utils/dateUtils";
import { getTeamNickname } from "../utils/nicknameUtils";

export class PreMatchScheduler extends BaseScheduler {
  constructor(match: any) {
    super(match, "preMatchPosted");
  }

  // Generate thread content
  private async formatThreadContent() {
    // Get home and away team names
    const homeTeam = this.match.teams.home;
    const awayTeam = this.match.teams.away;

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
        `Using nickname for opponent: ${homeName} (originally ${homeTeam.name})`
      );
    }
    if (awayName !== awayTeam.name.toUpperCase()) {
      console.log(
        `Using nickname for opponent: ${awayName} (originally ${awayTeam.name})`
      );
    }

    const competition = this.formatCompetitionName(
      this.match.league?.name ?? ""
    );
    const round = this.formatOrdinalRound(
      this.match.league?.round || "",
      this.match.league?.name || ""
    );

    const title = `[PRÉ-JOGO] | ${competition} | ${homeName} X ${awayName} | ${round}`;
    const body = await formatPreMatchThread(this.match);

    return { title, body };
  }

  // Preview the thread content
  async previewThreadContent(): Promise<void> {
    console.log("\n[PREVIEW] Pre-Match Thread:");
    const content = await this.formatThreadContent();
    console.log(`Title: ${content.title}`);
    console.log(`Body:\n${content.body}`);

    // Calculate target time (24 hours before match)
    const matchStart = DateTime.fromISO(this.match.fixture.date, {
      zone: "utc",
    });
    const postAt = matchStart.minus({ hours: 24 });

    console.log(
      `\nWould be posted at: ${formatDateTimeForConsole(postAt)} ${
        DRY_RUN ? "[DRY RUN]" : "[LIVE MODE]"
      }`
    );
    console.log("\n" + "=".repeat(80) + "\n");
  }

  async createAndPostThread(): Promise<void> {
    // Calculate target time (24 hours before match)
    const matchStart = DateTime.fromISO(this.match.fixture.date, {
      zone: "utc",
    });
    const postAt = matchStart.minus({ hours: 24 });

    // Wait until time to post
    await this.waitUntil(postAt);

    // Post thread logic
    const threadContent = await this.formatThreadContent();
    await this.postThread(threadContent.title, threadContent.body);

    // Mark as posted
    this.markAsPosted();
  }

  private async postThread(title: string, body: string) {
    if (DRY_RUN) {
      // In dry run mode, we've already shown the preview, so just show a brief message
      console.log("[DRY RUN] Pre-match thread would be posted to Reddit");
    } else {
      console.log("Posting pre-match thread!");
      await postMatchThread(title, body, "Pré-Jogo");
    }
  }

  private formatCompetitionName(rawName: string): string {
    const normalized = rawName
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toUpperCase();
    return normalized.includes("SERIE A") ? "BRASILEIRÃO" : normalized;
  }

  private formatOrdinalRound(round: string, competitionName: string): string {
    const rodadaMatch = round.match(
      /(Regular Season|Temporada Regular)\s*-\s*(\d+)/i
    );
    if (rodadaMatch) return `${rodadaMatch[2]}ª RODADA`;

    const groupMatch = round.match(/Group Stage - (\w+)/i);
    if (groupMatch) {
      // Convert group numbers to letters for Copa Libertadores
      const isLibertadores = competitionName
        .toLowerCase()
        .includes("libertadores");
      let groupIdentifier = groupMatch[1];

      if (isLibertadores) {
        const groupNumber = parseInt(groupIdentifier);
        if (!isNaN(groupNumber) && groupNumber >= 1 && groupNumber <= 8) {
          groupIdentifier = String.fromCharCode(64 + groupNumber); // 1->A, 2->B, etc.
        }
      }

      return `GRUPO ${groupIdentifier}`;
    }

    return round.toUpperCase();
  }
}
