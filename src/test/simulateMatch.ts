/**
 * Match Simulation Test
 *
 * This script runs a full simulation of a match to test the bot's behavior
 * from pre-match to post-match without having to wait for a real match.
 */
import { prepareTestMatch, cleanupTestFiles } from "../utils/testUtils";
import { startAllSchedulers } from "../index";
import {
  DRY_RUN,
  SIMULATION_MODE,
  SIMULATION_SPEED,
} from "../config/appConfig";

// Log simulation settings
console.log("\n🧪 Starting Match Simulation Test");
console.log(`🔍 DRY_RUN: ${DRY_RUN ? "✅" : "❌"}`);
console.log(`🔍 SIMULATION_MODE: ${SIMULATION_MODE ? "✅" : "❌"}`);
console.log(`🔍 SIMULATION_SPEED: ${SIMULATION_SPEED}x\n`);

// Check if required settings are enabled
if (!SIMULATION_MODE) {
  console.error(
    "❌ SIMULATION_MODE must be enabled. Set SIMULATION_MODE=true in your environment."
  );
  process.exit(1);
}

// Clean up any existing test files
cleanupTestFiles();

// Prepare the test match data
// The match will be set to start in 2 minutes
const MINUTES_TO_KICKOFF = 2;
prepareTestMatch(MINUTES_TO_KICKOFF);

// Calculate real wait time based on simulation speed
const realMinutesToKickoff = MINUTES_TO_KICKOFF / SIMULATION_SPEED;
console.log(
  `⏱️ Real time until kickoff: ${realMinutesToKickoff.toFixed(1)} minutes`
);

// Calculate total simulation duration
// A full match simulation takes about 105 minutes of simulated time
const totalSimulationMinutes = MINUTES_TO_KICKOFF + 105;
const realSimulationMinutes = totalSimulationMinutes / SIMULATION_SPEED;

console.log(
  `⏱️ Total simulation time: ${realSimulationMinutes.toFixed(1)} minutes`
);
console.log(
  `🏁 Simulation will complete around: ${new Date(
    Date.now() + realSimulationMinutes * 60 * 1000
  ).toLocaleTimeString()}`
);
console.log("\n" + "=".repeat(80) + "\n");

// Start the bot with the prepared test match
startAllSchedulers();

// Set a cleanup handler for when the process exits
process.on("SIGINT", () => {
  console.log("\n🧹 Cleaning up test files...");
  cleanupTestFiles();
  process.exit(0);
});

// Set a timer to automatically clean up after simulation should be done
const cleanupTime = (realSimulationMinutes + 5) * 60 * 1000; // Add 5 minutes buffer
setTimeout(() => {
  console.log("\n⏱️ Simulation time complete. Cleaning up...");
  cleanupTestFiles();
  console.log("✅ You can press Ctrl+C to exit.");
}, cleanupTime);
