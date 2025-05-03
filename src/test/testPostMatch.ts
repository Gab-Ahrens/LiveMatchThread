/**
 * Post-Match Test
 *
 * This script tests only the post-match thread functionality by simulating a match that just ended
 */
import { setMatchToStatus, cleanupTestFiles } from "../utils/testUtils";
import { startAllSchedulers } from "../index";
import { DRY_RUN, SIMULATION_MODE } from "../config/appConfig";

// Log test settings
console.log("\n🧪 Post-Match Thread Test");
console.log(`🔍 DRY_RUN: ${DRY_RUN ? "✅" : "❌"}`);
console.log(`🔍 SIMULATION_MODE: ${SIMULATION_MODE ? "✅" : "❌"}\n`);

// Check if required settings are enabled
if (!SIMULATION_MODE) {
  console.error(
    "❌ SIMULATION_MODE must be enabled. Set SIMULATION_MODE=true in your environment."
  );
  process.exit(1);
}

// Clean up any existing test files
cleanupTestFiles();

// Set the match directly to finished state
setMatchToStatus("FT");

console.log("\n" + "=".repeat(80) + "\n");

// Start the bot with the prepared test match
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
