const express = require('express');
const Inventory = require('../models/Inventory');
const Customer = require('../models/Customer');
const { protect, restrictTo, applyStateFilter } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
router.use(protect);

// GET /api/inventory — All inventory records (state-filtered)
router.get('/', applyStateFilter, asyncHandler(async (req, res) => {
  const { lowStock, customerId } = req.query;

  // Get accessible customer IDs based on state
  let accessibleCustomerIds;
  if (Object.keys(req.stateFilter).length > 0) {
    const customers = await Customer.find({ ...req.stateFilter, status: 'active' }).select('_id');
    accessibleCustomerIds = customers.map((c) => c._id);
  }

  const filter = {};
  if (accessibleCustomerIds) filter.customer = { $in: accessibleCustomerIds };
  if (customerId) filter.customer = customerId;
  if (lowStock === 'true') filter.isBelowThreshold = true;

  const inventory = await Inventory.find(filter)
    .populate('customer', 'name address.state address.city')
    .populate('product', 'name group defaultThreshold')
    .populate('lastUpdatedBy', 'name')
    .sort({ isBelowThreshold: -1, updatedAt: -1 })
    .lean();

  res.json({ status: 'success', results: inventory.length, data: { inventory } });
}));

// GET /api/inventory/alerts — Low stock items only
router.get('/alerts', applyStateFilter, asyncHandler(async (req, res) => {
  let customerFilter = {};
  if (Object.keys(req.stateFilter).length > 0) {
    const customers = await Customer.find({ ...req.stateFilter, status: 'active' }).select('_id');
    customerFilter = { customer: { $in: customers.map((c) => c._id) } };
  }

  const alerts = await Inventory.find({ ...customerFilter, isBelowThreshold: true })
    .populate('customer', 'name address.state')
    .populate('product', 'name group')
    .sort({ currentStock: 1 });

  res.json({ status: 'success', results: alerts.length, data: { alerts } });
}));

// PATCH /api/inventory/:id — Update stock level
router.patch('/:id', asyncHandler(async (req, res) => {
  const { currentStock, threshold, notes } = req.body;
  const item = await Inventory.findById(req.params.id);
  if (!item) return res.status(404).json({ status: 'fail', message: 'Inventory record not found' });

  const previousStock = item.currentStock;

  if (currentStock !== undefined) item.currentStock = currentStock;
  if (threshold !== undefined) item.threshold = threshold;
  item.lastUpdatedBy = req.user._id;

  // Push to history
  item.history.push({
    previousStock,
    newStock: item.currentStock,
    changedBy: req.user._id,
    source: 'manual',
    notes,
  });

  await item.save();

  const updated = await Inventory.findById(item._id)
    .populate('customer', 'name')
    .populate('product', 'name group')
    .populate('lastUpdatedBy', 'name');

  res.json({ status: 'success', data: { inventory: updated } });
}));

// POST /api/inventory/:id/acknowledge-alert — Clear alert flag
router.post('/:id/acknowledge-alert', asyncHandler(async (req, res) => {
  const item = await Inventory.findByIdAndUpdate(req.params.id, {
    alertAcknowledged: true,
    alertAcknowledgedBy: req.user._id,
  }, { new: true });
  res.json({ status: 'success', data: { inventory: item } });
}));

module.exports = router;
