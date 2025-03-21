// scheduler.ts
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
  console.log(`\n🔍 Fetching next match data ${USE_MOCK ? '[Mock data mode 🧪]' : '[Live API mode ☁️]'}`);

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
    console.log('🔄 Rescheduled match thread due to updated match data.');
  }

  const minute = matchDate.getUTCMinutes();
  const hour = matchDate.getUTCHours();
  const day = matchDate.getUTCDate();
  const month = matchDate.getUTCMonth() + 1; // cron months are 1-based

  const cronTime = `${minute} ${hour} ${day} ${month} *`;

  console.log(`🕒 Scheduling match thread for: ${matchDate.toUTCString()} ${DRY_RUN ? '[DRY RUN 🚧]' : '[LIVE MODE 🚀]'}`);

  scheduledCronJob = cron.schedule(cronTime, async () => {
    const title = formatMatchTitle(match);
    const body = formatMatchThread(match);

    if (DRY_RUN) {
      console.log('🚧 [DRY RUN MODE] Would have posted this:');
      console.log(`Title: ${title}`);
      console.log(`Body:\n${body}`);
    } else {
      console.log('🚀 Posting match thread...');
      await postMatchThread(title, body);
    }

    // Reset after execution
    scheduledMatchId = null;
    scheduledCronJob = null;
  });

  scheduledMatchId = matchId;
}

export function startScheduler() {
  console.log('📅 Starting scheduler: checking every 6 hours.');
  scheduleNextMatchThread(); // Run immediately at start
  cron.schedule('0 */6 * * *', scheduleNextMatchThread);
}
