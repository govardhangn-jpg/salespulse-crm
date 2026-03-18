const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, restrictTo } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// ─── Helper: sign JWT ──────────────────────────────────
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        assignedStates: user.assignedStates,
        initials: user.initials,
      },
    },
  });
};

// ─── POST /api/auth/register ───────────────────────────
// Admin only: create new users
router.post(
  '/register',
  protect,
  restrictTo('admin'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').optional().isIn(['admin', 'sales_rep']),
    body('assignedStates').optional().isArray(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ status: 'fail', errors: errors.array() });
    }

    const { name, email, password, role, assignedStates, phone } = req.body;

    const user = await User.create({ name, email, password, role, assignedStates, phone });
    sendTokenResponse(user, 201, res);
  })
);

// ─── POST /api/auth/login ──────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ status: 'fail', errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email, isActive: true }).select('+password');

    if (!user || !(await user.correctPassword(password))) {
      return res.status(401).json({ status: 'fail', message: 'Incorrect email or password' });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
  })
);

// ─── GET /api/auth/me ──────────────────────────────────
router.get('/me', protect, asyncHandler(async (req, res) => {
  res.json({
    status: 'success',
    data: { user: req.user },
  });
}));

// ─── PATCH /api/auth/change-password ──────────────────
router.patch(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }),
  ],
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.correctPassword(req.body.currentPassword))) {
      return res.status(401).json({ status: 'fail', message: 'Current password is incorrect' });
    }
    user.password = req.body.newPassword;
    await user.save();
    sendTokenResponse(user, 200, res);
  })
);

module.exports = router;
