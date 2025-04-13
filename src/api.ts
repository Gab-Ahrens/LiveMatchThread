import fs from "fs";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const USE_MOCK = process.env.USE_MOCK_DATA === "true";
const API_BASE_URL = "https://api-football-v1.p.rapidapi.com/v3";
const TEAM_ID = 119;
const SEASON = 2025;

const HEADERS = {
  "x-rapidapi-key": process.env.RAPIDAPI_KEY!,
  "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
};

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchNextMatch(retries = 3): Promise<any | null> {
  if (USE_MOCK) {
    console.log("🧪 Using mock data for next match.");
    const filePath = path.join(__dirname, "..", "mock-next-match.json");
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  }

  console.log(
    "🌐 [LIVE] Making API call to fetch next SC Internacional match..."
  );

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(`${API_BASE_URL}/fixtures`, {
        params: {
          team: TEAM_ID,
          season: SEASON,
          next: 1,
        },
        headers: HEADERS,
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

export async function fetchLineups(fixtureId: number) {
  if (USE_MOCK) {
    console.log("🧪 Using mock data for lineups.");
    const filePath = path.join(__dirname, "..", "mock-lineups.json");
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  }

  console.log(`📡 Fetching lineups for fixture ID ${fixtureId}...`);

  const response = await axios.get(`${API_BASE_URL}/fixtures/lineups`, {
    params: { fixture: fixtureId },
    headers: HEADERS,
  });

  return response.data.response;
}

export async function fetchFinalMatchData(fixtureId: number) {
  if (USE_MOCK) {
    console.log("🧪 Using mock data for final match info.");
    const filePath = path.join(__dirname, "..", "mock-final-match.json");
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  }

  console.log(`📡 Fetching final match data for fixture ID ${fixtureId}...`);

  const [fixtureRes, eventsRes, statsRes] = await Promise.all([
    axios.get(`${API_BASE_URL}/fixtures`, {
      params: { id: fixtureId },
      headers: HEADERS,
    }),
    axios.get(`${API_BASE_URL}/fixtures/events`, {
      params: { fixture: fixtureId },
      headers: HEADERS,
    }),
    axios.get(`${API_BASE_URL}/fixtures/statistics`, {
      params: { fixture: fixtureId },
      headers: HEADERS,
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

export async function fetchMatchStatus(fixtureId: number): Promise<string> {
  if (USE_MOCK) {
    console.log("🧪 [MOCK] Returning hardcoded match status: 'FT'");
    return "FT";
  }

  console.log(`📡 Checking match status for fixture ID ${fixtureId}...`);

  try {
    const response = await axios.get(`${API_BASE_URL}/fixtures`, {
      params: { id: fixtureId },
      headers: HEADERS,
    });

    const data = response.data.response[0];
    return data?.fixture?.status?.short || "NS";
  } catch (error: any) {
    console.error("❌ Error fetching match status:", error.message);
    return "NS";
  }
}
