const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://Admin:admin@filter.u442m.mongodb.net/mern-App';

const sampleData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const Candidate = mongoose.model('Candidate', new mongoose.Schema({}, { strict: false }));
    
    console.log('Searching for records containing "LPA"...');
    const candidates = await Candidate.find({ 
      $or: [
        { currentCTC: { $regex: /LPA/i } },
        { expectedCTC: { $regex: /LPA/i } }
      ]
    }).limit(10);
    
    if (candidates.length > 0) {
      candidates.forEach((c, i) => {
        console.log(`LPA Row ${i + 1}:`, {
          currentCTC: c.currentCTC,
          expectedCTC: c.expectedCTC,
          experience: c.experience
        });
      });
    } else {
      console.log('No records found with "LPA" string.');
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

sampleData();
