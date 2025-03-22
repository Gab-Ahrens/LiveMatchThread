export function formatMatchThread(match: any): string {
  const { fixture, teams, league, venue } = match;

  const kickoff = new Date(fixture.date).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const home = teams.home.name;
  const away = teams.away.name;

  const competition = league.name;
  const round = league.round;
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

^(*Este tópico foi criado automaticamente por um bot.*)
`;

  return threadBody.trim();
}

export function formatMatchTitle(match: any): string {
  const { teams, league } = match;
  const home = teams.home.name;
  const away = teams.away.name;
  const round = league.round;

  return `${home} vs ${away} [${round}] - Tópico da Partida`;
}
