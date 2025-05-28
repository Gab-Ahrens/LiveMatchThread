# Post-Match Thread Fix

## The Issue

When you start the bot during a live match, it skips creating the post-match thread for that ongoing match and instead schedules threads for the next match. This happens because:

1. **`fetchNextMatch()` uses `next: 1` parameter** - This always fetches the next upcoming match, not the current one
2. **No live match detection** - The bot didn't check for ongoing matches when starting
3. **Missing post-match thread** - The currently playing match doesn't get a post-match thread

## The Fix

I've implemented a comprehensive solution that:

### 1. **Live Match Detection**
- Added `fetchLiveMatch()` function to detect ongoing Internacional matches
- Added `fetchRecentlyFinishedMatch()` function to catch recently finished matches (within 6 hours)

### 2. **Enhanced Startup Logic**
The bot now follows this improved sequence when starting:

1. **Check for live matches** - If Internacional is currently playing, set up post-match thread polling
2. **Check for recently finished matches** - If there's a recent match without a post-match thread, create it immediately
3. **Schedule next match** - Proceed with normal scheduling for upcoming matches

### 3. **Manual Fix Tool**
Created `force-post-match.ts` script to manually create post-match threads for recently finished matches.

## How to Fix Your Current Situation

### Option 1: Manual Fix (Easiest)
Run the force post-match script to create the missing thread:

```bash
# Dry run first to see what it would do
npm run force-post-match:dry

# If it looks correct, run it for real
npm run force-post-match
```

### Option 2: Restart the Bot
The enhanced bot will now automatically detect and handle the situation:

```bash
npm run dev
```

The bot will:
1. Check for live matches (if still playing)
2. Check for recently finished matches and create missing post-match threads
3. Continue with normal scheduling

## How the Fix Prevents Future Issues

Going forward, when you start the bot during a live match, it will:

1. **Detect the live match** and immediately start polling for when it ends
2. **Create the post-match thread** as soon as the match finishes
3. **Also schedule** all threads for the next upcoming match

This ensures no post-match threads are ever missed, regardless of when you start the bot.

## New API Functions

- `fetchLiveMatch()` - Gets current live Internacional matches
- `fetchRecentlyFinishedMatch()` - Gets recently finished matches (last 6 hours)
- `PostMatchScheduler.createPostMatchThreadNow()` - Immediately creates post-match thread for finished matches

## Testing

You can test the fix with:

```bash
# Test the force post-match script (dry run)
npm run force-post-match:dry

# Test the enhanced bot startup
npm run dev:mock
``` 