import { fetchFinalMatchData, fetchMatchStatus } from "./api";
import { postMatchThread } from "./reddit";
import { DateTime } from "luxon";
import { isThreadPosted, markThreadPosted } from "./threadState";
import { DRY_RUN } from "./config";

export async function startPostMatchScheduler(match: any) {
  const matchId = match.fixture.id;

  if (isThreadPosted(matchId, "postMatchPosted")) {
    console.log("✅ Post-match thread already posted. Skipping.");
    return;
  }

  // If mock mode + dry run, simulate post right away
  if (DRY_RUN) {
    console.log("🧪 [MOCK] Previewing post-match thread immediately.");
    const finalData = await fetchFinalMatchData(matchId);
    await renderAndPrintPostMatch(finalData);
    markThreadPosted(matchId, "postMatchPosted");
    return;
  }

  const matchStartUTC = DateTime.fromISO(match.fixture.date, { zone: "utc" });
  const checkAfter = matchStartUTC.plus({ hours: 2 });
  const now = DateTime.utc();
  const waitMs = checkAfter.diff(now).as("milliseconds");

  if (waitMs > 0) {
    console.log(
      `⏳ Waiting until ${checkAfter.toISO()} UTC to begin post-match checks...`
    );
    await new Promise((res) => setTimeout(res, waitMs));
  } else {
    console.warn(
      "⚠️ Already past scheduled post-match check time. Checking immediately..."
    );
  }

  // Poll every 2 minutes until match is finished (FT, AET, PEN)
  const poll = async () => {
    const status = await fetchMatchStatus(matchId);
    console.log(`📡 Match status: ${status}`);

    if (["FT", "AET", "PEN"].includes(status)) {
      const finalData = await fetchFinalMatchData(matchId);
      await renderAndPrintPostMatch(finalData);
      markThreadPosted(matchId, "postMatchPosted");
      return;
    }

    console.log("⏱️ Match not finished yet. Will check again in 2 minutes...");
    setTimeout(poll, 2 * 60 * 1000);
  };

  poll();
}

async function renderAndPrintPostMatch(finalData: any) {
  const home = finalData.teams.home.name.toUpperCase();
  const away = finalData.teams.away.name.toUpperCase();
  const score = finalData.score.fulltime;
  const venue = finalData.fixture.venue;
  const kickoff = DateTime.fromISO(finalData.fixture.date, {
    zone: "America/Sao_Paulo",
  })
    .setLocale("pt-BR")
    .toFormat("cccc, dd 'de' LLLL 'de' yyyy 'às' HH:mm");

  const leagueName = finalData.league?.name ?? "COMPETIÇÃO";
  const competition = leagueName
    .toUpperCase()
    .replace("SÉRIE A", "BRASILEIRÃO");
  const round = formatOrdinalRound(finalData.league?.round || "");

  let scoreLine = `${home} ${score.home} x ${score.away} ${away}`;
  const status = finalData.fixture.status?.short || "FT";
  if (status === "AET") scoreLine += " (após prorrogação)";
  if (status === "PEN") {
    const pen = finalData.score.penalty;
    scoreLine += ` (pênaltis: ${pen.home} x ${pen.away})`;
  }

  const title = `[PÓS-JOGO] | ${competition} | ${home} X ${away} | ${round}`;
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

function formatGoals(finalData: any): string {
  const events = finalData.events || [];
  const goals = events.filter((e: any) => e.type === "Goal");
  if (goals.length === 0) return "_Nenhum gol registrado._";

  return goals
    .map(
      (g: any) => `⚽️ ${g.team.name}: ${g.player.name} (${g.time.elapsed}')`
    )
    .join("\n");
}

function formatStats(finalData: any): string {
  const stats = finalData.statistics;
  if (!stats || stats.length < 2) return "_Estatísticas indisponíveis._";

  const [homeStats, awayStats] = stats;
  const lines = [
    `| Estatística | ${homeStats.team.name.toUpperCase()} | ${awayStats.team.name.toUpperCase()} |`,
    "|-------------|------------------|------------------|",
  ];

  for (let i = 0; i < homeStats.statistics.length; i++) {
    const stat = homeStats.statistics[i];
    const awayStat = awayStats.statistics[i];
    lines.push(`| ${stat.type} | ${stat.value} | ${awayStat?.value ?? "-"} |`);
  }

  return lines.join("\n");
}

function formatOrdinalRound(round: string): string {
  const match = round.match(/Regular Season\s*-\s*(\d+)/i);
  if (match) return `${match[1]}ª RODADA`;
  const group = round.match(/Group Stage\s*-\s*(\w+)/i);
  if (group) return `GRUPO ${group[1]}`;
  return round.toUpperCase();
}
