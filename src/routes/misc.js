const express = require('express');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect, restrictTo } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// ─── USERS ROUTER ──────────────────────────────────────
const userRouter = express.Router();
userRouter.use(protect, restrictTo('admin'));

// GET /api/users
userRouter.get('/', asyncHandler(async (req, res) => {
  const users = await User.find({ isActive: true })
    .sort({ role: 1, name: 1 })
    .lean();
  res.json({ status: 'success', results: users.length, data: { users } });
}));

// GET /api/users/:id
userRouter.get('/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ status: 'fail', message: 'User not found' });
  res.json({ status: 'success', data: { user } });
}));

// PATCH /api/users/:id — Update user details (admin only)
userRouter.patch('/:id', asyncHandler(async (req, res) => {
  // Email cannot be changed
  delete req.body.email;

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ status: 'fail', message: 'User not found' });

  // Apply allowed fields
  if (req.body.name)           user.name           = req.body.name;
  if (req.body.phone)          user.phone          = req.body.phone;
  if (req.body.role)           user.role           = req.body.role;
  if (req.body.assignedStates) user.assignedStates = req.body.assignedStates;
  if (req.body.isActive !== undefined) user.isActive = req.body.isActive;

  // Allow password update if provided (model pre-save will hash it)
  if (req.body.password && req.body.password.length >= 8) {
    user.password = req.body.password;
  }

  await user.save();
  res.json({ status: 'success', data: { user } });
}));

// PATCH /api/users/:id/states — Update state assignments
userRouter.patch('/:id/states', asyncHandler(async (req, res) => {
  const { assignedStates } = req.body;
  if (!Array.isArray(assignedStates)) {
    return res.status(422).json({ status: 'fail', message: 'assignedStates must be an array' });
  }
  const user = await User.findByIdAndUpdate(req.params.id, { assignedStates }, { new: true });
  if (!user) return res.status(404).json({ status: 'fail', message: 'User not found' });
  res.json({ status: 'success', data: { user } });
}));

// DELETE /api/users/:id — Soft deactivate
userRouter.delete('/:id', asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({ status: 'fail', message: 'Cannot deactivate your own account' });
  }
  await User.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ status: 'success', message: 'User deactivated' });
}));

// ─── NOTIFICATIONS ROUTER ─────────────────────────────
const notifRouter = express.Router();
notifRouter.use(protect);

// GET /api/notifications — User's own notifications
notifRouter.get('/', asyncHandler(async (req, res) => {
  const { unread } = req.query;
  const filter = { recipient: req.user._id };
  if (unread === 'true') filter.isRead = false;

  const [notifications, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).limit(50).lean(),
    Notification.countDocuments({ recipient: req.user._id, isRead: false }),
  ]);

  res.json({ status: 'success', unreadCount, data: { notifications } });
}));

// PATCH /api/notifications/:id/read
notifRouter.patch('/:id/read', asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true, readAt: new Date() }
  );
  res.json({ status: 'success' });
}));

// PATCH /api/notifications/mark-all-read
notifRouter.patch('/mark-all-read', asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  res.json({ status: 'success', message: 'All notifications marked as read' });
}));

// ─── DASHBOARD STATS ROUTER ───────────────────────────
const dashRouter = express.Router();
dashRouter.use(protect);

dashRouter.get('/stats', asyncHandler(async (req, res) => {
  const Customer = require('../models/Customer');
  const Interaction = require('../models/Interaction');
  const Inventory = require('../models/Inventory');

  const stateFilter = req.user.role === 'admin' ? {} : { 'address.state': { $in: req.user.assignedStates } };

  const [totalCustomers, pendingApprovals, activeLeads, lowStockCount, recentInteractions] = await Promise.all([
    Customer.countDocuments({ ...stateFilter, status: 'active' }),
    Customer.countDocuments({ status: 'pending' }),
    Customer.countDocuments({ ...stateFilter, status: 'active', competition: 'New Account' }),
    Inventory.countDocuments({ isBelowThreshold: true }),
    Interaction.find(req.user.role !== 'admin' ? { salesperson: req.user._id } : {})
      .populate('customer', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
  ]);

  res.json({
    status: 'success',
    data: {
      stats: { totalCustomers, pendingApprovals, activeLeads, lowStockCount },
      recentInteractions,
    },
  });
}));

module.exports = { userRouter, notifRouter, dashRouter };
