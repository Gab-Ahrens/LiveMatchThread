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
- Posted when match ends (polls match status after estimated end time)
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
  - GitHub Actions (recommended - detailed below)
  - Free scheduler services (cron-job.org, etc.)

## Setting Up with GitHub Actions (Recommended)

GitHub Actions is the easiest way to host this bot for free. Here's how to set it up:

1. **Fork or push this repository to your GitHub account**

2. **Set up GitHub Secrets**

   In your repository, go to Settings → Secrets and variables → Actions → New repository secret
   
   Add the following secrets:

   - `FOOTBALL_API_KEY`: Your RapidAPI key for football-data API
   - `RAPIDAPI_HOST`: Host for the football API (e.g., `api-football-v1.p.rapidapi.com`)
   - `REDDIT_CLIENT_ID`: Your Reddit application client ID
   - `REDDIT_CLIENT_SECRET`: Your Reddit application client secret
   - `REDDIT_USERNAME`: Your Reddit username
   - `REDDIT_PASSWORD`: Your Reddit account password
   - `REDDIT_USER_AGENT`: User agent string (e.g., `node:sc-internacional-bot:v1.0.0 (by /u/your_username)`)
   - `REDDIT_SUBREDDIT`: Subreddit name without 'r/' (e.g., `internacional`)
   - `TEAM_ID`: SC Internacional team ID (e.g., `126`)
   - `SEASON`: Current season year (e.g., `2023`)

3. **Create GitHub Actions workflow file**

   Create a new file at `.github/workflows/run-bot.yml` with the following content:

```yaml
name: Run Match Thread Bot

on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
  workflow_dispatch:        # Allow manual triggering

jobs:
  run-bot:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build project
        run: npm run build
        
      - name: Create data directory
        run: mkdir -p data
        
      - name: Run bot job
        run: npm run job
        env:
          FOOTBALL_API_KEY: ${{ secrets.FOOTBALL_API_KEY }}
          RAPIDAPI_HOST: ${{ secrets.RAPIDAPI_HOST }}
          REDDIT_CLIENT_ID: ${{ secrets.REDDIT_CLIENT_ID }}
          REDDIT_CLIENT_SECRET: ${{ secrets.REDDIT_CLIENT_SECRET }}
          REDDIT_USERNAME: ${{ secrets.REDDIT_USERNAME }}
          REDDIT_PASSWORD: ${{ secrets.REDDIT_PASSWORD }}
          REDDIT_USER_AGENT: ${{ secrets.REDDIT_USER_AGENT }}
          REDDIT_SUBREDDIT: ${{ secrets.REDDIT_SUBREDDIT }}
          TEAM_ID: ${{ secrets.TEAM_ID }}
          SEASON: ${{ secrets.SEASON }}
      
      - name: Commit and push state changes
        run: |
          git config --global user.name 'GitHub Actions Bot'
          git config --global user.email 'actions@github.com'
          git add data/
          git commit -m "Update thread state [skip ci]" || echo "No changes to commit"
          git push
```

4. **Test manually**

   Go to the Actions tab in your repository and manually trigger the workflow to make sure everything works correctly.

### Important Notes about GitHub Actions

- The bot will run every 15 minutes (you can adjust the cron schedule as needed)
- State files will be committed back to your repository so the bot remembers which threads have been posted
- The setup includes a manual trigger option for testing
- Make sure your repository has a `data/` directory (even if empty) for the state files

## External Scheduler Service (Alternative)

If you prefer not to use GitHub Actions:

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

The preview mode will show you how all three thread types will look before they're posted.

## Working with Mock Data

The bot includes tools for working with mock data to facilitate development:

- `npm run capture-mock-data`: Captures live API responses to use as mock data
- `npm run clean-mock-data`: Cleans up old mock data files
- Mock data is stored in the `mock-data/` directory

## Installation & Usage

```bash
# Install dependencies
npm install

# Development
npm run dev:mock    # Mock data + no posting + preview all threads
npm run dev:dry     # Real API + no posting + preview all threads
npm run dev         # Real API + real posting

# Production - Job Mode (recommended)
npm run build
npm run job         # Real API + real posting
npm run job:dry     # Real API + no posting
npm run job:mock    # Mock data + no posting

# Legacy Continuous Mode
npm run build
npm start
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```
# Football API Configuration
FOOTBALL_API_KEY=your_api_key_here
RAPIDAPI_HOST=api-football-v1.p.rapidapi.com
TEAM_ID=126
SEASON=2024

# Reddit API Configuration
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_USERNAME=your_username
REDDIT_PASSWORD=your_password
REDDIT_USER_AGENT=node:sc-internacional-bot:v1.0.0 (by /u/your_username)
REDDIT_SUBREDDIT=internacional

# Runtime Flags (optional)
DRY_RUN=false
USE_MOCK_DATA=false
```

## Getting Reddit API Credentials

1. Visit https://www.reddit.com/prefs/apps
2. Scroll down and click "create another app..."
3. Fill in the details:
   - Name: SC Internacional Bot
   - Type: Script
   - Description: Bot for posting SC Internacional match threads
   - About URL: Your GitHub repository URL
   - Redirect URI: http://localhost:8000
4. Click "create app"
5. Note your client ID (under your app name) and client secret

## License

[MIT License](LICENSE)
