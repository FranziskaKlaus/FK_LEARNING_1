const express = require('express');
const { db } = require('../db/schema');

const router = express.Router();

// Get all sectors with entity counts
router.get('/', (req, res) => {
  const sectors = db.prepare(`
    SELECT s.*, COUNT(DISTINCT e.id) as entity_count,
           COUNT(DISTINCT r.id) as review_count
    FROM sectors s
    LEFT JOIN entities e ON e.sector_id = s.id
    LEFT JOIN reviews r ON r.entity_id = e.id
    GROUP BY s.id
    ORDER BY s.sort_order
  `).all();

  res.json(sectors);
});

// Get single sector with entity types
router.get('/:slug', (req, res) => {
  const sector = db.prepare('SELECT * FROM sectors WHERE slug = ?').get(req.params.slug);
  if (!sector) return res.status(404).json({ error: 'Sector not found' });

  const entityTypes = db.prepare('SELECT * FROM entity_types WHERE sector_id = ?').all(sector.id);

  res.json({ ...sector, entity_types: entityTypes });
});

module.exports = router;
