require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Connected to:', mongoose.connection.name);

  const User = require('./src/models/User');

  // Show all current users
  const users = await User.find({}).select('name email role isActive');
  console.log('\nCurrent users in database:');
  users.forEach(u => console.log(' -', u.isActive ? '✅' : '❌', u.role, '|', u.name, '|', u.email));

  if (!users.length) {
    console.log('\n⚠️  No users found! Running seed first...');
    await mongoose.disconnect();
    process.exit(2); // Signal: need to seed
  }

  // Reset ALL passwords to Password@123
  const hash = await bcrypt.hash('Password@123', 12);
  const result = await User.collection.updateMany(
    {},
    { $set: { password: hash, isActive: true, passwordChangedAt: null } }
  );

  console.log('\n✅ Password reset for', result.modifiedCount, 'users');
  console.log('✅ All users set to active');
  console.log('\nLogin credentials:');
  console.log('  Admin:    admin@salespulse.com  /  Password@123');
  console.log('  Sales 1:  priya@salespulse.com  /  Password@123');
  console.log('  Sales 2:  rahul@salespulse.com  /  Password@123');
  console.log('\nTest login with: curl -X POST http://localhost:5000/api/auth/login \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d "{\\"email\\":\\"admin@salespulse.com\\",\\"password\\":\\"Password@123\\"}"');

  await mongoose.disconnect();
  process.exit(0);
}).catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
