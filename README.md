# SC Internacional Match Thread Bot

An intelligent, automated Reddit bot that creates comprehensive match threads for SC Internacional football matches. The bot provides complete match coverage with pre-match discussions, live match threads, and detailed post-match analysis.

## 🚀 Features

### 📅 Automated Thread Scheduling
- **Pre-Match Thread**: Posted 24 hours before kickoff for predictions and discussions
- **Match Thread**: Posted 20 minutes before kickoff with lineups and live updates
- **Post-Match Thread**: Posted automatically when match ends with final stats and analysis

### 🧠 Smart Match Detection
- Automatically detects live Internacional matches and sets up post-match monitoring
- Handles recently finished matches that need post-match threads
- Polls match status every 2 minutes during games to detect when matches end
- Supports all match statuses (regular, extra time, penalties, cancelled, suspended, etc.)

### 📊 Rich Content Generation
- **Team lineups** with formation details (when available)
- **Match statistics** including possession, shots, cards, and more
- **Goal tracking** with scorer names and minute details
- **Last 5 matches** form for both teams
- **Competition formatting** for Brasileirão, Libertadores, Copa do Brasil, etc.
- **Team nicknames** for rival teams (configurable)

### 🛡️ Robust Operation
- **API rate limiting** with 100 calls/day tracking and warnings
- **Duplicate prevention** - never posts the same thread twice
- **State persistence** - remembers posted threads across bot restarts
- **Error recovery** - continues operation even if some API calls fail
- **Multi-timezone support** with proper Brazilian timezone handling

### 🧪 Comprehensive Testing Framework
- **Full match simulation** with accelerated time (30x speed by default)
- **Mock data system** for testing without API calls
- **Dry run mode** for safe testing without Reddit posts
- **Status testing** for all possible match outcomes
- **Force posting** scripts for manual overrides

## 📁 Project Structure

```
/
├── src/
│   ├── api/
│   │   └── apiClient.ts           # Football API integration with rate limiting
│   ├── config/
│   │   └── appConfig.ts           # Centralized configuration management
│   ├── formatters/
│   │   └── matchFormatters.ts     # Thread content formatting and styling
│   ├── reddit/
│   │   └── redditClient.ts        # Reddit API integration with flair support
│   ├── schedulers/
│   │   ├── BaseScheduler.ts       # Common scheduler functionality
│   │   ├── PreMatchScheduler.ts   # Pre-match thread scheduling
│   │   ├── MatchThreadScheduler.ts # Live match thread scheduling
│   │   └── PostMatchScheduler.ts  # Post-match thread with live monitoring
│   ├── utils/
│   │   ├── apiCallTracker.ts      # API usage monitoring and limits
│   │   ├── dateUtils.ts           # Date/time formatting utilities
│   │   ├── nicknameUtils.ts       # Team nickname management
│   │   ├── refreshState.ts        # Data refresh state management
│   │   ├── threadState.ts         # Posted thread tracking
│   │   └── testUtils.ts           # Testing utilities and helpers
│   ├── test/
│   │   ├── simulateMatch.ts       # Full match simulation
│   │   ├── testPostMatch.ts       # Post-match thread testing
│   │   ├── testIrregularMatchEnd.ts # Irregular match ending tests
│   │   └── README.md              # Detailed testing documentation
│   ├── nicknames.json             # Team nickname mappings
│   ├── index.ts                   # Main bot entry point
│   ├── force-post-match.ts        # Manual post-match thread creation
│   └── emergency-create-thread.ts # Emergency thread creation tool
├── scripts/
│   ├── captureApiData.ts          # Mock data capture utility
│   └── copy-assets.js             # Build asset copying
├── mock-data/                     # Mock API responses for testing
├── data/                          # Local state storage (git-ignored)
├── test-logs/                     # Test execution logs
└── tests/                         # Formal unit test structure (WIP)
```

## 🎮 Quick Start

### Development Mode (Safe Testing)
```bash
# Install dependencies
npm install

# Run with mock data and dry run (no Reddit posts)
npm run dev:mock

# Run with live API data but no Reddit posts
npm run dev

# Full match simulation (3-5 minutes, simulates entire match)
npm run test:sim
```

### Production Mode
```bash
# Build and run in production
npm run build
npm start
```

## 🧪 Testing & Simulation

The bot includes a comprehensive testing framework:

### Full Match Simulation
```bash
# Complete match simulation (pre-match → match → post-match)
npm run test:sim

# Test with actual Reddit posting (be careful!)
npm run test:sim:real
```

### Specific Thread Testing
```bash
# Test post-match thread only
npm run test:post

# Test irregular match endings
npm run test:cancelled    # Cancelled match
npm run test:suspended    # Suspended match
npm run test:abandoned    # Abandoned match
```

### Manual Operations
```bash
# Force create post-match thread for recently finished match
npm run force-post-match

# Force create with dry run
npm run force-post-match:dry

# Test all possible match statuses
npm run test:all-statuses
```

### Mock Data Management
```bash
# Capture live API data for testing
npm run capture-mock-data

# Clean up old mock data
npm run clean-mock-data
```

## ⚙️ Configuration

Create a `.env` file with the following variables:

```env
# Football API Configuration (RapidAPI)
RAPIDAPI_KEY=your_rapidapi_key
RAPIDAPI_HOST=api-football-v1.p.rapidapi.com

# Reddit API Configuration
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USERNAME=your_reddit_username
REDDIT_PASSWORD=your_reddit_password
REDDIT_USER_AGENT=your_user_agent_string
REDDIT_SUBREDDIT=your_target_subreddit

# Runtime Flags (optional)
DRY_RUN=true              # Preview mode, no Reddit posts
USE_MOCK_DATA=true        # Use mock data instead of API calls
SIMULATION_MODE=true      # Enable simulation features
SIMULATION_SPEED=30       # Simulation speed multiplier
MATCH_STATUS_OVERRIDE=FT  # Force specific match status for testing
```

## 🎯 Thread Examples

### Pre-Match Thread
```
[PRÉ-JOGO] | BRASILEIRÃO | INTERNACIONAL X GRÊMIO | 15ª RODADA

📅 **Data**: Domingo, 15 de Outubro de 2023
🕐 **Horário**: 16:00 (Horário de Brasília)
🏟️ **Estádio**: Estádio Beira-Rio
📺 **Transmissão**: Premiere

[Match preview content with team form, head-to-head, etc.]
```

### Match Thread
```
[JOGO] | BRASILEIRÃO | INTERNACIONAL X GRÊMIO | 15ª RODADA

⚽ **Internacional 2 x 1 Grêmio**

📋 **Escalações**:
🔴 Internacional: [Starting XI with formation]
🔵 Grêmio: [Starting XI with formation]

[Live updates, goals, cards, substitutions]
```

### Post-Match Thread
```
[PÓS-JOGO] | BRASILEIRÃO | INTERNACIONAL 2 X 1 GRÊMIO | 15ª RODADA

⚽ **Gols**:
- 23' Internacional - Wanderson
- 67' Internacional - Alan Patrick
- 89' Grêmio - Suárez

📊 **Estatísticas**:
[Detailed match statistics table]
```

## 🔧 Architecture

The bot follows a modular architecture with clear separation of concerns:

- **Schedulers**: Handle timing and orchestration of thread creation
- **Formatters**: Generate Reddit-formatted content from match data
- **API Client**: Manages external API calls with rate limiting
- **Utils**: Provide common functionality like date handling and state management
- **Config**: Centralized configuration management

## 📈 Monitoring & Limits

- **API Usage**: Tracks daily API calls (100/day limit) with warnings at 80+ calls
- **Thread State**: Persists posted thread information to prevent duplicates
- **Error Logging**: Comprehensive logging for debugging and monitoring
- **Refresh State**: Smart data refreshing every 24 hours

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Use the testing framework to validate changes
4. Submit a pull request

## 📄 License

[MIT License](LICENSE)

---

**Note**: This bot is designed specifically for SC Internacional matches. Team ID and season are configurable in the environment variables.
