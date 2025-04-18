/**
 * Team Nickname Utilities
 *
 * Provides functions to get fun nicknames for rival teams
 */
import fs from "fs";
import path from "path";

// Path to nicknames file
const NICKNAMES_FILE = path.join(__dirname, "..", "nicknames.json");

// Type definition for the nickname data structure
interface NicknameData {
  teams: {
    [key: string]: string[];
  };
}

// Cache for nickname data
let nicknameCache: NicknameData | null = null;

/**
 * Loads the nickname data from the JSON file
 */
function loadNicknameData(): NicknameData {
  // Return from cache if available
  if (nicknameCache) {
    return nicknameCache;
  }

  try {
    // Read and parse the JSON file
    const data = fs.readFileSync(NICKNAMES_FILE, "utf8");
    nicknameCache = JSON.parse(data) as NicknameData;
    return nicknameCache;
  } catch (error) {
    console.warn("⚠️ Failed to load team nicknames:", error);
    // Return empty data structure if file can't be loaded
    return { teams: {} };
  }
}

/**
 * Gets a random nickname for the specified team
 * @param teamName The official team name
 * @returns A random nickname or the original name if no nicknames exist
 */
export function getTeamNickname(teamName: string): string {
  // Normalize the team name for lookup (trim and handle case)
  const normalizedName = teamName.trim();

  // Load the nickname data
  const nicknameData = loadNicknameData();

  // Find nicknames for this team
  // Try exact match first, then case-insensitive match
  let nicknames = nicknameData.teams[normalizedName];

  if (!nicknames) {
    // Try case-insensitive match
    const teamKey = Object.keys(nicknameData.teams).find(
      (key) => key.toLowerCase() === normalizedName.toLowerCase()
    );

    if (teamKey) {
      nicknames = nicknameData.teams[teamKey];
    }
  }

  // If no nicknames found, return the original name
  if (!nicknames || nicknames.length === 0) {
    return teamName;
  }

  // Select a random nickname from the available options
  const randomIndex = Math.floor(Math.random() * nicknames.length);
  return nicknames[randomIndex];
}

/**
 * Checks if a team has nicknames available
 * @param teamName The official team name
 * @returns True if the team has at least one nickname, false otherwise
 */
export function hasNicknames(teamName: string): boolean {
  const normalizedName = teamName.trim();
  const nicknameData = loadNicknameData();

  // Check for exact match
  if (nicknameData.teams[normalizedName]?.length > 0) {
    return true;
  }

  // Check for case-insensitive match
  const teamKey = Object.keys(nicknameData.teams).find(
    (key) => key.toLowerCase() === normalizedName.toLowerCase()
  );

  return Boolean(teamKey && nicknameData.teams[teamKey].length > 0);
}
