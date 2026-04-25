const express = require('express');
const { body, validationResult } = require('express-validator');
const { Attendance, GeofenceZone } = require('../models/Attendance');
const { protect, restrictTo } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
router.use(protect);

// ─── Haversine distance (metres) between two [lng,lat] ─
function haversineMetres(coords1, coords2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const [lng1, lat1] = coords1;
  const [lng2, lat2] = coords2;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Find nearest active zone for given coords ─────────
async function findNearestZone(coordinates) {
  const zones = await GeofenceZone.find({ isActive: true });
  let nearest = null;
  let minDist = Infinity;
  for (const zone of zones) {
    const dist = haversineMetres(zone.location.coordinates, coordinates);
    if (dist < minDist) { minDist = dist; nearest = zone; }
  }
  return { zone: nearest, distanceMetres: Math.round(minDist) };
}

// ─── Today's date string ───────────────────────────────
function todayString(offsetHours = 5.5) {
  const now = new Date(Date.now() + offsetHours * 3600000);
  return now.toISOString().slice(0, 10);
}

// ════════════════════════════════════════════════════════
// GEOFENCE ZONES — Admin CRUD
// ════════════════════════════════════════════════════════

// GET /api/attendance/zones
router.get('/zones', asyncHandler(async (req, res) => {
  const zones = await GeofenceZone.find({ isActive: true })
    .populate('createdBy', 'name')
    .sort({ name: 1 });
  res.json({ status: 'success', results: zones.length, data: { zones } });
}));

// POST /api/attendance/zones
router.post('/zones', restrictTo('admin'),
  [
    body('name').trim().notEmpty().withMessage('Zone name required'),
    body('location.coordinates').isArray({ min: 2, max: 2 }).withMessage('coordinates [lng, lat] required'),
    body('radiusMeters').isInt({ min: 10, max: 5000 }).withMessage('Radius 10–5000 m'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ status: 'fail', errors: errors.array() });

    const zone = await GeofenceZone.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ status: 'success', data: { zone } });
  })
);

// PATCH /api/attendance/zones/:id
router.patch('/zones/:id', restrictTo('admin'), asyncHandler(async (req, res) => {
  const zone = await GeofenceZone.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!zone) return res.status(404).json({ status: 'fail', message: 'Zone not found' });
  res.json({ status: 'success', data: { zone } });
}));

// DELETE /api/attendance/zones/:id
router.delete('/zones/:id', restrictTo('admin'), asyncHandler(async (req, res) => {
  await GeofenceZone.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ status: 'success', message: 'Zone deactivated' });
}));

// ════════════════════════════════════════════════════════
// CLOCK IN
// POST /api/attendance/clock-in
// ════════════════════════════════════════════════════════
router.post('/clock-in',
  [
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ status: 'fail', errors: errors.array() });

    const { latitude, longitude, address, deviceInfo } = req.body;
    const coordinates = [parseFloat(longitude), parseFloat(latitude)];
    const date = todayString();

    // Check if already clocked in today
    const existing = await Attendance.findOne({ employee: req.user._id, date });
    if (existing && existing.clockIn && existing.clockIn.time) {
      return res.status(400).json({
        status: 'fail',
        message: existing.clockOut && existing.clockOut.time
          ? 'You have already completed attendance for today'
          : 'You are already clocked in. Please clock out first.',
        data: { attendance: existing },
      });
    }

    // Geofence check
    const { zone, distanceMetres } = await findNearestZone(coordinates);
    const isWithinZone = zone ? distanceMetres <= zone.radiusMeters : false;
    const geofenceViolation = !isWithinZone;

    // Determine if late (shift starts 09:30 IST)
    const nowIST = new Date(Date.now() + 5.5 * 3600000);
    const shiftStart = new Date(nowIST);
    shiftStart.setHours(9, 30, 0, 0);
    const isLate = nowIST > shiftStart;

    const attendanceData = {
      employee: req.user._id,
      date,
      clockIn: {
        time: new Date(),
        location: { type: 'Point', coordinates },
        address: address || '',
        zone: zone ? zone._id : undefined,
        zoneName: zone ? zone.name : 'Unknown',
        distanceFromZone: distanceMetres,
        isWithinZone,
        deviceInfo: deviceInfo || '',
      },
      status: 'present',
      isLate,
      geofenceViolation,
      violationNote: geofenceViolation
        ? `Clocked in ${distanceMetres}m from nearest zone "${zone?.name || 'N/A'}" (allowed: ${zone?.radiusMeters || '?'}m)`
        : undefined,
    };

    const attendance = existing
      ? await Attendance.findByIdAndUpdate(existing._id, attendanceData, { new: true })
      : await Attendance.create(attendanceData);

    res.status(201).json({
      status: 'success',
      message: isWithinZone
        ? `Clocked in successfully at ${zone.name}${isLate ? ' — marked Late (after 9:30 AM)' : ''}`
        : `Clocked in — but you are ${distanceMetres}m outside the nearest zone (${zone?.name || 'N/A'})`,
      geofenceViolation,
      distanceMetres,
      isWithinZone,
      isLate,
      zoneName: zone?.name,
      data: { attendance },
    });
  })
);

// ════════════════════════════════════════════════════════
// CLOCK OUT
// POST /api/attendance/clock-out
// ════════════════════════════════════════════════════════
router.post('/clock-out',
  [
    body('latitude').isFloat({ min: -90, max: 90 }),
    body('longitude').isFloat({ min: -180, max: 180 }),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ status: 'fail', errors: errors.array() });

    const { latitude, longitude, address, deviceInfo, notes } = req.body;
    const coordinates = [parseFloat(longitude), parseFloat(latitude)];
    const date = todayString();

    const attendance = await Attendance.findOne({ employee: req.user._id, date });
    if (!attendance || !attendance.clockIn || !attendance.clockIn.time) {
      return res.status(400).json({ status: 'fail', message: 'You have not clocked in today' });
    }
    if (attendance.clockOut && attendance.clockOut.time) {
      return res.status(400).json({ status: 'fail', message: 'Already clocked out today', data: { attendance } });
    }

    const { zone, distanceMetres } = await findNearestZone(coordinates);
    const isWithinZone = zone ? distanceMetres <= zone.radiusMeters : false;

    // Determine early exit (shift ends 18:00 IST = 6:00 PM)
    const nowIST = new Date(Date.now() + 5.5 * 3600000);
    const shiftEnd = new Date(nowIST);
    shiftEnd.setHours(18, 0, 0, 0);
    const isEarlyExit = nowIST < shiftEnd;

    attendance.clockOut = {
      time: new Date(),
      location: { type: 'Point', coordinates },
      address: address || '',
      zone: zone ? zone._id : undefined,
      zoneName: zone ? zone.name : 'Unknown',
      distanceFromZone: distanceMetres,
      isWithinZone,
      deviceInfo: deviceInfo || '',
    };
    attendance.isEarlyExit = isEarlyExit;
    if (notes) attendance.notes = notes;

    // Determine half-day
    const ms = new Date() - new Date(attendance.clockIn.time);
    const hoursWorked = ms / 3600000;
    if (hoursWorked < 4.5) attendance.status = 'half_day';

    if (!isWithinZone && !attendance.geofenceViolation) {
      attendance.geofenceViolation = true;
      attendance.violationNote = (attendance.violationNote || '') +
        ` | Clock-out ${distanceMetres}m from "${zone?.name || 'N/A'}"`;
    }

    await attendance.save();

    res.json({
      status: 'success',
      message: isWithinZone
        ? `Clocked out successfully${isEarlyExit ? ' — marked Early Exit (before 6:00 PM)' : ''}`
        : `Clocked out — ${distanceMetres}m outside zone`,
      geofenceViolation: !isWithinZone,
      isEarlyExit,
      distanceMetres,
      isWithinZone,
      totalHours: attendance.totalHours,
      data: { attendance },
    });
  })
);

// ════════════════════════════════════════════════════════
// GET TODAY'S STATUS for logged-in user
// GET /api/attendance/today
// ════════════════════════════════════════════════════════
router.get('/today', asyncHandler(async (req, res) => {
  const date = todayString();
  const attendance = await Attendance.findOne({ employee: req.user._id, date })
    .populate('clockIn.zone', 'name radiusMeters')
    .populate('clockOut.zone', 'name radiusMeters');
  res.json({ status: 'success', date, data: { attendance } });
}));

// ════════════════════════════════════════════════════════
// GET MY ATTENDANCE HISTORY
// GET /api/attendance/my?month=2026-04
// ════════════════════════════════════════════════════════
router.get('/my', asyncHandler(async (req, res) => {
  const { month } = req.query;
  const filter = { employee: req.user._id };
  if (month) filter.date = { $regex: `^${month}` };

  const records = await Attendance.find(filter)
    .populate('clockIn.zone', 'name')
    .populate('clockOut.zone', 'name')
    .sort({ date: -1 })
    .lean();

  const summary = {
    present: records.filter(r => r.status === 'present').length,
    late: records.filter(r => r.isLate).length,
    halfDay: records.filter(r => r.status === 'half_day').length,
    violations: records.filter(r => r.geofenceViolation).length,
    totalHours: Math.round(records.reduce((s, r) => s + (r.totalHours || 0), 0) * 100) / 100,
  };

  res.json({ status: 'success', results: records.length, summary, data: { records } });
}));

// ════════════════════════════════════════════════════════
// ADMIN: GET ALL ATTENDANCE
// GET /api/attendance?date=2026-04-08&employeeId=xxx
// ════════════════════════════════════════════════════════
router.get('/', restrictTo('admin'), asyncHandler(async (req, res) => {
  const { date, month, employeeId, status, violation } = req.query;
  const filter = {};
  if (date) filter.date = date;
  else if (month) filter.date = { $regex: `^${month}` };
  if (employeeId) filter.employee = employeeId;
  if (status) filter.status = status;
  if (violation === 'true') filter.geofenceViolation = true;

  const records = await Attendance.find(filter)
    .populate('employee', 'name email role assignedStates')
    .populate('clockIn.zone', 'name')
    .populate('clockOut.zone', 'name')
    .sort({ date: -1, 'clockIn.time': -1 })
    .lean();

  res.json({ status: 'success', results: records.length, data: { records } });
}));

// ════════════════════════════════════════════════════════
// ADMIN: MANUAL OVERRIDE
// PATCH /api/attendance/:id/override
// ════════════════════════════════════════════════════════
router.patch('/:id/override', restrictTo('admin'),
  asyncHandler(async (req, res) => {
    const { clockInTime, clockOutTime, status, overrideReason } = req.body;
    const record = await Attendance.findById(req.params.id);
    if (!record) return res.status(404).json({ status: 'fail', message: 'Record not found' });

    if (clockInTime && record.clockIn) {
      record.clockIn.time = new Date(clockInTime);
      // Recompute isLate: after 9:30 AM IST
      const inIST = new Date(new Date(clockInTime).getTime() + 5.5 * 3600000);
      const lateLimit = new Date(inIST); lateLimit.setHours(9, 30, 0, 0);
      record.isLate = inIST > lateLimit;
    }
    if (clockOutTime) {
      if (!record.clockOut) record.clockOut = {};
      record.clockOut.time = new Date(clockOutTime);
      // Recompute isEarlyExit: before 18:00 IST
      const outIST = new Date(new Date(clockOutTime).getTime() + 5.5 * 3600000);
      const earlyLimit = new Date(outIST); earlyLimit.setHours(18, 0, 0, 0);
      record.isEarlyExit = outIST < earlyLimit;
    }
    if (status) record.status = status;
    record.isManualOverride = true;
    record.overrideReason = overrideReason || 'Admin correction';
    record.overrideBy = req.user._id;
    record.geofenceViolation = false;

    await record.save();
    res.json({ status: 'success', message: 'Record corrected', data: { record } });
  })
);

// ════════════════════════════════════════════════════════
// ADMIN: DAILY SUMMARY
// GET /api/attendance/summary?date=2026-04-08
// ════════════════════════════════════════════════════════
router.get('/summary', restrictTo('admin'), asyncHandler(async (req, res) => {
  const date = req.query.date || todayString();
  const User = require('../models/User');

  const [records, totalEmployees] = await Promise.all([
    Attendance.find({ date }).populate('employee', 'name role').lean(),
    User.countDocuments({ isActive: true }),
  ]);

  const summary = {
    date,
    totalEmployees,
    present: records.filter(r => r.clockIn?.time).length,
    absent: totalEmployees - records.length,
    late: records.filter(r => r.isLate).length,
    earlyExit: records.filter(r => r.isEarlyExit).length,
    halfDay: records.filter(r => r.status === 'half_day').length,
    violations: records.filter(r => r.geofenceViolation).length,
    notClockedOut: records.filter(r => r.clockIn?.time && !r.clockOut?.time).length,
  };

  res.json({ status: 'success', data: { summary, records } });
}));

module.exports = router;
