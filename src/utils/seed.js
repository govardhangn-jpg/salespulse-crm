require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Interaction = require('../models/Interaction');
const Inventory = require('../models/Inventory');
const Notification = require('../models/Notification');

const connectDB = require('../config/db');

const seed = async () => {
  await connectDB();
  console.log('🌱 Starting seed...');

  // Clear all collections
  await Promise.all([
    User.deleteMany({}),
    Customer.deleteMany({}),
    Product.deleteMany({}),
    Interaction.deleteMany({}),
    Inventory.deleteMany({}),
    Notification.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data');

  // ─── USERS ────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Password@123', 12);

  const [admin, priya, rahul] = await User.insertMany([
    {
      name: 'Arjun Kumar',
      email: 'admin@salespulse.com',
      password: passwordHash,
      role: 'admin',
      assignedStates: ['Maharashtra', 'Gujarat', 'Karnataka', 'Tamil Nadu', 'Delhi'],
      phone: '+91 98765 00001',
      isActive: true,
    },
    {
      name: 'Priya Mehta',
      email: 'priya@salespulse.com',
      password: passwordHash,
      role: 'sales_rep',
      assignedStates: ['Maharashtra', 'Karnataka'],
      phone: '+91 98765 00002',
      isActive: true,
    },
    {
      name: 'Rahul Singh',
      email: 'rahul@salespulse.com',
      password: passwordHash,
      role: 'sales_rep',
      assignedStates: ['Gujarat'],
      phone: '+91 98765 00003',
      isActive: true,
    },
  ]);
  console.log('👤 Users seeded (3)');

  // ─── PRODUCTS ─────────────────────────────────────────
  const products = await Product.insertMany([
    { name: 'Printer LaserJet 500', group: 'Hardware', sku: 'HW-LJ500', defaultThreshold: 5, isPending: false },
    { name: 'Scanner Pro X', group: 'Hardware', sku: 'HW-SPX', defaultThreshold: 3, isPending: false },
    { name: 'Label Maker LX', group: 'Hardware', sku: 'HW-LLX', defaultThreshold: 5, isPending: false },
    { name: 'Barcode Reader Z', group: 'Hardware', sku: 'HW-BRZ', defaultThreshold: 4, isPending: false },
    { name: 'ERP Suite Pro', group: 'Software', sku: 'SW-ERP', defaultThreshold: 1, isPending: false },
    { name: 'Inventory Manager', group: 'Software', sku: 'SW-INV', defaultThreshold: 1, isPending: false },
    { name: 'Analytics Dashboard', group: 'Software', sku: 'SW-ADX', defaultThreshold: 1, isPending: false },
    { name: 'Toner Cartridge Black', group: 'Consumables', sku: 'CS-TCB', defaultThreshold: 10, isPending: false },
    { name: 'Ink Pack Color', group: 'Consumables', sku: 'CS-IPC', defaultThreshold: 8, isPending: false },
    { name: 'Label Rolls 50mm', group: 'Consumables', sku: 'CS-LR50', defaultThreshold: 15, isPending: false },
    { name: 'Thermal Paper A4', group: 'Consumables', sku: 'CS-TPA4', defaultThreshold: 10, isPending: false },
    { name: 'Annual Maintenance Contract', group: 'Services', sku: 'SV-AMC', defaultThreshold: 1, isPending: false },
    { name: 'Installation Service', group: 'Services', sku: 'SV-INS', defaultThreshold: 1, isPending: false },
    // Pending product
    { name: 'HP Ink X500', group: null, isPending: true, submittedBy: priya._id, isActive: true },
  ]);

  const hw = (name) => products.find((p) => p.name === name);
  console.log('📦 Products seeded (14)');

  // ─── CUSTOMERS ────────────────────────────────────────
  const [apex, reliance, techparts, sunrise, autoparts, greenfields] = await Customer.insertMany([
    {
      name: 'Apex Manufacturing Pvt Ltd',
      segment: { category: 'Industry', value: 'Manufacturing' },
      unit: 'Unit 1',
      address: { street: '12 MIDC Road, Bhosari', city: 'Pune', state: 'Maharashtra', pinCode: '411026' },
      competition: 'Existing Account',
      contacts: [
        { name: 'Rajesh Mehta', phone: '+91 98765 12345', designation: 'Purchase Manager', email: 'r.mehta@apex.com', isPrimary: true },
        { name: 'Sunita Patel', phone: '+91 98765 67890', designation: 'Director', email: 's.patel@apex.com' },
      ],
      productInterests: [
        { productGroup: 'Consumables', productId: hw('Toner Cartridge Black')._id, productName: 'Toner Cartridge Black', potentialRevenue: 4.5 },
        { productGroup: 'Software', productId: hw('ERP Suite Pro')._id, productName: 'ERP Suite Pro', potentialRevenue: 25 },
      ],
      competitors: [{ name: 'Canon India', notes: 'Currently using for printers' }, { name: 'HP Enterprise' }],
      status: 'active', isPending: false,
      submittedBy: priya._id, approvedBy: admin._id, approvedAt: new Date(), assignedTo: priya._id,
    },
    {
      name: 'Reliance Textiles Ltd',
      segment: { category: 'Industry', value: 'Textiles' },
      unit: 'Plant - Nashik',
      address: { street: 'Plot 7, Satpur MIDC', city: 'Nashik', state: 'Maharashtra', pinCode: '422007' },
      competition: 'Competitor Account',
      contacts: [{ name: 'Vikram Shah', phone: '+91 98222 11111', designation: 'GM Operations', email: 'v.shah@reliance-tex.com', isPrimary: true }],
      productInterests: [
        { productGroup: 'Consumables', productId: hw('Label Rolls 50mm')._id, productName: 'Label Rolls 50mm', potentialRevenue: 3.2 },
        { productGroup: 'Hardware', productId: hw('Scanner Pro X')._id, productName: 'Scanner Pro X', potentialRevenue: 8 },
      ],
      competitors: [{ name: 'Zebra Technologies', notes: 'Preferred for label printing' }],
      status: 'active', isPending: false,
      submittedBy: priya._id, approvedBy: admin._id, approvedAt: new Date(), assignedTo: priya._id,
    },
    {
      name: 'TechParts Ltd',
      segment: { category: 'Industry', value: 'Automotive' },
      unit: 'Unit 2',
      address: { street: 'B-45, Sachin GIDC', city: 'Surat', state: 'Gujarat', pinCode: '394230' },
      competition: 'New Account',
      contacts: [{ name: 'Amitabh Roy', phone: '+91 99099 22222', designation: 'CEO', email: 'a.roy@techparts.in', isPrimary: true }],
      productInterests: [
        { productGroup: 'Hardware', productId: hw('Barcode Reader Z')._id, productName: 'Barcode Reader Z', potentialRevenue: 6 },
      ],
      competitors: [],
      status: 'active', isPending: false,
      submittedBy: rahul._id, approvedBy: admin._id, approvedAt: new Date(), assignedTo: rahul._id,
    },
    {
      name: 'Sunrise Pharmaceuticals',
      segment: { category: 'Industry', value: 'Pharma' },
      unit: 'Plant - Bengaluru',
      address: { street: '22 Electronics City Phase 2', city: 'Bengaluru', state: 'Karnataka', pinCode: '560100' },
      competition: 'Existing Account',
      contacts: [{ name: 'Dr. Kavita Rao', phone: '+91 80000 33333', designation: 'Admin Head', email: 'k.rao@sunrise-pharma.com', isPrimary: true }],
      productInterests: [
        { productGroup: 'Consumables', productId: hw('Thermal Paper A4')._id, productName: 'Thermal Paper A4', potentialRevenue: 2.8 },
        { productGroup: 'Services', productId: hw('Annual Maintenance Contract')._id, productName: 'Annual Maintenance Contract', potentialRevenue: 15 },
      ],
      competitors: [{ name: '3M Healthcare' }],
      status: 'active', isPending: false,
      submittedBy: priya._id, approvedBy: admin._id, approvedAt: new Date(), assignedTo: priya._id,
    },
    {
      name: 'AutoParts Co',
      segment: { category: 'Industry', value: 'Automotive' },
      unit: 'Unit 3',
      address: { street: 'Old Mahabalipuram Road, Siruseri', city: 'Chennai', state: 'Tamil Nadu', pinCode: '603103' },
      competition: 'Competitor Account',
      contacts: [{ name: 'Suresh Nair', phone: '+91 44444 55555', designation: 'Purchase Head', email: 's.nair@autoparts.co', isPrimary: true }],
      productInterests: [
        { productGroup: 'Hardware', productId: hw('Printer LaserJet 500')._id, productName: 'Printer LaserJet 500', potentialRevenue: 12 },
      ],
      competitors: [{ name: 'HP Enterprise' }, { name: 'Epson India' }],
      status: 'active', isPending: false,
      submittedBy: admin._id, approvedBy: admin._id, approvedAt: new Date(), assignedTo: admin._id,
    },
    {
      name: 'Green Fields Agro Pvt Ltd',
      segment: { category: 'Industry', value: 'Manufacturing' },
      unit: 'Unit 1',
      address: { street: 'Wardha Road, Hingna', city: 'Nagpur', state: 'Maharashtra', pinCode: '440016' },
      competition: 'New Account',
      contacts: [],
      productInterests: [],
      competitors: [],
      status: 'pending', isPending: true,
      submittedBy: admin._id, assignedTo: admin._id,
    },
  ]);
  console.log('🏢 Customers seeded (6)');

  // ─── INTERACTIONS ─────────────────────────────────────
  const now = new Date();
  const daysAgo = (d) => new Date(now - d * 86400000);
  const hoursFromNow = (h) => new Date(now.getTime() + h * 3600000);

  const interactions = await Interaction.insertMany([
    {
      customer: apex._id, salesperson: priya._id,
      productGroup: 'Consumables', product: hw('Toner Cartridge Black')._id, productName: 'Toner Cartridge Black',
      activityTypes: ['Follow-up'], callType: 'Follow-up', interactionDate: daysAgo(0),
      notes: 'Customer confirmed requirement of 50 units. Requested revised pricing for bulk order.',
      quickNoteUsed: null,
      stockSnapshot: { unitsAtSite: 24, threshold: 20, isBelowThreshold: false },
      nextAction: { type: 'Send Quote', dueDate: hoursFromNow(6), assignedTo: priya._id, isCompleted: false, reminderSent: false },
    },
    {
      customer: reliance._id, salesperson: priya._id,
      productGroup: 'Hardware', product: hw('Scanner Pro X')._id, productName: 'Scanner Pro X',
      activityTypes: ['Cold Call'], callType: 'Cold Call', interactionDate: daysAgo(0),
      notes: 'Customer not available. Admin mentioned they are evaluating options. Follow up Thursday.',
      quickNoteUsed: 'Customer not available',
      nextAction: { type: 'Follow-up', dueDate: hoursFromNow(48), assignedTo: priya._id, isCompleted: false, reminderSent: false },
    },
    {
      customer: techparts._id, salesperson: rahul._id,
      productGroup: 'Hardware', product: hw('Barcode Reader Z')._id, productName: 'Barcode Reader Z',
      activityTypes: ['Demo'], callType: 'Demo', interactionDate: daysAgo(1),
      notes: 'Interested in trial. Requested demo for 2 units. Very positive conversation — CEO personally engaged.',
      quickNoteUsed: 'Interested in trial',
      nextAction: { type: 'Schedule Demo', dueDate: hoursFromNow(72), assignedTo: rahul._id, isCompleted: false, reminderSent: false },
    },
    {
      customer: sunrise._id, salesperson: priya._id,
      productGroup: 'Consumables', product: hw('Thermal Paper A4')._id, productName: 'Thermal Paper A4',
      activityTypes: ['Service'], callType: 'Service', interactionDate: daysAgo(1),
      notes: 'Price too high — needs revision. Asked for bundled pricing with Annual Maintenance Contract.',
      quickNoteUsed: 'Price too high — needs revision',
      stockSnapshot: { unitsAtSite: 2, threshold: 10, isBelowThreshold: true },
      nextAction: { type: 'Send Quote', dueDate: hoursFromNow(96), assignedTo: priya._id, isCompleted: false, reminderSent: false },
    },
    {
      customer: autoparts._id, salesperson: admin._id,
      productGroup: 'Hardware', product: hw('Printer LaserJet 500')._id, productName: 'Printer LaserJet 500',
      activityTypes: ['Demo'], callType: 'Demo', interactionDate: daysAgo(2),
      notes: 'Demo scheduled and confirmed. Customer very interested in replacing existing HP units.',
      nextAction: { type: 'Close Deal', dueDate: hoursFromNow(120), assignedTo: admin._id, isCompleted: false, reminderSent: false },
    },
  ]);
  console.log('📞 Interactions seeded (5)');

  // ─── INVENTORY ────────────────────────────────────────
  await Inventory.insertMany([
    { customer: apex._id, product: hw('Toner Cartridge Black')._id, productName: 'Toner Cartridge Black', productGroup: 'Consumables', currentStock: 24, threshold: 20, unit: 'cartridges', lastUpdatedBy: priya._id },
    { customer: sunrise._id, product: hw('Thermal Paper A4')._id, productName: 'Thermal Paper A4', productGroup: 'Consumables', currentStock: 2, threshold: 10, unit: 'reams', lastUpdatedBy: priya._id },
    { customer: reliance._id, product: hw('Label Rolls 50mm')._id, productName: 'Label Rolls 50mm', productGroup: 'Consumables', currentStock: 5, threshold: 15, unit: 'rolls', lastUpdatedBy: priya._id },
    { customer: autoparts._id, product: hw('Ink Pack Color')._id, productName: 'Ink Pack Color', productGroup: 'Consumables', currentStock: 8, threshold: 5, unit: 'packs', lastUpdatedBy: admin._id },
    { customer: techparts._id, product: hw('Toner Cartridge Black')._id, productName: 'Toner Cartridge Black', productGroup: 'Consumables', currentStock: 3, threshold: 10, unit: 'cartridges', lastUpdatedBy: rahul._id },
  ]);
  console.log('📊 Inventory seeded (5)');

  // ─── NOTIFICATIONS ────────────────────────────────────
  await Notification.insertMany([
    { recipient: admin._id, type: 'approval_needed', title: 'New customer pending: Green Fields Agro', message: 'Arjun Kumar submitted a new customer registration.', refModel: 'Customer', refId: greenfields._id, isRead: false },
    { recipient: admin._id, type: 'approval_needed', title: 'New product needs categorization: HP Ink X500', message: 'Priya Mehta submitted a new product that needs a group assigned.', refModel: 'Product', isRead: false },
    { recipient: priya._id, type: 'low_stock', title: 'Low stock: Thermal Paper A4 at Sunrise Pharma', message: 'Only 2 units remaining (threshold: 10). Reorder suggested.', isRead: false },
    { recipient: priya._id, type: 'reminder', title: 'Reminder: Send Quote — Apex Manufacturing', message: 'Due in 6 hours. Don\'t miss it!', isRead: false },
  ]);
  console.log('🔔 Notifications seeded (4)');

  console.log('\n✅ Seed complete!\n');
  console.log('─────────────────────────────────────────');
  console.log('  Login credentials (all passwords: Password@123)');
  console.log('  Admin:    admin@salespulse.com');
  console.log('  Sales 1:  priya@salespulse.com  (Maharashtra, Karnataka)');
  console.log('  Sales 2:  rahul@salespulse.com  (Gujarat)');
  console.log('─────────────────────────────────────────\n');

  process.exit(0);
};

seed().catch((err) => { console.error(err); process.exit(1); });
