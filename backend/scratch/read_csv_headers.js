const fs = require('fs');
const readline = require('readline');
const path = require('path');

const filePath = path.join(__dirname, 'Backup_candidates.csv');

const readHeaders = async () => {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    console.log('HEADERS:');
    console.log(line);
    break; // Stop after first line
  }
};

readHeaders();
