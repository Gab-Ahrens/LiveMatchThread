/**
 * Test all possible match statuses
 * 
 * This script runs tests for each of the match statuses to verify
 * that the bot handles all of them correctly.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// All possible match statuses according to the API-Football documentation
const ALL_STATUSES = [
  // Pre-match statuses
  'TBD',  // To Be Defined
  'NS',   // Not Started
  'PST',  // Postponed
  
  // In-play statuses
  '1H',   // First Half
  'HT',   // Half Time
  '2H',   // Second Half
  'BT',   // Break Time
  'ET',   // Extra Time
  'P',    // Penalty In Progress
  'SUSP', // Suspended
  'INT',  // Interrupted
  'LIVE', // Live (general in-play)
  
  // Match ended statuses
  'FT',   // Full Time (regular)
  'AET',  // After Extra Time
  'PEN',  // Penalties
  'WO',   // Walkover
  'AWD',  // Awarded
  'CANC', // Cancelled
  'ABD',  // Abandoned
];

// Log header
console.log('\n🧪 TESTING ALL MATCH STATUSES');
console.log('='.repeat(50));

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', '..', 'test-logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Run test for each status
for (const status of ALL_STATUSES) {
  console.log(`\n🔍 Testing status: ${status}`);
  
  try {
    // Create log file for this status
    const logFile = path.join(logsDir, `status-${status}.log`);
    
    // Run the test with the specific status
    const command = `cross-env DRY_RUN=true USE_MOCK_DATA=true SIMULATION_MODE=true MATCH_STATUS_OVERRIDE=${status} ts-node src/test/testIrregularMatchEnd.ts`;
    
    console.log(`⚙️ Running: ${command}`);
    execSync(command, { 
      stdio: ['ignore', fs.openSync(logFile, 'w'), fs.openSync(logFile, 'w')],
      timeout: 60000 // 1 minute timeout
    });
    
    console.log(`✅ Test for status ${status} completed successfully`);
    console.log(`📄 Log file: ${logFile}`);
  } catch (error) {
    console.error(`❌ Error testing status ${status}:`, error.message);
  }
  
  // Make sure to clean up after each test
  try {
    const cleanupCommand = 'node -e "require(\'../utils/testUtils\').cleanupTestFiles()"';
    execSync(cleanupCommand, { stdio: 'ignore' });
  } catch (err) {
    // Silent cleanup errors
  }
  
  // Small delay between tests
  console.log(`⏱️ Waiting 2 seconds before next test...`);
  execSync('node -e "setTimeout(() => {}, 2000)"');
}

console.log('\n✅ All status tests completed');
console.log(`📄 Logs are available in: ${logsDir}`);
console.log('='.repeat(50)); 