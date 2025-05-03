/**
 * Test Utilities
 *
 * Helper functions for testing the bot's functionality
 */
import { DateTime } from "luxon";
import fs from "fs";
import path from "path";
import { SIMULATION_MODE, SIMULATION_SPEED } from "../config/appConfig";

// Path to mock data
const MOCK_DIR = path.join(__dirname, "../..", "mock-data");
const MOCK_MATCH_FILE = path.join(MOCK_DIR, "match-data.json");

/**
 * Creates a temporary match file with an adjusted date
 * This allows testing the bot with a match that's scheduled to occur soon
 * @param minutesFromNow Minutes from now when the match should start
 */
export function prepareTestMatch(minutesFromNow: number = 1): void {
  if (!fs.existsSync(MOCK_MATCH_FILE)) {
    console.error("❌ Mock match file not found. Cannot prepare test match.");
    return;
  }

  try {
    // Read the original mock match data
    const matchData = JSON.parse(fs.readFileSync(MOCK_MATCH_FILE, "utf-8"));

    // Create a new date for the match
    const newMatchDate = DateTime.now()
      .plus({ minutes: minutesFromNow })
      .toISO();

    // Update the match date
    matchData.fixture.date = newMatchDate;
    matchData.fixture.status.short = "NS"; // Not Started

    // Create a temporary test file
    const testMatchFile = path.join(MOCK_DIR, "test-match-data.json");
    fs.writeFileSync(testMatchFile, JSON.stringify(matchData, null, 2));

    console.log(
      `✅ Created test match file with kickoff in ${minutesFromNow} minutes`
    );
    console.log(`🕒 Match time set to: ${newMatchDate}`);

    if (SIMULATION_MODE) {
      console.log(
        `🚀 Simulation speed: ${SIMULATION_SPEED}x (${
          minutesFromNow / SIMULATION_SPEED
        } real minutes until kickoff)`
      );
    }
  } catch (error) {
    console.error("❌ Error preparing test match:", error);
  }
}

/**
 * Reset the match date in the test match file to a specific status for immediate testing
 * @param status Match status to set (e.g., "1H", "HT", "2H", "FT")
 */
export function setMatchToStatus(status: string): void {
  try {
    const testMatchFile = path.join(MOCK_DIR, "test-match-data.json");

    // Check if test file exists, if not, create it
    if (!fs.existsSync(testMatchFile)) {
      prepareTestMatch(-30); // Create a match that started 30 minutes ago
    }

    // Read the test match data
    const matchData = JSON.parse(fs.readFileSync(testMatchFile, "utf-8"));

    // Update the match status
    matchData.fixture.status.short = status;

    // Adjust date depending on status
    const now = DateTime.now();
    switch (status) {
      case "NS":
        matchData.fixture.date = now.plus({ minutes: 30 }).toISO();
        break;
      case "1H":
        matchData.fixture.date = now.minus({ minutes: 20 }).toISO();
        break;
      case "HT":
        matchData.fixture.date = now.minus({ minutes: 45 }).toISO();
        break;
      case "2H":
        matchData.fixture.date = now.minus({ minutes: 70 }).toISO();
        break;
      case "FT":
        matchData.fixture.date = now.minus({ minutes: 115 }).toISO();
        break;
    }

    // Write back to the test file
    fs.writeFileSync(testMatchFile, JSON.stringify(matchData, null, 2));

    console.log(`✅ Set test match to status: ${status}`);
  } catch (error) {
    console.error("❌ Error setting match status:", error);
  }
}

/**
 * Clean up test files
 */
export function cleanupTestFiles(): void {
  try {
    const testMatchFile = path.join(MOCK_DIR, "test-match-data.json");
    if (fs.existsSync(testMatchFile)) {
      fs.unlinkSync(testMatchFile);
      console.log("✅ Cleaned up test match file");
    }
  } catch (error) {
    console.error("❌ Error cleaning up test files:", error);
  }
}
