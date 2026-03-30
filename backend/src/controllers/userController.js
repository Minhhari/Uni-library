const { validationResult } = require('express-validator');
const User = require('../models/User');

// ───────────────────────────────────────────────────────────────────────
// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
// ───────────────────────────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }

    return res.status(200).json({
      success: true,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
};

// ───────────────────────────────────────────────────────────────────────
// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
// ───────────────────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array(),
      });
    }

    const { name, phone, department, studentId, avatar } = req.body;

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (phone !== undefined) updateFields.phone = phone;
    if (department !== undefined) updateFields.department = department;
    if (studentId !== undefined) updateFields.studentId = studentId;
    if (avatar !== undefined) updateFields.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Cập nhật hồ sơ thành công.',
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
};

// ───────────────────────────────────────────────────────────────────────
// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
// ───────────────────────────────────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
    }

    const user = await User.findById(req.user._id).select('+password');

    if (user.isGoogleAccount && !user.password) {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản Google không thể đổi mật khẩu tại đây. Vui lòng đặt mật khẩu qua tính năng quên mật khẩu.',
      });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Mật khẩu hiện tại không chính xác.' });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công.' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
};

// ───────────────────────────────────────────────────────────────────────
// @desc    Get all users (Admin / Librarian)
// @route   GET /api/users
// @access  Private/Admin/Librarian
// ───────────────────────────────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 10, search, isActive } = req.query;

    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      users: users.map((u) => u.toPublicJSON()),
    });
  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
};

// ───────────────────────────────────────────────────────────────────────
// @desc    Get user by ID (Admin)
// @route   GET /api/users/:id
// @access  Private/Admin
// ───────────────────────────────────────────────────────────────────────
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.status(200).json({ success: true, user: user.toPublicJSON() });
  } catch (error) {
    console.error('Get user by ID error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
};

// ───────────────────────────────────────────────────────────────────────
// @desc    Update user role (Admin only)
// @route   PUT /api/users/:id/role
// @access  Private/Admin
// ───────────────────────────────────────────────────────────────────────
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const allowedRoles = ['admin', 'librarian', 'lecturer', 'student'];

    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Vai trò không hợp lệ.' });
    }

    // Không cho tự đổi role của chính mình
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Không thể tự thay đổi vai trò của chính mình.' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { role } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      message: `Quyền hạn người dùng đã được cập nhật thành ${role}.`,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('Update user role error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
};

// ───────────────────────────────────────────────────────────────────────
// @desc    Toggle user active status (Admin)
// @route   PUT /api/users/:id/status
// @access  Private/Admin
// ───────────────────────────────────────────────────────────────────────
const toggleUserStatus = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Không thể vô hiệu hóa tài khoản của chính mình.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: `Người dùng đã được ${user.isActive ? 'kích hoạt' : 'vô hiệu hóa'} thành công.`,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
};

// ───────────────────────────────────────────────────────────────────────
// @desc    Create a librarian (Admin only)
// @route   POST /api/users/librarian
// @access  Private/Admin
// ───────────────────────────────────────────────────────────────────────
const createLibrarian = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array(),
      });
    }

    const { name, email, password, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email này đã được đăng ký.' });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: 'librarian',
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo tài khoản thủ thư thành công.',
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('Create librarian error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ───────────────────────────────────────────────────────────────────────
// @desc    Edit user by ID (Admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
// ───────────────────────────────────────────────────────────────────────
const editUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array(),
      });
    }

    const { name, phone, department, studentId, role, isActive } = req.body;

    // Filter update fields
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (phone !== undefined) updateFields.phone = phone;
    if (department !== undefined) updateFields.department = department;
    if (studentId !== undefined) updateFields.studentId = studentId;
    if (role !== undefined) updateFields.role = role;
    if (isActive !== undefined) updateFields.isActive = isActive;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Cập nhật người dùng thành công.',
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('Edit user error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Không thể xóa tài khoản của chính mình.' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({ success: true, message: 'Xóa người dùng thành công.' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ───────────────────────────────────────────────────────────────────────
// @desc    Accept terms and policies
// @route   PUT /api/users/accept-terms
// @access  Private
// ───────────────────────────────────────────────────────────────────────
const acceptTerms = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { hasAcceptedTerms: true } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Đã chấp nhận điều khoản và chính sách.',
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('Accept terms error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  getUserById,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  createLibrarian,
  editUser,
  acceptTerms,
};
