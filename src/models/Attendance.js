const mongoose = require('mongoose');

const geofenceZoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    radiusMeters: { type: Number, required: true, default: 200 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);
geofenceZoneSchema.index({ location: '2dsphere' });

const attendanceSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    clockIn: {
      time: Date,
      location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: [Number],
      },
      address: String,
      zone: { type: mongoose.Schema.Types.ObjectId, ref: 'GeofenceZone' },
      zoneName: String,
      distanceFromZone: Number,
      isWithinZone: { type: Boolean, default: false },
      deviceInfo: String,
    },
    clockOut: {
      time: Date,
      location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: [Number],
      },
      address: String,
      zone: { type: mongoose.Schema.Types.ObjectId, ref: 'GeofenceZone' },
      zoneName: String,
      distanceFromZone: Number,
      isWithinZone: { type: Boolean, default: false },
      deviceInfo: String,
    },
    totalHours: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['present', 'absent', 'half_day', 'late', 'on_leave', 'holiday'],
      default: 'present',
    },
    isLate: { type: Boolean, default: false },
    isEarlyExit: { type: Boolean, default: false },
    isManualOverride: { type: Boolean, default: false },
    overrideReason: String,
    overrideBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    geofenceViolation: { type: Boolean, default: false },
    violationNote: String,
    notes: String,
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ status: 1 });

attendanceSchema.pre('save', function (next) {
  if (this.clockIn && this.clockIn.time && this.clockOut && this.clockOut.time) {
    const ms = new Date(this.clockOut.time) - new Date(this.clockIn.time);
    this.totalHours = Math.round((ms / 3600000) * 100) / 100;
  }
  next();
});

const Attendance = mongoose.model('Attendance', attendanceSchema);
const GeofenceZone = mongoose.model('GeofenceZone', geofenceZoneSchema);

module.exports = { Attendance, GeofenceZone };
