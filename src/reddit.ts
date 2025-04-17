import snoowrap from "snoowrap";
import dotenv from "dotenv";
import { DRY_RUN } from "./config";

dotenv.config();

const reddit = new snoowrap({
  userAgent: process.env.REDDIT_USER_AGENT!,
  clientId: process.env.REDDIT_CLIENT_ID!,
  clientSecret: process.env.REDDIT_CLIENT_SECRET!,
  username: process.env.REDDIT_USERNAME!,
  password: process.env.REDDIT_PASSWORD!,
});

export async function postMatchThread(title: string, body: string) {
  try {
    const subredditName = process.env.REDDIT_SUBREDDIT!;

    const options = {
      subredditName,
      title,
      text: body,
      suggested_sort: "new",
    };

    if (DRY_RUN) {
      console.log(
        "🚧 [DRY_RUN MODE] Not posting to Reddit. Here's what would've been posted:"
      );
      console.log("Title:", title);
      console.log("Body:", body);
      return;
    }

    const submission = await (reddit as any).submitSelfpost(options);
    console.log(`✅ Match thread posted: ${submission.url}`);
  } catch (error) {
    console.error("❌ Failed to post match thread:", error);
  }
}
