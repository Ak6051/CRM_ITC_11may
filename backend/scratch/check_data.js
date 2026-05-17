const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://Admin:admin@filter.u442m.mongodb.net/mern-App';

const checkData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const Candidate = mongoose.model('Candidate', new mongoose.Schema({}, { strict: false }));
    
    console.log('Checking records with noticePeriod or experience...');
    const candidates = await Candidate.find({ 
      $or: [
        { noticePeriod: { $gt: 0 } },
        { experience: { $gt: 0 } }
      ]
    }).limit(10);
    
    if (candidates.length > 0) {
      candidates.forEach((c, i) => {
        console.log(`Candidate ${i + 1}:`, {
          currentCTC: c.currentCTC,
          expectedCTC: c.expectedCTC,
          experience: c.experience,
          noticePeriod: c.noticePeriod
        });
      });
    } else {
      console.log('No records found with noticePeriod > 0 or experience > 0.');
      // Let's check why...
      const sample = await Candidate.find().limit(5);
      sample.forEach((c, i) => {
        console.log(`Sample ${i + 1}:`, {
          noticePeriod: c.noticePeriod,
          experience: c.experience,
          typeOfNotice: typeof c.noticePeriod
        });
      });
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

checkData();
