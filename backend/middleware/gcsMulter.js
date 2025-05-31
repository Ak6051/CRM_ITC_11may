
const multer = require("multer");
const { Storage } = require("@google-cloud/storage");

// ✅ Use ADC — no key file
const storage = new Storage(); // Automatically uses ADC

const bucket = storage.bucket("resumejobs");

// Multer memory storage to handle buffer
const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

// Upload function to GCS
const uploadToGCS = async (fileBuffer, filename, mimetype) => {
  const blob = bucket.file(filename);
  const stream = blob.createWriteStream({
    resumable: false,
    contentType: mimetype,
  });

  return new Promise((resolve, reject) => {
    stream.on("error", (err) => reject(err));
    stream.on("finish", () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
      resolve(publicUrl);
    });
    stream.end(fileBuffer);
  });
};

module.exports = { upload, uploadToGCS };
