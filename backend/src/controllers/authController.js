const { validationResult } = require('express-validator');
const User = require('../models/User');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../config/jwt');

// ───────────────────────────────────────────────────────────────────────
// Helper: gửi access + refresh token về client
// ───────────────────────────────────────────────────────────────────────
const sendTokenResponse = async (user, statusCode, res, message) => {
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  // Lưu refresh token vào DB và reset login attempts
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  await user.save({ validateBeforeSave: false });

  return res.status(statusCode).json({
    success: true,
    message,
    accessToken,
    refreshToken,
    user: user.toPublicJSON(),
  });
};

// ───────────────────────────────────────────────────────────────────────
// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
// ───────────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { name, email, password, role } = req.body;

    // kiểm tra email tồn tại
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered.',
      });
    }

    // chỉ cho phép student / lecturer tự đăng ký
    const allowedRoles = ['student', 'lecturer'];
    const assignedRole = allowedRoles.includes(role) ? role : 'student';

    const user = new User({
      name,
      email,
      password,
      role: assignedRole,
    });

    await user.save();

    // KHÔNG login sau khi register
    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please login to continue.',
      user: user.toPublicJSON(),
    });

  } catch (error) {
    console.error('Register error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error during registration.',
    });
  }
};

// ───────────────────────────────────────────────────────────────────────
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
// ───────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Google-only account check
    if (user.isGoogleAccount && !user.password) {
      return res.status(401).json({
        success: false,
        message: 'This account uses Google login. Please sign in with Google.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact admin.',
      });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / (1000 * 60));
      return res.status(423).json({
        success: false,
        message: `Account is temporarily locked. Please try again in ${remainingMinutes} minutes.`,
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      // Increment login attempts
      user.loginAttempts += 1;

      const MAX_ATTEMPTS = 5;
      if (user.loginAttempts >= MAX_ATTEMPTS) {
        // Lock for 1 hour
        user.lockUntil = Date.now() + 60 * 60 * 1000;
        await user.save({ validateBeforeSave: false });
        return res.status(423).json({
          success: false,
          message: 'Too many failed attempts. Account locked for 1 hour.',
        });
      }

      await user.save({ validateBeforeSave: false });

      return res.status(401).json({
        success: false,
        message: `Invalid email or password. Attempt ${user.loginAttempts}/${MAX_ATTEMPTS}`,
      });
    }

    return await sendTokenResponse(user, 200, res, 'Login successful.');
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// ───────────────────────────────────────────────────────────────────────
// @desc    Google OAuth login / register
// @route   POST /api/auth/google
// @access  Public
// ───────────────────────────────────────────────────────────────────────
const googleLogin = async (req, res) => {
  try {
    const { access_token, credential } = req.body;

    let googleId, email, name, picture;

    if (access_token) {
      // Dùng native fetch (Node 18+)
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch userinfo');
      const data = await response.json();
      ({ sub: googleId, email, name, picture } = data);
    } else if (credential) {
      const { OAuth2Client } = require('google-auth-library');
      const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      ({ sub: googleId, email, name, picture } = payload);
    } else {
      return res.status(400).json({
        success: false,
        message: 'access_token or credential is required.',
      });
    }

    if (!email) {
      return res.status(400).json({ success: false, message: 'Could not retrieve email from Google.' });
    }

    let user = await User.findOne({ email });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        user.isGoogleAccount = true;
        if (!user.avatar) user.avatar = picture;
        await user.save({ validateBeforeSave: false });
      }
    } else {
      user = await User.create({
        name,
        email,
        googleId,
        avatar: picture,
        isGoogleAccount: true,
        role: 'student',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact admin.',
      });
    }

    return await sendTokenResponse(user, 200, res, 'Google login successful.');
  } catch (error) {
    console.error('Google login error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Google authentication failed. Invalid token.',
    });
  }
};

// ───────────────────────────────────────────────────────────────────────
// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
// ───────────────────────────────────────────────────────────────────────
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Refresh token required.' });
    }

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated.' });
    }

    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Refresh token invalid or expired.' });
  }
};

// ───────────────────────────────────────────────────────────────────────
// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
// ───────────────────────────────────────────────────────────────────────
const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    return res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ───────────────────────────────────────────────────────────────────────
// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
// ───────────────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user.toPublicJSON(),
  });
};

module.exports = {
  register,
  login,
  googleLogin,
  refreshToken,
  logout,
  getMe,
};
