const fs = require('fs');
const path = require('path');

const sketchPath = path.join(__dirname, '..', 'sketch.js');
if (!fs.existsSync(sketchPath)) {
  console.error('sketch.js not found at', sketchPath);
  process.exit(1);
}

const content = fs.readFileSync(sketchPath, 'utf8');

// Find the trainingData block
const startToken = 'const trainingData = [';
const startIndex = content.indexOf(startToken);
if (startIndex === -1) {
  console.error('trainingData declaration not found');
  process.exit(1);
}

// Find the opening '[' after the token and its closing '];' block
const arrayStart = content.indexOf('[', startIndex + startToken.length);
const endToken = '\n]\n\n';
const arrayEnd = content.indexOf(endToken, arrayStart);
if (arrayEnd === -1) {
  console.error('Could not find end of trainingData array');
  process.exit(1);
}

const jsonBlock = content.slice(arrayStart, arrayEnd + 2);

// If array already contains arrays instead of objects, exit
if (/\{\s*"high"/.test(jsonBlock) === false) {
  console.log('trainingData already seems to be in a non-object format — exiting');
  process.exit(0);
}

// Convert JSON-ish block to valid JSON by replacing trailing commas after last entry
// Parse to array of objects
let parsed;
try {
  parsed = JSON.parse(jsonBlock);
} catch (err) {
  // Try to rehabilitate by removing trailing slashes, and converting keys to proper strings
  const repaired = jsonBlock.replace(/\n\s*([A-Za-z0-9_\-\/]+)\s*:/g, '\n"$1":');
  try {
    parsed = JSON.parse(repaired);
  } catch (err2) {
    console.error('Failed to parse trainingData block:', err2.message);
    process.exit(1);
  }
}

// Transform to 2D array
const twoD = parsed.map((obj) => {
  // handle both 'up/down' and up_down keys
  const upKey = Object.prototype.hasOwnProperty.call(obj, 'up/down') ? 'up/down' : (Object.prototype.hasOwnProperty.call(obj, 'up_down') ? 'up_down' : 'up/down');
  const dirVal = obj[upKey];
  return [obj.high, obj.low, obj.volume, dirVal];
});

const newBlock = JSON.stringify(twoD, null, 2);

const newContent = content.slice(0, startIndex) + 'const trainingData = ' + newBlock + content.slice(arrayEnd + 2);

fs.copyFileSync(sketchPath, sketchPath + '.bak');
fs.writeFileSync(sketchPath, newContent, 'utf8');
console.log('Converted trainingData to 2D array in sketch.js — backup written to sketch.js.bak');
