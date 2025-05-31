// // const Candidate = require("../models/candidateModal");

// // const addMultipleCandidates = async (req, res) => {
// //   try {
// //     const { candidates, jobId } = req.body;

// //     if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
// //       return res.status(400).json({ message: "No candidates provided" });
// //     }

// //     const candidatesWithJobId = candidates.map((c) => ({
// //       ...c,
// //       jobId,
// //     }));

// //     const savedCandidates = await Candidate.insertMany(candidatesWithJobId);

// //     res.status(201).json({ success: true, data: savedCandidates });
// //   } catch (error) {
// //     res.status(500).json({ success: false, message: "Failed to add candidates", error: error.message });
// //   }
// // };

// // module.exports = { addMultipleCandidates };


// const Candidate = require("../models/candidateModal");

// const addMultipleCandidates = async (req, res) => {
//   try {
//     const { jobId } = req.body;
//     const candidatesData = JSON.parse(req.body.candidates); // Parse from FormData string

//     const uploadedFiles = req.files || [];

//     if (!candidatesData || !Array.isArray(candidatesData) || candidatesData.length === 0) {
//       return res.status(400).json({ message: "No candidates provided" });
//     }

//     const candidatesWithFiles = candidatesData.map((candidate, index) => {
//       const file = uploadedFiles.find((f) => f.fieldname === `resume-${index}`);
      
//       return {
//         ...candidate,
//         jobId,
//         // Store only the relative file path
//         resumeLink: file ? `/uploads/resumes/${file.filename}` : "No Resume", // Store only relative path
//       };
//     });

//     const savedCandidates = await Candidate.insertMany(candidatesWithFiles);

//     res.status(201).json({ success: true, data: savedCandidates });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Failed to add candidates", error: error.message });
//   }
// };

// module.exports = { addMultipleCandidates };


// controllers/addCandidate.Controller.js


const Candidate = require("../models/candidateModal");
const { uploadToGCS } = require("../middleware/gcsMulter");

const addMultipleCandidates = async (req, res) => {
  try {
    const { jobId } = req.body;
    const candidatesData = JSON.parse(req.body.candidates);
    const uploadedFiles = req.files || [];

    if (!Array.isArray(candidatesData) || candidatesData.length === 0) {
      return res.status(400).json({ message: "No candidates provided" });
    }

    const candidatesWithFiles = await Promise.all(
      candidatesData.map(async (candidate, index) => {
        const file = uploadedFiles.find((f) => f.fieldname === `resume-${index}`);
        let resumeLink = "No Resume";

        if (file) {
          console.log(`✅ Found file for resume-${index}`);
          const cleanedOriginalName = file.originalname.replace(/\s+/g, "_");
          const uniqueName = `${Date.now()}-${cleanedOriginalName}`;
          try {
            resumeLink = await uploadToGCS(file.buffer, uniqueName, file.mimetype);
            console.log(`✅ Uploaded to GCS: ${resumeLink}`);
          } catch (err) {
            console.error(`❌ GCS upload failed: ${err.message}`);
          }
        } else {
          console.log(`❌ No file found for resume-${index}`);
        }

        return {
          ...candidate,
          jobId,
          resumeLink,
          createdBy: req.user._id, // ✅ Add this line
        };
      })
    );

    const savedCandidates = await Candidate.insertMany(candidatesWithFiles);
    res.status(201).json({ success: true, data: savedCandidates });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add candidates",
      error: error.message,
    });
  }
};

module.exports = { addMultipleCandidates };
