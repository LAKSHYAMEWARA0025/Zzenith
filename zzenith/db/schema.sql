-- Zzenith Database Schema (Phase 1)

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  youtube_url TEXT,
  instagram_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_analyzed_at TIMESTAMP
);

CREATE TABLE persona (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  primary_niche TEXT,
  secondary_niche TEXT,
  content_style TEXT,
  audience TEXT,
  consistency TEXT,
  strengths JSONB,
  weaknesses JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
