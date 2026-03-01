const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/schema');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', (req, res) => {
  const { email, username, password, full_name } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Email, username and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  // Check if user exists
  const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
  if (existing) {
    return res.status(409).json({ error: 'Email or username already taken' });
  }

  const id = uuidv4();
  const password_hash = bcrypt.hashSync(password, 10);

  db.prepare(`
    INSERT INTO users (id, email, username, password_hash, full_name)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, email.toLowerCase(), username, password_hash, full_name || username);

  const token = jwt.sign(
    { id, email, username, is_admin: 0 },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    token,
    user: { id, email, username, full_name: full_name || username, is_admin: 0 }
  });
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, username: user.username, is_admin: user.is_admin },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      full_name: user.full_name,
      is_admin: user.is_admin,
      is_verified: user.is_verified,
      avatar_url: user.avatar_url
    }
  });
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, email, username, full_name, is_admin, is_verified, avatar_url, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// Update profile
router.put('/profile', authenticateToken, (req, res) => {
  const { full_name } = req.body;

  db.prepare('UPDATE users SET full_name = ?, updated_at = datetime("now") WHERE id = ?')
    .run(full_name, req.user.id);

  res.json({ message: 'Profile updated' });
});

module.exports = router;
