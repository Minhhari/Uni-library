const express = require('express');
const { body } = require('express-validator');
const {
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  getUserById,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// ─── All routes require authentication ────────────────────────────────
router.use(protect);

// ─── Current User Routes ───────────────────────────────────────────────

/**
 * GET /api/users/profile
 * Lấy profile của user đang đăng nhập
 */
router.get('/profile', getProfile);

/**
 * PUT /api/users/profile
 * Cập nhật profile (name, phone, department, studentId, avatar)
 */
router.put(
  '/profile',
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
    body('phone')
      .optional()
      .trim(),
    body('department')
      .optional()
      .trim(),
    body('studentId')
      .optional()
      .trim(),
    body('avatar')
      .optional()
      .trim()
      .isURL().withMessage('Avatar must be a valid URL'),
  ],
  updateProfile
);

/**
 * PUT /api/users/change-password
 * Đổi mật khẩu
 * Body: { currentPassword, newPassword }
 */
router.put('/change-password', changePassword);

// ─── Admin / Librarian Routes ──────────────────────────────────────────

/**
 * GET /api/users
 * Lấy danh sách tất cả users (có filter, search, pagination)
 * Query: ?role=&page=&limit=&search=&isActive=
 */
router.get('/', authorize('admin', 'librarian'), getAllUsers);

/**
 * GET /api/users/:id
 * Lấy thông tin user theo ID
 */
router.get('/:id', authorize('admin', 'librarian'), getUserById);

/**
 * PUT /api/users/:id/role
 * Cập nhật role của user (Admin only)
 * Body: { role }
 */
router.put('/:id/role', authorize('admin'), updateUserRole);

/**
 * PUT /api/users/:id/status
 * Bật/tắt tài khoản user (Admin only)
 */
router.put('/:id/status', authorize('admin'), toggleUserStatus);

/**
 * DELETE /api/users/:id
 * Xóa user (Admin only)
 */
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;
