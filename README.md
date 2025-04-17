# SC Internacional Match Thread Bot

Automated Reddit bot that creates and posts match threads for SC Internacional football matches. The bot handles pre-match, live match, and post-match threads, providing comprehensive coverage of matches.

## Features

### 🕒 Pre-Match Thread
- Posted 24 hours before kickoff
- Includes: competition, round, teams, stadium, date/time, referee
- Title format: `[PRÉ-JOGO] | COMPETIÇÃO | TIME DA CASA X TIME VISITANTE | RODADA`

### ⚽ Match Thread
- Posted 15 minutes before kickoff
- Includes: lineups (fetched 1 hour before kickoff), last 5 match results for both teams, match details
- Title format: `[JOGO] | COMPETIÇÃO | TIME DA CASA X TIME VISITANTE | RODADA`

### 🏁 Post-Match Thread
- Posted when match ends (polls every 2 minutes after expected end time)
- Includes: final score, goalscorers with minutes, detailed match statistics
- Title format: `[PÓS-JOGO] | COMPETIÇÃO | TIME DA CASA X TIME VISITANTE | RODADA`

## Project Structure

```
/
├── src/                   # Source code
│   ├── api/               # API client for football data
│   ├── config/            # Configuration settings and constants
│   ├── formatters/        # Formatting utilities for thread content
│   ├── reddit/            # Reddit API integration
│   ├── schedulers/        # Thread scheduling logic
│   ├── utils/             # Utility functions
│   └── index.ts           # Main entry point
├── scripts/               # Utility scripts
│   └── captureApiData.ts  # Tool for capturing API responses as mock data
├── mock-data/             # Storage for mock API responses
└── data/                  # Local state storage (git-ignored except .gitkeep)
```

## Hosting Options

The bot can run in two modes:

### 1. Continuous Mode (Legacy)
- Runs as a continuous process
- Internally schedules all thread creation
- Requires a persistent hosting environment

### 2. Job Mode (Recommended for free hosting)
- Runs as a scheduled job that starts, checks for needed actions, and exits
- Perfect for free hosting platforms with execution time limits
- Can be scheduled with:
  - Cron jobs (Linux/Unix)
  - Task Scheduler (Windows)
  - GitHub Actions
  - Free scheduler services (cron-job.org, etc.)

## Setting Up Scheduled Execution

For best results with free hosting, schedule the job to run every 15-30 minutes:

### GitHub Actions Example
```yaml
name: Run Match Thread Bot

on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes

jobs:
  run-bot:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run job
        env:
          # Set all your environment variables here
          FOOTBALL_API_KEY: ${{ secrets.FOOTBALL_API_KEY }}
          REDDIT_CLIENT_ID: ${{ secrets.REDDIT_CLIENT_ID }}
          # ...other env vars
```

### External Scheduler Service
1. Deploy your app to a service like Render, Netlify, or Vercel
2. Create an endpoint that triggers the bot job
3. Use a service like cron-job.org to hit that endpoint every 15-30 minutes

## Smart Refreshing

The bot implements smart data refreshing:
- Fetches match data once every 24 hours
- Persists refresh state between bot restarts
- Fetches lineups separately, 1 hour before kickoff and again right before posting
- State data is stored in the `data/` directory (not committed to repository)

## Development Mode

The bot supports two development flags:

- `USE_MOCK_DATA=true`: Uses local mock data instead of making API calls
- `DRY_RUN=true`: Previews thread content without posting to Reddit

## Working with Mock Data

The bot includes tools for working with mock data to facilitate development:

- `npm run capture-mock-data`: Captures live API responses to use as mock data
- `npm run clean-mock-data`: Cleans up old mock data files
- Mock data is stored in the `mock-data/` directory

## Installation & Usage

```bash
# Install dependencies
npm install

# Development - Continuous Mode
npm run dev:mock    # Mock data + no posting
npm run dev:dry     # Real API + no posting
npm run dev         # Real API + real posting

# Production - Continuous Mode
npm run build
npm start

# Job Mode (for scheduled execution)
npm run build
npm run job         # Real API + real posting
npm run job:dry     # Real API + no posting
npm run job:mock    # Mock data + no posting
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```
# Football API Configuration
FOOTBALL_API_KEY=your_api_key_here

# Reddit API Configuration
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_USERNAME=your_username
REDDIT_PASSWORD=your_password
REDDIT_USER_AGENT=your_user_agent
REDDIT_SUBREDDIT=target_subreddit

# Runtime Flags
DRY_RUN=true        # Set to false in production
USE_MOCK_DATA=true  # Set to false in production
```

## License

[MIT License](LICENSE)
