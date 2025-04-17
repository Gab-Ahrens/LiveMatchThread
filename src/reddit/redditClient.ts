/**
 * Reddit API Client
 *
 * Handles posting threads to Reddit using snoowrap
 */
import snoowrap from "snoowrap";
import {
  REDDIT_USER_AGENT,
  REDDIT_CLIENT_ID,
  REDDIT_CLIENT_SECRET,
  REDDIT_USERNAME,
  REDDIT_PASSWORD,
  REDDIT_SUBREDDIT,
  DRY_RUN,
} from "../config/appConfig";

// Get Reddit credentials from environment
function getCredentials(env?: any) {
  return {
    userAgent: env?.REDDIT_USER_AGENT || REDDIT_USER_AGENT,
    clientId: env?.REDDIT_CLIENT_ID || REDDIT_CLIENT_ID,
    clientSecret: env?.REDDIT_CLIENT_SECRET || REDDIT_CLIENT_SECRET,
    username: env?.REDDIT_USERNAME || REDDIT_USERNAME,
    password: env?.REDDIT_PASSWORD || REDDIT_PASSWORD,
    subreddit: env?.REDDIT_SUBREDDIT || REDDIT_SUBREDDIT,
  };
}

/**
 * Creates a Reddit API client
 */
function createRedditClient(env?: any) {
  const credentials = getCredentials(env);

  return new snoowrap({
    userAgent: credentials.userAgent,
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
    username: credentials.username,
    password: credentials.password,
  });
}

/**
 * Post a match thread to Reddit
 */
export async function postMatchThread(
  title: string,
  body: string,
  env?: any
): Promise<void> {
  if (DRY_RUN) {
    console.log(
      `🚧 [DRY RUN] Would post to r/${REDDIT_SUBREDDIT} with title: ${title}`
    );
    return;
  }

  try {
    const credentials = getCredentials(env);
    const reddit = createRedditClient(env);

    console.log(`🔄 Submitting thread to r/${credentials.subreddit}...`);

    // Submit the post
    const submission = await reddit
      .getSubreddit(credentials.subreddit)
      .submitSelfpost({
        title,
        text: body,
        sendReplies: false,
      });

    console.log(`✅ Thread posted successfully! URL: ${submission.url}`);
  } catch (error) {
    console.error("❌ Failed to post to Reddit:", error);
  }
}
