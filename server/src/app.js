require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const http = require('http');
const os = require('os');
const { Server } = require('socket.io');
const connectDB = require('./config/database');
const { validateEnv } = require('./config/validateEnv');
const { errorHandler } = require('./middleware/errorHandler');
const { lanOnlyMiddleware } = require('./middleware/lanOnly');

// Refuse to start with default / missing secrets.
validateEnv();

// Route imports
const authRoutes = require('./routes/auth');
const noticeRoutes = require('./routes/notices');
const boardRoutes = require('./routes/boards');
const templateRoutes = require('./routes/templates');
const categoryRoutes = require('./routes/categories');
const mediaRoutes = require('./routes/media');
const tenantRoutes = require('./routes/tenant');
const dataSourceRoutes = require('./routes/datasources');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:4200' || 'http://localhost:4300',
    methods: ['GET', 'POST'],
  },
});

// Optional JWT auth on the handshake. Tokens are verified if supplied;
// anonymous connections are allowed but limited to public board rooms.
const jwt = require('jsonwebtoken');
const Mongoose = require('mongoose');
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) { socket.user = null; return next(); }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const User = require('./models/User');
    const user = await User.findById(decoded.userId).lean();
    if (!user || !user.isActive) { socket.user = null; return next(); }
    socket.user = { _id: String(user._id), tenantId: String(user.tenantId), role: user.role };
  } catch {
    socket.user = null;
  }
  next();
});

// Attach io to requests
app.use((req, res, next) => {
  req.io = io;
  next();
});

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}${socket.user ? ` (user ${socket.user._id})` : ' (anonymous)'}`);

  // Tenant rooms get sensitive events (notices created/updated/deleted)
  // and require a token that matches the requested tenant.
  socket.on('join:tenant', (tenantId) => {
    if (!socket.user || socket.user.tenantId !== String(tenantId || '')) {
      socket.emit('join:denied', { room: `tenant:${tenantId}`, reason: 'auth required' });
      return;
    }
    socket.join(`tenant:${tenantId}`);
  });

  // Board rooms are public-display oriented — anyone can subscribe to a
  // specific board, but only if the board exists and is active.
  socket.on('join:board', async (boardId) => {
    if (!Mongoose.isValidObjectId(boardId)) return;
    try {
      const Board = require('./models/Board');
      const b = await Board.findById(boardId).select('isActive tenantId').lean();
      if (!b || !b.isActive) return;
      socket.join(`board:${boardId}`);
    } catch {/* swallow */}
  });

  socket.on('disconnect', () => {});
});

// Middleware. Helmet hardens HTTP headers; CSP is set explicitly because
// some legitimate features (custom Google Fonts, embedded notice <img>s)
// need targeted relaxations.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'default-src': ["'self'"],
      'script-src':  ["'self'"],
      // Angular emits inline <style> blocks; Google Fonts CSS for custom fonts.
      'style-src':   ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src':    ["'self'", 'data:', 'https://fonts.gstatic.com'],
      // Allow externally-hosted images that admins paste into notices.
      'img-src':     ["'self'", 'data:', 'blob:', 'https:'],
      'media-src':   ["'self'", 'blob:', 'https:'],
      // Socket.IO uses ws:/wss: + same-origin XHR fallback.
      'connect-src': ["'self'", 'ws:', 'wss:'],
      'frame-ancestors': ["'self'"],
      'object-src': ["'none'"],
      'base-uri':   ["'self'"],
    },
  },
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200' || 'http://localhost:4300',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// LAN-only access gate. Skip for /api/health so monitoring tools work.
app.set('trust proxy', 'loopback');
app.use((req, res, next) => req.path === '/api/health' ? next() : lanOnlyMiddleware(req, res, next));

// Static files (uploads) — served inline; force download for anything that
// could behave like an executable in the browser.
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), {
  setHeaders: (res, filePath) => {
    if (/\.(svg|html?|js)$/i.test(filePath)) {
      // SVG uploads are blocked at the upload layer, but if any leftover
      // file slipped in, force it to download instead of executing.
      res.setHeader('Content-Disposition', 'attachment');
    }
  },
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/tenant', tenantRoutes);
app.use('/api/datasources', dataSourceRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// In production-style bundles the Angular app is built once into
// `client/dist/client/browser` and served from this same Express server,
// so admins/users access everything on http://<lan-ip>:3000.
const CLIENT_DIST = path.join(__dirname, '..', '..', 'client', 'dist', 'client', 'browser');
if (fs.existsSync(CLIENT_DIST)) {
  // Serve hashed JS/CSS bundles with long-lived caching, but force
  // index.html, manifest, and the service-worker assets to revalidate
  // every load so admins never see stale CSS after a rebuild.
  app.use(express.static(CLIENT_DIST, {
    index: false,
    setHeaders: (res, filePath) => {
      const base = path.basename(filePath);
      if (
        base === 'index.html' ||
        base === 'manifest.webmanifest' ||
        base === 'ngsw.json' ||
        base === 'ngsw-worker.js' ||
        base === 'safety-worker.js'
      ) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else if (/\.[0-9a-f]{8,}\.(?:js|css|woff2?|png|jpg|webp|svg|ico)$/i.test(base)) {
        // Angular adds an 8+ hex hash to every fingerprinted asset; safe
        // to cache forever because a new build → new hash → new URL.
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  }));
  app.get(/^(?!\/api\/|\/uploads\/).*/, (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
  console.log(`📦 Serving client bundle from ${CLIENT_DIST}`);
}

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

function getLanIps() {
  const ips = [];
  for (const ifaces of Object.values(os.networkInterfaces() || {})) {
    for (const i of ifaces || []) {
      if (i.family === 'IPv4' && !i.internal) ips.push(i.address);
    }
  }
  return ips;
}

const startServer = async () => {
  await connectDB();

  // Seed default templates on first run
  const seedTemplates = require('./services/seedTemplates');
  await seedTemplates();

  // Start cron jobs
  require('./jobs/noticeScheduler');
  require('./jobs/dataSourcePoller');

  server.listen(PORT, HOST, () => {
    const lanIps = getLanIps();
    console.log(`\n🚀 NoticeBoard is ready.`);
    console.log(`   • Local:     http://localhost:${PORT}`);
    for (const ip of lanIps) console.log(`   • Network:   http://${ip}:${PORT}   ← share this with TVs / colleagues on the same network`);
    console.log(`   • API base:  http://localhost:${PORT}/api`);
    console.log(`   • Mode:      ${process.env.NODE_ENV || 'development'}${process.env.LAN_ONLY === 'false' ? ' (LAN-only DISABLED)' : ' (LAN-only)'}\n`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = app;
