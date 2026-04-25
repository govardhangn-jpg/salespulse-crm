const mongoose = require('mongoose');

// ─── Sub-schemas ───────────────────────────────────────

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    designation: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: true }
);

const productInterestSchema = new mongoose.Schema(
  {
    productGroup: {
      type: String,
      enum: ['MPI Machine', 'FPI Machine', 'EDDY Current Machine', 'Consumables', 'Spares', 'Accessories', 'Service', 'Others'],
      required: true,
    },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String, trim: true }, // Denormalized for display speed
    potentialRevenue: { type: Number, default: 0 }, // In Lakhs (₹L)
  },
  { _id: true }
);

const competitorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
  },
  { _id: true }
);

// ─── Main Customer Schema ──────────────────────────────
const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },

    // ─── Segment (categorized dropdown) ───────────────
    segment: {
      category: {
        type: String,
        enum: ['Industry', 'Size', 'Services'],
        required: [true, 'Segment category is required'],
      },
      value: {
        type: String,
        required: [true, 'Segment value is required'],
      },
    },

    // ─── Unit / Plant ──────────────────────────────────
    unit: {
      type: String,
      enum: ['Unit 1', 'Unit 2', 'Unit 3', 'Plant - Pune', 'Plant - Nashik', 'Plant - Ahmedabad', 'Plant - Chennai', 'Plant - Bengaluru', 'Plant - Surat', 'Other'],
    },

    // ─── Address with mandatory State & PIN ───────────
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: {
        type: String,
        required: [true, 'State is required'],
        enum: [
          'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
          'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
          'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
          'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
          'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
          'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi',
        ],
      },
      pinCode: {
        type: String,
        required: [true, 'PIN code is required'],
        match: [/^\d{6}$/, 'PIN code must be exactly 6 digits'],
      },
    },

    // ─── Competition classification ───────────────────
    competition: {
      type: String,
      required: [true, 'Competition type is required'],
      enum: ['New Account', 'Existing Account', 'Competitor Account'],
    },

    // ─── Multi-entry slots (up to 10 each) ────────────
    contacts: {
      type: [contactSchema],
      validate: {
        validator: (v) => v.length <= 10,
        message: 'Cannot have more than 10 contacts',
      },
    },
    productInterests: {
      type: [productInterestSchema],
      validate: {
        validator: (v) => v.length <= 10,
        message: 'Cannot have more than 10 product interests',
      },
    },
    competitors: {
      type: [competitorSchema],
      validate: {
        validator: (v) => v.length <= 5,
        message: 'Cannot have more than 5 competitors',
      },
    },

    // ─── Approval workflow ─────────────────────────────
    status: {
      type: String,
      enum: ['pending', 'active', 'inactive', 'rejected'],
      default: 'pending',
    },
    isPending: {
      type: Boolean,
      default: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: Date,
    rejectionReason: String,

    // ─── Assigned salesperson ─────────────────────────
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // ─── Soft delete ──────────────────────────────────
    isDeleted: { type: Boolean, default: false, select: false },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', select: false },
    deletedAt: { type: Date, select: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ───────────────────────────────────────────
customerSchema.index({ 'address.state': 1 });           // State-based filtering
customerSchema.index({ status: 1 });
customerSchema.index({ isPending: 1 });
customerSchema.index({ assignedTo: 1 });
customerSchema.index({ submittedBy: 1 });
customerSchema.index({ name: 'text', 'address.city': 'text' }); // Full-text search

// ─── Query middleware — always exclude soft-deleted ────
customerSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: { $ne: true } });
  next();
});

const Customer = mongoose.model('Customer', customerSchema);
module.exports = Customer;
