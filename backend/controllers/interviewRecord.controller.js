// // controller/hrDashboardController.js
// const JobOpenings = require('../models/jobopennings.modal');
// const ConvertedJob = require('../models/convertOpening.model');
// const Candidate = require('../models/candidateModal');
// const ConvertSourceData = require('../models/convertSourceData.model');
// const User = require('../models/User');

// const getHRCompanyCandidateReport = async (req, res) => {
//   try {
//     const allHRs = await User.find({ role: 'HR' });

//     const finalResult = [];

//     for (const hr of allHRs) {
//       const jobOpenings = await JobOpenings.find({ assignedHR: hr._id });
//       const convertedJobs = await ConvertedJob.find({ assignedHR: hr._id });

//       const hrData = {
//         hrId: hr._id,
//         hrName: `${hr.firstName} ${hr.lastName}`,
//         companies: [],
//       };

//       // For normal JobOpenings
//       for (const job of jobOpenings) {
//         const candidates = await Candidate.find({ jobId: job._id });

//         hrData.companies.push({
//           type: "JobOpening",
//           industries: job.industries,
//           companyName: job.companyName,
//           companyAddress: job.companyAddress,
//           jobLocation: job.jobLocation,
//           candidateCount: candidates.length,
//           candidates: candidates.map(c => ({
//             name: c.candidateName,
//             email: c.candidateEmail,
//             phone: c.candidatePhone,
//             qualification: c.qualification,
//             remark: c.remark,
//              resumeLink:c.resumeLink,
//             interviewDate:c.interviewDate,
//             lineupStatus: c.lineupStatus,
//             joiningDate: c.joiningDate,
//           })),
//         });
//       }

//       // For ConvertedJobs
//       for (const job of convertedJobs) {
//         const candidates = await ConvertSourceData.find({ jobId: job._id });

//         hrData.companies.push({
//           type: "ConvertedJob",
//           industries: job.industries,
//           companyName: job.companyName,
//           companyAddress: job.companyAddress,
//           jobLocation: job.jobLocation,
//           candidateCount: candidates.length,
//           candidates: candidates.map(c => ({
//             name: c.candidateName,
//             email: c.candidateEmail,
//             phone: c.candidatePhone,
//             qualification: c.qualification,
//             remark: c.remark,
//             resumeLink:c.resumeLink,
//             interviewDate:c.name,
//             lineupStatus: c.lineupStatus,
//             joiningDate: c.joiningDate,
//           })),
//         });
//       }

//       finalResult.push(hrData);
//     }

//     res.status(200).json(finalResult);
//   } catch (err) {
//     console.error("Error in fetching report:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };
// module.exports = { getHRCompanyCandidateReport };
// controller/hrDashboardController.js
const JobOpenings = require('../models/jobopennings.modal');
const Candidate = require('../models/candidateModal');
const User = require('../models/User');

const getHRCompanyCandidateReport = async (req, res) => {
  try {
    const allHRs = await User.find({ role: 'HR' });

    const finalResult = [];

    for (const hr of allHRs) {
      const jobOpenings = await JobOpenings.find({ assignedHR: hr._id });

      const hrData = {
        hrId: hr._id,
        hrName: `${hr.firstName} ${hr.lastName}`,
        companies: [],
      };

      for (const job of jobOpenings) {
        const candidates = await Candidate.find({ jobId: job._id });

        hrData.companies.push({
          type: "JobOpening",
          industries: job.industries,
          companyName: job.companyName,
                    jobTitle: job.jobTitle,

          companyAddress: job.companyAddress,
          jobLocation: job.jobLocation,
          candidateCount: candidates.length,
          candidates: candidates.map(c => ({
            name: c.candidateName,
            email: c.candidateEmail,
            phone: c.candidatePhone,
            qualification: c.qualification,
            remark: c.remark,
            resumeLink: c.resumeLink,
            interviewDate: c.interviewDate,
            lineupStatus: c.lineupStatus,
            joiningDate: c.joiningDate,
          })),
        });
      }

      finalResult.push(hrData);
    }

    res.status(200).json(finalResult);
  } catch (err) {
    console.error("Error in fetching report:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { getHRCompanyCandidateReport };
