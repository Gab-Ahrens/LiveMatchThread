/**
 * Copy-Assets Script
 * 
 * This script copies non-TypeScript files from src to dist
 * that are needed at runtime, like JSON files.
 */
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
const distDir = path.join(__dirname, '..', 'dist');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy nicknames.json file
const nicknamesSource = path.join(srcDir, 'nicknames.json');
const nicknamesTarget = path.join(distDir, 'nicknames.json');

try {
  if (fs.existsSync(nicknamesSource)) {
    fs.copyFileSync(nicknamesSource, nicknamesTarget);
    console.log('✅ Successfully copied nicknames.json to dist folder');
  } else {
    console.warn('⚠️ nicknames.json not found in src folder');
  }
} catch (error) {
  console.error('❌ Error copying nicknames.json:', error);
}

// Add more files to copy here if needed in the future 