import dotenv from "dotenv";

dotenv.config();

export const DRY_RUN = process.env.DRY_RUN === "true";
export const USE_MOCK_DATA = process.env.USE_MOCK_DATA === "true";
export const API_BASE_URL = "https://api-football-v1.p.rapidapi.com/v3";
export const TEAM_ID = 119;
export const SEASON = 2025;
export const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY!;
export const RAPIDAPI_HOST = "api-football-v1.p.rapidapi.com";
