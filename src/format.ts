function formatCompetition(name: string): string {
  if (name.toLowerCase().includes('libertadores')) {
    return 'LIBERTADORES';
  }
  if (name.toLowerCase().includes('serie a')) {
    return 'BRASILEIRÃO SÉRIE A';
  }
  if (name.toLowerCase().includes('copa do brasil')) {
    return 'COPA DO BRASIL';
  }
  return name.toUpperCase();
}

function formatRound(round: string): string {
  // Group Stage
  const groupMatch = round.match(/Group Stage - (\w)/i);
  if (groupMatch) return `GRUPO ${groupMatch[1]}`;

  // Regular Season - 2 → Rodada 2
  const rodadaMatch = round.match(/(Regular Season|Temporada Regular)\s*-\s*(\d+)/i);
  if (rodadaMatch) return `RODADA ${rodadaMatch[2]}`;

  // Knockouts
  return round
    .replace('Quarter-finals', 'QUARTAS DE FINAL')
    .replace('Semi-finals', 'SEMIFINAL')
    .replace('Final', 'FINAL')
    .toUpperCase();
}

export function formatMatchThread(match: any): string {
  const { fixture, teams, league } = match;
  const { venue } = fixture;

  const kickoff = new Date(fixture.date).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const home = teams.home.name;
  const away = teams.away.name;

  const competition = formatCompetition(league.name);
  const round = formatRound(league.round);
  const stadium = venue?.name ?? "Unknown Venue";
  const city = venue?.city ?? "Unknown City";

  const threadBody = `
## 🏆 ${competition} - ${round}

**${home}** vs **${away}**

📍 *${stadium}, ${city}*  
🕓 *Horário: ${kickoff} (Brasília)*

---

⚽️ Vamo Inter! ❤️

---

^(*Esse thread foi criado automaticamente por um bot.*)
`;

  return threadBody.trim();
}

export function formatMatchTitle(match: any): string {
  const { teams, league } = match;
  const home = teams.home.name.toUpperCase();
  const away = teams.away.name.toUpperCase();

  const competition = formatCompetition(league.name);
  const round = formatRound(league.round); // now gives "RODADA X" or "GRUPO F", etc.

  return `[JOGO] | ${competition} | ${home} X ${away} | ${round}`;
}