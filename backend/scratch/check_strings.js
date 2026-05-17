const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://Admin:admin@filter.u442m.mongodb.net/mern-App';

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    const Candidate = mongoose.model('Candidate', new mongoose.Schema({}, { strict: false }));
    
    const expStrings = await Candidate.find({ experience: { $type: 'string' } }).limit(20).lean();
    console.log('--- Experience Strings ---');
    expStrings.forEach(c => console.log(`ID: ${c._id}, value: "${c.experience}"`));

    const npStrings = await Candidate.find({ noticePeriod: { $type: 'string' } }).limit(20).lean();
    console.log('\n--- Notice Period Strings ---');
    npStrings.forEach(c => console.log(`ID: ${c._id}, value: "${c.noticePeriod}"`));

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};
run();
