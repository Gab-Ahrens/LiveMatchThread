# Testing Framework for Match Thread Bot

This directory contains tools and scripts to test the functionality of the match thread bot without having to wait for actual matches to occur.

## Quick Start

### Full Match Simulation

To run a full match simulation from pre-match to post-match:

```bash
npm run test:sim
```

This will:
1. Create a test match scheduled to start in 2 minutes
2. Accelerate time (30x by default) to quickly go through the entire match
3. Trigger all thread creation at the appropriate simulated times

The entire test takes approximately 3-5 minutes in real time but simulates a full 2-hour match experience.

### Post-Match Thread Test

To test just the post-match thread functionality:

```bash
npm run test:post
```

This immediately simulates a match that has just finished and tests the post-match thread creation.

### Irregular Match Endings

To test how the bot handles matches that end in irregular ways:

```bash
# Test cancelled match
npm run test:cancelled

# Test suspended match
npm run test:suspended

# Test abandoned match
npm run test:abandoned
```

### Test All Match Statuses

To run tests for every possible match status from the API:

```bash
npm run test:all-statuses
```

This will run individual tests for each status and save logs in the `test-logs` directory.

### Real Posting Test

If you want to test the actual posting to Reddit (but still with accelerated simulation):

```bash
npm run test:sim:real
```

**Warning:** This will make actual posts to your configured subreddit!

## Configuration Options

You can customize the simulation by setting environment variables:

- `SIMULATION_SPEED`: Controls how fast the simulation runs (default: 30)
  - Example: `SIMULATION_SPEED=60` makes the simulation run 60x faster
- `MATCH_STATUS_OVERRIDE`: Forces a specific match status for testing
  - Example: `MATCH_STATUS_OVERRIDE=HT` forces the match status to half-time

## Manual Testing

You can also use the test utilities in your own scripts:

```typescript
import { prepareTestMatch, setMatchToStatus, cleanupTestFiles } from "../utils/testUtils";

// Create a match starting 5 minutes from now
prepareTestMatch(5);

// Or set a match to a specific status
setMatchToStatus("2H"); // Second half

// Clean up when done
cleanupTestFiles();
```

## Available Status Codes

The API-Football provides the following match status codes, all of which are now handled by our system:

### Pre-match Statuses
- `TBD`: To Be Defined
- `NS`: Not Started
- `PST`: Postponed

### In-play Statuses
- `1H`: First Half
- `HT`: Half Time
- `2H`: Second Half
- `BT`: Break Time
- `ET`: Extra Time
- `P`: Penalty In Progress
- `SUSP`: Suspended
- `INT`: Interrupted
- `LIVE`: Live (general in-play)

### Match Ended Statuses
- `FT`: Full Time (regular)
- `AET`: After Extra Time
- `PEN`: Penalties
- `WO`: Walkover
- `AWD`: Awarded
- `CANC`: Cancelled
- `ABD`: Abandoned

## Troubleshooting

If you encounter any issues:

1. Make sure all test files are cleaned up: `npm run clean-mock-data`
2. Check that `mock-data/match-data.json` exists (required for simulation)
3. Verify that the `.env` file has all necessary API and Reddit credentials
4. Examine test logs in the `test-logs` directory 