const mongoose = require('mongoose');

// ─── Activity Types (multi-select) ─────────────────────
const ACTIVITY_TYPES = [
  'Cold Call',
  'Follow-up',
  'Negotiation',
  'Demo',
  'Service',
  'Calibration',
  'PO Collection',
  'Payment Collection',
  'Installation',
  'Courtesy',
];

// ─── Visit Outcomes (multi-select) ─────────────────────
const VISIT_OUTCOMES = [
  'Relationship Management',
  'PO Collected',
  'Service Done',
  'Calibration Done',
  'Installation Completed',
  'Payment Collected',
  'Demo Done',
  'Demo Planned',
  'Contact Person Not Available',
  'Catalogue/Business Card Given',
];

const ACTION_TYPES = [
  'Schedule Demo', 'Send Quote', 'Follow-up', 'Trial Follow-up',
  'Cold Call', 'Site Visit', 'Close Deal', 'Send Proposal', 'Escalate',
];

const QUICK_NOTES = [
  'Customer not available', 'Interested in trial',
  'Price too high — needs revision', 'Requested a demo',
  'Waiting for decision maker', 'Using competitor product', 'Requested callback',
];

const interactionSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: [true, 'Customer is required'] },
    salesperson: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    productGroup: { type: String, enum: ['MPI Machine', 'FPI Machine', 'EDDY Current Machine', 'Consumables', 'Spares', 'Accessories', 'Service', 'Others'] },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: String,

    // ─── Multi-select activity types ──────────────────
    activityTypes: {
      type: [{ type: String, enum: ACTIVITY_TYPES }],
      validate: {
        validator: v => Array.isArray(v) && v.length >= 1,
        message: 'At least one activity type is required',
      },
    },
    // Backward-compat alias — mirrors first item of activityTypes
    callType: { type: String, enum: ACTIVITY_TYPES },

    interactionDate: { type: Date, required: true, default: Date.now },

    // ─── Multi-select visit outcomes ──────────────────
    visitOutcomes: { type: [{ type: String, enum: VISIT_OUTCOMES }], default: [] },

    notes: { type: String, trim: true, maxlength: [2000, 'Notes cannot exceed 2000 characters'] },
    quickNoteUsed: { type: String, enum: QUICK_NOTES },

    emailSent: { type: Boolean, default: false },
    emailSentAt: Date,

    stockSnapshot: { unitsAtSite: Number, threshold: Number, isBelowThreshold: Boolean },

    nextAction: {
      type: { type: String, enum: ACTION_TYPES },
      dueDate: Date,
      assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      isCompleted: { type: Boolean, default: false },
      completedAt: Date,
      reminderSent: { type: Boolean, default: false },
      reminderSentAt: Date,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Keep callType in sync with first activityType for backward compat
interactionSchema.pre('save', function (next) {
  if (this.activityTypes && this.activityTypes.length > 0) {
    this.callType = this.activityTypes[0];
  }
  next();
});

interactionSchema.index({ customer: 1, createdAt: -1 });
interactionSchema.index({ salesperson: 1 });
interactionSchema.index({ activityTypes: 1 });
interactionSchema.index({ visitOutcomes: 1 });
interactionSchema.index({ 'nextAction.dueDate': 1, 'nextAction.isCompleted': 1, 'nextAction.reminderSent': 1 });

const Interaction = mongoose.model('Interaction', interactionSchema);

module.exports = Interaction;
module.exports.ACTIVITY_TYPES = ACTIVITY_TYPES;
module.exports.VISIT_OUTCOMES  = VISIT_OUTCOMES;
module.exports.CALL_TYPES      = ACTIVITY_TYPES;  // backward-compat
module.exports.ACTION_TYPES    = ACTION_TYPES;
module.exports.QUICK_NOTES     = QUICK_NOTES;
