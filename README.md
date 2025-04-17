# SC Internacional Match Thread Bot

Automated Reddit bot that posts match threads for SC Internacional matches.

## Features

### ✅ Pre-Match Thread
- Posts 1 hour before kickoff.
- Includes: competition, round, teams, stadium, time, referee, lineups.
- Title format:  
  `[JOGO] | COMPETIÇÃO | TIME DA CASA X SC INTERNACIONAL | RODADA`

### ✅ Post-Match Thread
- Posted when match ends (polls every 2 minutes after 2h).
- Includes: final score, goalscorers with minutes, stats (table format).
- Title format:  
  `[PÓS-JOGO] | COMPETIÇÃO | TIME DA CASA X TIME VISITANTE | RODADA`

## Dev Mode
- `USE_MOCK_DATA=true`: Uses local mock JSONs.
- `DRY_RUN=true`: Logs thread previews, doesn't post to Reddit.

## Usage

```bash
# Install dependencies
npm install

# Run in dev mode with mock data (doesn't post to Reddit)
npm run dev:mock
# OR on Windows, use the batch file:
./run-dev-mode.bat

# For production use
npm run build
npm start
