const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    group: {
      type: String,
      enum: ['MPI Machine', 'FPI Machine', 'EDDY Current Machine', 'Consumables', 'Spares', 'Accessories', 'Service', 'Others'],
      required: function () {
        return !this.isPending; // Only required after approval
      },
    },
    description: { type: String, trim: true },
    sku: { type: String, trim: true, uppercase: true },
    isActive: { type: Boolean, default: true },

    // ─── Pending approval flag ─────────────────────────
    // Set true when a sales rep adds an "Other/New" product.
    // Admin must approve & assign group before it becomes visible.
    isPending: { type: Boolean, default: false },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,

    // ─── Inventory threshold (for consumables) ─────────
    defaultThreshold: { type: Number, default: 10 },
  },
  { timestamps: true }
);

productSchema.index({ group: 1, isActive: 1, isPending: 1 });
productSchema.index({ name: 'text' });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
