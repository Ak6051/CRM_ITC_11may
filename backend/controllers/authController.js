const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendOtpEmail = require('../utils/sendOtpEmail');
const { generateAccessToken } = require('../middleware/authMiddleware');
const LoginAuditLog = require('../models/LoginAuditLog.model');
const { extractClientIp } = require('../middleware/ipWhitelistMiddleware');

// Register User
const registerUser = async (req, res) => {
  const { firstName, lastName, email, password, mobileNo, role, address, gender } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // role me Sales ya HR ko allow karte hue
    user = new User({
      firstName,
      lastName,
      email,
      password,
      mobileNo,
      role,
      address,
      gender,
    });

    await user.save();
    res.status(201).json({ msg: 'User registered successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};


// Login User
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check for user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Block deactivated accounts
    if (user.isActive === false) {
      return res.status(403).json({ msg: 'Your account has been deactivated. Please contact the administrator.' });
    }

    // Match password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Create and send token
    const token = generateAccessToken(user);

    res.json({ token, role: user.role });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

const preLogin = async (req, res) => {
  const { email, password, deviceId } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

  // Block deactivated accounts
  if (user.isActive === false) {
    return res.status(403).json({ msg: 'Your account has been deactivated. Please contact the administrator.' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    // Requirement 3.3 — write failed audit log for HR and Sales roles only
    // (admin and teamleader bypass OTP so they are not logged here)
    if (user.role === 'HR' || user.role === 'Sales') {
      try {
        LoginAuditLog.create({
          status: 'failed',
          email,
          ip: extractClientIp(req),
          deviceInfo: req.headers['user-agent'] || '',
          userId: user._id,
          role: user.role,
        }).catch((err) => console.error('[preLogin] Audit log write failed:', err));
      } catch (err) {
        console.error('[preLogin] Audit log write failed:', err);
      }
    }
    return res.status(400).json({ msg: 'Invalid credentials' });
  }

  // Admin → Direct login
  if (user.role === 'admin' || user.role === 'teamleader') {
    const token = generateAccessToken(user);
    return res.json({ token, role: user.role, otpRequired: false, userId: user._id });
  }

  // HR & Sales → Always send OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP
  user.otp = otp;
  user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
  await user.save();

  const fullName = `${user.firstName} ${user.lastName}`;
  const fixedEmail = process.env.OTP_RECEIVER_EMAIL || 'italentconnect1@gmail.com';

  const emailSent = await sendOtpEmail(fixedEmail, otp, fullName, user.role);
  if (!emailSent) {
    return res.status(500).json({ msg: 'Failed to send OTP email' });
  }

  return res.json({ msg: 'OTP sent', otpRequired: true });
};

const verifyOtpAndLogin = async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });
  if (!user || user.otp !== otp || user.otpExpiresAt < new Date()) {
    // Requirement 3.3 — write failed audit log for invalid/expired OTP
    try {
      const ip = extractClientIp(req);
      const deviceInfo = req.headers['user-agent'] || '';
      LoginAuditLog.create({
        status: 'failed',
        email,
        ip,
        deviceInfo,
        userId: user ? user._id : null,
        role: user ? user.role : 'HR',
      }).catch((err) => console.error('[verifyOtpAndLogin] Audit log write failed:', err));
    } catch (err) {
      console.error('[verifyOtpAndLogin] Audit log write failed:', err);
    }
    return res.status(400).json({ msg: 'Invalid or expired OTP' });
  }

  user.otp = null;
  user.otpExpiresAt = null;
  await user.save();

  const token = generateAccessToken(user);

  // Requirement 3.1 — write success audit log after JWT is issued
  try {
    const ip = extractClientIp(req);
    const deviceInfo = req.headers['user-agent'] || '';
    LoginAuditLog.create({
      status: 'success',
      email,
      ip,
      deviceInfo,
      userId: user._id,
      role: user.role,
    }).catch((err) => console.error('[verifyOtpAndLogin] Audit log write failed:', err));
  } catch (err) {
    console.error('[verifyOtpAndLogin] Audit log write failed:', err);
  }

  res.json({ token, role: user.role, userId: user._id });
};




const logoutUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(200).json({ msg: 'Logged out' });
    }

    const token = authHeader.split(' ')[1];
    const jwt = require('jsonwebtoken');

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(200).json({ msg: 'Logged out' });
    }

    const userId = decoded._id || decoded.userId;
    const logoutTime = new Date();

    // Update the most recent 'success' entry for this user with logoutAt timestamp
    try {
      await LoginAuditLog.findOneAndUpdate(
        { userId, status: 'success', logoutAt: null },
        { logoutAt: logoutTime },
        { sort: { createdAt: -1 } }
      );
    } catch (err) {
      console.error('[logoutUser] Failed to update logoutAt:', err);
    }

    return res.status(200).json({ msg: 'Logged out' });
  } catch (err) {
    console.error('[logoutUser] Error:', err);
    return res.status(200).json({ msg: 'Logged out' });
  }
};

module.exports = { registerUser, loginUser, preLogin, verifyOtpAndLogin, logoutUser };

