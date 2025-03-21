import { fetchNextMatch } from './api';

async function main() {
  const match = await fetchNextMatch();

  if (!match) {
    console.log("No match data available.");
    return;
  }

  const { fixture, teams, league } = match;

  console.log(`🏟️ ${teams.home.name} vs ${teams.away.name}`);
  console.log(`📅 Kickoff (UTC): ${fixture.date}`);
  console.log(`🧭 Venue: ${fixture.venue?.name}, ${fixture.venue?.city}`);
  console.log(`🏆 Competition: ${league.name} - ${league.round}`);
}

main();
