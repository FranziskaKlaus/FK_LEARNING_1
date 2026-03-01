require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initializeDatabase } = require('./db/schema');

const app = express();
const PORT = process.env.PORT || 5000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Initialize DB
initializeDatabase();

// Seed DB automatically in production if empty
if (IS_PRODUCTION) {
  const { db } = require('./db/schema');
  const sectorCount = db.prepare('SELECT COUNT(*) as c FROM sectors').get().c;
  if (sectorCount === 0) {
    console.log('Seeding database for first run...');
    require('./db/seed');
  }
}

// Middleware
app.use(cors({
  origin: IS_PRODUCTION ? '*' : (process.env.FRONTEND_URL || 'http://localhost:3000'),
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sectors', require('./routes/sectors'));
app.use('/api/entities', require('./routes/entities').router);
app.use('/api/reviews', require('./routes/reviews'));

// Stats endpoint
app.get('/api/stats', (req, res) => {
  const { db } = require('./db/schema');
  const stats = {
    total_entities: db.prepare('SELECT COUNT(*) as c FROM entities').get().c,
    total_reviews: db.prepare("SELECT COUNT(*) as c FROM reviews WHERE status = 'published'").get().c,
    total_users: db.prepare('SELECT COUNT(*) as c FROM users').get().c,
    total_sectors: db.prepare('SELECT COUNT(*) as c FROM sectors').get().c,
  };
  res.json(stats);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React frontend in production
const frontendBuild = path.join(__dirname, '../../frontend/dist');
if (IS_PRODUCTION && fs.existsSync(frontendBuild)) {
  app.use(express.static(frontendBuild));
  // All non-API routes serve the React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendBuild, 'index.html'));
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
  }
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
