require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const migrate = async () => {
  await connectDB();
  const Interaction = require('../models/Interaction');

  // Find all interactions missing activityTypes
  const result = await Interaction.updateMany(
    { activityTypes: { $exists: false }, callType: { $exists: true, $ne: null } },
    [{ $set: { activityTypes: ['$callType'], visitOutcomes: { $ifNull: ['$visitOutcomes', []] } } }]
  );
  console.log(`✅ Migrated ${result.modifiedCount} interactions — added activityTypes from callType`);

  // Also fix records with empty activityTypes array
  const result2 = await Interaction.updateMany(
    { activityTypes: { $size: 0 }, callType: { $exists: true, $ne: null } },
    [{ $set: { activityTypes: ['$callType'] } }]
  );
  console.log(`✅ Fixed ${result2.modifiedCount} interactions with empty activityTypes`);

  process.exit(0);
};

migrate().catch(e => { console.error(e); process.exit(1); });
