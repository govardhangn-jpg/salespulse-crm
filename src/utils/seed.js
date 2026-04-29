require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User        = require('../models/User');
const Customer    = require('../models/Customer');
const Product     = require('../models/Product');
const Interaction = require('../models/Interaction');
const Notification = require('../models/Notification');
const connectDB   = require('../config/db');

const seed = async () => {
  await connectDB();
  console.log('🌱 Starting seed...');

  // Clear all collections
  const collections = ['users','customers','products','interactions',
                       'inventories','notifications','attendances','geofencezones'];
  for (const col of collections) {
    try { await mongoose.connection.collection(col).deleteMany({}); } catch(e) {}
  }
  console.log('🗑️  Cleared existing data');

  // ── USERS ──────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Password@123', 12);

  const [admin, priya, rahul] = await User.insertMany([
    {
      name: 'Arjun Kumar',
      email: 'admin@magmaticndt.com',
      password: passwordHash,
      role: 'admin',
      assignedStates: ['Maharashtra','Gujarat','Karnataka','Tamil Nadu','Delhi'],
      phone: '9876500001',
      isActive: true,
    },
    {
      name: 'Priya Mehta',
      email: 'priya@salespulse.com',
      password: passwordHash,
      role: 'sales_rep',
      assignedStates: ['Maharashtra','Karnataka'],
      phone: '9876500002',
      isActive: true,
    },
    {
      name: 'Rahul Singh',
      email: 'rahul@salespulse.com',
      password: passwordHash,
      role: 'sales_rep',
      assignedStates: ['Gujarat'],
      phone: '9876500003',
      isActive: true,
    },
  ]);
  console.log('👤 Users seeded (3)');

  // ── PRODUCTS (new enum values) ─────────────────────────
  const products = await Product.insertMany([
    // MPI Machine
    { name: 'MPI Pro 500',          group: 'MPI Machine',          sku: 'MPI-500',  isPending: false, isActive: true },
    { name: 'MPI Compact 200',      group: 'MPI Machine',          sku: 'MPI-200',  isPending: false, isActive: true },
    // FPI Machine
    { name: 'FPI Fluorescent X1',   group: 'FPI Machine',          sku: 'FPI-X1',   isPending: false, isActive: true },
    { name: 'FPI Visible V2',       group: 'FPI Machine',          sku: 'FPI-V2',   isPending: false, isActive: true },
    // EDDY Current
    { name: 'EDDY Scan EC100',      group: 'EDDY Current Machine', sku: 'EC-100',   isPending: false, isActive: true },
    { name: 'EDDY Probe EP200',     group: 'EDDY Current Machine', sku: 'EP-200',   isPending: false, isActive: true },
    // Consumables
    { name: 'MPI Ink Black 1L',     group: 'Consumables',          sku: 'CS-INK1',  isPending: false, isActive: true },
    { name: 'FPI Penetrant 500ml',  group: 'Consumables',          sku: 'CS-PEN1',  isPending: false, isActive: true },
    { name: 'Developer Spray 400ml',group: 'Consumables',          sku: 'CS-DEV1',  isPending: false, isActive: true },
    // Spares
    { name: 'UV Lamp 100W',         group: 'Spares',               sku: 'SP-UVL1',  isPending: false, isActive: true },
    { name: 'Probe Cable 2m',       group: 'Spares',               sku: 'SP-PC2M',  isPending: false, isActive: true },
    // Accessories
    { name: 'Calibration Block Set',group: 'Accessories',          sku: 'AC-CBS1',  isPending: false, isActive: true },
    // Service
    { name: 'Annual Maintenance Contract', group: 'Service',       sku: 'SV-AMC1',  isPending: false, isActive: true },
    { name: 'Calibration Service',  group: 'Service',              sku: 'SV-CAL1',  isPending: false, isActive: true },
    // Others
    { name: 'Training Program',     group: 'Others',               sku: 'OT-TRN1',  isPending: false, isActive: true },
  ]);

  const byName = (name) => products.find(p => p.name === name);
  console.log('📦 Products seeded (15)');

  // ── CUSTOMERS ──────────────────────────────────────────
  const [apex, reliance, techparts, sunrise, autoparts] = await Customer.insertMany([
    {
      name: 'APEX MANUFACTURING PVT LTD',
      email: 'purchase@apexmfg.com',
      phone: '9876512345',
      segment: { category: 'Industry', value: 'Manufacturing' },
      unit: 'Unit 1',
      address: { street: '12 MIDC Road, Bhosari', city: 'Pune', state: 'Maharashtra', pinCode: '411026' },
      competition: 'Existing Account',
      contacts: [
        { name: 'Rajesh Mehta', phone: '9876512345', designation: 'Purchase Manager', email: 'r.mehta@apex.com', isPrimary: true },
        { name: 'Sunita Patel', phone: '9876567890', designation: 'Director', email: 's.patel@apex.com' },
      ],
      productInterests: [
        { productGroup: 'Consumables', productId: byName('MPI Ink Black 1L')._id, productName: 'MPI Ink Black 1L', potentialRevenue: 4.5 },
        { productGroup: 'MPI Machine', productId: byName('MPI Pro 500')._id,      productName: 'MPI Pro 500',      potentialRevenue: 25 },
      ],
      competitors: [{ name: 'Magnaflux', notes: 'Currently using' }],
      status: 'active', isPending: false,
      submittedBy: priya._id, approvedBy: admin._id, approvedAt: new Date(), assignedTo: priya._id,
    },
    {
      name: 'RELIANCE INDUSTRIES LTD',
      email: 'ndt@reliance.com',
      phone: '9822211111',
      segment: { category: 'Industry', value: 'Manufacturing' },
      unit: 'Plant - Nashik',
      address: { street: 'Plot 7, Satpur MIDC', city: 'Nashik', state: 'Maharashtra', pinCode: '422007' },
      competition: 'Competitor Account',
      contacts: [{ name: 'Vikram Shah', phone: '9822211111', designation: 'GM Operations', email: 'v.shah@reliance.com', isPrimary: true }],
      productInterests: [
        { productGroup: 'FPI Machine', productId: byName('FPI Fluorescent X1')._id, productName: 'FPI Fluorescent X1', potentialRevenue: 18 },
        { productGroup: 'Consumables', productId: byName('FPI Penetrant 500ml')._id, productName: 'FPI Penetrant 500ml', potentialRevenue: 3.2 },
      ],
      competitors: [{ name: 'Olympus NDT', notes: 'Preferred vendor' }],
      status: 'active', isPending: false,
      submittedBy: priya._id, approvedBy: admin._id, approvedAt: new Date(), assignedTo: priya._id,
    },
    {
      name: 'TECHPARTS LTD',
      email: 'qa@techparts.in',
      phone: '9909922222',
      segment: { category: 'Industry', value: 'Automotive' },
      unit: 'Unit 2',
      address: { street: 'B-45, Sachin GIDC', city: 'Surat', state: 'Gujarat', pinCode: '394230' },
      competition: 'New Account',
      contacts: [{ name: 'Amitabh Roy', phone: '9909922222', designation: 'CEO', email: 'a.roy@techparts.in', isPrimary: true }],
      productInterests: [
        { productGroup: 'EDDY Current Machine', productId: byName('EDDY Scan EC100')._id, productName: 'EDDY Scan EC100', potentialRevenue: 12 },
      ],
      competitors: [],
      status: 'active', isPending: false,
      submittedBy: rahul._id, approvedBy: admin._id, approvedAt: new Date(), assignedTo: rahul._id,
    },
    {
      name: 'SUNRISE PHARMACEUTICALS',
      email: 'admin@sunrise-pharma.com',
      phone: '8000033333',
      segment: { category: 'Industry', value: 'Pharma' },
      unit: 'Plant - Bengaluru',
      address: { street: '22 Electronics City Phase 2', city: 'Bengaluru', state: 'Karnataka', pinCode: '560100' },
      competition: 'Existing Account',
      contacts: [{ name: 'Dr. Kavita Rao', phone: '8000033333', designation: 'Admin Head', email: 'k.rao@sunrise-pharma.com', isPrimary: true }],
      productInterests: [
        { productGroup: 'Service', productId: byName('Annual Maintenance Contract')._id, productName: 'Annual Maintenance Contract', potentialRevenue: 15 },
        { productGroup: 'Service', productId: byName('Calibration Service')._id, productName: 'Calibration Service', potentialRevenue: 5 },
      ],
      competitors: [],
      status: 'active', isPending: false,
      submittedBy: priya._id, approvedBy: admin._id, approvedAt: new Date(), assignedTo: priya._id,
    },
    {
      name: 'AUTOPARTS CO',
      email: 'purchase@autoparts.co',
      phone: '4444455555',
      segment: { category: 'Industry', value: 'Automotive' },
      unit: 'Unit 3',
      address: { street: 'Old Mahabalipuram Road', city: 'Chennai', state: 'Tamil Nadu', pinCode: '603103' },
      competition: 'Competitor Account',
      contacts: [{ name: 'Suresh Nair', phone: '4444455555', designation: 'Purchase Head', email: 's.nair@autoparts.co', isPrimary: true }],
      productInterests: [
        { productGroup: 'MPI Machine', productId: byName('MPI Compact 200')._id, productName: 'MPI Compact 200', potentialRevenue: 20 },
      ],
      competitors: [{ name: 'Zetec' }, { name: 'GE Inspection' }],
      status: 'active', isPending: false,
      submittedBy: admin._id, approvedBy: admin._id, approvedAt: new Date(), assignedTo: admin._id,
    },
  ]);
  console.log('🏢 Customers seeded (5)');

  // ── INTERACTIONS ───────────────────────────────────────
  const now = new Date();
  const daysAgo = (d) => new Date(now - d * 86400000);

  await Interaction.insertMany([
    {
      customer: apex._id, salesperson: priya._id,
      productGroup: 'MPI Machine', product: byName('MPI Pro 500')._id, productName: 'MPI Pro 500',
      activityTypes: ['Follow-up'], callType: 'Follow-up',
      visitOutcomes: ['Relationship Management', 'Demo Planned'],
      interactionDate: daysAgo(1),
      notes: 'Customer confirmed interest in MPI Pro 500. Demo scheduled for next week.',
      nextAction: { type: 'Schedule Demo', dueDate: new Date(now.getTime() + 7*86400000), assignedTo: priya._id, isCompleted: false },
    },
    {
      customer: reliance._id, salesperson: priya._id,
      productGroup: 'FPI Machine', product: byName('FPI Fluorescent X1')._id, productName: 'FPI Fluorescent X1',
      activityTypes: ['Cold Call'], callType: 'Cold Call',
      visitOutcomes: ['Contact Person Not Available'],
      interactionDate: daysAgo(2),
      notes: 'Contact person was not available. Will follow up Thursday.',
      nextAction: { type: 'Trial Follow-up', dueDate: new Date(now.getTime() + 2*86400000), assignedTo: priya._id, isCompleted: false },
    },
    {
      customer: techparts._id, salesperson: rahul._id,
      productGroup: 'EDDY Current Machine', product: byName('EDDY Scan EC100')._id, productName: 'EDDY Scan EC100',
      activityTypes: ['Demo'], callType: 'Demo',
      visitOutcomes: ['Demo Done', 'Catalogue/Business Card Given'],
      interactionDate: daysAgo(3),
      notes: 'Demo completed successfully. Customer very interested.',
      nextAction: { type: 'Send Quote', dueDate: new Date(now.getTime() + 3*86400000), assignedTo: rahul._id, isCompleted: false },
    },
    {
      customer: sunrise._id, salesperson: priya._id,
      productGroup: 'Service', product: byName('Calibration Service')._id, productName: 'Calibration Service',
      activityTypes: ['Service','Calibration'], callType: 'Service',
      visitOutcomes: ['Calibration Done', 'Service Done'],
      interactionDate: daysAgo(4),
      notes: 'Annual calibration completed. Customer satisfied.',
      nextAction: { type: 'Close Deal', dueDate: new Date(now.getTime() + 10*86400000), assignedTo: priya._id, isCompleted: false },
    },
    {
      customer: autoparts._id, salesperson: admin._id,
      productGroup: 'MPI Machine', product: byName('MPI Compact 200')._id, productName: 'MPI Compact 200',
      activityTypes: ['Negotiation'], callType: 'Negotiation',
      visitOutcomes: ['PO Collected'],
      interactionDate: daysAgo(1),
      notes: 'PO collected for MPI Compact 200. Order confirmed.',
      nextAction: { type: 'Close Deal', dueDate: new Date(now.getTime() + 5*86400000), assignedTo: admin._id, isCompleted: false },
    },
  ]);
  console.log('📞 Interactions seeded (5)');

  // ── NOTIFICATIONS ──────────────────────────────────────
  await Notification.insertMany([
    {
      recipient: admin._id,
      type: 'approval_needed',
      title: 'Welcome to SalesPulse CRM',
      message: 'System seeded successfully. All demo data is ready.',
      isRead: false,
    },
    {
      recipient: priya._id,
      type: 'reminder',
      title: 'Follow-up due: Reliance Industries',
      message: 'Scheduled follow-up call is due in 2 days.',
      isRead: false,
    },
  ]);
  console.log('🔔 Notifications seeded (2)');

  console.log('\n✅ Seed complete!\n');
  console.log('─────────────────────────────────────────');
  console.log('  Login credentials (password: Password@123)');
  console.log('  Admin:    admin@magmaticndt.com');
  console.log('  Sales 1:  priya@salespulse.com  (Maharashtra, Karnataka)');
  console.log('  Sales 2:  rahul@salespulse.com  (Gujarat)');
  console.log('─────────────────────────────────────────\n');

  process.exit(0);
};

seed().catch(err => { console.error('❌ Seed error:', err); process.exit(1); });
