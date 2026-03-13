const { verifyToken } = require('../config/jwt');
const User = require('../models/User');

// ─────────────────────────────────────────────────────────────────────────
// protect: Xác thực JWT - phải đăng nhập mới vào được route
// ─────────────────────────────────────────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token invalid.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact admin.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please refresh your token.',
        code: 'TOKEN_EXPIRED',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Token invalid.',
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────
// authorize: Role-based access control
// Cách dùng: authorize('admin'), authorize('admin', 'librarian'), v.v.
// ─────────────────────────────────────────────────────────────────────────
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`,
      });
    }

    next();
  };
};

// ─────────────────────────────────────────────────────────────────────────
// optionalProtect: Attach user từ token nếu có, không bắt buộc
// Dùng cho các route public nhưng muốn biết user là ai
// ─────────────────────────────────────────────────────────────────────────
const optionalProtect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id);
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch (_) {
    // Token không hợp lệ -> bỏ qua, không báo lỗi
  }

  next();
};

module.exports = { protect, authorize, optionalProtect };
