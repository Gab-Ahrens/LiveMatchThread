/**
 * API Usage Checker
 *
 * Simple utility to check current API usage
 */
import {
  getTodaysApiCallCount,
  getTodaysApiCallDetails,
} from "./apiCallTracker";

export function checkApiUsage(): void {
  const count = getTodaysApiCallCount();
  const details = getTodaysApiCallDetails();

  console.log(`📊 API Usage Today: ${count}/100 calls`);

  if (count > 0) {
    console.log(`📅 Date: ${details.date}`);
    console.log(
      `🕒 Last call: ${
        details.callDetails[details.callDetails.length - 1]?.timestamp || "N/A"
      }`
    );

    // Show breakdown by endpoint
    const endpointCounts: { [key: string]: number } = {};
    details.callDetails.forEach((call) => {
      endpointCounts[call.endpoint] = (endpointCounts[call.endpoint] || 0) + 1;
    });

    console.log("📈 Breakdown by endpoint:");
    Object.entries(endpointCounts).forEach(([endpoint, count]) => {
      console.log(`  ${endpoint}: ${count} calls`);
    });
  }

  // Show warnings
  if (count >= 95) {
    console.error("🚨 CRITICAL: Very close to API limit!");
  } else if (count >= 80) {
    console.warn("⚠️ WARNING: Approaching API limit");
  } else if (count >= 50) {
    console.log("ℹ️ INFO: Halfway to API limit");
  }
}

// If run directly
if (require.main === module) {
  checkApiUsage();
}
