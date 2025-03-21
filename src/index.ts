import { fetchNextMatch } from './api';
import { formatMatchTitle, formatMatchThread } from './format';
import { postMatchThread } from './reddit';

async function main() {
  const match = await fetchNextMatch();

  if (!match) {
    console.log("No match found.");
    return;
  }

  const title = formatMatchTitle(match);
  const body = formatMatchThread(match);

  await postMatchThread(title, body);
}

main();
