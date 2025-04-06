import { startScheduler } from './schedulerMatchThread';
import { startPostMatchScheduler } from './schedulerPostMatchThread';

function main() {
  startScheduler();
  startPostMatchScheduler();
}

main();
