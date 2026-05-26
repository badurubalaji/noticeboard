const Template = require('../models/Template');

const systemTemplates = [
  // === IT Industry Templates ===
  {
    name: 'Sprint Update',
    description: 'Display current sprint progress, velocity, and blockers',
    category: 'kpi',
    industry: ['IT'],
    html: `<div class="template-sprint">
  <div class="header"><span class="icon">🏃</span> {{sprintName}}</div>
  <div class="progress-bar"><div class="fill" style="width: {{progress}}%"></div></div>
  <div class="stats">
    <div class="stat"><span class="label">Stories</span><span class="value">{{completedStories}}/{{totalStories}}</span></div>
    <div class="stat"><span class="label">Velocity</span><span class="value">{{velocity}}</span></div>
    <div class="stat"><span class="label">Days Left</span><span class="value">{{daysLeft}}</span></div>
  </div>
  <div class="blockers" style="display:{{showBlockers}}"><span class="alert">⚠️</span> {{blockerText}}</div>
</div>`,
    css: `.template-sprint{padding:24px;background:linear-gradient(135deg,#1e293b,#334155);border-radius:16px;color:#f1f5f9;font-family:Inter,sans-serif}.header{font-size:1.5rem;font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:8px}.progress-bar{height:8px;background:#475569;border-radius:4px;overflow:hidden;margin-bottom:20px}.fill{height:100%;background:linear-gradient(90deg,#3b82f6,#06b6d4);border-radius:4px;transition:width .5s}.stats{display:flex;gap:16px}.stat{flex:1;text-align:center;padding:12px;background:#1e293b;border-radius:8px}.label{display:block;font-size:.75rem;color:#94a3b8;text-transform:uppercase}.value{display:block;font-size:1.5rem;font-weight:700;margin-top:4px}.blockers{margin-top:16px;padding:12px;background:#7f1d1d33;border-radius:8px;border:1px solid #f87171}`,
    fields: [
      { key: 'sprintName', label: 'Sprint Name', type: 'text', defaultValue: 'Sprint 42', required: true },
      { key: 'progress', label: 'Progress (%)', type: 'number', defaultValue: '65' },
      { key: 'completedStories', label: 'Completed Stories', type: 'number', defaultValue: '13' },
      { key: 'totalStories', label: 'Total Stories', type: 'number', defaultValue: '20' },
      { key: 'velocity', label: 'Velocity', type: 'number', defaultValue: '34' },
      { key: 'daysLeft', label: 'Days Left', type: 'number', defaultValue: '5' },
      { key: 'showBlockers', label: 'Show Blockers', type: 'select', defaultValue: 'none', options: ['block', 'none'] },
      { key: 'blockerText', label: 'Blocker Text', type: 'textarea', defaultValue: '' },
    ],
  },
  {
    name: 'System Alert',
    description: 'Critical system alerts and incident notifications',
    category: 'alert',
    industry: ['IT'],
    html: `<div class="template-alert alert-{{severity}}">
  <div class="icon-row"><span class="pulse"></span><span class="severity-badge">{{severity}}</span></div>
  <h2>{{title}}</h2>
  <p>{{description}}</p>
  <div class="meta"><span>🕐 {{time}}</span><span>👤 {{assignee}}</span></div>
</div>`,
    css: `.template-alert{padding:24px;border-radius:16px;font-family:Inter,sans-serif;color:#fff}.alert-critical{background:linear-gradient(135deg,#7f1d1d,#991b1b);border:2px solid #f87171}.alert-warning{background:linear-gradient(135deg,#78350f,#92400e);border:2px solid #fbbf24}.alert-info{background:linear-gradient(135deg,#1e3a5f,#1e40af);border:2px solid #60a5fa}.icon-row{display:flex;align-items:center;gap:12px;margin-bottom:12px}.pulse{width:12px;height:12px;background:#f87171;border-radius:50%;animation:pulse 1.5s infinite}@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.2)}}.severity-badge{padding:4px 12px;border-radius:12px;font-size:.75rem;font-weight:700;text-transform:uppercase;background:#ffffff22}h2{margin:0 0 8px;font-size:1.25rem}.meta{margin-top:16px;display:flex;gap:16px;font-size:.85rem;color:#ffffff99}`,
    fields: [
      { key: 'severity', label: 'Severity', type: 'select', defaultValue: 'warning', options: ['critical', 'warning', 'info'], required: true },
      { key: 'title', label: 'Alert Title', type: 'text', defaultValue: 'Service Degradation', required: true },
      { key: 'description', label: 'Description', type: 'textarea', defaultValue: 'API response times elevated.' },
      { key: 'time', label: 'Time', type: 'text', defaultValue: '10:30 AM' },
      { key: 'assignee', label: 'Assignee', type: 'text', defaultValue: 'On-call Team' },
    ],
  },

  // === Logistics Templates ===
  {
    name: 'Shipment Tracker',
    description: 'Live shipment status and delivery tracking',
    category: 'kpi',
    industry: ['Logistics'],
    html: `<div class="template-shipment">
  <div class="header"><span>🚚</span> Shipment Dashboard</div>
  <div class="grid">
    <div class="card"><span class="number">{{inTransit}}</span><span class="label">In Transit</span></div>
    <div class="card"><span class="number">{{delivered}}</span><span class="label">Delivered</span></div>
    <div class="card"><span class="number">{{delayed}}</span><span class="label">Delayed</span></div>
    <div class="card"><span class="number">{{pending}}</span><span class="label">Pending</span></div>
  </div>
  <div class="update">Last updated: {{lastUpdate}}</div>
</div>`,
    css: `.template-shipment{padding:24px;background:linear-gradient(135deg,#0c4a6e,#164e63);border-radius:16px;color:#f0f9ff;font-family:Inter,sans-serif}.header{font-size:1.5rem;font-weight:700;margin-bottom:20px;display:flex;align-items:center;gap:8px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.card{padding:16px;background:#0e7490aa;border-radius:12px;text-align:center}.number{display:block;font-size:2rem;font-weight:800}.label{font-size:.8rem;color:#a5f3fc;text-transform:uppercase}.update{margin-top:16px;font-size:.75rem;color:#67e8f9;text-align:right}`,
    fields: [
      { key: 'inTransit', label: 'In Transit', type: 'number', defaultValue: '24' },
      { key: 'delivered', label: 'Delivered Today', type: 'number', defaultValue: '87' },
      { key: 'delayed', label: 'Delayed', type: 'number', defaultValue: '3' },
      { key: 'pending', label: 'Pending Pickup', type: 'number', defaultValue: '12' },
      { key: 'lastUpdate', label: 'Last Update', type: 'text', defaultValue: '2 min ago' },
    ],
  },

  // === Manufacturing Templates ===
  {
    name: 'Production KPI',
    description: 'Real-time production line metrics and OEE',
    category: 'kpi',
    industry: ['Manufacturing', 'Assembly'],
    html: `<div class="template-production">
  <div class="header"><span>🏭</span> {{lineName}}</div>
  <div class="oee"><div class="oee-circle"><span class="oee-value">{{oee}}%</span><span class="oee-label">OEE</span></div></div>
  <div class="metrics">
    <div class="metric"><span class="val">{{output}}</span><span class="lbl">Units/hr</span></div>
    <div class="metric"><span class="val">{{defects}}</span><span class="lbl">Defects</span></div>
    <div class="metric"><span class="val">{{downtime}}</span><span class="lbl">Downtime</span></div>
  </div>
  <div class="shift">Shift: {{shift}} | Target: {{target}} units</div>
</div>`,
    css: `.template-production{padding:24px;background:linear-gradient(135deg,#14532d,#166534);border-radius:16px;color:#f0fdf4;font-family:Inter,sans-serif}.header{font-size:1.5rem;font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:8px}.oee{text-align:center;margin:16px 0}.oee-circle{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;width:120px;height:120px;border-radius:50%;border:4px solid #4ade80;background:#16a34a33}.oee-value{font-size:2rem;font-weight:800}.oee-label{font-size:.75rem;color:#bbf7d0}.metrics{display:flex;gap:12px;margin:16px 0}.metric{flex:1;text-align:center;padding:12px;background:#15803d55;border-radius:8px}.val{display:block;font-size:1.5rem;font-weight:700}.lbl{font-size:.7rem;color:#86efac;text-transform:uppercase}.shift{text-align:center;font-size:.85rem;color:#86efac;margin-top:12px}`,
    fields: [
      { key: 'lineName', label: 'Line Name', type: 'text', defaultValue: 'Line A-1', required: true },
      { key: 'oee', label: 'OEE (%)', type: 'number', defaultValue: '87' },
      { key: 'output', label: 'Units/Hour', type: 'number', defaultValue: '142' },
      { key: 'defects', label: 'Defects', type: 'number', defaultValue: '3' },
      { key: 'downtime', label: 'Downtime (min)', type: 'number', defaultValue: '12' },
      { key: 'shift', label: 'Current Shift', type: 'select', defaultValue: 'Morning', options: ['Morning', 'Afternoon', 'Night'] },
      { key: 'target', label: 'Target Units', type: 'number', defaultValue: '500' },
    ],
  },

  // === Safety Alert (cross-industry) ===
  {
    name: 'Safety Notice',
    description: 'Safety announcements and hazard warnings',
    category: 'safety',
    industry: ['Manufacturing', 'Assembly', 'Logistics'],
    html: `<div class="template-safety">
  <div class="warning-stripe"></div>
  <div class="content">
    <div class="icon">⚠️</div>
    <h2>{{title}}</h2>
    <p>{{message}}</p>
    <div class="meta"><span>📅 {{date}}</span><span>📍 {{location}}</span></div>
  </div>
  <div class="warning-stripe"></div>
</div>`,
    css: `.template-safety{background:#fef3c7;border-radius:16px;overflow:hidden;color:#78350f;font-family:Inter,sans-serif}.warning-stripe{height:8px;background:repeating-linear-gradient(45deg,#f59e0b,#f59e0b 20px,#1e293b 20px,#1e293b 40px)}.content{padding:24px;text-align:center}.icon{font-size:3rem;margin-bottom:8px}h2{margin:0 0 12px;font-size:1.5rem;font-weight:800}p{font-size:1rem;line-height:1.5;margin:0 0 16px}.meta{display:flex;justify-content:center;gap:24px;font-size:.85rem;color:#92400e}`,
    fields: [
      { key: 'title', label: 'Title', type: 'text', defaultValue: 'Safety Alert', required: true },
      { key: 'message', label: 'Message', type: 'textarea', defaultValue: 'Please wear protective equipment in Zone B.', required: true },
      { key: 'date', label: 'Date', type: 'text', defaultValue: 'May 24, 2026' },
      { key: 'location', label: 'Location', type: 'text', defaultValue: 'Zone B - Workshop' },
    ],
  },

  // === General Announcement ===
  {
    name: 'General Announcement',
    description: 'Versatile announcement template for any company type',
    category: 'announcement',
    industry: ['IT', 'Logistics', 'Manufacturing', 'Assembly', 'Healthcare', 'Education', 'Retail', 'Other'],
    html: `<div class="template-announce">
  <div class="badge">📢 {{category}}</div>
  <h2>{{title}}</h2>
  <p>{{message}}</p>
  <div class="footer"><span>{{author}}</span><span>{{date}}</span></div>
</div>`,
    css: `.template-announce{padding:32px;background:linear-gradient(135deg,#1e293b,#0f172a);border-radius:16px;color:#e2e8f0;font-family:Inter,sans-serif;border:1px solid #334155}.badge{display:inline-block;padding:4px 16px;background:#3b82f622;color:#60a5fa;border-radius:20px;font-size:.8rem;font-weight:600;margin-bottom:16px}h2{margin:0 0 12px;font-size:1.5rem;font-weight:700;color:#f8fafc}p{margin:0;line-height:1.6;color:#cbd5e1}.footer{margin-top:20px;display:flex;justify-content:space-between;font-size:.8rem;color:#64748b}`,
    fields: [
      { key: 'category', label: 'Category Badge', type: 'text', defaultValue: 'Announcement' },
      { key: 'title', label: 'Title', type: 'text', defaultValue: 'Important Update', required: true },
      { key: 'message', label: 'Message', type: 'textarea', defaultValue: 'Details about the update...', required: true },
      { key: 'author', label: 'Author', type: 'text', defaultValue: 'Admin' },
      { key: 'date', label: 'Date', type: 'text', defaultValue: 'May 24, 2026' },
    ],
  },

  // === Event Template ===
  {
    name: 'Upcoming Event',
    description: 'Event announcement with date, time, and location',
    category: 'event',
    industry: ['IT', 'Logistics', 'Manufacturing', 'Assembly', 'Healthcare', 'Education', 'Retail', 'Other'],
    html: `<div class="template-event">
  <div class="date-badge"><span class="month">{{month}}</span><span class="day">{{day}}</span></div>
  <div class="details">
    <h2>{{title}}</h2>
    <p>{{description}}</p>
    <div class="info"><span>🕐 {{time}}</span><span>📍 {{location}}</span></div>
  </div>
</div>`,
    css: `.template-event{display:flex;gap:20px;padding:24px;background:linear-gradient(135deg,#312e81,#4338ca);border-radius:16px;color:#e0e7ff;font-family:Inter,sans-serif}.date-badge{min-width:80px;padding:16px;background:#6366f1;border-radius:12px;text-align:center;display:flex;flex-direction:column;justify-content:center}.month{font-size:.8rem;text-transform:uppercase;font-weight:600;color:#c7d2fe}.day{font-size:2.5rem;font-weight:800;line-height:1}.details{flex:1}h2{margin:0 0 8px;font-size:1.25rem;color:#f8fafc}p{margin:0 0 16px;color:#c7d2fe;line-height:1.5}.info{display:flex;gap:20px;font-size:.85rem;color:#a5b4fc}`,
    fields: [
      { key: 'month', label: 'Month', type: 'text', defaultValue: 'MAY', required: true },
      { key: 'day', label: 'Day', type: 'text', defaultValue: '28', required: true },
      { key: 'title', label: 'Event Title', type: 'text', defaultValue: 'Team Meeting', required: true },
      { key: 'description', label: 'Description', type: 'textarea', defaultValue: 'Monthly all-hands meeting.' },
      { key: 'time', label: 'Time', type: 'text', defaultValue: '2:00 PM - 3:00 PM' },
      { key: 'location', label: 'Location', type: 'text', defaultValue: 'Conference Room A' },
    ],
  },
];

/**
 * Seed system templates if they don't exist
 */
module.exports = async function seedTemplates() {
  try {
    const count = await Template.countDocuments({ isSystem: true });
    if (count === 0) {
      const templates = systemTemplates.map(t => ({
        ...t,
        tenantId: null,
        isSystem: true,
      }));
      await Template.insertMany(templates);
      console.log(`🌱 Seeded ${templates.length} system templates`);
    } else {
      console.log(`✅ ${count} system templates already exist`);
    }
  } catch (error) {
    console.error('❌ Template seeding error:', error.message);
  }
};
