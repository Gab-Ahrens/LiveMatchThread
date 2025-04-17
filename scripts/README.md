# Utility Scripts

This directory contains utility scripts for the LiveMatchThread project.

## Available Scripts

### `captureApiData.ts`

This script makes API calls to fetch real match data for use as mock data during development.

**Usage:**
```
npm run capture-mock-data
```

**Purpose:**
- Captures real API responses for a complete match
- Saves the data to the `mock-data` directory
- Only needs to be run once to initialize mock data

**Important:** 
Running this script consumes API calls against your daily limit. Only run it when you need to refresh the mock data.

## Working with Mock Data

To develop and test with mock data:

1. Make sure you have mock data by running `npm run capture-mock-data` once
2. Run the application in mock mode: `npm run dev:mock`

If you need to reset your mock data:
```
npm run clean-mock-data
```

This will remove all mock data files, allowing you to start fresh with a new capture.

Mock data provides consistent test cases without consuming API quota or requiring an actual match to be happening. 