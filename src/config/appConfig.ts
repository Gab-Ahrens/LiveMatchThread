/**
 * Application Configuration
 *
 * Central place for all configuration values
 */
import dotenv from "dotenv";

dotenv.config();

// Runtime flags
export const DRY_RUN = process.env.DRY_RUN === "true";
export const USE_MOCK_DATA = process.env.USE_MOCK_DATA === "true";
export const SIMULATION_MODE = process.env.SIMULATION_MODE === "true";
export const MATCH_STATUS_OVERRIDE = process.env.MATCH_STATUS_OVERRIDE || null;
export const SIMULATION_SPEED = parseInt(
  process.env.SIMULATION_SPEED || "1",
  10
); // Speed multiplier for simulations

// Football API configuration
export const API_BASE_URL = "https://api-football-v1.p.rapidapi.com/v3";
export const TEAM_ID = 119; // SC Internacional ID
export const SEASON = 2025; // Current season
export const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY!;
export const RAPIDAPI_HOST = "api-football-v1.p.rapidapi.com";

// Reddit configuration
export const REDDIT_USER_AGENT = process.env.REDDIT_USER_AGENT!;
export const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID!;
export const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET!;
export const REDDIT_USERNAME = process.env.REDDIT_USERNAME!;
export const REDDIT_PASSWORD = process.env.REDDIT_PASSWORD!;
export const REDDIT_SUBREDDIT = process.env.REDDIT_SUBREDDIT!;
