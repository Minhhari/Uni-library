const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  googleLogin,
  refreshToken,
  logout,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// ─── Validators ────────────────────────────────────────────────────────
const registerValidators = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('email')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*]/).withMessage('Password must contain at least one special character'),
  body('role')
    .optional()
    .isIn(['student', 'lecturer']).withMessage('Role must be student or lecturer'),
];

const loginValidators = [
  body('email')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

// ─── Public Routes ─────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Đăng ký tài khoản (không cần email verify)
 */
router.post('/register', registerValidators, register);

/**
 * POST /api/auth/login
 * Đăng nhập cơ bản qua email + password
 */
router.post('/login', loginValidators, login);

/**
 * POST /api/auth/google
 * Google OAuth login/register
 * Body: { access_token } hoặc { credential }
 */
router.post('/google', googleLogin);

/**
 * POST /api/auth/refresh
 * Làm mới access token
 * Body: { refreshToken }
 */
router.post('/refresh', refreshToken);

// ─── Protected Routes ──────────────────────────────────────────────────

/**
 * GET /api/auth/me
 * Lấy thông tin user hiện tại từ token
 */
router.get('/me', protect, getMe);

/**
 * POST /api/auth/logout
 * Đăng xuất (xóa refresh token)
 */
router.post('/logout', protect, logout);

module.exports = router;
