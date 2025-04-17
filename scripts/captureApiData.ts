/**
 * API Data Capture Script
 *
 * This script makes minimal API calls to capture real data for mocking purposes.
 * It should only be run once to generate the mock data files.
 */
import fs from "fs";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// API configuration
const API_BASE_URL = "https://api-football-v1.p.rapidapi.com/v3";
const TEAM_ID = 119; // SC Internacional ID
const SEASON = 2023; // Using past season to ensure completed matches
const HEADERS = {
  "x-rapidapi-key": process.env.RAPIDAPI_KEY!,
  "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
};

// Create mock data directory if it doesn't exist
const MOCK_DIR = path.join(__dirname, "..", "mock-data");
if (!fs.existsSync(MOCK_DIR)) {
  fs.mkdirSync(MOCK_DIR, { recursive: true });
}

// Helper function to save response to file
function saveToFile(filename: string, data: any) {
  const filePath = path.join(MOCK_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`✅ Saved: ${filePath}`);
}

// Fetch next match (actually a past match)
async function fetchNextMatch() {
  console.log("Fetching match data...");

  try {
    // We'll use a past match instead of a "next" match because we want a completed match with all data
    const response = await axios.get(`${API_BASE_URL}/fixtures`, {
      params: {
        team: TEAM_ID,
        season: SEASON,
        last: 1, // Get the most recent match of the specified season
      },
      headers: HEADERS,
    });

    // Save the response data
    const matchData = response.data.response[0];
    saveToFile("match-data.json", matchData);

    return matchData;
  } catch (error: any) {
    console.error("❌ Error fetching match:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Response:", error.response.data);
    }
    process.exit(1);
  }
}

// Fetch lineups for a specific match
async function fetchLineups(fixtureId: number) {
  console.log(`Fetching lineups for fixture ID ${fixtureId}...`);

  try {
    const response = await axios.get(`${API_BASE_URL}/fixtures/lineups`, {
      params: { fixture: fixtureId },
      headers: HEADERS,
    });

    const lineups = response.data.response;
    saveToFile("lineups-data.json", lineups);

    return lineups;
  } catch (error: any) {
    console.error("❌ Error fetching lineups:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
    }
  }
}

// Fetch events for a specific match
async function fetchEvents(fixtureId: number) {
  console.log(`Fetching events for fixture ID ${fixtureId}...`);

  try {
    const response = await axios.get(`${API_BASE_URL}/fixtures/events`, {
      params: { fixture: fixtureId },
      headers: HEADERS,
    });

    const events = response.data.response;
    saveToFile("events-data.json", events);

    return events;
  } catch (error: any) {
    console.error("❌ Error fetching events:", error.message);
  }
}

// Fetch statistics for a specific match
async function fetchStatistics(fixtureId: number) {
  console.log(`Fetching statistics for fixture ID ${fixtureId}...`);

  try {
    const response = await axios.get(`${API_BASE_URL}/fixtures/statistics`, {
      params: { fixture: fixtureId },
      headers: HEADERS,
    });

    const statistics = response.data.response;
    saveToFile("statistics-data.json", statistics);

    return statistics;
  } catch (error: any) {
    console.error("❌ Error fetching statistics:", error.message);
  }
}

// Fetch last 5 matches for both teams
async function fetchLast5Matches(match: any) {
  try {
    const homeTeamId = match.teams.home.id;
    const awayTeamId = match.teams.away.id;
    const leagueId = match.league.id;
    const season = match.league.season;

    console.log(`Fetching last 5 matches for home team (ID: ${homeTeamId})...`);
    const homeTeamResponse = await axios.get(`${API_BASE_URL}/fixtures`, {
      params: {
        team: homeTeamId,
        league: leagueId,
        season: season,
        last: 5,
      },
      headers: HEADERS,
    });

    console.log(`Fetching last 5 matches for away team (ID: ${awayTeamId})...`);
    const awayTeamResponse = await axios.get(`${API_BASE_URL}/fixtures`, {
      params: {
        team: awayTeamId,
        league: leagueId,
        season: season,
        last: 5,
      },
      headers: HEADERS,
    });

    saveToFile("last5-home-team.json", homeTeamResponse.data.response);
    saveToFile("last5-away-team.json", awayTeamResponse.data.response);

    return {
      home: homeTeamResponse.data.response,
      away: awayTeamResponse.data.response,
    };
  } catch (error: any) {
    console.error("❌ Error fetching last 5 matches:", error.message);
  }
}

// Create a README for the mock data
function createReadme() {
  const readmeContent = `# Mock Data for LiveMatchThread

This directory contains mock API responses captured from real football-data.org API calls.
These files are used for development and testing without hitting the API limits.

## Files:

- **match-data.json**: A completed match with all details (used as "next match" in mock mode)
- **lineups-data.json**: Lineups for both teams
- **events-data.json**: All match events (goals, cards, substitutions, etc.)
- **statistics-data.json**: Match statistics
- **last5-home-team.json**: Last 5 matches for the home team
- **last5-away-team.json**: Last 5 matches for the away team

Generated on: ${new Date().toISOString()}
`;

  fs.writeFileSync(path.join(MOCK_DIR, "README.md"), readmeContent);
  console.log("✅ Created README.md");
}

// Main function to orchestrate the data capture
async function captureAllData() {
  console.log("🔍 Starting API data capture...");

  // Get a completed match
  const match = await fetchNextMatch();
  if (!match) {
    console.error("❌ Failed to fetch match data. Exiting.");
    return;
  }

  const fixtureId = match.fixture.id;
  console.log(`📊 Using fixture ID: ${fixtureId}`);

  // Fetch additional data for this match
  await Promise.all([
    fetchLineups(fixtureId),
    fetchEvents(fixtureId),
    fetchStatistics(fixtureId),
    fetchLast5Matches(match),
  ]);

  // Create a README file
  createReadme();

  console.log("\n✅ Data capture complete!");
  console.log(`📂 Mock data saved to: ${MOCK_DIR}`);
  console.log(
    "⚠️ Remember: This script should only be run once to minimize API calls."
  );
}

// Run the script
captureAllData();
