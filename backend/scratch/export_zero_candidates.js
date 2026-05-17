const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
require('dotenv').config();
const path = require('path');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://Admin:admin@filter.u442m.mongodb.net/mern-App';

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const Candidate = mongoose.model('Candidate', new mongoose.Schema({}, { strict: false }));

    console.log('Fetching candidates with experience = 0 AND noticePeriod = 0...');
    
    const candidates = await Candidate.find({ 
        experience: 0, 
        noticePeriod: 0 
    }).lean();

    console.log(`Found ${candidates.length} candidates. Generating Excel file...`);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Zero Value Candidates');

    // Define columns
    worksheet.columns = [
      { header: 'ID', key: '_id', width: 25 },
      { header: 'Name', key: 'candidateName', width: 25 },
      { header: 'Email', key: 'candidateEmail', width: 30 },
      { header: 'Phone', key: 'candidatePhone', width: 15 },
      { header: 'Experience', key: 'experience', width: 15 },
      { header: 'Notice Period', key: 'noticePeriod', width: 15 },
      { header: 'Current CTC', key: 'currentCTC', width: 15 },
      { header: 'Expected CTC', key: 'expectedCTC', width: 15 },
      { header: 'Current Position', key: 'currentPosition', width: 20 },
      { header: 'Position Applied', key: 'positionName', width: 20 },
      { header: 'Current Location', key: 'currentLocation', width: 20 },
      { header: 'Created At', key: 'createdAt', width: 20 }
    ];

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add rows
    candidates.forEach(c => {
      worksheet.addRow({
        _id: c._id ? c._id.toString() : '',
        candidateName: c.candidateName || c.name || '',
        candidateEmail: c.candidateEmail || c.email || '',
        candidatePhone: c.candidatePhone || c.phoneNumber || '',
        experience: c.experience,
        noticePeriod: c.noticePeriod,
        currentCTC: c.currentCTC,
        expectedCTC: c.expectedCTC,
        currentPosition: c.currentPosition || '',
        positionName: c.positionName || '',
        currentLocation: c.currentLocation || '',
        createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''
      });
    });

    const exportPath = path.join(__dirname, 'Zero_Experience_Notice_Candidates.xlsx');
    await workbook.xlsx.writeFile(exportPath);

    console.log(`\n✅ Excel file generated successfully at: ${exportPath}`);

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

run();
