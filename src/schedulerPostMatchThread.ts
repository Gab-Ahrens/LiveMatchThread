import { fetchNextMatch, fetchFinalMatchData } from "./api";
import { postMatchThread } from "./reddit";
import { DateTime } from "luxon";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const DRY_RUN = process.env.DRY_RUN === "true";

async function fetchMatchStatus(fixtureId: number): Promise<string> {
  const response = await axios.get(
    "https://api-football-v1.p.rapidapi.com/v3/fixtures",
    {
      params: { id: fixtureId },
      headers: {
        "x-rapidapi-key": process.env.RAPIDAPI_KEY!,
        "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
      },
    }
  );

  const data = response.data.response[0];
  return data?.fixture?.status?.short || "NS";
}

function formatGoals(finalData: any): string {
  const events = finalData.events || [];
  const goals = events.filter((e: any) => e.type === "Goal");

  if (goals.length === 0) return "_Nenhum gol registrado._";

  return goals
    .map((g: any) => {
      const minute = g.time.elapsed;
      const player = g.player.name;
      const team = g.team.name;
      return `⚽️ ${team}: ${player} (${minute}')`;
    })
    .join("\n");
}

function formatStats(finalData: any): string {
  const stats = finalData.statistics;
  if (!stats || stats.length < 2) return "_Estatísticas indisponíveis._";

  const [homeStats, awayStats] = stats;
  const statLines = homeStats.statistics.map((stat: any, idx: number) => {
    const label = stat.type;
    const homeValue = stat.value;
    const awayValue = awayStats.statistics[idx]?.value ?? "-";
    return `${label}: ${homeValue} - ${awayValue}`;
  });

  return statLines.join("\n");
}

export async function startPostMatchScheduler() {
  const match = await fetchNextMatch();
  if (!match) {
    console.log("⚠️ No upcoming match found for post-match scheduler.");
    return;
  }

  const matchId = match.fixture.id;
  const matchStartUTC = DateTime.fromISO(match.fixture.date, { zone: "utc" });
  const startPollingAt = matchStartUTC.plus({ hours: 2 });
  const now = DateTime.utc();
  const waitTimeMs = startPollingAt.diff(now).as("milliseconds");

  console.log(
    `🕓 Post-match thread scheduler will start polling at: ${startPollingAt.toISO()} (UTC)`
  );

  if (waitTimeMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitTimeMs));
  }

  console.log("⏳ Starting post-match status polling...");
  const interval = setInterval(async () => {
    const status = await fetchMatchStatus(matchId);
    console.log(`📡 Match status: ${status}`);

    if (status === "FT" || status === "AET" || status === "PEN") {
      clearInterval(interval);
      const finalData = await fetchFinalMatchData(matchId);

      const home = finalData.teams.home.name;
      const away = finalData.teams.away.name;
      const score = finalData.score.fulltime;
      const venue = finalData.fixture.venue;
      const kickoff = DateTime.fromISO(finalData.fixture.date, {
        zone: "America/Sao_Paulo",
      }).toFormat("cccc, dd 'de' LLLL 'de' yyyy 'às' HH:mm");

      let scoreLine = `${home} ${score.home} x ${score.away} ${away}`;
      if (status === "AET") scoreLine += " (após prorrogação)";
      if (status === "PEN") {
        const pen = finalData.score.penalty;
        scoreLine += ` (pênaltis: ${pen.home} x ${pen.away})`;
      }

      const title = `[PÓS-JOGO] ${scoreLine}`;

      const body = `
## 📊 Resultado Final

**${scoreLine}**

📍 *${venue.name}, ${venue.city}*  
🕓 *Data: ${kickoff} (Brasília)*

---

### ⚽ Gols
${formatGoals(finalData)}

---

### 📈 Estatísticas
${formatStats(finalData)}

---

⚽️ Vamo Inter! ❤️

---
^(*Esse post foi criado automaticamente por um bot.*)
      `.trim();

      if (DRY_RUN) {
        console.log("🚧 [DRY RUN] Would post post-match thread:\n");
        console.log(`Title: ${title}`);
        console.log(`Body:\n${body}`);
      } else {
        console.log("🚀 Posting post-match thread!");
        await postMatchThread(title, body);
      }
    }
  }, 2 * 60 * 1000);
}
