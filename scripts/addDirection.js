const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'trainingData.json');
const backupPath = path.join(__dirname, '..', 'trainingData_backup.json');

if (!fs.existsSync(filePath)) {
  console.error('trainingData.json not found at', filePath);
  process.exit(1);
}

if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(filePath, backupPath);
  console.log('Backup written to', backupPath);
}

const raw = fs.readFileSync(filePath, { encoding: 'utf8' });
let arr = JSON.parse(raw);

let prevMid = null;
for (let i = 0; i < arr.length; i++) {
  const { high, low } = arr[i];
  const mid = (high + low) / 2;

  if (prevMid === null) {
    arr[i].direction = 'nochange';
  } else if (mid > prevMid) {
    arr[i].direction = 'up';
  } else if (mid < prevMid) {
    arr[i].direction = 'down';
  } else {
    arr[i].direction = 'nochange';
  }

  prevMid = mid;
}

fs.writeFileSync(filePath, JSON.stringify(arr, null, 2));
console.log('Updated trainingData.json with direction field.');
