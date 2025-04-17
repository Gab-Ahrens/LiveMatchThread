# SC Internacional Match Thread Bot

Automated Reddit bot that creates and posts match threads for SC Internacional football matches. The bot handles pre-match, live match, and post-match threads, providing comprehensive coverage of matches.

## Features

### 🕒 Pre-Match Thread
- Posted 1 hour before kickoff
- Includes: competition, round, teams, stadium, date/time, referee
- Title format: `[PRÉ-JOGO] | COMPETIÇÃO | TIME DA CASA X TIME VISITANTE | RODADA`

### ⚽ Match Thread
- Posted at kickoff time
- Includes: lineups, last 5 match results for both teams, match details
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
│   ├── capture-mock-data/ # Tools for capturing API responses as mock data
│   └── clean-mock-data/   # Tools for cleaning mock data
└── mock-data/             # Storage for mock API responses
```

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

# Run in development mode with mock data (previews only)
npm run dev:mock

# Run in development mode with live API data (previews only)
npm run dev:dry

# Run in production mode (posts to Reddit)
npm run build
npm start
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
DRY_RUN=true
USE_MOCK_DATA=true
```

## License

[MIT License](LICENSE)
