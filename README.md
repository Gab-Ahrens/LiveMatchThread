# SC Internacional Match Thread Bot

Automated Reddit bot that creates and posts match threads for SC Internacional football matches. The bot handles pre-match, live match, and post-match threads, providing comprehensive coverage of matches.

## Features

### 🕒 Pre-Match Thread
- Posted 24 hours before kickoff
- Includes: competition, venue, date/time
- Uses team nicknames for better readability
- Title format: `[PRÉ-JOGO] | COMPETIÇÃO | TIME DA CASA X TIME VISITANTE | RODADA`

### ⚽ Match Thread
- Posted 15 minutes before kickoff
- Attempts to fetch lineups 1 hour before kickoff and again right before posting
- Includes lineups (when available), match details, and venue information
- Title format: `[JOGO] | COMPETIÇÃO | TIME DA CASA X TIME VISITANTE | RODADA`

### 🏁 Post-Match Thread
- Posted automatically when match ends (checks status after estimated end time)
- Includes: final score, goalscorers with minutes, detailed match statistics
- Handles special cases like extra time (AET) and penalties (PEN)
- Title format: `[PÓS-JOGO] | COMPETIÇÃO | TIME DA CASA X TIME VISITANTE | RODADA`

## Project Structure

```
/
├── src/                   # Source code
│   ├── api/               # API client for football data
│   │   └── apiClient.ts   # Football API integration
│   ├── config/            # Configuration settings and constants
│   ├── formatters/        # Formatting utilities for thread content
│   ├── reddit/            # Reddit API integration
│   │   └── redditClient.ts# Reddit posting functionality
│   ├── schedulers/        # Thread scheduling logic
│   │   ├── BaseScheduler.ts     # Common scheduler functionality
│   │   ├── PreMatchScheduler.ts # Pre-match thread handling
│   │   ├── MatchThreadScheduler.ts # Match thread handling
│   │   └── PostMatchScheduler.ts # Post-match thread handling
│   ├── utils/             # Utility functions
│   │   ├── dateUtils.ts   # Date and time formatting
│   │   ├── nicknameUtils.ts # Team nickname handling
│   │   └── refreshState.ts # Data refresh state management
│   ├── nicknames.json     # Team nickname mappings
│   └── index.ts           # Main entry point
├── scripts/               # Utility scripts
│   └── captureApiData.ts  # Tool for capturing API responses as mock data
├── mock-data/             # Storage for mock API responses
└── data/                  # Local state storage (git-ignored except .gitkeep)
```

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
RAPIDAPI_KEY=your_api_key_here
RAPIDAPI_HOST=api-football-v1.p.rapidapi.com

# Reddit API Configuration
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_USERNAME=your_username
REDDIT_PASSWORD=your_password
REDDIT_USER_AGENT=your_user_agent
REDDIT_SUBREDDIT=target_subreddit

# Team Configuration
TEAM_ID=131    # SC Internacional ID
SEASON=2024    # Current season

# Runtime Flags
DRY_RUN=true
USE_MOCK_DATA=true
```

## License

[MIT License](LICENSE)
