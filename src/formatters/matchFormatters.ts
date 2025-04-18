/**
 * Match Thread Formatters
 *
 * Formatting functions for match threads
 */
import { DateTime } from "luxon";
import { fetchLast5Matches } from "../api/apiClient";
import { getTeamNickname } from "../utils/nicknameUtils";

/**
 * Formats the competition name to a standardized format
 */
export function formatCompetition(name: string): string {
  // Normalize accents and special characters for comparison
  const normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  // Common abbreviations and normalization
  if (normalized.includes("SERIE A") || normalized.includes("BRASILEIRAO")) {
    return "BRASILEIRÃO";
  }

  return name.toUpperCase();
}

/**
 * Formats the round to an ordinal number (e.g., "1ª RODADA")
 */
export function formatOrdinalRound(round: string): string {
  const rodadaMatch = round.match(
    /(Regular Season|Temporada Regular)\s*-\s*(\d+)/i
  );
  if (rodadaMatch) return `${rodadaMatch[2]}ª RODADA`;

  const groupMatch = round.match(/Group Stage - (\w)/i);
  if (groupMatch) return `GRUPO ${groupMatch[1]}`;

  return round.toUpperCase();
}

/**
 * Formats round names for different competition stages
 */
export function formatRound(round: string): string {
  // Group Stage
  const groupMatch = round.match(/Group Stage - (\w)/i);
  if (groupMatch) return `GRUPO ${groupMatch[1]}`;

  // Regular Season - 2 → Rodada 2
  const rodadaMatch = round.match(
    /(Regular Season|Temporada Regular)\s*-\s*(\d+)/i
  );
  if (rodadaMatch) return `RODADA ${rodadaMatch[2]}`;

  // Knockouts
  return round
    .replace("Quarter-finals", "QUARTAS DE FINAL")
    .replace("Semi-finals", "SEMIFINAL")
    .replace("Final", "FINAL")
    .toUpperCase();
}

/**
 * Formats lineup data into a readable format
 */
export function formatLineups(lineups: any[]): string {
  if (!lineups || lineups.length === 0)
    return "Escalações indisponíveis no momento.";

  return lineups
    .map((team) => {
      if (!team || !team.team) {
        console.log("⚠️ Invalid lineup data for a team:", team);
        return "**Dados de escalação inválidos**";
      }

      const coach = team.coach?.name || "Desconhecido";
      const starters =
        team.startXI
          ?.filter(Boolean)
          ?.map(
            (p: { player: { name: any } }) => p.player?.name || "Desconhecido"
          )
          .join(", ") || "N/A";
      const subs =
        team.substitutes
          ?.filter(Boolean)
          ?.map(
            (p: { player: { name: any } }) => p.player?.name || "Desconhecido"
          )
          .join(", ") || "N/A";

      return `
**${team.team.name}**
👔 Técnico: ${coach}  
🔴 Titulares: ${starters}  
⚪ Banco: ${subs}
`;
    })
    .join("\n\n");
}

/**
 * Formats the title for match threads
 */
export function formatMatchTitle(match: any): string {
  // Get competition name
  const competition = formatCompetition(match.league?.name || "CAMPEONATO");

  // Get round
  const round = formatOrdinalRound(match.league?.round || "");

  // Determine which team is Internacional and which is the opponent
  const homeTeam = match.teams.home;
  const awayTeam = match.teams.away;
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

  return `[JOGO] | ${competition} | ${homeName} X ${awayName} | ${round}`;
}

/**
 * Formats the last 5 results for a team
 */
export function formatLast5Results(matches: any[], teamId: number): string {
  return matches
    .map((match) => {
      const { home, away } = match.teams;
      const { home: homeScore, away: awayScore } = match.score.fulltime;

      const isHome = home.id === teamId;
      const teamScore = isHome ? homeScore : awayScore;
      const opponentScore = isHome ? awayScore : homeScore;
      const opponentName = isHome ? away.name : home.name;

      let resultIcon = "➖ Empate";
      if (teamScore > opponentScore) resultIcon = "✅ Vitória";
      else if (teamScore < opponentScore) resultIcon = "❌ Derrota";

      return `${resultIcon} contra ${opponentName} (${teamScore}x${opponentScore})`;
    })
    .join("\n");
}

/**
 * Formats the full match thread content
 */
export async function formatMatchThread(
  match: any,
  lineups?: any
): Promise<string> {
  const { fixture, teams, league } = match;
  const { venue } = fixture;

  const kickoff = new Date(fixture.date).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "full",
    timeStyle: "short",
  });

  const homeTeamId = teams.home.id;
  const awayTeamId = teams.away.id;
  const homeTeamName = teams.home.name;
  const awayTeamName = teams.away.name;
  const leagueId = league.id;
  const season = league.season;

  const last5Home = await fetchLast5Matches(homeTeamId, leagueId, season);
  const last5Away = await fetchLast5Matches(awayTeamId, leagueId, season);

  const homeResults = formatLast5Results(last5Home, homeTeamId);
  const awayResults = formatLast5Results(last5Away, awayTeamId);

  const last5Section = `
📉 Últimos 5 jogos do ${homeTeamName} (${formatCompetition(league.name)})
${homeResults}

📉 Últimos 5 jogos do ${awayTeamName} (${formatCompetition(league.name)})
${awayResults}
`;

  let stadium = venue?.name ?? "Unknown Venue";
  if (stadium === "Estádio José Pinheiro Borda") {
    stadium = "Estádio Beira-Rio";
  }
  const city = venue?.city ?? "Unknown City";
  const referee = fixture.referee || "Desconhecido";

  const lineupSection = lineups
    ? formatLineups(lineups)
    : "Escalações indisponíveis no momento.";

  console.log(`homeResults log`, homeResults);
  console.log(`awayResults log`, awayResults);
  const threadBody = `
## 🏆 ${formatCompetition(league.name)} - ${formatRound(league.round)}

**${homeTeamName}** vs **${awayTeamName}**

📍 *${stadium}, ${city}*  
🕓 *Horário: ${kickoff} (Brasília)*  
🧑‍⚖️ Árbitro: ${referee}

---

👥 **Escalações**

${lineupSection}

---

${last5Section}

⚽️ Vamo Inter! ❤️

---

^(*Esse thread foi criado automaticamente por um bot.*)
  `.trim();

  return threadBody;
}
