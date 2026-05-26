/**
 * Seed script — creates a demo tenant with default admin user.
 * Run:  node src/scripts/seedDemo.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Category = require('../models/Category');
const Board = require('../models/Board');
const Notice = require('../models/Notice');
const { ROLES, ROLE_PERMISSIONS } = require('../config/constants');

const DEMO_ADMIN = {
  email: 'admin@noticeboard.local',
  password: 'admin123',
  name: 'Demo Admin',
};

const DEMO_TENANT = {
  name: 'Demo Company',
  slug: 'demo-company',
  industry: 'IT',
};

async function seed() {
  await connectDB();
  console.log('🌱 Starting demo seed...\n');

  // Check if demo already exists
  const existing = await Tenant.findOne({ slug: DEMO_TENANT.slug });
  if (existing) {
    console.log('⚠️  Demo tenant already exists. Drop the database first to re-seed.');
    console.log(`   Email: ${DEMO_ADMIN.email}`);
    console.log(`   Password: ${DEMO_ADMIN.password}`);
    process.exit(0);
  }

  // 1. Create tenant
  const tenant = await Tenant.create(DEMO_TENANT);
  console.log(`✅ Tenant created: ${tenant.name} (${tenant.slug})`);

  // 2. Create admin user
  const user = await User.create({
    tenantId: tenant._id,
    email: DEMO_ADMIN.email,
    passwordHash: DEMO_ADMIN.password,
    name: DEMO_ADMIN.name,
    role: ROLES.OWNER,
    permissions: ROLE_PERMISSIONS.owner,
  });
  console.log(`✅ Admin user created: ${user.email}`);

  // 3. Create categories
  const categories = await Category.insertMany([
    { tenantId: tenant._id, name: 'General', color: '#3B82F6', icon: '📢', order: 1 },
    { tenantId: tenant._id, name: 'Urgent', color: '#EF4444', icon: '🚨', order: 2 },
    { tenantId: tenant._id, name: 'Events', color: '#8B5CF6', icon: '📅', order: 3 },
    { tenantId: tenant._id, name: 'HR', color: '#10B981', icon: '👥', order: 4 },
    { tenantId: tenant._id, name: 'IT Updates', color: '#F59E0B', icon: '💻', order: 5 },
  ]);
  console.log(`✅ Created ${categories.length} categories`);

  // 4. Create sample notices
  const notices = await Notice.insertMany([
    {
      tenantId: tenant._id,
      title: 'Welcome to NoticeBoard!',
      content: '<p>This is your digital signage platform. Create notices, configure display boards, and broadcast information across your organization.</p><p>Start by exploring the dashboard and creating your first notice.</p>',
      type: 'html',
      priority: 3,
      status: 'active',
      category: categories[0]._id,
      createdBy: user._id,
      displayConfig: { size: 'large', gridSpan: { cols: 2, rows: 1 }, bgColor: '#1E3A5F', textColor: '#E2E8F0', animation: 'fade' },
      tags: ['welcome', 'getting-started'],
    },
    {
      tenantId: tenant._id,
      title: 'System Maintenance — Saturday 2 AM',
      content: '<p>Scheduled server maintenance this Saturday from 2:00 AM to 4:00 AM IST. All services will be temporarily unavailable.</p><p>Please save your work before the maintenance window.</p>',
      type: 'html',
      priority: 1,
      status: 'active',
      category: categories[1]._id,
      createdBy: user._id,
      displayConfig: { size: 'medium', gridSpan: { cols: 1, rows: 1 }, bgColor: '#7F1D1D', textColor: '#FEE2E2', animation: 'slide' },
      tags: ['maintenance', 'downtime'],
    },
    {
      tenantId: tenant._id,
      title: 'Team Building Friday — Bowling Night 🎳',
      content: '<p>Join us this Friday at 6 PM for a fun bowling night! Food and drinks will be provided.</p><p>RSVP by Wednesday to secure your spot. Transportation will be arranged from office.</p>',
      type: 'html',
      priority: 4,
      status: 'active',
      category: categories[2]._id,
      createdBy: user._id,
      displayConfig: { size: 'medium', gridSpan: { cols: 1, rows: 1 }, bgColor: '#1E1B4B', textColor: '#C4B5FD', animation: 'zoom' },
      tags: ['team-building', 'social'],
    },
    {
      tenantId: tenant._id,
      title: 'New Leave Policy Update',
      content: '<p>Effective next month, the company will offer <strong>5 additional wellness days</strong> per year. These can be used for mental health breaks, personal wellness activities, or family time.</p><p>Check the HR portal for full details.</p>',
      type: 'html',
      priority: 2,
      status: 'active',
      category: categories[3]._id,
      createdBy: user._id,
      displayConfig: { size: 'medium', gridSpan: { cols: 1, rows: 1 }, bgColor: '#064E3B', textColor: '#A7F3D0', animation: 'slide' },
      tags: ['hr', 'policy'],
    },
    {
      tenantId: tenant._id,
      title: 'VPN Configuration Change',
      content: '<p>The IT team has updated VPN certificates. Please download the new configuration file from the IT self-service portal.</p><p>Old certificates will stop working on Friday.</p>',
      type: 'html',
      priority: 2,
      status: 'active',
      category: categories[4]._id,
      createdBy: user._id,
      displayConfig: { size: 'small', gridSpan: { cols: 1, rows: 1 }, bgColor: '#451A03', textColor: '#FDE68A', animation: 'none' },
      tags: ['it', 'vpn'],
    },
  ]);
  console.log(`✅ Created ${notices.length} sample notices`);

  // 5. Create demo board
  const board = await Board.create({
    tenantId: tenant._id,
    name: 'Main Lobby Display',
    description: 'Primary display board for the office lobby',
    displayMode: 'carousel',
    layout: { columns: 2, rows: 2, gap: 16 },
    carousel: { autoPlay: true, interval: 8, transition: 'slide', pauseOnHover: true, showIndicators: true, showNavigation: true },
    autoScroll: { enabled: false, speed: 30, direction: 'up', pauseOnHover: true },
    theme: {
      bgColor: '#0F172A',
      headerVisible: true,
      headerText: 'Demo Company — NoticeBoard',
      clockVisible: true,
      dateVisible: true,
      logoVisible: true,
      fontFamily: 'Inter',
      fontSize: 'medium',
    },
  });
  console.log(`✅ Created display board: ${board.name}`);

  console.log('\n' + '═'.repeat(50));
  console.log('🎉 Demo seeding complete!\n');
  console.log('  📧 Email:    ' + DEMO_ADMIN.email);
  console.log('  🔑 Password: ' + DEMO_ADMIN.password);
  console.log('  🌐 Admin:    http://localhost:4200');
  console.log('  📺 Display:  http://localhost:4200/display/' + board._id);
  console.log('═'.repeat(50) + '\n');

  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
