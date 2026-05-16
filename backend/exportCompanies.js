const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const path = require('path');

const MONGO_URI = 'mongodb+srv://Admin:admin@filter.u442m.mongodb.net/mern-App';

const jobOpeningsSchema = new mongoose.Schema({
  companyName:     { type: String },
  industries:      { type: String },
  companyAddress:  { type: String },
  Area:            { type: String },
  contactName:     { type: String },
  phoneNumber:     { type: String },
  email:           { type: String },
  websiteURL:      { type: String },
}, { strict: false });

const JobOpenings = mongoose.model('JobOpenings', jobOpeningsSchema);

async function exportToExcel() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected!');

    // Deduplicate by companyName
    const records = await JobOpenings.aggregate([
      {
        $group: {
          _id: '$companyName',
          companyName:    { $first: '$companyName' },
          industries:     { $first: '$industries' },
          companyAddress: { $first: '$companyAddress' },
          Area:           { $first: '$Area' },
          contactName:    { $first: '$contactName' },
          phoneNumber:    { $first: '$phoneNumber' },
          email:          { $first: '$email' },
          websiteURL:     { $first: '$websiteURL' },
        }
      },
      { $sort: { companyName: 1 } }
    ]);

    console.log(`Found ${records.length} unique companies.`);

    // Build Excel
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Company Details');

    sheet.columns = [
      { header: 'Company Name',    key: 'companyName',    width: 30 },
      { header: 'Industries',      key: 'industries',     width: 25 },
      { header: 'Company Address', key: 'companyAddress', width: 35 },
      { header: 'Area',            key: 'Area',           width: 20 },
      { header: 'Contact Name',    key: 'contactName',    width: 25 },
      { header: 'Phone Number',    key: 'phoneNumber',    width: 18 },
      { header: 'Email',           key: 'email',          width: 30 },
      { header: 'Website URL',     key: 'websiteURL',     width: 35 },
    ];

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' },
      };
    });
    headerRow.height = 22;

    // Add data rows with alternating colors
    records.forEach((rec, index) => {
      const row = sheet.addRow({
        companyName:    rec.companyName    || '',
        industries:     rec.industries     || '',
        companyAddress: rec.companyAddress || '',
        Area:           rec.Area           || '',
        contactName:    rec.contactName    || '',
        phoneNumber:    rec.phoneNumber    || '',
        email:          rec.email          || '',
        websiteURL:     rec.websiteURL     || '',
      });

      const bgColor = index % 2 === 0 ? 'FFF0F4FA' : 'FFFFFFFF';
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.alignment = { vertical: 'middle', wrapText: true };
        cell.border = {
          top:    { style: 'thin', color: { argb: 'FFD0D0D0' } },
          left:   { style: 'thin', color: { argb: 'FFD0D0D0' } },
          bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
          right:  { style: 'thin', color: { argb: 'FFD0D0D0' } },
        };
      });
      row.height = 18;
    });

    // Freeze header row
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    const outputPath = path.join(__dirname, 'company_details.xlsx');
    await workbook.xlsx.writeFile(outputPath);

    console.log(`\n✅ Excel exported: ${outputPath}`);
    console.log(`   Total companies: ${records.length}`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

exportToExcel();
