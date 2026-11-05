require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static uploads serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/deposits', require('./routes/deposits'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/creators', require('./routes/creators'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/library', require('./routes/library'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/payouts', require('./routes/payouts'));
app.use('/api/transactions', require('./routes/transactions'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'Viewpay',
    version: '1.0.0',
    currency: 'USD ($)',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend static build if present
const FRONTEND_DIST = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
}

// Global 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `API endpoint ${req.method} ${req.originalUrl} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'An internal server error occurred.'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Viewpay Server running at http://localhost:${PORT}`);
  console.log(`🔒 AES-256 E-Code Vault initialized & DB connected.`);
});
