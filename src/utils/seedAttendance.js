require('dotenv').config();
const mongoose = require('mongoose');
const { GeofenceZone, Attendance } = require('../models/Attendance');
const User = require('../models/User');
const connectDB = require('../config/db');

const seedAttendance = async () => {
  await connectDB();
  console.log('🌱 Seeding attendance data...');

  await GeofenceZone.deleteMany({});
  await Attendance.deleteMany({});

  const admin = await User.findOne({ role: 'admin' });
  if (!admin) { console.error('Run main seed first'); process.exit(1); }

  // Seed geofence zones (real Indian office locations)
  const zones = await GeofenceZone.insertMany([
    { name: 'Head Office — Mumbai', address: 'BKC, Bandra East, Mumbai 400051', location: { type: 'Point', coordinates: [72.8656, 19.0607] }, radiusMeters: 300, createdBy: admin._id },
    { name: 'Pune Branch', address: 'Hinjewadi Phase 1, Pune 411057', location: { type: 'Point', coordinates: [73.7379, 18.5912] }, radiusMeters: 200, createdBy: admin._id },
    { name: 'Bengaluru Office', address: 'Electronic City, Bengaluru 560100', location: { type: 'Point', coordinates: [77.6600, 12.8456] }, radiusMeters: 250, createdBy: admin._id },
  ]);
  console.log('📍 Geofence zones seeded (3)');

  // Seed sample attendance records for last 7 days
  const users = await User.find({ isActive: true });
  const records = [];
  const today = new Date();

  for (let d = 6; d >= 0; d--) {
    const day = new Date(today); day.setDate(today.getDate() - d);
    const dateStr = day.toISOString().slice(0, 10);
    // Skip Sundays
    if (day.getDay() === 0) continue;

    for (const user of users) {
      const zone = zones[Math.floor(Math.random() * zones.length)];
      const isLate = Math.random() > 0.75;
      const hasViolation = Math.random() > 0.85;
      const inHour = isLate ? 9 + Math.floor(Math.random() * 2) : 8;
      const inMin = Math.floor(Math.random() * 59);
      const outHour = 17 + Math.floor(Math.random() * 2);

      const clockInTime = new Date(day); clockInTime.setHours(inHour, inMin, 0);
      const clockOutTime = new Date(day); clockOutTime.setHours(outHour, Math.floor(Math.random()*59), 0);

      // Slightly offset coords if violation
      const offsetLng = hasViolation ? (zone.location.coordinates[0] + 0.005) : zone.location.coordinates[0];
      const offsetLat = hasViolation ? (zone.location.coordinates[1] + 0.005) : zone.location.coordinates[1];
      const dist = hasViolation ? Math.round(Math.random() * 600 + 300) : Math.round(Math.random() * 50);

      records.push({
        employee: user._id,
        date: dateStr,
        clockIn: { time: clockInTime, location: { type: 'Point', coordinates: [offsetLng, offsetLat] }, address: zone.address, zone: zone._id, zoneName: zone.name, distanceFromZone: dist, isWithinZone: !hasViolation, deviceInfo: 'Chrome/Mobile' },
        clockOut: { time: clockOutTime, location: { type: 'Point', coordinates: [offsetLng, offsetLat] }, address: zone.address, zone: zone._id, zoneName: zone.name, distanceFromZone: dist, isWithinZone: !hasViolation, deviceInfo: 'Chrome/Mobile' },
        status: 'present',
        isLate,
        geofenceViolation: hasViolation,
        violationNote: hasViolation ? `${dist}m from zone boundary` : undefined,
      });
    }
  }

  await Attendance.insertMany(records);
  console.log(`✅ Attendance records seeded (${records.length})`);
  console.log('📍 Zones:', zones.map(z => z.name).join(', '));
  process.exit(0);
};

seedAttendance().catch(e => { console.error(e); process.exit(1); });
