import { postMatchThread } from "./reddit";
import { DateTime } from "luxon";

const DRY_RUN = process.env.DRY_RUN === "true";

export async function startPreMatchScheduler(match: any) {
  const matchStart = DateTime.fromISO(match.fixture.date, { zone: "utc" });
  const postAt = matchStart.minus({ hours: 12 });
  const now = DateTime.utc();
  const waitMs = postAt.diff(now).as("milliseconds");

  if (waitMs > 0) {
    console.log(
      `⏳ Waiting until ${postAt.toISO()} UTC to post pre-match thread...`
    );
    await new Promise((res) => setTimeout(res, waitMs));
  } else {
    console.warn(
      "⚠️ Scheduled pre-match time already passed. Posting immediately..."
    );
  }

  await renderAndPrintPreMatchThread(match);
}

async function renderAndPrintPreMatchThread(match: any) {
  const home = match.teams.home.name.toUpperCase();
  const away = match.teams.away.name.toUpperCase();
  const venue = match.fixture.venue;
  const kickoff = DateTime.fromISO(match.fixture.date, {
    zone: "America/Sao_Paulo",
  })
    .setLocale("pt-BR")
    .toFormat("cccc, dd 'de' LLLL 'de' yyyy 'às' HH:mm");

  const competition = formatCompetitionName(match.league?.name ?? "");
  const round = formatOrdinalRound(match.league?.round || "");

  const title = `[PRÉ-JOGO] | ${competition} | ${home} X ${away} | ${round}`;
  const body = `
## 📝 Informações da Partida

🏟️ *${venue.name}, ${venue.city}*  
🕓 *Data: ${kickoff} (Brasília)*

---

⚽️ Vamo Inter! ❤️

---
^(*Esse post foi criado automaticamente por um bot.*)
  `.trim();

  if (DRY_RUN) {
    console.log("🚧 [DRY RUN] Would post pre-match thread:\n");
    console.log(`Title: ${title}`);
    console.log(`Body:\n${body}`);
  } else {
    console.log("🚀 Posting pre-match thread!");
    await postMatchThread(title, body);
  }
}

function formatCompetitionName(rawName: string): string {
  const normalized = rawName.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();
  return normalized.includes("SERIE A") ? "BRASILEIRÃO" : normalized;
}

function formatOrdinalRound(round: string): string {
  const rodadaMatch = round.match(
    /(Regular Season|Temporada Regular)\s*-\s*(\d+)/i
  );
  if (rodadaMatch) return `${rodadaMatch[2]}ª RODADA`;

  const groupMatch = round.match(/Group Stage - (\w)/i);
  if (groupMatch) return `GRUPO ${groupMatch[1]}`;

  return round.toUpperCase();
}
