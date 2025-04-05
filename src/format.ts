function translateRound(round: string): string {
  return round
    .replace('Group Stage - ', 'Fase de Grupos - Grupo ')
    .replace('Group Stage', 'Fase de Grupos')
    .replace('Regular Season', 'Temporada Regular')
    .replace('Quarter-finals', 'Quartas de Final')
    .replace('Semi-finals', 'Semifinal')
    .replace('Final', 'Final');
}

export function formatMatchThread(match: any): string {
  const { fixture, teams, league } = match;
  const { venue } = fixture; // ✅ FIXED: Venue is nested inside fixture

  const kickoff = new Date(fixture.date).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const home = teams.home.name;
  const away = teams.away.name;

  const competition = league.name;
  const round = translateRound(league.round);
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
  const home = teams.home.name;
  const away = teams.away.name;
  const round = translateRound(league.round);
  const competition = translateRound(league.name);

  return `[Match Thread: ${home} vs ${away} [${competition} - ${round}]`;
}
