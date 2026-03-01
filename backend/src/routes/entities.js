const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/schema');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Search entities
router.get('/search', (req, res) => {
  const { q, sector, city, type, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let conditions = [];
  let params = [];

  if (q) {
    conditions.push(`(e.name LIKE ? OR e.description LIKE ? OR e.city LIKE ?)`);
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (sector) {
    conditions.push(`s.slug = ?`);
    params.push(sector);
  }
  if (city) {
    conditions.push(`e.city LIKE ?`);
    params.push(`%${city}%`);
  }
  if (type) {
    conditions.push(`et.slug = ?`);
    params.push(type);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const entities = db.prepare(`
    SELECT e.*, s.name as sector_name, s.slug as sector_slug, s.icon as sector_icon, s.color as sector_color,
           et.name as entity_type_name
    FROM entities e
    LEFT JOIN sectors s ON s.id = e.sector_id
    LEFT JOIN entity_types et ON et.id = e.entity_type_id
    ${where}
    ORDER BY e.total_reviews DESC, e.avg_overall_rating DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  const total = db.prepare(`
    SELECT COUNT(*) as count
    FROM entities e
    LEFT JOIN sectors s ON s.id = e.sector_id
    LEFT JOIN entity_types et ON et.id = e.entity_type_id
    ${where}
  `).get(...params);

  res.json({
    entities,
    pagination: {
      total: total.count,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total.count / parseInt(limit))
    }
  });
});

// Get entity by slug
router.get('/:slug', optionalAuth, (req, res) => {
  const entity = db.prepare(`
    SELECT e.*, s.name as sector_name, s.slug as sector_slug, s.icon as sector_icon, s.color as sector_color,
           et.name as entity_type_name
    FROM entities e
    LEFT JOIN sectors s ON s.id = e.sector_id
    LEFT JOIN entity_types et ON et.id = e.entity_type_id
    WHERE e.slug = ?
  `).get(req.params.slug);

  if (!entity) return res.status(404).json({ error: 'Entity not found' });

  // Rating breakdown per category
  const categoryRatings = db.prepare(`
    SELECT rr.category, AVG(rr.rating) as avg_rating, COUNT(rr.id) as count
    FROM review_ratings rr
    JOIN reviews r ON r.id = rr.review_id
    WHERE r.entity_id = ? AND r.status = 'published'
    GROUP BY rr.category
  `).all(entity.id);

  // Star distribution
  const starDistribution = db.prepare(`
    SELECT overall_rating, COUNT(*) as count
    FROM reviews
    WHERE entity_id = ? AND status = 'published'
    GROUP BY overall_rating
    ORDER BY overall_rating DESC
  `).all(entity.id);

  res.json({
    ...entity,
    category_ratings: categoryRatings,
    star_distribution: starDistribution
  });
});

// Create entity
router.post('/', authenticateToken, (req, res) => {
  const { name, sector_id, entity_type_id, description, address, city, country, website, phone, email } = req.body;

  if (!name || !sector_id) {
    return res.status(400).json({ error: 'Name and sector are required' });
  }

  // Verify sector exists
  const sector = db.prepare('SELECT id FROM sectors WHERE id = ?').get(sector_id);
  if (!sector) return res.status(400).json({ error: 'Invalid sector' });

  // Generate unique slug
  let baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  let slug = baseSlug;
  let counter = 1;
  while (db.prepare('SELECT id FROM entities WHERE slug = ?').get(slug)) {
    slug = `${baseSlug}-${counter++}`;
  }

  const id = uuidv4();

  db.prepare(`
    INSERT INTO entities (id, name, slug, sector_id, entity_type_id, description, address, city, country, website, phone, email)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, slug, sector_id, entity_type_id || null, description || null, address || null, city || null, country || null, website || null, phone || null, email || null);

  const entity = db.prepare('SELECT * FROM entities WHERE id = ?').get(id);
  res.status(201).json(entity);
});

// Update entity stats (called after review operations)
function updateEntityStats(entityId) {
  const stats = db.prepare(`
    SELECT COUNT(*) as total, AVG(overall_rating) as avg
    FROM reviews WHERE entity_id = ? AND status = 'published'
  `).get(entityId);

  db.prepare(`
    UPDATE entities SET total_reviews = ?, avg_overall_rating = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(stats.total, stats.avg || 0, entityId);
}

module.exports = { router, updateEntityStats };
