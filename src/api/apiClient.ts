/**
 * Football API client
 *
 * This module handles all interactions with the football-data API
 */
import fs from "fs";
import path from "path";
import axios from "axios";
import {
  USE_MOCK_DATA,
  API_BASE_URL,
  TEAM_ID,
  SEASON,
  RAPIDAPI_KEY,
  RAPIDAPI_HOST,
} from "../config/appConfig";

// For Workers environment, we'll need to get the API key from environment
function getHeaders(env?: any) {
  // If running in Workers environment, use env variable
  const apiKey = env?.RAPIDAPI_KEY || RAPIDAPI_KEY;
  const apiHost = env?.RAPIDAPI_HOST || RAPIDAPI_HOST;

  return {
    "x-rapidapi-key": apiKey,
    "x-rapidapi-host": apiHost,
  };
}

// Mock data paths for local development
const MOCK_DIR = path.join(__dirname, "../..", "mock-data");
const MOCK_FILES = {
  match: path.join(MOCK_DIR, "match-data.json"),
  lineups: path.join(MOCK_DIR, "lineups-data.json"),
  events: path.join(MOCK_DIR, "events-data.json"),
  statistics: path.join(MOCK_DIR, "statistics-data.json"),
  lastMatchesHome: path.join(MOCK_DIR, "last5-home-team.json"),
  lastMatchesAway: path.join(MOCK_DIR, "last5-away-team.json"),
};

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Helper function to read mock data - works in both Node.js and Workers
 */
function readMockData(filePath: string): any {
  // In Node.js environment
  if (typeof process !== "undefined" && fs.existsSync) {
    try {
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ Mock file not found: ${filePath}`);
        console.warn('Run "npm run capture-mock-data" to generate mock data');
        return null;
      }
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch (error) {
      console.error(`❌ Error reading mock data from ${filePath}:`, error);
      return null;
    }
  }

  // In Workers environment - we don't have access to mock files
  // Return hardcoded mock data for essential testing
  console.warn("⚠️ Mock data not available in Workers environment");

  // Return a simple mock match object
  const mockMatch = {
    fixture: {
      id: 12345,
      date: "2023-12-07T00:30:00+00:00",
      venue: { name: "Estádio Beira-Rio", city: "Porto Alegre" },
      status: { short: "NS" },
    },
    league: {
      name: "Campeonato Brasileiro Série A",
      round: "Regular Season - 34",
    },
    teams: {
      home: { id: 126, name: "Internacional" },
      away: { id: 127, name: "Botafogo" },
    },
    score: {
      fulltime: { home: 2, away: 1 },
    },
  };

  // Return appropriate mock data based on which mock was requested
  if (filePath.includes("match-data")) return mockMatch;
  if (filePath.includes("lineups")) return [];
  if (filePath.includes("events")) return [];
  if (filePath.includes("statistics")) return [];
  if (filePath.includes("last5")) return [];

  return null;
}

/**
 * Fetches the next upcoming match for SC Internacional
 * @param forceFresh If true, forces a fresh API call regardless of mock data setting
 * @param retries Number of retry attempts for API calls
 * @param env Cloudflare Worker environment (optional)
 */
export async function fetchNextMatch(
  forceFresh = true,
  retries = 3,
  env?: any
): Promise<any | null> {
  if (USE_MOCK_DATA && !forceFresh) {
    console.log("🧪 Using mock data for next match.");
    return readMockData(MOCK_FILES.match);
  }

  console.log(
    "🌐 [LIVE] Making API call to fetch next SC Internacional match..."
  );

  // Get team ID from environment if available
  const teamId = env?.TEAM_ID || TEAM_ID;
  const season = env?.SEASON || SEASON;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(`${API_BASE_URL}/fixtures`, {
        params: {
          team: teamId,
          season: season,
          next: 1,
        },
        headers: getHeaders(env),
      });

      const data = response.data.response[0];

      if (!data) {
        console.log("⚠️ No upcoming match returned from API.");
        return null;
      }

      return data;
    } catch (error: any) {
      if (error.response?.status === 429) {
        console.warn(
          `⚠️ Rate limit hit (429). Attempt ${attempt} of ${retries}. Retrying in 10s...`
        );
        await wait(10_000);
      } else {
        console.error("❌ Failed to fetch from API:", error.message);
        break;
      }
    }
  }

  return null;
}

/**
 * Fetches lineups for a specific match
 */
export async function fetchLineups(fixtureId: number, env?: any) {
  if (USE_MOCK_DATA) {
    console.log("🧪 Using mock data for lineups.");
    return readMockData(MOCK_FILES.lineups);
  }

  console.log(`📡 Fetching lineups for fixture ID ${fixtureId}...`);

  try {
    const response = await axios.get(`${API_BASE_URL}/fixtures/lineups`, {
      params: { fixture: fixtureId },
      headers: getHeaders(env),
    });

    const lineups = response.data.response;

    if (!lineups || !Array.isArray(lineups)) {
      console.error("❌ API returned invalid lineups data: Not an array");
      console.log(
        "API Response:",
        JSON.stringify(response.data, null, 2).slice(0, 500) + "..."
      );
      return [];
    }

    if (lineups.length === 0) {
      console.warn("⚠️ API returned empty lineups array");
      return [];
    }

    console.log(`✅ Received lineup data for ${lineups.length} teams`);
    return lineups;
  } catch (error: any) {
    console.error("❌ Error fetching lineups:", error.message);
    if (error.response) {
      console.error(
        "Response data:",
        JSON.stringify(error.response.data, null, 2).slice(0, 500) + "..."
      );
      console.error("Response status:", error.response.status);
    }
    throw error;
  }
}

/**
 * Fetches complete match data after the match has concluded
 */
export async function fetchFinalMatchData(fixtureId: number, env?: any) {
  if (USE_MOCK_DATA) {
    console.log("🧪 Using mock data for final match info.");
    const mockMatch = readMockData(MOCK_FILES.match);
    const mockEvents = readMockData(MOCK_FILES.events);
    const mockStats = readMockData(MOCK_FILES.statistics);

    return {
      fixture: mockMatch.fixture,
      teams: mockMatch.teams,
      score: mockMatch.score,
      events: mockEvents,
      statistics: mockStats,
    };
  }

  console.log(`📡 Fetching final match data for fixture ID ${fixtureId}...`);

  const [fixtureRes, eventsRes, statsRes] = await Promise.all([
    axios.get(`${API_BASE_URL}/fixtures`, {
      params: { id: fixtureId },
      headers: getHeaders(env),
    }),
    axios.get(`${API_BASE_URL}/fixtures/events`, {
      params: { fixture: fixtureId },
      headers: getHeaders(env),
    }),
    axios.get(`${API_BASE_URL}/fixtures/statistics`, {
      params: { fixture: fixtureId },
      headers: getHeaders(env),
    }),
  ]);

  const fixtureData = fixtureRes.data.response[0];

  return {
    fixture: fixtureData.fixture,
    teams: fixtureData.teams,
    score: fixtureData.score,
    events: eventsRes.data.response,
    statistics: statsRes.data.response,
  };
}

/**
 * Checks the current status of a match
 */
export async function fetchMatchStatus(
  fixtureId: number,
  env?: any
): Promise<string> {
  if (USE_MOCK_DATA) {
    console.log("🧪 [MOCK] Returning match status from mock data");
    const mockMatch = readMockData(MOCK_FILES.match);
    return mockMatch?.fixture?.status?.short || "FT";
  }

  console.log(`📡 Checking match status for fixture ID ${fixtureId}...`);

  try {
    const response = await axios.get(`${API_BASE_URL}/fixtures`, {
      params: { id: fixtureId },
      headers: getHeaders(env),
    });

    const data = response.data.response[0];
    return data?.fixture?.status?.short || "NS";
  } catch (error: any) {
    console.error("❌ Error fetching match status:", error.message);
    return "NS";
  }
}

/**
 * Fetches the last 5 matches for a team in a specific league
 */
export async function fetchLast5Matches(
  teamId: number,
  leagueId: number,
  season: number,
  env?: any
) {
  if (USE_MOCK_DATA) {
    console.log(`🧪 Using mock data for last 5 matches (team ID: ${teamId})`);
    // Determine if this is the home or away team
    const mockMatch = readMockData(MOCK_FILES.match);
    const isHomeTeam = mockMatch.teams.home.id === teamId;

    if (isHomeTeam) {
      return readMockData(MOCK_FILES.lastMatchesHome);
    } else {
      return readMockData(MOCK_FILES.lastMatchesAway);
    }
  }

  const response = await axios.get(`${API_BASE_URL}/fixtures`, {
    params: {
      team: teamId,
      league: leagueId,
      season: season,
      last: 5,
    },
    headers: getHeaders(env),
  });
  return response.data.response;
}
