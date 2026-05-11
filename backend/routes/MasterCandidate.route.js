const express = require("express");
const {
  createCandidate,
  getAllCandidates,
  updateCandidate,
  deleteCandidate,
  importCandidates,
} = require("../controllers/MasterCandidate.Controller");
const { protect } = require("../middleware/Hr.data.middleware");
const {upload} = require("../middleware/gcsMulter"); // multer config

const router = express.Router();

router.post("/create", protect, upload.single('GstUpload'), createCandidate);
router.get("/all", protect, getAllCandidates);
router.put("/update/:id", protect, upload.single('GstUpload'), updateCandidate);
router.delete("/delete/:id", protect, deleteCandidate);
router.post("/import", protect, importCandidates);



module.exports = router;
