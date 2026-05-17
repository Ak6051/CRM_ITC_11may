const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://Admin:admin@filter.u442m.mongodb.net/mern-App';

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const Candidate = mongoose.model('Candidate', new mongoose.Schema({}, { strict: false }));

    // Total candidates
    const totalCandidates = await Candidate.countDocuments();
    console.log(`📊 Total Candidates in DB: ${totalCandidates}\n`);

    // ── Experience = 0 ──────────────────────────────────────────────────────
    const expZero = await Candidate.countDocuments({ experience: 0 });
    const expNull = await Candidate.countDocuments({ experience: { $in: [null, undefined] } });
    const expMissing = await Candidate.countDocuments({ experience: { $exists: false } });
    const expString = await Candidate.countDocuments({ experience: { $type: 'string' } });
    const expStringZero = await Candidate.countDocuments({ experience: '0' });

    console.log('═══ EXPERIENCE BREAKDOWN ═══');
    console.log(`  experience = 0 (number)  : ${expZero}`);
    console.log(`  experience = "0" (string): ${expStringZero}`);
    console.log(`  experience = null        : ${expNull}`);
    console.log(`  experience field missing : ${expMissing}`);
    console.log(`  experience is string type: ${expString}`);
    console.log(`  experience > 0 (valid)   : ${totalCandidates - expZero - expNull - expMissing}`);
    console.log('');

    // ── Notice Period = 0 ───────────────────────────────────────────────────
    const npZero = await Candidate.countDocuments({ noticePeriod: 0 });
    const npNull = await Candidate.countDocuments({ noticePeriod: { $in: [null, undefined] } });
    const npMissing = await Candidate.countDocuments({ noticePeriod: { $exists: false } });
    const npString = await Candidate.countDocuments({ noticePeriod: { $type: 'string' } });
    const npStringZero = await Candidate.countDocuments({ noticePeriod: '0' });

    console.log('═══ NOTICE PERIOD BREAKDOWN ═══');
    console.log(`  noticePeriod = 0 (number)  : ${npZero}`);
    console.log(`  noticePeriod = "0" (string): ${npStringZero}`);
    console.log(`  noticePeriod = null        : ${npNull}`);
    console.log(`  noticePeriod field missing : ${npMissing}`);
    console.log(`  noticePeriod is string type: ${npString}`);
    console.log(`  noticePeriod > 0 (valid)   : ${totalCandidates - npZero - npNull - npMissing}`);
    console.log('');

    // ── Both zero ───────────────────────────────────────────────────────────
    const bothZero = await Candidate.countDocuments({ experience: 0, noticePeriod: 0 });
    console.log('═══ COMBINED ═══');
    console.log(`  Both experience=0 AND noticePeriod=0: ${bothZero}`);
    console.log('');

    // ── Sample of zero-experience candidates ────────────────────────────────
    console.log('═══ SAMPLE: 5 candidates with experience=0 ═══');
    const sampleExp = await Candidate.find({ experience: 0 }).limit(5).lean();
    sampleExp.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.candidateName || c.name || '—'}  |  exp: ${c.experience}  |  notice: ${c.noticePeriod}  |  ctc: ${c.currentCTC}  |  type(exp): ${typeof c.experience}`);
    });

    console.log('');
    console.log('═══ SAMPLE: 5 candidates with noticePeriod=0 ═══');
    const sampleNp = await Candidate.find({ noticePeriod: 0 }).limit(5).lean();
    sampleNp.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.candidateName || c.name || '—'}  |  exp: ${c.experience}  |  notice: ${c.noticePeriod}  |  type(notice): ${typeof c.noticePeriod}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Done');
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

run();
