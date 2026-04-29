const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never return password in queries
    },
    role: {
      type: String,
      enum: ['admin', 'sales_rep'],
      default: 'sales_rep',
    },
    // ─── User-to-State mapping table ───────────────────
    // This is the core of state-based filtering.
    // Sales reps only see customers in their assigned states.
    assignedStates: [
      {
        type: String,
        enum: [
          // 28 States
          'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
          'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
          'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
          'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
          'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
          'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
          // 8 Union Territories
          'Delhi', 'Andaman & Nicobar Islands', 'Chandigarh',
          'Dadra & Nagar Haveli and Daman & Diu',
          'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
        ],
      },
    ],
    phone: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Hash password before save ─────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) this.passwordChangedAt = Date.now() - 1000;
  next();
});

// ─── Instance methods ──────────────────────────────────
userSchema.methods.correctPassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedAt = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedAt;
  }
  return false;
};

// ─── Virtual: initials ────────────────────────────────
userSchema.virtual('initials').get(function () {
  return this.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
});

const User = mongoose.model('User', userSchema);
module.exports = User;
