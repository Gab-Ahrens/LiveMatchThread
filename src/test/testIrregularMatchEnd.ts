/**
 * Irregular Match End Test
 *
 * This script tests the post-match thread functionality with irregular match endings
 * (cancelled, suspended, abandoned, etc.)
 */
import { setMatchToStatus, cleanupTestFiles } from "../utils/testUtils";
import { startAllSchedulers } from "../index";
import {
  DRY_RUN,
  SIMULATION_MODE,
  MATCH_STATUS_OVERRIDE,
} from "../config/appConfig";

// The irregular status to test (can be CANC, SUSP, INT, ABD, AWD, WO)
const IRREGULAR_STATUS = process.env.STATUS || "CANC";

// Log test settings
console.log("\n🧪 Irregular Match End Test");
console.log(`🔍 DRY_RUN: ${DRY_RUN ? "✅" : "❌"}`);
console.log(`🔍 SIMULATION_MODE: ${SIMULATION_MODE ? "✅" : "❌"}`);
console.log(`🔍 Testing irregular status: ${IRREGULAR_STATUS}\n`);

// Check if required settings are enabled
if (!SIMULATION_MODE) {
  console.error(
    "❌ SIMULATION_MODE must be enabled. Set SIMULATION_MODE=true in your environment."
  );
  process.exit(1);
}

// Clean up any existing test files
cleanupTestFiles();

// Set the match to the specified irregular status
// For convenience, we're using FT as the basic status and overriding
// via the environment variable in the API call
setMatchToStatus("FT");

console.log("\n" + "=".repeat(80) + "\n");

// Start the bot with the prepared test match
// The actual status will be provided via MATCH_STATUS_OVERRIDE in the environment
startAllSchedulers();

// Set a cleanup handler for when the process exits
process.on("SIGINT", () => {
  console.log("\n🧹 Cleaning up test files...");
  cleanupTestFiles();
  process.exit(0);
});

// Set a timer to automatically clean up after 5 minutes
setTimeout(() => {
  console.log("\n⏱️ Test should be complete. Cleaning up...");
  cleanupTestFiles();
  console.log("✅ You can press Ctrl+C to exit.");
}, 5 * 60 * 1000);
