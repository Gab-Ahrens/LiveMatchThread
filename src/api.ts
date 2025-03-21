import fs from 'fs';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const USE_MOCK = process.env.USE_MOCK_DATA === 'true';
const API_BASE_URL = 'https://api-football-v1.p.rapidapi.com/v3';
const TEAM_ID = 119;
const SEASON = 2024;

export async function fetchNextMatch() {
  if (USE_MOCK) {
    const filePath = path.join(__dirname, '..', 'mock-next-match.json');
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }

  const response = await axios.get(`${API_BASE_URL}/fixtures`, {
    params: {
      team: TEAM_ID,
      season: SEASON,
      next: 1
    },
    headers: {
      'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
      'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
    }
  });

  return response.data.response[0]; // just return the data directly
}
