/**
 * API Call Tracker
 *
 * Tracks API calls to monitor the 100 calls/day limit
 */
import fs from "fs";
import path from "path";

// Path to the API call tracking file
const API_TRACKER_PATH = path.join(__dirname, "../../data/api-calls.json");

// API call tracking interface
interface ApiCallTracker {
  date: string; // YYYY-MM-DD format
  calls: number;
  callDetails: Array<{
    timestamp: string;
    endpoint: string;
    purpose: string;
  }>;
}

/**
 * Reads the current API call tracking data
 */
function readApiCallData(): ApiCallTracker {
  try {
    if (fs.existsSync(API_TRACKER_PATH)) {
      const rawData = fs.readFileSync(API_TRACKER_PATH, "utf8");
      return JSON.parse(rawData);
    }
  } catch (err) {
    console.error("Error reading API call tracker:", err);
  }

  // Return default structure for today
  return {
    date: new Date().toISOString().split('T')[0],
    calls: 0,
    callDetails: []
  };
}

/**
 * Writes the API call tracking data to disk
 */
function writeApiCallData(data: ApiCallTracker): void {
  try {
    // Ensure the directory exists
    const dir = path.dirname(API_TRACKER_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(API_TRACKER_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing API call tracker:", err);
  }
}

/**
 * Records an API call
 */
export function recordApiCall(endpoint: string, purpose: string): void {
  const today = new Date().toISOString().split('T')[0];
  let data = readApiCallData();

  // Reset counter if it's a new day
  if (data.date !== today) {
    data = {
      date: today,
      calls: 0,
      callDetails: []
    };
  }

  // Increment call count
  data.calls++;
  data.callDetails.push({
    timestamp: new Date().toISOString(),
    endpoint,
    purpose
  });

  // Write updated data
  writeApiCallData(data);

  // Log warning if approaching limit
  if (data.calls >= 80) {
    console.warn(`⚠️ API LIMIT WARNING: ${data.calls}/100 calls used today`);
  } else if (data.calls >= 95) {
    console.error(`🚨 API LIMIT CRITICAL: ${data.calls}/100 calls used today`);
  }

  console.log(`📊 API calls today: ${data.calls}/100`);
}

/**
 * Gets current API call count for today
 */
export function getTodaysApiCallCount(): number {
  const today = new Date().toISOString().split('T')[0];
  const data = readApiCallData();
  
  if (data.date !== today) {
    return 0;
  }
  
  return data.calls;
}

/**
 * Checks if we can make more API calls today
 */
export function canMakeApiCall(): boolean {
  return getTodaysApiCallCount() < 100;
}

/**
 * Gets detailed API call information for today
 */
export function getTodaysApiCallDetails(): ApiCallTracker {
  const today = new Date().toISOString().split('T')[0];
  const data = readApiCallData();
  
  if (data.date !== today) {
    return {
      date: today,
      calls: 0,
      callDetails: []
    };
  }
  
  return data;
} 