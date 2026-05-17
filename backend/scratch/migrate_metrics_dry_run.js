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
  
  // Handle 'k'
  if (str.includes('k')) {
    const num = parseNumeric(str);
    return num * 1000;
  }
  
  // Handle 'lpa'
  if (str.includes('lpa')) {
    const num = parseNumeric(str);
    return Math.round((num * 100000) / 12);
  }

  const num = parseNumeric(str);
  
  // Heuristic for raw numbers
  if (num > 0 && num < 100) {
    // Likely LPA (e.g., 2.4, 5, 12)
    // BUT WAIT: If it's 30, is it 30,000 or 30 LPA?
    // Let's adjust: if num >= 15 and num < 100, maybe it's missing 'k'?
    // Usually LPA is < 20. If it's 30, it's probably 30,000.
    if (num >= 20) return num * 1000; 
    return Math.round((num * 100000) / 12);
  }
  if (num >= 100 && num < 1000) {
    // Likely missing 'k' (e.g., 150, 250)
    return num * 1000;
  }
  
  return Math.round(num);
};

const runDryRun = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for Dry Run');

    const Candidate = mongoose.model('Candidate', new mongoose.Schema({}, { strict: false }));
    const CandidateApplication = mongoose.model('CandidateApplication', new mongoose.Schema({}, { strict: false }));

    const models = [
      { name: 'Candidate', model: Candidate },
      { name: 'CandidateApplication', model: CandidateApplication }
    ];

    for (const m of models) {
      console.log(`\n--- Sampling ${m.name} (Top 20 changes) ---`);
      const docs = await m.model.find({
        $or: [
          { currentCTC: { $nin: ["", null, 0] } },
          { expectedCTC: { $nin: ["", null, 0] } },
          { experience: { $nin: ["", null, 0] } },
          { noticePeriod: { $nin: ["", null, 0] } }
        ]
      }).limit(100);

      let changeCount = 0;
      docs.forEach(doc => {
        const updates = {};
        const fields = ['currentCTC', 'expectedCTC', 'experience', 'noticePeriod'];
        let hasChange = false;

        fields.forEach(f => {
          const original = doc[f];
          let parsed = 0;
          if (f === 'experience') parsed = parseExperience(original);
          else if (f === 'noticePeriod') parsed = parseNoticePeriod(original);
          else parsed = parseCTC(original);

          if (String(original) !== String(parsed)) {
            updates[f] = { from: original, to: parsed };
            hasChange = true;
          }
        });

        if (hasChange && changeCount < 20) {
          console.log(`ID: ${doc._id} | Changes:`, updates);
          changeCount++;
        }
      });
      
      if (changeCount === 0) console.log('No changes needed for sampled records.');
    }

    await mongoose.disconnect();
    console.log('\nDry run complete. Please review the transformations above.');
  } catch (err) {
    console.error(err);
  }
};

runDryRun();
