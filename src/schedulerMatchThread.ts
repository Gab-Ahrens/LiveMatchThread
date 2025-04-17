import { fetchLineups } from "./api";
import { formatMatchThread, formatMatchTitle } from "./format";
import { postMatchThread } from "./reddit";
import { DateTime } from "luxon";
import { isThreadPosted, markThreadPosted } from "./threadState";
import { DRY_RUN, USE_MOCK_DATA } from "./config";

const USE_MOCK = USE_MOCK_DATA;

let scheduledMatchId: number | null = null;

export async function startScheduler(match: any) {
  const now = DateTime.now()
    .setZone("Europe/Amsterdam")
    .toFormat("cccc, dd 'de' LLLL 'de' yyyy 'às' HH:mm:ss");

  console.log(
    `\n📅 [${now}] Iniciando checagem agendada para a próxima partida...`
  );
  console.log(`🔍 Using ${USE_MOCK ? "mock data 🧪" : "live data ☁️"}`);

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

  const title = formatMatchTitle(match);
  let lineups: any = null;

  // Try to fetch lineups up to 3 times with delay between attempts
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`📋 Fetching lineups, attempt ${attempt}/3...`);
      lineups = await fetchLineups(matchId);

      if (lineups && lineups.length > 0) {
        console.log(`✅ Successfully fetched lineups on attempt ${attempt}`);
        break;
      } else {
        console.warn(`⚠️ Lineup data empty or invalid on attempt ${attempt}`);

        if (attempt < 3) {
          const waitTime = attempt * 10000; // 10s, 20s, 30s
          console.log(`⏳ Waiting ${waitTime / 1000}s before next attempt...`);
          await new Promise((res) => setTimeout(res, waitTime));
        }
      }
    } catch (err) {
      console.warn(
        `⚠️ Failed to fetch lineups on attempt ${attempt}:`,
        err instanceof Error ? err.message : err
      );

      if (attempt < 3) {
        const waitTime = attempt * 10000; // 10s, 20s, 30s
        console.log(`⏳ Waiting ${waitTime / 1000}s before next attempt...`);
        await new Promise((res) => setTimeout(res, waitTime));
      }
    }
  }

  if (!lineups || lineups.length === 0) {
    console.warn(
      "❌ All lineup fetch attempts failed. Posting without lineups."
    );
  }

  const body = await formatMatchThread(match, lineups);

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
    await maybePost(title, body, matchId);
    return;
  }

  console.log(`⏳ Waiting ${Math.round(delay / 1000)} seconds until post...`);

  setTimeout(async () => {
    console.log("⏰ Scheduled match time reached, preparing thread...");

    await maybePost(title, body, matchId);

    scheduledMatchId = null;
  }, delay);

  scheduledMatchId = matchId;
}

async function maybePost(title: string, body: string, matchId: number) {
  if (DRY_RUN) {
    console.log("🚧 [DRY RUN] Simulating post.");
    console.log(`Title: ${title}`);
    console.log(`Body:\n${body}`);
  } else {
    console.log("🚀 Posting match thread!");
    await postMatchThread(title, body);
    markThreadPosted(matchId, "matchThreadPosted");
  }
}
