/**
 * Configuration module
 *
 * This module loads and exports all configuration settings from environment variables.
 * It automatically detects whether we're running in a Node.js or Workers environment.
 */
import dotenv from "dotenv";

// Load .env file in Node.js environment
if (typeof process !== "undefined") {
  dotenv.config();
}

// Helper to get environment variable from either Node.js or Workers environment
function getEnv(key: string, defaultValue: string = "", env?: any): string {
  // First check Workers environment if provided
  if (env && key in env) {
    return env[key];
  }

  // Then check Node.js environment
  if (typeof process !== "undefined" && process.env && key in process.env) {
    return process.env[key] || defaultValue;
  }

  // Fallback to default
  return defaultValue;
}

// API Configuration
export const API_BASE_URL = "https://api-football-v1.p.rapidapi.com/v3";
export const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY!;
export const RAPIDAPI_HOST =
  process.env.RAPIDAPI_HOST || "api-football-v1.p.rapidapi.com";
export const TEAM_ID = process.env.TEAM_ID || "126"; // SC Internacional
export const SEASON = process.env.SEASON || "2024";

// Reddit Configuration
export const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID!;
export const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET!;
export const REDDIT_USERNAME = process.env.REDDIT_USERNAME!;
export const REDDIT_PASSWORD = process.env.REDDIT_PASSWORD!;
export const REDDIT_USER_AGENT = process.env.REDDIT_USER_AGENT!;
export const REDDIT_SUBREDDIT = process.env.REDDIT_SUBREDDIT || "internacional";

// Runtime Flags
export const DRY_RUN = process.env.DRY_RUN === "true";
export const USE_MOCK_DATA = process.env.USE_MOCK_DATA === "true";

/**
 * Get configuration variables for Cloudflare Workers environment
 * This function takes a Cloudflare environment object and returns config values
 */
export function getWorkerConfig(env: any) {
  return {
    // API Configuration
    API_BASE_URL,
    RAPIDAPI_KEY: getEnv("RAPIDAPI_KEY", "", env),
    RAPIDAPI_HOST: getEnv(
      "RAPIDAPI_HOST",
      "api-football-v1.p.rapidapi.com",
      env
    ),
    TEAM_ID: getEnv("TEAM_ID", "126", env),
    SEASON: getEnv("SEASON", "2024", env),

    // Reddit Configuration
    REDDIT_CLIENT_ID: getEnv("REDDIT_CLIENT_ID", "", env),
    REDDIT_CLIENT_SECRET: getEnv("REDDIT_CLIENT_SECRET", "", env),
    REDDIT_USERNAME: getEnv("REDDIT_USERNAME", "", env),
    REDDIT_PASSWORD: getEnv("REDDIT_PASSWORD", "", env),
    REDDIT_USER_AGENT: getEnv("REDDIT_USER_AGENT", "", env),
    REDDIT_SUBREDDIT: getEnv("REDDIT_SUBREDDIT", "internacional", env),

    // Runtime Flags
    DRY_RUN: getEnv("DRY_RUN", "false", env) === "true",
    USE_MOCK_DATA: getEnv("USE_MOCK_DATA", "false", env) === "true",
  };
}
