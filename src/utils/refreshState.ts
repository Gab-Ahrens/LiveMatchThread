/**
 * Refresh State Management
 *
 * Tracks when the bot last refreshed match data to avoid unnecessary API calls,
 * especially after bot restarts.
 */
import fs from "fs";
import path from "path";

// Path to the state file in the data directory
const REFRESH_STATE_PATH = path.join(
  __dirname,
  "../../data/refresh-state.json"
);

// State interface
interface RefreshState {
  lastRefreshTime: string; // ISO string representation of date
}

/**
 * Gets the last time match data was refreshed
 * @returns Date object of the last refresh time
 */
export function getLastRefreshTime(): Date {
  try {
    if (fs.existsSync(REFRESH_STATE_PATH)) {
      const stateData = fs.readFileSync(REFRESH_STATE_PATH, "utf8");
      const state = JSON.parse(stateData) as RefreshState;
      return new Date(state.lastRefreshTime);
    }
  } catch (error) {
    console.warn("⚠️ Error reading refresh state file:", error);
  }

  // If file doesn't exist or there's an error, return old date to trigger refresh
  return new Date(0);
}

/**
 * Updates the last refresh time to the current time
 */
export function updateRefreshTime(): void {
  try {
    // Ensure the directory exists
    const dir = path.dirname(REFRESH_STATE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const state: RefreshState = {
      lastRefreshTime: new Date().toISOString(),
    };

    fs.writeFileSync(REFRESH_STATE_PATH, JSON.stringify(state, null, 2));
    console.log("✅ Refresh state updated");
  } catch (error) {
    console.error("❌ Failed to update refresh state:", error);
  }
}

/**
 * Checks if a refresh is needed based on hours passed
 * @param hourThreshold Number of hours that should pass before refreshing
 * @returns boolean indicating if refresh is needed
 */
export function isRefreshNeeded(hourThreshold: number = 24): boolean {
  const lastRefresh = getLastRefreshTime();
  const now = new Date();
  const hoursSinceLastRefresh =
    (now.getTime() - lastRefresh.getTime()) / (1000 * 60 * 60);

  return hoursSinceLastRefresh >= hourThreshold;
}
