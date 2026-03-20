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
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
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
        message: 'Validation failed',
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
      message: 'Profile updated successfully.',
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
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
      return res.status(400).json({ success: false, message: 'Current and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(req.user._id).select('+password');

    if (user.isGoogleAccount && !user.password) {
      return res.status(400).json({
        success: false,
        message: 'Google accounts cannot change password here. Please set a password first via forgot password.',
      });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
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
    return res.status(500).json({ success: false, message: 'Server error.' });
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
    return res.status(500).json({ success: false, message: 'Server error.' });
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
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }

    // Không cho tự đổi role của chính mình
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot update your own role.' });
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
      message: `User role updated to ${role}.`,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('Update user role error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
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
      return res.status(400).json({ success: false, message: 'Cannot deactivate your own account.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully.`,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
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
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { name, email, password, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
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
      message: 'Librarian created successfully.',
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
        message: 'Validation failed',
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
      message: 'User updated successfully.',
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
      return res.status(400).json({ success: false, message: 'Cannot delete your own account.' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Delete user error:', error);
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
};
