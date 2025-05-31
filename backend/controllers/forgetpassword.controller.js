const nodemailer = require('nodemailer');
const Otp = require('../models/otp');
const User = require('../models/User');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const sendOtp = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'Email not found' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Save OTP
  await Otp.create({ email, otp });

  // Setup transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: "sahil42740@gmail.com", // your Gmail
      pass: "snut klyt zljw udwf", 
    },
  });

  // Email options
  const mailOptions = {
    from: "sahil42740@gmail.com",
    to: email,
    subject: 'Password Reset OTP',
    html: `<p>Your OTP is: <strong>${otp}</strong>. It is valid for 5 minutes.</p>`,
  };

  // Send mail
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) return res.status(500).json({ message: 'Error sending email' });
    return res.status(200).json({ message: 'OTP sent successfully' });
  });
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

