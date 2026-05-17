
const Candidate = require("../models/candidateModal");
const { uploadToS3 } = require("../middleware/gcsMulter");

// const addMultipleCandidates = async (req, res) => {
//   try {
//     const { jobId } = req.body;
//     const candidatesData = JSON.parse(req.body.candidates);
//     const uploadedFiles = req.files || [];

//     if (!Array.isArray(candidatesData) || candidatesData.length === 0) {
//       return res.status(400).json({ message: "No candidates provided" });
//     }

//     const candidatesWithFiles = await Promise.all(
//       candidatesData.map(async (candidate, index) => {
//         const file = uploadedFiles.find((f) => f.fieldname === `resume-${index}`);
//         let resumeLink = "No Resume";

//         if (file) {
//           console.log(`✅ Found file for resume-${index}`);
//           const cleanedOriginalName = file.originalname.replace(/\s+/g, "_");
//           const uniqueName = `${Date.now()}-${cleanedOriginalName}`;
//           try {
//             resumeLink = await uploadToS3(file.buffer, uniqueName, file.mimetype);
//             console.log(`✅ Uploaded to S3: ${resumeLink}`);
//           } catch (err) {
//             console.error(`❌ S3 upload failed: ${err.message}`);
//           }
//         } else {
//           console.log(`❌ No file found for resume-${index}`);
//         }

//         return {
//           ...candidate,
//           jobId,
//           resumeLink,
//           createdBy: req.user._id, // ✅ Add this line
//         };
//       })
//     );

//     const savedCandidates = await Candidate.insertMany(candidatesWithFiles);
//     res.status(201).json({ success: true, data: savedCandidates });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to add candidates",
//       error: error.message,
//     });
//   }
// };


const addMultipleCandidates = async (req, res) => {
  try {
    const { jobId } = req.body;

    if (!req.body.candidates) {
      return res.status(400).json({
        success: false,
        message: "Candidates data is missing",
      });
    }

    const candidatesData = JSON.parse(req.body.candidates);
    const uploadedFiles = req.files || [];

    if (!Array.isArray(candidatesData) || candidatesData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No candidates provided",
      });
    }

    const candidatesWithFiles = await Promise.all(
      candidatesData.map(async (candidate, index) => {
        const file = uploadedFiles.find((f) => f.fieldname === `resume-${index}`);
        let resumeLink = "No Resume";

        if (file) {
          const cleanedOriginalName = file.originalname.replace(/\s+/g, "_");
          const uniqueName = `${Date.now()}-${cleanedOriginalName}`;
          try {
            resumeLink = await uploadToS3(file.buffer, uniqueName, file.mimetype);
          } catch (err) {
            console.error(`S3 upload failed: ${err.message}`);
          }
        }

        return {
          ...candidate,
          jobId,
          resumeLink,
          createdBy: req.user._id,
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


module.exports = {
  addMultipleCandidates,
};
