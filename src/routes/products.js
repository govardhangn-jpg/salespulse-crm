// ─── products.js ─────────────────────────────────────
const express = require('express');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { protect, restrictTo } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const productRouter = express.Router();
productRouter.use(protect);

// GET /api/products?group=Consumables
productRouter.get('/', asyncHandler(async (req, res) => {
  const { group } = req.query;
  const filter = { isActive: true };

  // Sales reps don't see pending products (except their own)
  if (req.user.role !== 'admin') {
    filter.$or = [
      { isPending: false },
      { isPending: true, submittedBy: req.user._id },
    ];
  }
  if (group) filter.group = group;

  const products = await Product.find(filter)
    .populate('submittedBy', 'name')
    .sort({ group: 1, name: 1 })
    .lean();

  res.json({ status: 'success', results: products.length, data: { products } });
}));

// GET /api/products/pending — Admin only
productRouter.get('/pending', restrictTo('admin'), asyncHandler(async (req, res) => {
  const products = await Product.find({ isPending: true, isActive: true })
    .populate('submittedBy', 'name email')
    .sort({ createdAt: 1 });
  res.json({ status: 'success', results: products.length, data: { products } });
}));

// POST /api/products — Create or submit new product
productRouter.post('/', asyncHandler(async (req, res) => {
  const { name, group, description, sku } = req.body;
  if (!name) return res.status(422).json({ status: 'fail', message: 'Product name is required' });

  const isPending = !group; // No group = pending for admin to categorize
  const product = await Product.create({
    name, group, description, sku,
    isPending,
    submittedBy: req.user._id,
    isActive: true,
  });

  if (isPending) {
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
    await Notification.insertMany(admins.map((a) => ({
      recipient: a._id,
      type: 'approval_needed',
      title: `New product needs categorization: ${name}`,
      message: `${req.user.name} submitted a new product "${name}" that needs to be assigned a group.`,
      refModel: 'Product',
      refId: product._id,
    })));
  }

  res.status(201).json({ status: 'success', data: { product } });
}));

// POST /api/products/:id/approve — Admin: approve & assign group
productRouter.post('/:id/approve', restrictTo('admin'), asyncHandler(async (req, res) => {
  const { group } = req.body;
  if (!group) return res.status(422).json({ status: 'fail', message: 'Group is required for approval' });

  const product = await Product.findByIdAndUpdate(req.params.id, {
    group,
    isPending: false,
    approvedBy: req.user._id,
    approvedAt: new Date(),
  }, { new: true });

  if (!product) return res.status(404).json({ status: 'fail', message: 'Product not found' });

  await Notification.create({
    recipient: product.submittedBy,
    type: 'approved',
    title: `Product approved: ${product.name}`,
    message: `"${product.name}" has been approved and added to ${group}.`,
    refModel: 'Product',
    refId: product._id,
  });

  res.json({ status: 'success', data: { product } });
}));

// DELETE /api/products/:id — Admin only
productRouter.delete('/:id', restrictTo('admin'), asyncHandler(async (req, res) => {
  await Product.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ status: 'success', message: 'Product deactivated' });
}));

module.exports = productRouter;
