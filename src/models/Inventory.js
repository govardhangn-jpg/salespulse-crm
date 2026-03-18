const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: String,   // Denormalized for performance
    productGroup: String,  // Denormalized

    // ─── Stock details ─────────────────────────────────
    currentStock: {
      type: Number,
      required: [true, 'Current stock is required'],
      min: [0, 'Stock cannot be negative'],
    },
    unit: {
      type: String,
      default: 'units',
      enum: ['units', 'boxes', 'reams', 'cartridges', 'packs', 'rolls', 'kg', 'litres'],
    },
    threshold: {
      type: Number,
      required: [true, 'Threshold is required'],
      min: [0, 'Threshold cannot be negative'],
    },

    // ─── Alert state (computed) ────────────────────────
    isBelowThreshold: {
      type: Boolean,
      default: false,
    },
    alertAcknowledged: { type: Boolean, default: false },
    alertAcknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // ─── Stock history ─────────────────────────────────
    history: [
      {
        previousStock: Number,
        newStock: Number,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        source: { type: String, enum: ['manual', 'interaction_log', 'reorder'], default: 'manual' },
        notes: String,
        changedAt: { type: Date, default: Date.now },
      },
    ],

    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

// ─── Compound index: one record per customer+product ──
inventorySchema.index({ customer: 1, product: 1 }, { unique: true });
inventorySchema.index({ isBelowThreshold: 1 });
inventorySchema.index({ customer: 1 });

// ─── Auto-compute isBelowThreshold before save ────────
inventorySchema.pre('save', function (next) {
  this.isBelowThreshold = this.currentStock <= this.threshold;
  next();
});

const Inventory = mongoose.model('Inventory', inventorySchema);
module.exports = Inventory;
