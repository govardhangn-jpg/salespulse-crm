const mongoose = require('mongoose');

const CALL_TYPES = ['Cold Call', 'Follow-up', 'Technical Support', 'Demo', 'Closing', 'Site Visit', 'Email'];
const ACTION_TYPES = ['Schedule Demo', 'Send Quote', 'Trial Follow-up', 'Cold Call', 'Site Visit', 'Close Deal', 'Send Proposal', 'Escalate'];
const QUICK_NOTES = [
  'Customer not available',
  'Interested in trial',
  'Price too high — needs revision',
  'Requested a demo',
  'Waiting for decision maker',
  'Using competitor product',
  'Requested callback',
];

const interactionSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer is required'],
    },
    salesperson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ─── Product discussed ─────────────────────────────
    productGroup: {
      type: String,
      enum: ['Hardware', 'Software', 'Consumables', 'Services'],
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    productName: String, // Denormalized

    // ─── Call details ──────────────────────────────────
    callType: {
      type: String,
      enum: CALL_TYPES,
      required: [true, 'Call type is required'],
    },
    interactionDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
    quickNoteUsed: {
      type: String,
      enum: QUICK_NOTES,
    },

    // ─── Email intro sent ──────────────────────────────
    emailSent: { type: Boolean, default: false },
    emailSentAt: Date,

    // ─── Stock snapshot (consumables) ─────────────────
    stockSnapshot: {
      unitsAtSite: Number,
      threshold: Number,
      isBelowThreshold: Boolean,
    },

    // ─── Next action plan ──────────────────────────────
    nextAction: {
      type: {
        type: String,
        enum: ACTION_TYPES,
      },
      dueDate: Date,
      assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      isCompleted: { type: Boolean, default: false },
      completedAt: Date,

      // Reminder tracking
      reminderSent: { type: Boolean, default: false },
      reminderSentAt: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ───────────────────────────────────────────
interactionSchema.index({ customer: 1, createdAt: -1 });
interactionSchema.index({ salesperson: 1 });
interactionSchema.index({ 'nextAction.dueDate': 1, 'nextAction.isCompleted': 1, 'nextAction.reminderSent': 1 });
interactionSchema.index({ callType: 1 });

const Interaction = mongoose.model('Interaction', interactionSchema);

module.exports = Interaction;
module.exports.CALL_TYPES = CALL_TYPES;
module.exports.ACTION_TYPES = ACTION_TYPES;
module.exports.QUICK_NOTES = QUICK_NOTES;
