const express = require('express');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../db/schema');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { updateEntityStats } = require('./entities');

const router = express.Router();

// Configure multer for file uploads
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
});

// Rating categories
const RATING_CATEGORIES = [
  'harassment',
  'service_quality',
  'fraud',
  'pricing',
  'waiting_time',
  'competence',
  'reliability',
  'communication',
  'cleanliness'
];

// Get reviews for an entity
router.get('/entity/:entityId', optionalAuth, (req, res) => {
  const { entityId } = req.params;
  const { page = 1, limit = 10, sort = 'newest', rating } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let orderBy = 'r.created_at DESC';
  if (sort === 'oldest') orderBy = 'r.created_at ASC';
  if (sort === 'highest') orderBy = 'r.overall_rating DESC';
  if (sort === 'lowest') orderBy = 'r.overall_rating ASC';
  if (sort === 'helpful') orderBy = 'r.helpful_count DESC';

  let ratingFilter = '';
  let ratingParams = [];
  if (rating) {
    ratingFilter = 'AND r.overall_rating = ?';
    ratingParams = [parseInt(rating)];
  }

  const reviews = db.prepare(`
    SELECT r.*,
           CASE WHEN r.is_anonymous = 1 THEN 'Anonymous' ELSE u.username END as author_name,
           CASE WHEN r.is_anonymous = 1 THEN NULL ELSE u.avatar_url END as author_avatar,
           er.content as entity_response
    FROM reviews r
    LEFT JOIN users u ON u.id = r.user_id
    LEFT JOIN entity_responses er ON er.review_id = r.id
    WHERE r.entity_id = ? AND r.status = 'published'
    ${ratingFilter}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `).all(entityId, ...ratingParams, parseInt(limit), offset);

  // Get ratings and media for each review
  const enrichedReviews = reviews.map(review => {
    const ratings = db.prepare('SELECT category, rating FROM review_ratings WHERE review_id = ?').all(review.id);
    const media = db.prepare('SELECT id, file_name, file_type, mime_type FROM review_media WHERE review_id = ?').all(review.id);
    const tags = db.prepare('SELECT tag FROM review_tags WHERE review_id = ?').all(review.id).map(t => t.tag);

    let userVote = null;
    if (req.user) {
      const vote = db.prepare('SELECT vote_type FROM review_votes WHERE review_id = ? AND user_id = ?').get(review.id, req.user.id);
      userVote = vote?.vote_type || null;
    }

    return { ...review, ratings, media, tags, user_vote: userVote };
  });

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM reviews
    WHERE entity_id = ? AND status = 'published' ${ratingFilter}
  `).get(entityId, ...ratingParams);

  res.json({
    reviews: enrichedReviews,
    pagination: {
      total: total.count,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total.count / parseInt(limit))
    }
  });
});

// Get single review
router.get('/:id', optionalAuth, (req, res) => {
  const review = db.prepare(`
    SELECT r.*,
           CASE WHEN r.is_anonymous = 1 THEN 'Anonymous' ELSE u.username END as author_name,
           e.name as entity_name, e.slug as entity_slug,
           s.name as sector_name, s.icon as sector_icon
    FROM reviews r
    LEFT JOIN users u ON u.id = r.user_id
    LEFT JOIN entities e ON e.id = r.entity_id
    LEFT JOIN sectors s ON s.id = e.sector_id
    WHERE r.id = ?
  `).get(req.params.id);

  if (!review) return res.status(404).json({ error: 'Review not found' });

  const ratings = db.prepare('SELECT category, rating FROM review_ratings WHERE review_id = ?').all(review.id);
  const media = db.prepare('SELECT * FROM review_media WHERE review_id = ?').all(review.id);
  const tags = db.prepare('SELECT tag FROM review_tags WHERE review_id = ?').all(review.id).map(t => t.tag);
  const entityResponse = db.prepare('SELECT * FROM entity_responses WHERE review_id = ?').get(review.id);

  res.json({ ...review, ratings, media, tags, entity_response: entityResponse });
});

// Create review with media upload
router.post('/', authenticateToken, upload.array('media', 10), async (req, res) => {
  try {
    const {
      entity_id, title, content, overall_rating,
      visit_date, is_anonymous, ratings, tags
    } = req.body;

    // Validation
    if (!entity_id || !title || !content || !overall_rating) {
      return res.status(400).json({ error: 'entity_id, title, content and overall_rating are required' });
    }

    const ratingInt = parseInt(overall_rating);
    if (ratingInt < 1 || ratingInt > 5) {
      return res.status(400).json({ error: 'Overall rating must be between 1 and 5' });
    }

    const entity = db.prepare('SELECT id FROM entities WHERE id = ?').get(entity_id);
    if (!entity) return res.status(404).json({ error: 'Entity not found' });

    // Check if user already reviewed this entity
    const existingReview = db.prepare(
      'SELECT id FROM reviews WHERE user_id = ? AND entity_id = ? AND status != "deleted"'
    ).get(req.user.id, entity_id);

    if (existingReview) {
      return res.status(409).json({ error: 'You have already reviewed this entity' });
    }

    const reviewId = uuidv4();

    // Parse ratings if it's a JSON string
    let parsedRatings = {};
    if (ratings) {
      try {
        parsedRatings = typeof ratings === 'string' ? JSON.parse(ratings) : ratings;
      } catch (e) {
        parsedRatings = {};
      }
    }

    // Parse tags
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        parsedTags = [];
      }
    }

    // Insert review
    db.prepare(`
      INSERT INTO reviews (id, user_id, entity_id, title, content, overall_rating, visit_date, is_anonymous)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      reviewId, req.user.id, entity_id, title, content, ratingInt,
      visit_date || null, is_anonymous === 'true' || is_anonymous === true ? 1 : 0
    );

    // Insert category ratings
    const insertRating = db.prepare(`
      INSERT INTO review_ratings (id, review_id, category, rating) VALUES (?, ?, ?, ?)
    `);

    for (const [category, rating] of Object.entries(parsedRatings)) {
      if (RATING_CATEGORIES.includes(category) && rating >= 1 && rating <= 5) {
        insertRating.run(uuidv4(), reviewId, category, parseInt(rating));
      }
    }

    // Insert tags
    const insertTag = db.prepare('INSERT INTO review_tags (id, review_id, tag) VALUES (?, ?, ?)');
    for (const tag of parsedTags) {
      insertTag.run(uuidv4(), reviewId, tag);
    }

    // Insert uploaded files
    if (req.files && req.files.length > 0) {
      const insertMedia = db.prepare(`
        INSERT INTO review_media (id, review_id, file_name, file_path, file_type, mime_type, file_size)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const file of req.files) {
        const fileType = file.mimetype.split('/')[0]; // image, video, audio, application
        insertMedia.run(
          uuidv4(), reviewId, file.originalname, file.filename,
          fileType === 'application' ? 'document' : fileType,
          file.mimetype, file.size
        );
      }
    }

    // Update entity stats
    updateEntityStats(entity_id);

    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(reviewId);
    res.status(201).json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// Vote on a review (helpful / not helpful)
router.post('/:id/vote', authenticateToken, (req, res) => {
  const { vote_type } = req.body;

  if (!['helpful', 'not_helpful'].includes(vote_type)) {
    return res.status(400).json({ error: 'vote_type must be "helpful" or "not_helpful"' });
  }

  const review = db.prepare('SELECT id, user_id, helpful_count, not_helpful_count FROM reviews WHERE id = ?').get(req.params.id);
  if (!review) return res.status(404).json({ error: 'Review not found' });

  if (review.user_id === req.user.id) {
    return res.status(400).json({ error: 'Cannot vote on your own review' });
  }

  const existingVote = db.prepare('SELECT * FROM review_votes WHERE review_id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);

  if (existingVote) {
    if (existingVote.vote_type === vote_type) {
      // Remove vote
      db.prepare('DELETE FROM review_votes WHERE review_id = ? AND user_id = ?')
        .run(req.params.id, req.user.id);
    } else {
      // Change vote
      db.prepare('UPDATE review_votes SET vote_type = ?, created_at = datetime("now") WHERE review_id = ? AND user_id = ?')
        .run(vote_type, req.params.id, req.user.id);
    }
  } else {
    db.prepare('INSERT INTO review_votes (id, review_id, user_id, vote_type) VALUES (?, ?, ?, ?)')
      .run(uuidv4(), req.params.id, req.user.id, vote_type);
  }

  // Recalculate counts
  const counts = db.prepare(`
    SELECT
      SUM(CASE WHEN vote_type = 'helpful' THEN 1 ELSE 0 END) as helpful,
      SUM(CASE WHEN vote_type = 'not_helpful' THEN 1 ELSE 0 END) as not_helpful
    FROM review_votes WHERE review_id = ?
  `).get(req.params.id);

  db.prepare('UPDATE reviews SET helpful_count = ?, not_helpful_count = ? WHERE id = ?')
    .run(counts.helpful || 0, counts.not_helpful || 0, req.params.id);

  res.json({ helpful_count: counts.helpful || 0, not_helpful_count: counts.not_helpful || 0 });
});

// Delete review (owner only)
router.delete('/:id', authenticateToken, (req, res) => {
  const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(req.params.id);
  if (!review) return res.status(404).json({ error: 'Review not found' });

  if (review.user_id !== req.user.id && !req.user.is_admin) {
    return res.status(403).json({ error: 'Not authorized to delete this review' });
  }

  db.prepare('UPDATE reviews SET status = "deleted" WHERE id = ?').run(req.params.id);
  updateEntityStats(review.entity_id);

  res.json({ message: 'Review deleted' });
});

// Get reviews by current user
router.get('/user/me', authenticateToken, (req, res) => {
  const reviews = db.prepare(`
    SELECT r.*, e.name as entity_name, e.slug as entity_slug,
           s.name as sector_name, s.icon as sector_icon
    FROM reviews r
    JOIN entities e ON e.id = r.entity_id
    LEFT JOIN sectors s ON s.id = e.sector_id
    WHERE r.user_id = ? AND r.status != 'deleted'
    ORDER BY r.created_at DESC
  `).all(req.user.id);

  res.json(reviews);
});

// Get available rating categories
router.get('/meta/categories', (req, res) => {
  res.json(RATING_CATEGORIES);
});

module.exports = router;
