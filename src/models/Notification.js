const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'reminder',          // Upcoming action due
        'approval_needed',   // Admin: new customer/product pending
        'approved',          // Salesperson: their submission was approved
        'rejected',          // Salesperson: their submission was rejected
        'low_stock',         // Stock below threshold
        'new_interaction',   // Team activity feed
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    readAt: Date,

    // ─── Linked entity ─────────────────────────────────
    refModel: { type: String, enum: ['Customer', 'Interaction', 'Inventory', 'Product'] },
    refId: { type: mongoose.Schema.Types.ObjectId },

    // ─── Delivery channels ─────────────────────────────
    emailSent: { type: Boolean, default: false },
    emailSentAt: Date,
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
