// src/scheduler.ts
import cron from 'node-cron';
import { fetchNextMatch } from './api';
import { formatMatchThread, formatMatchTitle } from './format';
import { postMatchThread } from './reddit';
import dotenv from 'dotenv';

dotenv.config();

const DRY_RUN = process.env.DRY_RUN === 'true';
const USE_MOCK = process.env.USE_MOCK_DATA === 'true';

let scheduledMatchId: number | null = null;
let scheduledCronJob: cron.ScheduledTask | null = null;

async function scheduleNextMatchThread() {
  const now = new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'full',
    timeStyle: 'medium'
  });

  console.log(`\n📅 [${now}] Iniciando checagem agendada para a próxima partida...`);
  console.log(`🔍 Fetching next match data ${USE_MOCK ? '[Mock data 🧪]' : '[Live data ☁️]'}`);

  const match = await fetchNextMatch();

  if (!match) {
    console.log('⚠️ No upcoming match found.');
    return;
  }

  const matchId = match.fixture.id;
  const matchDate = new Date(match.fixture.date);

  // Convert match time to America/Sao_Paulo timezone for accurate scheduling
  const matchDateLocal = new Date(matchDate.toLocaleString('en-US', {
    timeZone: 'America/Sao_Paulo'
  }));
  
  // ⏱️ Schedule 15 minutes earlier
  const postTime = new Date(matchDateLocal.getTime() - 15 * 60 * 1000);

  if (scheduledMatchId === matchId) {
    console.log('✅ Match already scheduled.');
    return;
  }

  if (scheduledCronJob) {
    scheduledCronJob.stop();
    console.log('🔄 Rescheduled due to new match data.');
  }

  // Convert back to UTC for cron scheduling
  const postTimeUTC = new Date(postTime.toLocaleString('en-US', { timeZone: 'UTC' }));
  
  const minute = postTimeUTC.getMinutes();
  const hour = postTimeUTC.getHours();
  const day = postTimeUTC.getDate();
  const month = postTimeUTC.getMonth() + 1;

  const cronTime = `${minute} ${hour} ${day} ${month} *`;

  const title = formatMatchTitle(match);
  const body = formatMatchThread(match);

  console.log(`\n🖥️ [PREVIEW] Match Thread Preview:`);
  console.log(`Title: ${title}`);
  console.log(`Body:\n${body}\n`);

  console.log(`🕒 Thread will be created at: ${postTime.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'full',
    timeStyle: 'medium'
  })} ${DRY_RUN ? '[DRY RUN 🚧]' : '[LIVE MODE 🚀]'}`);

  scheduledCronJob = cron.schedule(cronTime, async () => {
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
