const express = require('express');
const { body, validationResult } = require('express-validator');
const Interaction = require('../models/Interaction');
const Customer = require('../models/Customer');
const Inventory = require('../models/Inventory');
const Notification = require('../models/Notification');
const { sendEmail } = require('../utils/email');
const { protect, applyStateFilter } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { CALL_TYPES, ACTION_TYPES } = require('../models/Interaction');

const router = express.Router();
router.use(protect);

// Email template builder
const buildIntroEmail = (customer, salesperson, productGroup) => ({
  subject: `Introduction: ${productGroup} Portfolio — Tailored for ${customer.name}`,
  html: `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#333;">
      <div style="background:#3b82f6;padding:20px;border-radius:8px 8px 0 0;">
        <h2 style="color:#fff;margin:0;">SalesPulse Solutions</h2>
      </div>
      <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
        <p>Dear ${customer.contacts[0]?.name || 'Sir/Madam'},</p>
        <p>I hope this message finds you well. My name is <strong>${salesperson.name}</strong> and I represent <strong>SalesPulse Solutions</strong>.</p>
        <p>Following our recent conversation, I wanted to formally introduce our <strong>${productGroup}</strong> range that we believe can add significant value to your operations at <strong>${customer.name}</strong>.</p>
        <p>Key highlights of our <strong>${productGroup} Portfolio</strong>:</p>
        <ul>
          <li>Premium quality with extended life cycles</li>
          <li>Competitive pricing with volume discounts</li>
          <li>Same-day delivery across ${customer.address.state}</li>
        </ul>
        <p>I would love to arrange a brief demo at your convenience. Please feel free to reach out at any time.</p>
        <p style="margin-top:24px;">Warm regards,<br><strong>${salesperson.name}</strong><br>Sales Executive, SalesPulse Solutions</p>
      </div>
    </div>
  `,
});

// ═══════════════════════════════════════════════════════
// GET /api/interactions
// ═══════════════════════════════════════════════════════
router.get(
  '/',
  applyStateFilter,
  asyncHandler(async (req, res) => {
    const { customer, callType, salesperson, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (customer) filter.customer = customer;
    if (callType) filter.callType = callType;

    // Sales reps only see their own interactions
    if (req.user.role !== 'admin') {
      filter.salesperson = req.user._id;
    } else if (salesperson) {
      filter.salesperson = salesperson;
    }

    // State filter: join with Customer
    let customerIds;
    if (Object.keys(req.stateFilter).length > 0) {
      const customers = await Customer.find(req.stateFilter).select('_id');
      customerIds = customers.map((c) => c._id);
      filter.customer = { $in: customerIds };
    }
    if (customer) filter.customer = customer; // Override with specific customer if provided

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [interactions, total] = await Promise.all([
      Interaction.find(filter)
        .populate('customer', 'name address.state')
        .populate('salesperson', 'name')
        .populate('product', 'name group')
        .populate('nextAction.assignedTo', 'name')
        .sort({ interactionDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Interaction.countDocuments(filter),
    ]);

    res.json({
      status: 'success',
      results: interactions.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      data: { interactions },
    });
  })
);

// ═══════════════════════════════════════════════════════
// POST /api/interactions  — Log a new interaction
// ═══════════════════════════════════════════════════════
router.post(
  '/',
  [
    body('customer').notEmpty().withMessage('Customer ID is required'),
    body('callType').isIn(CALL_TYPES).withMessage('Invalid call type'),
    body('interactionDate').optional().isISO8601(),
    body('nextAction.type').optional().isIn(ACTION_TYPES),
    body('nextAction.dueDate').optional().isISO8601(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ status: 'fail', errors: errors.array() });
    }

    // Verify customer exists and is accessible
    const customer = await Customer.findById(req.body.customer)
      .populate('contacts');
    if (!customer || customer.status !== 'active') {
      return res.status(404).json({ status: 'fail', message: 'Customer not found or not active' });
    }

    const interactionData = {
      ...req.body,
      salesperson: req.user._id,
    };

    // Handle stock snapshot
    if (req.body.stockSnapshot?.unitsAtSite !== undefined) {
      interactionData.stockSnapshot = {
        ...req.body.stockSnapshot,
        isBelowThreshold:
          req.body.stockSnapshot.unitsAtSite <= (req.body.stockSnapshot.threshold || 10),
      };

      // Upsert inventory record
      if (req.body.product) {
        const inventoryUpdate = await Inventory.findOneAndUpdate(
          { customer: customer._id, product: req.body.product },
          {
            currentStock: req.body.stockSnapshot.unitsAtSite,
            threshold: req.body.stockSnapshot.threshold || 10,
            productName: req.body.productName,
            productGroup: req.body.productGroup,
            lastUpdatedBy: req.user._id,
            $push: {
              history: {
                newStock: req.body.stockSnapshot.unitsAtSite,
                changedBy: req.user._id,
                source: 'interaction_log',
              },
            },
          },
          { upsert: true, new: true }
        );

        // Notify if below threshold
        if (inventoryUpdate.isBelowThreshold) {
          await Notification.create({
            recipient: req.user._id,
            type: 'low_stock',
            title: `Low stock alert: ${req.body.productName || 'Product'}`,
            message: `Stock at ${customer.name} is at ${req.body.stockSnapshot.unitsAtSite} units (threshold: ${req.body.stockSnapshot.threshold}).`,
            refModel: 'Inventory',
            refId: inventoryUpdate._id,
          });
        }
      }
    }

    const interaction = await Interaction.create(interactionData);

    // Send intro email if requested
    if (req.body.sendEmail && customer.contacts[0]?.email) {
      const template = buildIntroEmail(customer, req.user, req.body.productGroup || 'Products');
      try {
        await sendEmail({
          to: customer.contacts[0].email,
          subject: template.subject,
          html: template.html,
        });
        await Interaction.findByIdAndUpdate(interaction._id, {
          emailSent: true,
          emailSentAt: new Date(),
        });
      } catch (emailErr) {
        console.warn('Email send failed:', emailErr.message);
      }
    }

    // Schedule reminder notification (handled by cron, but also create in-app now)
    if (interaction.nextAction?.dueDate) {
      const assignedTo = interaction.nextAction.assignedTo || req.user._id;
      await Notification.create({
        recipient: assignedTo,
        type: 'reminder',
        title: `Upcoming: ${interaction.nextAction.type} — ${customer.name}`,
        message: `You have a "${interaction.nextAction.type}" scheduled for ${new Date(interaction.nextAction.dueDate).toLocaleString()}.`,
        refModel: 'Interaction',
        refId: interaction._id,
      });
    }

    const populated = await Interaction.findById(interaction._id)
      .populate('customer', 'name address.state')
      .populate('salesperson', 'name')
      .populate('product', 'name group');

    res.status(201).json({ status: 'success', data: { interaction: populated } });
  })
);

// ═══════════════════════════════════════════════════════
// GET /api/interactions/upcoming — Actions due soon
// ═══════════════════════════════════════════════════════
router.get(
  '/upcoming',
  asyncHandler(async (req, res) => {
    const { days = 7 } = req.query;
    const now = new Date();
    const future = new Date(now.getTime() + parseInt(days) * 24 * 60 * 60 * 1000);

    const filter = {
      'nextAction.dueDate': { $gte: now, $lte: future },
      'nextAction.isCompleted': false,
    };

    if (req.user.role !== 'admin') {
      filter['nextAction.assignedTo'] = req.user._id;
    }

    const interactions = await Interaction.find(filter)
      .populate('customer', 'name address.state address.city')
      .populate('nextAction.assignedTo', 'name')
      .sort({ 'nextAction.dueDate': 1 })
      .lean();

    res.json({ status: 'success', results: interactions.length, data: { interactions } });
  })
);

// ═══════════════════════════════════════════════════════
// PATCH /api/interactions/:id/complete-action
// ═══════════════════════════════════════════════════════
router.patch(
  '/:id/complete-action',
  asyncHandler(async (req, res) => {
    const interaction = await Interaction.findByIdAndUpdate(
      req.params.id,
      { 'nextAction.isCompleted': true, 'nextAction.completedAt': new Date() },
      { new: true }
    );
    if (!interaction) return res.status(404).json({ status: 'fail', message: 'Interaction not found' });
    res.json({ status: 'success', data: { interaction } });
  })
);

// ═══════════════════════════════════════════════════════
// POST /api/interactions/email-preview — Build template
// ═══════════════════════════════════════════════════════
router.post(
  '/email-preview',
  asyncHandler(async (req, res) => {
    const { customerId, productGroup } = req.body;
    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ status: 'fail', message: 'Customer not found' });

    const template = buildIntroEmail(customer, req.user, productGroup || 'Products');
    res.json({ status: 'success', data: { template } });
  })
);

module.exports = router;
