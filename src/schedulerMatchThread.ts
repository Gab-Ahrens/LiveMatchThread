import cron from 'node-cron';
import { fetchNextMatch, fetchLineups } from './api';
import { formatMatchThread, formatMatchTitle } from './format';
import { postMatchThread } from './reddit';
import { DateTime } from 'luxon';
import dotenv from 'dotenv';

dotenv.config();

const DRY_RUN = process.env.DRY_RUN === 'true';
const USE_MOCK = process.env.USE_MOCK_DATA === 'true';

let scheduledMatchId: number | null = null;
let scheduledCronJob: cron.ScheduledTask | null = null;

async function scheduleNextMatchThread() {
  const now = DateTime.now().setZone('America/Sao_Paulo').toFormat("cccc, dd 'de' LLLL 'de' yyyy 'às' HH:mm:ss");
  console.log(`\n📅 [${now}] Iniciando checagem agendada para a próxima partida...`);
  console.log(`🔍 Fetching next match data ${USE_MOCK ? '[Mock data 🧪]' : '[Live data ☁️]'}`);

  const match = await fetchNextMatch();

  if (!match) {
    console.log('⚠️ No upcoming match found.');
    return;
  }

  const matchId = match.fixture.id;
  const matchDateUTC = DateTime.fromISO(match.fixture.date, { zone: 'utc' });

  // Convert to Brasília and subtract 15 mins
  const postTimeBrasilia = matchDateUTC.setZone('America/Sao_Paulo').minus({ hours: 1 });

  // Convert back to UTC for scheduling
  const postTimeUTC = postTimeBrasilia.setZone('utc');

  if (scheduledMatchId === matchId) {
    console.log('✅ Match already scheduled.');
    return;
  }

  if (scheduledCronJob) {
    scheduledCronJob.stop();
    console.log('🔄 Rescheduled due to new match data.');
  }

  const minute = postTimeUTC.minute;
  const hour = postTimeUTC.hour;
  const day = postTimeUTC.day;
  const month = postTimeUTC.month;

  const cronTime = `${minute} ${hour} ${day} ${month} *`;

const lineups = await fetchLineups(matchId);

const title = formatMatchTitle(match);
const body = formatMatchThread(match, lineups); 

  console.log(`\n🖥️ [PREVIEW] Match Thread Preview:`);
  console.log(`Title: ${title}`);
  console.log(`Body:\n${body}\n`);

  console.log(`🕒 Thread will be created at: ${postTimeBrasilia.toFormat("cccc, dd 'de' LLLL 'de' yyyy 'às' HH:mm:ss")} (Brasília) ${DRY_RUN ? '[DRY RUN 🚧]' : '[LIVE MODE 🚀]'}`);

  scheduledCronJob = cron.schedule(cronTime, async () => {
  console.log('⏰ Scheduled match time reached, preparing thread...');

  const title = formatMatchTitle(match);
  const body = formatMatchThread(match, lineups); // ✅ Pass to thread formatter

  if (DRY_RUN) {
    console.log('🚧 [DRY RUN] Simulating post at scheduled time.');
    console.log(`Title: ${title}`);
    console.log(`Body:\n${body}`);
  } else {
    console.log('🚀 Posting match thread!');
    await postMatchThread(title, body);
  }

  scheduledMatchId = null;
  scheduledCronJob = null;
});

  scheduledMatchId = matchId;
}

export function startScheduler() {
  console.log('📅 Scheduler started (checks every 6 hours).');
  scheduleNextMatchThread();
  cron.schedule('0 */6 * * *', scheduleNextMatchThread);
}
