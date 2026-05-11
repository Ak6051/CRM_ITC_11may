require('dotenv').config();
const AWS = require('aws-sdk');
const multer = require('multer');

// AWS S3 configuration
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID.trim(),
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY.trim(),
  region: process.env.AWS_REGION.trim(),
  signatureVersion: 'v4'
});

const bucketName = 'resumejobs';

// Multer config for memory storage
const multerStorage = multer.memoryStorage();
const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  }
});

// Upload file to S3
const uploadToS3 = async (fileBuffer, filename, mimetype) => {
  try {
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `${Date.now()}_${sanitizedFilename}`;

    const params = {
      Bucket: bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: mimetype,
    };

    const data = await s3.upload(params).promise();
    return data.Location; // return the uploaded file URL
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

module.exports = { upload, uploadToS3 };
