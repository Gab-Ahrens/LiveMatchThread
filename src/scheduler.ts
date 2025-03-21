import cron from 'node-cron';
import { fetchNextMatch } from './api';
import { formatMatchThread, formatMatchTitle } from './format';
import { postMatchThread } from './reddit';

let scheduledMatchId: number | null = null;
let scheduledCronJob: cron.ScheduledTask | null = null;

async function scheduleNextMatchThread() {
  const match = await fetchNextMatch();

  if (!match) {
    console.log('⚠️ No upcoming match found.');
    return;
  }

  const matchId = match.fixture.id;
  const matchDate = new Date(match.fixture.date);

  // If the same match is already scheduled, skip re-scheduling.
  if (scheduledMatchId === matchId) {
    console.log('✅ Match already scheduled. No update needed.');
    return;
  }

  // Cancel previously scheduled job if it exists
  if (scheduledCronJob) {
    scheduledCronJob.stop();
    console.log('🔄 Rescheduled match thread due to new match data.');
  }

  // Extract minute and hour for scheduling (in UTC)
  const minute = matchDate.getUTCMinutes();
  const hour = matchDate.getUTCHours();
  const day = matchDate.getUTCDate();
  const month = matchDate.getUTCMonth() + 1; // cron months are 1-based

  const cronTime = `${minute} ${hour} ${day} ${month} *`;

  console.log(`🕒 Scheduling new match thread for: ${matchDate.toUTCString()}`);

  // Schedule the posting
  scheduledCronJob = cron.schedule(cronTime, async () => {
    console.log('🚀 Time to post the match thread!');
    const title = formatMatchTitle(match);
    const body = formatMatchThread(match);
    await postMatchThread(title, body);

    // Reset after posting
    scheduledMatchId = null;
    scheduledCronJob = null;
  });

  // Save the current match ID as scheduled
  scheduledMatchId = matchId;
}

export function startScheduler() {
  console.log('📅 Starting scheduler: checking every 6 hours.');

  // Runs immediately at start, then every 6 hours
  scheduleNextMatchThread();
  cron.schedule('0 */6 * * *', scheduleNextMatchThread);
}
