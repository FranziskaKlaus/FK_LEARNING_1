const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../../data/platform.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initializeDatabase() {
  db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT,
      avatar_url TEXT,
      is_verified INTEGER DEFAULT 0,
      is_admin INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Sectors / Industries
    CREATE TABLE IF NOT EXISTS sectors (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      icon TEXT NOT NULL,
      description TEXT,
      color TEXT DEFAULT '#4F46E5',
      sort_order INTEGER DEFAULT 0
    );

    -- Entity types (Doctor, Hospital, Company, School, etc.)
    CREATE TABLE IF NOT EXISTS entity_types (
      id TEXT PRIMARY KEY,
      sector_id TEXT NOT NULL,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      FOREIGN KEY (sector_id) REFERENCES sectors(id) ON DELETE CASCADE
    );

    -- Reviewable entities
    CREATE TABLE IF NOT EXISTS entities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      sector_id TEXT NOT NULL,
      entity_type_id TEXT,
      description TEXT,
      address TEXT,
      city TEXT,
      country TEXT,
      website TEXT,
      phone TEXT,
      email TEXT,
      logo_url TEXT,
      cover_url TEXT,
      is_claimed INTEGER DEFAULT 0,
      is_verified INTEGER DEFAULT 0,
      total_reviews INTEGER DEFAULT 0,
      avg_overall_rating REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (sector_id) REFERENCES sectors(id),
      FOREIGN KEY (entity_type_id) REFERENCES entity_types(id)
    );

    -- Reviews
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      overall_rating INTEGER NOT NULL CHECK(overall_rating BETWEEN 1 AND 5),
      visit_date TEXT,
      is_anonymous INTEGER DEFAULT 0,
      is_verified INTEGER DEFAULT 0,
      verification_status TEXT DEFAULT 'pending',
      status TEXT DEFAULT 'published',
      helpful_count INTEGER DEFAULT 0,
      not_helpful_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
    );

    -- Review category ratings (multi-dimensional ratings)
    CREATE TABLE IF NOT EXISTS review_ratings (
      id TEXT PRIMARY KEY,
      review_id TEXT NOT NULL,
      category TEXT NOT NULL,
      rating INTEGER CHECK(rating BETWEEN 1 AND 5),
      FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
    );

    -- Review media (photos, videos, documents, recordings)
    CREATE TABLE IF NOT EXISTS review_media (
      id TEXT PRIMARY KEY,
      review_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT NOT NULL,
      mime_type TEXT,
      file_size INTEGER,
      uploaded_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
    );

    -- Review votes (helpful / not helpful)
    CREATE TABLE IF NOT EXISTS review_votes (
      id TEXT PRIMARY KEY,
      review_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      vote_type TEXT NOT NULL CHECK(vote_type IN ('helpful', 'not_helpful')),
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(review_id, user_id),
      FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Entity responses to reviews
    CREATE TABLE IF NOT EXISTS entity_responses (
      id TEXT PRIMARY KEY,
      review_id TEXT UNIQUE NOT NULL,
      entity_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
      FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
    );

    -- Tags for reviews (harassment, fraud, etc.)
    CREATE TABLE IF NOT EXISTS review_tags (
      id TEXT PRIMARY KEY,
      review_id TEXT NOT NULL,
      tag TEXT NOT NULL,
      FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_entities_sector ON entities(sector_id);
    CREATE INDEX IF NOT EXISTS idx_entities_slug ON entities(slug);
    CREATE INDEX IF NOT EXISTS idx_reviews_entity ON reviews(entity_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
    CREATE INDEX IF NOT EXISTS idx_review_ratings_review ON review_ratings(review_id);
    CREATE INDEX IF NOT EXISTS idx_review_media_review ON review_media(review_id);
  `);

  console.log('Database initialized successfully');
}

module.exports = { db, initializeDatabase };
