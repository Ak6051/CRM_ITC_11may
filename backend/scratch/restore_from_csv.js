const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://Admin:admin@filter.u442m.mongodb.net/mern-App';

const parseNum = (str) => {
  if (!str) return null;
  const match = str.match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[0]) : null;
};

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const Candidate = mongoose.model('Candidate', new mongoose.Schema({}, { strict: false }));
    const filePath = path.join(__dirname, 'Backup_candidates.csv');

    console.log('📖 Reading backup CSV file and restoring missing numeric values...\n');

    let processedCount = 0;
    let updateCount = 0;
    const batchOps = [];
    const BATCH_SIZE = 500;
    const promises = [];

    const executeBatch = async (ops) => {
      if (ops.length > 0) {
        try {
          await Candidate.bulkWrite(ops);
        } catch (e) {
          console.error('Batch write error:', e.message);
        }
      }
    };

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          processedCount++;
          
          const id = row._id;
          if (!id) return;

          // Safely restore only if we can parse a valid number from the backup
          const bExp = parseNum(row.experience);
          const bNp = parseNum(row.noticePeriod);
          const bCctc = parseNum(row.currentCTC);
          const bEctc = parseNum(row.expectedCTC);

          // For string versions created by previous flawed run:
          // We will update ANY record where experience is 0 OR experience is a string
          if (bExp !== null) {
            batchOps.push({
              updateOne: {
                filter: { _id: new mongoose.Types.ObjectId(id), $or: [{ experience: 0 }, { experience: { $type: 'string' } }] },
                update: { $set: { experience: bExp } }
              }
            });
          }
          if (bNp !== null) {
            batchOps.push({
              updateOne: {
                filter: { _id: new mongoose.Types.ObjectId(id), $or: [{ noticePeriod: 0 }, { noticePeriod: { $type: 'string' } }] },
                update: { $set: { noticePeriod: bNp } }
              }
            });
          }
          if (bCctc !== null) {
            batchOps.push({
              updateOne: {
                filter: { _id: new mongoose.Types.ObjectId(id), $or: [{ currentCTC: 0 }, { currentCTC: { $type: 'string' } }] },
                update: { $set: { currentCTC: bCctc } }
              }
            });
          }
          if (bEctc !== null) {
            batchOps.push({
              updateOne: {
                filter: { _id: new mongoose.Types.ObjectId(id), $or: [{ expectedCTC: 0 }, { expectedCTC: { $type: 'string' } }] },
                update: { $set: { expectedCTC: bEctc } }
              }
            });
          }

          if (batchOps.length >= BATCH_SIZE) {
            updateCount += batchOps.length;
            const opsToRun = [...batchOps];
            batchOps.length = 0;
            promises.push(executeBatch(opsToRun));
          }
        })
        .on('end', () => {
          // Push any remaining
          if (batchOps.length > 0) {
            updateCount += batchOps.length;
            promises.push(executeBatch([...batchOps]));
          }
          resolve();
        })
        .on('error', reject);
    });

    console.log('Waiting for all database updates to finish...');
    await Promise.all(promises);

    console.log(`\n🎉 CSV Parsing and Update completed!`);
    console.log(`📊 Processed Rows: ${processedCount}`);
    console.log(`🔄 Total Operations Run: ${updateCount}`);
    
    await mongoose.disconnect();
    console.log('✅ Done');

  } catch (err) {
    console.error('❌ Error:', err);
  }
};

run();
