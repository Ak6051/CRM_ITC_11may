// const nodemailer = require('nodemailer');
// const Otp = require('../models/otp');
// const User = require('../models/User');
// const crypto = require('crypto');
// const bcrypt = require('bcryptjs');

// const sendOtp = async (req, res) => {
//   const { email } = req.body;

//   const user = await User.findOne({ email });
//   if (!user) return res.status(404).json({ message: 'Email not found' });

//   const otp = Math.floor(100000 + Math.random() * 900000).toString();

//   // Save OTP
//   await Otp.create({ email, otp });

//   // Setup transporter
//   const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//       user: "sahil42740@gmail.com", // your Gmail
//       pass: "snut klyt zljw udwf", 
//     },
//   });

//   // Email options
//   const mailOptions = {
//     from: "sahil42740@gmail.com",
//     to: email,
//     subject: 'Password Reset OTP',
//     html: `<p>Your OTP is: <strong>${otp}</strong>. It is valid for 5 minutes.</p>`,
//   };

//   // Send mail
//   transporter.sendMail(mailOptions, (error, info) => {
//     if (error) return res.status(500).json({ message: 'Error sending email' });
//     return res.status(200).json({ message: 'OTP sent successfully' });
//   });
// };


// const verifyOtpAndReset = async (req, res) => {
//   const { email, otp, newPassword } = req.body;

//   const validOtp = await Otp.findOne({ email, otp });
//   if (!validOtp) return res.status(400).json({ message: 'Invalid or expired OTP' });

//   const salt = await bcrypt.genSalt(10);
//   const hashed = await bcrypt.hash(newPassword, salt);

//   await User.findOneAndUpdate({ email }, { password: hashed });

//   // Remove used OTP
//   await Otp.deleteMany({ email });

//   return res.status(200).json({ message: 'Password reset successful' });
// };

// module.exports = { sendOtp, verifyOtpAndReset };

const nodemailer = require('nodemailer');
const Otp = require('../models/otp');
const User = require('../models/User');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const sendOtp = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'Email not found' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Save OTP
  await Otp.create({ email, otp });

  // Setup transporter with environment variables
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USERNAME || 'italentconnect1@gmail.com',
      pass: process.env.EMAIL_PASSWORD || 'mqurdpspxmuowrwi'
    }
  });

  // Email options
  const mailOptions = {
    from: process.env.EMAIL_USERNAME || 'italentconnect1@gmail.com',
    to: email,
    subject: 'Password Reset OTP - iTalentConnect',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>You have requested to reset your password. Please use the following OTP to proceed:</p>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; margin: 20px 0;">
          <h1 style="margin: 0; color: #1976d2;">${otp}</h1>
        </div>
        <p>This OTP is valid for 5 minutes.</p>
        <p>If you didn't request this, please ignore this email or contact support.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          This is an automated message, please do not reply directly to this email.
        </p>
      </div>
    `,
  };

  // Send mail with better error handling
  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
    return res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ 
      message: 'Error sending email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


const verifyOtpAndReset = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const validOtp = await Otp.findOne({ email, otp });
  if (!validOtp) return res.status(400).json({ message: 'Invalid or expired OTP' });

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(newPassword, salt);

  await User.findOneAndUpdate({ email }, { password: hashed });

  // Remove used OTP
  await Otp.deleteMany({ email });

  return res.status(200).json({ message: 'Password reset successful' });
};

module.exports = { sendOtp, verifyOtpAndReset };

