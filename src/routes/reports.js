const express = require('express');
const mongoose = require('mongoose');
const Interaction = require('../models/Interaction');
const Customer = require('../models/Customer');
const User = require('../models/User');
const { protect, restrictTo } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
router.use(protect);

// ─── Helper: build date range filter ──────────────────
function dateFilter(from, to) {
  const f = {};
  if (from) f.$gte = new Date(from);
  if (to)   { const d = new Date(to); d.setHours(23,59,59,999); f.$lte = d; }
  return Object.keys(f).length ? { interactionDate: f } : {};
}

// ─── Helper: sales-rep state restriction ──────────────
async function stateCustomerIds(user) {
  if (user.role === 'admin') return null; // null = no restriction
  const customers = await Customer.find(
    { 'address.state': { $in: user.assignedStates }, status: 'active' }
  ).select('_id').lean();
  return customers.map(c => c._id);
}

// ═══════════════════════════════════════════════════════
// GET /api/reports/by-salesperson
// ─ Total visits, activity breakdown, outcome breakdown
//   per salesperson for a date range
// ═══════════════════════════════════════════════════════
router.get('/by-salesperson', asyncHandler(async (req, res) => {
  const { from, to, salespersonId } = req.query;
  const match = { ...dateFilter(from, to) };

  // Non-admins only see their own data
  if (req.user.role !== 'admin') {
    match.salesperson = req.user._id;
  } else if (salespersonId) {
    match.salesperson = new mongoose.Types.ObjectId(salespersonId);
  }

  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: 'users',
        localField: 'salesperson',
        foreignField: '_id',
        as: 'sp',
      },
    },
    { $unwind: { path: '$sp', preserveNullAndEmpty: true } },
    {
      $lookup: {
        from: 'customers',
        localField: 'customer',
        foreignField: '_id',
        as: 'cust',
      },
    },
    { $unwind: { path: '$cust', preserveNullAndEmpty: true } },
    {
      $group: {
        _id: '$salesperson',
        salespersonName:  { $first: '$sp.name' },
        salespersonEmail: { $first: '$sp.email' },
        totalVisits:      { $sum: 1 },
        // Flatten all activityTypes arrays and collect
        allActivities: { $push: { $ifNull: ['$activityTypes', []] } },
        allOutcomes:   { $push: { $ifNull: ['$visitOutcomes', []] } },
        customersVisited: { $addToSet: '$customer' },
        statesVisited:    { $addToSet: '$cust.address.state' },
        lastVisit: { $max: '$interactionDate' },
        // Raw records for drill-down
        records: {
          $push: {
            _id: '$_id',
            interactionDate: '$interactionDate',
            activityTypes: '$activityTypes',
            visitOutcomes: '$visitOutcomes',
            notes: '$notes',
            customerName: '$cust.name',
            customerState: '$cust.address.state',
            productName: '$productName',
          },
        },
      },
    },
    {
      $project: {
        salespersonName: 1,
        salespersonEmail: 1,
        totalVisits: 1,
        uniqueCustomers: { $size: '$customersVisited' },
        statesVisited: 1,
        lastVisit: 1,
        records: 1,
        // Flatten nested arrays into counts
        activityBreakdown: {
          $reduce: {
            input: '$allActivities',
            initialValue: [],
            in: { $concatArrays: ['$$value', '$$this'] },
          },
        },
        outcomeBreakdown: {
          $reduce: {
            input: '$allOutcomes',
            initialValue: [],
            in: { $concatArrays: ['$$value', '$$this'] },
          },
        },
      },
    },
    { $sort: { totalVisits: -1 } },
  ];

  const raw = await Interaction.aggregate(pipeline);

  // Count occurrences of each activity / outcome
  const tally = arr =>
    arr.reduce((acc, v) => { acc[v] = (acc[v] || 0) + 1; return acc; }, {});

  const result = raw.map(r => ({
    ...r,
    activityBreakdown: tally(r.activityBreakdown),
    outcomeBreakdown:  tally(r.outcomeBreakdown),
  }));

  res.json({ status: 'success', results: result.length, data: { report: result } });
}));

// ═══════════════════════════════════════════════════════
// GET /api/reports/by-state
// ─ Total visits, unique customers, activity breakdown per state
// ═══════════════════════════════════════════════════════
router.get('/by-state', asyncHandler(async (req, res) => {
  const { from, to, state } = req.query;
  const match = { ...dateFilter(from, to) };

  // Restrict non-admins to their assigned states
  const custIds = await stateCustomerIds(req.user);
  if (custIds !== null) match.customer = { $in: custIds };

  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: 'customers',
        localField: 'customer',
        foreignField: '_id',
        as: 'cust',
      },
    },
    { $unwind: { path: '$cust', preserveNullAndEmpty: true } },
    // Apply state filter if provided
    ...(state ? [{ $match: { 'cust.address.state': state } }] : []),
    {
      $group: {
        _id: '$cust.address.state',
        totalVisits:  { $sum: 1 },
        allActivities: { $push: { $ifNull: ['$activityTypes', []] } },
        allOutcomes:   { $push: { $ifNull: ['$visitOutcomes', []] } },
        customersVisited: { $addToSet: '$customer' },
        salespersons:     { $addToSet: '$salesperson' },
        lastVisit: { $max: '$interactionDate' },
        records: {
          $push: {
            _id: '$_id',
            interactionDate: '$interactionDate',
            activityTypes: '$activityTypes',
            visitOutcomes: '$visitOutcomes',
            notes: '$notes',
            customerName: '$cust.name',
            customerCity: '$cust.address.city',
            productName: '$productName',
          },
        },
      },
    },
    {
      $project: {
        state: '$_id',
        totalVisits: 1,
        uniqueCustomers: { $size: '$customersVisited' },
        uniqueSalespersons: { $size: '$salespersons' },
        lastVisit: 1,
        records: 1,
        activityBreakdown: {
          $reduce: {
            input: '$allActivities',
            initialValue: [],
            in: { $concatArrays: ['$$value', '$$this'] },
          },
        },
        outcomeBreakdown: {
          $reduce: {
            input: '$allOutcomes',
            initialValue: [],
            in: { $concatArrays: ['$$value', '$$this'] },
          },
        },
      },
    },
    { $sort: { totalVisits: -1 } },
  ];

  const raw = await Interaction.aggregate(pipeline);
  const tally = arr =>
    arr.reduce((acc, v) => { acc[v] = (acc[v] || 0) + 1; return acc; }, {});

  const result = raw.map(r => ({
    ...r,
    activityBreakdown: tally(r.activityBreakdown),
    outcomeBreakdown:  tally(r.outcomeBreakdown),
  }));

  res.json({ status: 'success', results: result.length, data: { report: result } });
}));

// ═══════════════════════════════════════════════════════
// GET /api/reports/by-customer
// ─ All interactions per customer with full detail
// ═══════════════════════════════════════════════════════
router.get('/by-customer', asyncHandler(async (req, res) => {
  const { from, to, customerId, state, salespersonId } = req.query;
  const match = { ...dateFilter(from, to) };

  // State restriction for non-admins
  const custIds = await stateCustomerIds(req.user);
  if (custIds !== null) match.customer = { $in: custIds };
  if (customerId) match.customer = new mongoose.Types.ObjectId(customerId);
  if (req.user.role !== 'admin') match.salesperson = req.user._id;
  else if (salespersonId) match.salesperson = new mongoose.Types.ObjectId(salespersonId);

  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: 'customers',
        localField: 'customer',
        foreignField: '_id',
        as: 'cust',
      },
    },
    { $unwind: { path: '$cust', preserveNullAndEmpty: true } },
    ...(state ? [{ $match: { 'cust.address.state': state } }] : []),
    {
      $lookup: {
        from: 'users',
        localField: 'salesperson',
        foreignField: '_id',
        as: 'sp',
      },
    },
    { $unwind: { path: '$sp', preserveNullAndEmpty: true } },
    {
      $group: {
        _id: '$customer',
        customerName:    { $first: '$cust.name' },
        customerState:   { $first: '$cust.address.state' },
        customerCity:    { $first: '$cust.address.city' },
        customerSegment: { $first: '$cust.segment.value' },
        totalVisits:  { $sum: 1 },
        allActivities: { $push: { $ifNull: ['$activityTypes', []] } },
        allOutcomes:   { $push: { $ifNull: ['$visitOutcomes', []] } },
        salespersons:  { $addToSet: '$sp.name' },
        firstVisit: { $min: '$interactionDate' },
        lastVisit:  { $max: '$interactionDate' },
        records: {
          $push: {
            _id: '$_id',
            interactionDate: '$interactionDate',
            activityTypes: '$activityTypes',
            visitOutcomes: '$visitOutcomes',
            notes: '$notes',
            salespersonName: '$sp.name',
            productName: '$productName',
            nextAction: '$nextAction',
          },
        },
      },
    },
    {
      $project: {
        customerName: 1, customerState: 1, customerCity: 1, customerSegment: 1,
        totalVisits: 1, salespersons: 1, firstVisit: 1, lastVisit: 1, records: 1,
        activityBreakdown: {
          $reduce: {
            input: '$allActivities',
            initialValue: [],
            in: { $concatArrays: ['$$value', '$$this'] },
          },
        },
        outcomeBreakdown: {
          $reduce: {
            input: '$allOutcomes',
            initialValue: [],
            in: { $concatArrays: ['$$value', '$$this'] },
          },
        },
      },
    },
    { $sort: { totalVisits: -1 } },
  ];

  const raw = await Interaction.aggregate(pipeline);
  const tally = arr =>
    arr.reduce((acc, v) => { acc[v] = (acc[v] || 0) + 1; return acc; }, {});

  const result = raw.map(r => ({
    ...r,
    activityBreakdown: tally(r.activityBreakdown),
    outcomeBreakdown:  tally(r.outcomeBreakdown),
  }));

  res.json({ status: 'success', results: result.length, data: { report: result } });
}));

// ═══════════════════════════════════════════════════════
// GET /api/reports/summary
// ─ Top-level KPIs for the period — used for header cards
// ═══════════════════════════════════════════════════════
router.get('/summary', asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const match = { ...dateFilter(from, to) };

  const custIds = await stateCustomerIds(req.user);
  if (custIds !== null) match.customer = { $in: custIds };
  if (req.user.role !== 'admin') match.salesperson = req.user._id;

  const [agg] = await Interaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalVisits:      { $sum: 1 },
        uniqueCustomers:  { $addToSet: '$customer' },
        uniqueSalespersons: { $addToSet: '$salesperson' },
        allActivities: { $push: { $ifNull: ['$activityTypes', []] } },
        allOutcomes:   { $push: { $ifNull: ['$visitOutcomes', []] } },
      },
    },
    {
      $project: {
        totalVisits: 1,
        uniqueCustomers:    { $size: '$uniqueCustomers' },
        uniqueSalespersons: { $size: '$uniqueSalespersons' },
        allActivities: {
          $reduce: { input: '$allActivities', initialValue: [],
            in: { $concatArrays: ['$$value', '$$this'] } },
        },
        allOutcomes: {
          $reduce: { input: '$allOutcomes', initialValue: [],
            in: { $concatArrays: ['$$value', '$$this'] } },
        },
      },
    },
  ]);

  const tally = arr =>
    arr ? arr.reduce((acc, v) => { acc[v] = (acc[v] || 0) + 1; return acc; }, {}) : {};

  res.json({
    status: 'success',
    data: {
      totalVisits:        agg?.totalVisits || 0,
      uniqueCustomers:    agg?.uniqueCustomers || 0,
      uniqueSalespersons: agg?.uniqueSalespersons || 0,
      activityBreakdown:  tally(agg?.allActivities),
      outcomeBreakdown:   tally(agg?.allOutcomes),
    },
  });
}));

// ═══════════════════════════════════════════════════════
// GET /api/reports/filters
// ─ Returns dropdown options (salespersons, states, customers)
// ═══════════════════════════════════════════════════════
router.get('/filters', asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === 'admin';

  const [users, customers] = await Promise.all([
    isAdmin
      ? User.find({ isActive: true }).select('name email role').lean()
      : [req.user],
    isAdmin
      ? Customer.find({ status: 'active' }).select('name address.state address.city').lean()
      : Customer.find({
          status: 'active',
          'address.state': { $in: req.user.assignedStates },
        }).select('name address.state address.city').lean(),
  ]);

  const states = isAdmin
    ? [...new Set(customers.map(c => c.address?.state).filter(Boolean))].sort()
    : req.user.assignedStates;

  res.json({
    status: 'success',
    data: { salespersons: users, states, customers },
  });
}));


// ═══════════════════════════════════════════════════════
// GET /api/reports/by-product
// ─ Total visits, activity breakdown, outcome breakdown
//   grouped by product type (productGroup)
// ═══════════════════════════════════════════════════════
router.get('/by-product', asyncHandler(async (req, res) => {
  const { from, to, salespersonId, state, productGroup } = req.query;
  const match = { ...dateFilter(from, to) };

  // Must have a productGroup logged
  match.productGroup = { $exists: true, $ne: null, $ne: '' };

  const custIds = await stateCustomerIds(req.user);
  if (custIds !== null) match.customer = { $in: custIds };
  if (req.user.role !== 'admin') match.salesperson = req.user._id;
  else if (salespersonId) match.salesperson = new mongoose.Types.ObjectId(salespersonId);
  if (productGroup) match.productGroup = productGroup;

  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: 'customers',
        localField: 'customer',
        foreignField: '_id',
        as: 'cust',
      },
    },
    { $unwind: { path: '$cust', preserveNullAndEmpty: true } },
    ...(state ? [{ $match: { 'cust.address.state': state } }] : []),
    {
      $lookup: {
        from: 'users',
        localField: 'salesperson',
        foreignField: '_id',
        as: 'sp',
      },
    },
    { $unwind: { path: '$sp', preserveNullAndEmpty: true } },
    {
      $group: {
        _id: '$productGroup',
        productType:      { $first: '$productGroup' },
        totalVisits:      { $sum: 1 },
        allActivities:    { $push: { $ifNull: ['$activityTypes', []] } },
        allOutcomes:      { $push: { $ifNull: ['$visitOutcomes', []] } },
        customersReached: { $addToSet: '$customer' },
        salespersonsActive: { $addToSet: '$salesperson' },
        statesCovered:    { $addToSet: '$cust.address.state' },
        lastVisit:        { $max: '$interactionDate' },
        salespersonNames: { $addToSet: '$sp.name' },
        records: {
          $push: {
            _id: '$_id',
            interactionDate: '$interactionDate',
            activityTypes:  '$activityTypes',
            visitOutcomes:  '$visitOutcomes',
            notes:          '$notes',
            customerName:   '$cust.name',
            customerState:  '$cust.address.state',
            salespersonName:'$sp.name',
            productName:    '$productName',
          },
        },
      },
    },
    {
      $project: {
        productType: 1,
        totalVisits: 1,
        uniqueCustomers:   { $size: '$customersReached' },
        uniqueSalespersons: { $size: '$salespersonsActive' },
        statesCovered: 1,
        lastVisit: 1,
        salespersonNames: 1,
        records: 1,
        activityBreakdown: {
          $reduce: {
            input: '$allActivities', initialValue: [],
            in: { $concatArrays: ['$$value', '$$this'] },
          },
        },
        outcomeBreakdown: {
          $reduce: {
            input: '$allOutcomes', initialValue: [],
            in: { $concatArrays: ['$$value', '$$this'] },
          },
        },
      },
    },
    { $sort: { totalVisits: -1 } },
  ];

  const raw = await Interaction.aggregate(pipeline);
  const tally = arr =>
    arr.reduce((acc, v) => { acc[v] = (acc[v] || 0) + 1; return acc; }, {});

  const result = raw.map(r => ({
    ...r,
    activityBreakdown: tally(r.activityBreakdown),
    outcomeBreakdown:  tally(r.outcomeBreakdown),
  }));

  res.json({ status: 'success', results: result.length, data: { report: result } });
}));

module.exports = router;
