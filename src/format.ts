import { fetchLast5Matches } from "./api";

function formatCompetition(name: string): string {
  if (name.toLowerCase().includes("libertadores")) {
    return "LIBERTADORES";
  }
  if (name.toLowerCase().includes("serie a")) {
    return "BRASILEIRÃO";
  }
  if (name.toLowerCase().includes("copa do brasil")) {
    return "COPA DO BRASIL";
  }
  return name.toUpperCase();
}

function formatOrdinalRound(round: string): string {
  const rodadaMatch = round.match(
    /(Regular Season|Temporada Regular)\s*-\s*(\d+)/i
  );
  if (rodadaMatch) return `${rodadaMatch[2]}ª RODADA`;

  return formatRound(round); // fallback to other logic
}

function formatRound(round: string): string {
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

function formatLineups(lineups: any[]): string {
  if (!lineups || lineups.length === 0)
    return "Escalações indisponíveis no momento.";

  return lineups
    .map((team) => {
      const coach = team.coach?.name || "Desconhecido";
      const starters =
        team.startXI
          ?.map((p: { player: { name: any } }) => p.player.name)
          .join(", ") || "N/A";
      const subs =
        team.substitutes
          ?.map((p: { player: { name: any } }) => p.player.name)
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

export function formatMatchTitle(match: any): string {
  const { teams, league } = match;
  const home = teams.home.name.toUpperCase();
  const away = teams.away.name.toUpperCase();
  const competition = formatCompetition(league.name);
  const round = formatOrdinalRound(league.round);

  return `[JOGO] | ${competition} | ${home} X ${away} | ${round}`;
}

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

