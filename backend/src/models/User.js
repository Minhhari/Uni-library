const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'librarian', 'lecturer', 'student'],
      default: 'student',
    },
    avatar: {
      type: String,
      default: null,
    },

    // ─── Google OAuth ───────────────────────────────────────────
    googleId: {
      type: String,
      default: null,
    },
    isGoogleAccount: {
      type: Boolean,
      default: false,
    },

    // ─── Profile fields ─────────────────────────────────────────
    phone: {
      type: String,
      default: null,
    },
    department: {
      type: String,
      default: null,
    },
    studentId: {
      type: String,
      default: null,
    },

    // ─── Account status ─────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
    },

    // ─── Refresh token ───────────────────────────────────────────
    refreshToken: {
      type: String,
      select: false,
      default: null,
    },

    // ─── Last login tracking ─────────────────────────────────────
    lastLogin: {
      type: Date,
      default: null,
    },

    // ─── Account Lockout ──────────────────────────────────────────
    loginAttempts: {
      type: Number,
      required: true,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    hasAcceptedTerms: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Pre-save: hash password ────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Instance methods ───────────────────────────────────────────

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Return user object without sensitive fields
 */
userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.googleId;
  delete obj.refreshToken;
  delete obj.__v;
  // Ensure hasAcceptedTerms is included if it exists, otherwise keep default
  if (obj.hasAcceptedTerms === undefined) obj.hasAcceptedTerms = false;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
