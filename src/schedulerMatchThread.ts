import { fetchLineups } from "./api";
import { formatMatchThread, formatMatchTitle } from "./format";
import { postMatchThread } from "./reddit";
import { DateTime } from "luxon";
import { isThreadPosted, markThreadPosted } from "./threadState";
import { DRY_RUN, USE_MOCK_DATA } from "./config";
import dotenv from "dotenv";

dotenv.config();

let scheduledMatchId: number | null = null;

export async function startScheduler(match: any) {
  const now = DateTime.now()
    .setZone("Europe/Amsterdam")
    .toFormat("cccc, dd 'de' LLLL 'de' yyyy 'às' HH:mm:ss");

  console.log(
    `\n📅 [${now}] Iniciando checagem agendada para a próxima partida...`
  );

  const matchId = match.fixture.id;

  if (isThreadPosted(matchId, "matchThreadPosted")) {
    console.log("✅ Match thread already posted. Skipping.");
    return;
  }

  const matchDateUTC = DateTime.fromISO(match.fixture.date, { zone: "utc" });
  const postTimeAmsterdam = matchDateUTC
    .setZone("Europe/Amsterdam")
    .minus({ minutes: 8 });
  const postTimeUTC = postTimeAmsterdam.setZone("utc");
  const delay = postTimeUTC.diff(DateTime.utc(), "milliseconds").milliseconds;

  const lineups = await fetchLineups(matchId);
  const title = formatMatchTitle(match);
  const body = formatMatchThread(match, lineups);

  console.log(`\n🖥️ [PREVIEW] Match Thread Preview:`);
  console.log(`Title: ${title}`);
  console.log(`Body:\n${body}\n`);

  console.log(
    `🕒 Thread will be created at: ${postTimeAmsterdam.toFormat(
      "cccc, dd 'de' LLLL 'de' yyyy 'às' HH:mm:ss"
    )} (Amsterdam) ${DRY_RUN ? "[DRY RUN 🚧]" : "[LIVE MODE 🚀]"}`
  );

  if (scheduledMatchId === matchId) {
    console.log("✅ Match already scheduled.");
    return;
  }

  if (delay <= 0) {
    console.warn(
      "⚠️ Scheduled time is in the past. Posting thread immediately..."
    );
    if (DRY_RUN) {
      console.log("🚧 [DRY RUN] Simulating post.");
      console.log(`Title: ${title}`);
      console.log(`Body:\n${body}`);
    } else {
      console.log("🚀 Posting match thread!");
      await postMatchThread(title, body);
    }
    if (!DRY_RUN) {
      markThreadPosted(matchId, "matchThreadPosted");
    }
    return;
  }

  console.log(`⏳ Waiting ${Math.round(delay / 1000)} seconds until post...`);

  setTimeout(async () => {
    console.log("⏰ Scheduled match time reached, preparing thread...");
    if (DRY_RUN) {
      console.log("🚧 [DRY RUN] Simulating post.");
      console.log(`Title: ${title}`);
      console.log(`Body:\n${body}`);
    } else {
      console.log("🚀 Posting match thread!");
      await postMatchThread(title, body);
      markThreadPosted(matchId, "matchThreadPosted");
    }
    scheduledMatchId = null;
  }, delay);

  scheduledMatchId = matchId;
}
