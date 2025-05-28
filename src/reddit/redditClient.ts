/**
 * Reddit Integration
 *
 * Handles posting threads to Reddit
 */
import snoowrap from "snoowrap";
import {
  DRY_RUN,
  REDDIT_USER_AGENT,
  REDDIT_CLIENT_ID,
  REDDIT_CLIENT_SECRET,
  REDDIT_USERNAME,
  REDDIT_PASSWORD,
  REDDIT_SUBREDDIT,
} from "../config/appConfig";

const reddit = new snoowrap({
  userAgent: REDDIT_USER_AGENT,
  clientId: REDDIT_CLIENT_ID,
  clientSecret: REDDIT_CLIENT_SECRET,
  username: REDDIT_USERNAME,
  password: REDDIT_PASSWORD,
});

/**
 * Posts a new thread to Reddit with optional flair
 */
export async function postMatchThread(
  title: string,
  body: string,
  flair?: string
) {
  try {
    const options = {
      subredditName: REDDIT_SUBREDDIT,
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
      if (flair) {
        console.log("Flair:", flair);
      }
      return;
    }

    const submission = await (reddit as any).submitSelfpost(options);

    // Apply flair if provided
    if (flair) {
      try {
        await submission.selectFlair({ flair_template_id: null, text: flair });
        console.log(
          `✅ Match thread posted with flair "${flair}": ${submission.url}`
        );
      } catch (flairError) {
        console.warn(`⚠️ Failed to apply flair "${flair}":`, flairError);
        console.log(
          `✅ Match thread posted (without flair): ${submission.url}`
        );
      }
    } else {
      console.log(`✅ Match thread posted: ${submission.url}`);
    }
  } catch (error) {
    console.error("❌ Failed to post match thread:", error);
  }
}
