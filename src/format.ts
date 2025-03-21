export function formatMatchThread(match: any): string {
  const { fixture, teams, league, venue } = match;

  const kickoff = new Date(fixture.date).toUTCString();

  const home = teams.home.name;
  const away = teams.away.name;

  const competition = league.name;
  const round = league.round;
  const stadium = venue?.name ?? "Unknown Venue";
  const city = venue?.city ?? "Unknown City";

  const threadTitle = `${home} vs ${away} - Match Thread`;

  const threadBody = `
## 🏆 ${competition} - ${round}

**${home}** vs **${away}**

📍 *${stadium}, ${city}*  
🕓 *Horário: ${kickoff} (UTC)*

---

⚽️ Vamo Inter! ❤️

---

^(*Thead gerado automaticamente via bot.*)
`;

  return threadBody.trim();
}

export function formatMatchTitle(match: any): string {
  const { teams, league, fixture } = match;
  const home = teams.home.name;
  const away = teams.away.name;
  const round = league.round;

  return `${home} vs ${away} [${round}] - Match Thread`;
}
