const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://Admin:admin@filter.u442m.mongodb.net/mern-App';

// Parsing Logic
const parseNumeric = (val) => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  const match = String(val).match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[0]) : 0;
};

const parseExperience = (val) => {
  if (!val) return 0;
  const str = String(val).toLowerCase();
  const num = parseNumeric(str);
  if (str.includes('month')) return parseFloat((num / 12).toFixed(2));
  return num;
};

const parseNoticePeriod = (val) => {
  if (!val) return 0;
  const str = String(val).toLowerCase();
  const num = parseNumeric(str);
  if (str.includes('week')) return num * 7;
  if (str.includes('month')) return num * 30;
  return num;
};

const parseCTC = (val) => {
  if (!val) return 0;
  let str = String(val).toLowerCase().replace(/[, \s]/g, '');
  
  if (str.includes('k')) {
    const num = parseNumeric(str);
    return num * 1000;
  }
  
  if (str.includes('lpa')) {
    const num = parseNumeric(str);
    return Math.round((num * 100000) / 12);
  }

  const num = parseNumeric(str);
  if (num > 0 && num < 15) {
    // Heuristic: < 15 is likely LPA (e.g., 3.5, 5, 12)
    return Math.round((num * 100000) / 12);
  }
  if (num >= 15 && num < 1000) {
    // Heuristic: >= 15 is likely missing 'k' (e.g., 15, 25, 150)
    return num * 1000;
  }
  
  return Math.round(num);
};

const migrateData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for Final Migration');

    const Candidate = mongoose.model('Candidate', new mongoose.Schema({}, { strict: false }));
    const CandidateApplication = mongoose.model('CandidateApplication', new mongoose.Schema({}, { strict: false }));

    const models = [
      { name: 'Candidate', model: Candidate },
      { name: 'CandidateApplication', model: CandidateApplication }
    ];

    for (const m of models) {
      console.log(`\n--- Migrating ${m.name} ---`);
      
      const total = await m.model.countDocuments();
      console.log(`Total records to process: ${total}`);

      let processed = 0;
      let updatedCount = 0;
      const batchSize = 500;

      while (processed < total) {
        const docs = await m.model.find().skip(processed).limit(batchSize);
        if (docs.length === 0) break;

        const bulkOps = docs.map(doc => {
          const updates = {};
          const fields = ['currentCTC', 'expectedCTC', 'experience', 'noticePeriod'];
          let hasChange = false;

          fields.forEach(f => {
            const original = doc[f];
            if (original === undefined || original === null) return;
            
            let parsed = 0;
            if (f === 'experience') parsed = parseExperience(original);
            else if (f === 'noticePeriod') parsed = parseNoticePeriod(original);
            else parsed = parseCTC(original);

            if (String(original) !== String(parsed)) {
              updates[f] = parsed;
              hasChange = true;
            }
          });

          if (hasChange) {
            return {
              updateOne: {
                filter: { _id: doc._id },
                update: { $set: updates }
              }
            };
          }
          return null;
        }).filter(Boolean);

        if (bulkOps.length > 0) {
          await m.model.bulkWrite(bulkOps);
          updatedCount += bulkOps.length;
        }

        processed += docs.length;
        console.log(`Processed ${processed}/${total}... (Updates: ${updatedCount})`);
      }

      console.log(`Finished ${m.name}. Total updates: ${updatedCount}`);
    }

    await mongoose.disconnect();
    console.log('\nMigration complete successfully.');
  } catch (err) {
    console.error('Migration Error:', err);
  }
};

migrateData();
