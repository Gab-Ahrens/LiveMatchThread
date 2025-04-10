import { startScheduler } from './schedulerMatchThread';
import { startPostMatchScheduler } from './schedulerPostMatchThread';
import { startPreMatchScheduler } from './schedulePreMatchThread';

function main() {
  startPreMatchScheduler();
  startScheduler();
  startPostMatchScheduler();
}

main();
