const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const Customer = require('../models/Customer');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { protect, restrictTo, applyStateFilter } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
router.use(protect); // All customer routes require authentication

// ─── Helper: create admin notifications ───────────────
const notifyAdmins = async (type, title, message, refId) => {
  const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
  const notifications = admins.map((admin) => ({
    recipient: admin._id,
    type,
    title,
    message,
    refModel: 'Customer',
    refId,
  }));
  if (notifications.length) await Notification.insertMany(notifications);
};

// ═══════════════════════════════════════════════════════
// GET /api/customers
// State-based filtering: sales reps only see their states
// ═══════════════════════════════════════════════════════
router.get(
  '/',
  applyStateFilter,
  asyncHandler(async (req, res) => {
    const { search, segment, status, competition, state, page = 1, limit = 50 } = req.query;

    // Build filter — always merge with state filter
    const filter = { ...req.stateFilter };

    // Additional filters
    if (status) filter.status = status;
    if (competition) filter.competition = competition;
    if (state && req.user.role === 'admin') filter['address.state'] = state;
    if (segment) {
      const [category, value] = segment.split(':');
      if (value) { filter['segment.category'] = category; filter['segment.value'] = value; }
      else filter['segment.value'] = category;
    }

    // Sales reps only see their own customers (assigned to them or submitted by them)
    // Admins see all customers across all states
    if (req.user.role !== 'admin') {
      filter.$or = [
        { status: 'active',   assignedTo: req.user._id },
        { status: 'active',   submittedBy: req.user._id },
        { status: 'pending',  submittedBy: req.user._id },
      ];
    }

    // Text search
    if (search) filter.$text = { $search: search };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [customers, total] = await Promise.all([
      Customer.find(filter)
        .populate('submittedBy', 'name email')
        .populate('approvedBy', 'name')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Customer.countDocuments(filter),
    ]);

    res.json({
      status: 'success',
      results: customers.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: { customers },
    });
  })
);

// ═══════════════════════════════════════════════════════
// POST /api/customers  — Submit new customer (pending)
// ═══════════════════════════════════════════════════════
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Company name is required'),
    body('segment.category').notEmpty().withMessage('Segment category is required'),
    body('segment.value').notEmpty().withMessage('Segment value is required'),
    body('competition').isIn(['New Account', 'Existing Account', 'Competitor Account']).withMessage('Invalid competition type'),
    body('address.state').notEmpty().withMessage('State is required'),
    body('address.pinCode').matches(/^\d{6}$/).withMessage('PIN code must be 6 digits'),
    body('contacts').optional().isArray({ max: 10 }).withMessage('Max 10 contacts'),
    body('productInterests').optional().isArray({ max: 10 }).withMessage('Max 10 products'),
    body('competitors').optional().isArray({ max: 5 }).withMessage('Max 5 competitors'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ status: 'fail', errors: errors.array() });
    }

    const isAdmin = req.user.role === 'admin';

    const customerData = {
      ...req.body,
      submittedBy: req.user._id,
      assignedTo: req.user._id,
      // Admin -> instantly active; all others -> pending review
      status: isAdmin ? 'active' : 'pending',
      isPending: !isAdmin,
      ...(isAdmin && {
        approvedBy: req.user._id,
        approvedAt: new Date(),
      }),
    };

    const customer = await Customer.create(customerData);

    if (isAdmin) {
      return res.status(201).json({
        status: 'success',
        message: 'Customer added successfully.',
        data: { customer },
      });
    }

    // Non-admin: notify admins for review
    await notifyAdmins(
      'approval_needed',
      `New customer pending approval: ${customer.name}`,
      `${req.user.name} submitted a new customer registration for ${customer.name} (${customer.address.state}).`,
      customer._id
    );

    res.status(201).json({
      status: 'success',
      message: 'Customer submitted for review. An Admin will approve it shortly.',
      data: { customer },
    });
  })
);

// ═══════════════════════════════════════════════════════
// GET /api/customers/:id
// ═══════════════════════════════════════════════════════
router.get(
  '/:id',
  applyStateFilter,
  asyncHandler(async (req, res) => {
    const filter = { _id: req.params.id, ...req.stateFilter };
    if (req.user.role !== 'admin') {
      filter.$or = [
        { status: 'active',  assignedTo: req.user._id },
        { status: 'active',  submittedBy: req.user._id },
        { status: 'pending', submittedBy: req.user._id },
      ];
    }

    const customer = await Customer.findOne(filter)
      .populate('submittedBy', 'name email')
      .populate('approvedBy', 'name')
      .populate('assignedTo', 'name email assignedStates')
      .populate('productInterests.productId', 'name group');

    if (!customer) {
      return res.status(404).json({ status: 'fail', message: 'Customer not found or access denied' });
    }

    res.json({ status: 'success', data: { customer } });
  })
);

// ═══════════════════════════════════════════════════════
// PATCH /api/customers/:id  — Update customer
// ═══════════════════════════════════════════════════════
router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ status: 'fail', message: 'Customer not found' });

    // Sales reps can only edit their own pending customers
    if (req.user.role !== 'admin') {
      if (!customer.submittedBy.equals(req.user._id) || customer.status !== 'pending') {
        return res.status(403).json({ status: 'fail', message: 'Cannot edit this customer' });
      }
    }

    // Prevent overriding approval fields
    const forbidden = ['isPending', 'status', 'approvedBy', 'approvedAt', 'submittedBy'];
    forbidden.forEach((f) => delete req.body[f]);

    const updated = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('submittedBy assignedTo', 'name email');

    res.json({ status: 'success', data: { customer: updated } });
  })
);

// ═══════════════════════════════════════════════════════
// POST /api/customers/:id/approve  — Admin only
// ═══════════════════════════════════════════════════════
router.post(
  '/:id/approve',
  restrictTo('admin'),
  asyncHandler(async (req, res) => {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ status: 'fail', message: 'Customer not found' });
    if (customer.status !== 'pending') {
      return res.status(400).json({ status: 'fail', message: 'Customer is not in pending state' });
    }

    customer.status = 'active';
    customer.isPending = false;
    customer.approvedBy = req.user._id;
    customer.approvedAt = Date.now();
    await customer.save();

    // Notify submitter
    await Notification.create({
      recipient: customer.submittedBy,
      type: 'approved',
      title: `Customer approved: ${customer.name}`,
      message: `Your customer registration for ${customer.name} has been approved by ${req.user.name}.`,
      refModel: 'Customer',
      refId: customer._id,
    });

    res.json({ status: 'success', message: 'Customer approved', data: { customer } });
  })
);

// ═══════════════════════════════════════════════════════
// POST /api/customers/:id/reject  — Admin only
// ═══════════════════════════════════════════════════════
router.post(
  '/:id/reject',
  restrictTo('admin'),
  asyncHandler(async (req, res) => {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ status: 'fail', message: 'Customer not found' });

    customer.status = 'rejected';
    customer.rejectionReason = req.body.reason || 'No reason provided';
    await customer.save();

    await Notification.create({
      recipient: customer.submittedBy,
      type: 'rejected',
      title: `Customer rejected: ${customer.name}`,
      message: `${customer.name} was rejected. Reason: ${customer.rejectionReason}`,
      refModel: 'Customer',
      refId: customer._id,
    });

    res.json({ status: 'success', message: 'Customer rejected', data: { customer } });
  })
);

// ═══════════════════════════════════════════════════════
// DELETE /api/customers/:id  — Admin only (soft delete)
// ═══════════════════════════════════════════════════════
router.delete(
  '/:id',
  restrictTo('admin'),
  asyncHandler(async (req, res) => {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true, deletedBy: req.user._id, deletedAt: new Date() },
      { new: true }
    );
    if (!customer) return res.status(404).json({ status: 'fail', message: 'Customer not found' });

    res.json({ status: 'success', message: 'Customer deleted successfully' });
  })
);

// ═══════════════════════════════════════════════════════
// GET /api/customers/pending/list  — Admin only
// ═══════════════════════════════════════════════════════
router.get(
  '/pending/list',
  restrictTo('admin'),
  asyncHandler(async (req, res) => {
    const customers = await Customer.find({ status: 'pending' })
      .populate('submittedBy', 'name email')
      .sort({ createdAt: 1 })
      .lean();

    res.json({ status: 'success', results: customers.length, data: { customers } });
  })
);

module.exports = router;
