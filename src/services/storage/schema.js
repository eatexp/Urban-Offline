export const SCHEMA_SQL = `
-- Core content tables
CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,           -- URL-safe identifier
    title TEXT NOT NULL,
    body_html TEXT NOT NULL,             -- Rendered content
    body_plain TEXT NOT NULL,            -- For FTS indexing
    source TEXT NOT NULL,                -- 'wikimed', 'ogl', 'cc-by-sa'
    source_url TEXT,
    last_updated TEXT,                   -- ISO8601
    content_hash TEXT                    -- For delta updates
);

-- FTS5 virtual table (Note: Virtual tables don't support IF NOT EXISTS in all versions, but we catch errors)
CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts USING fts5(
    title, 
    body_plain,
    content='articles',
    content_rowid='id',
    tokenize='porter unicode61'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER IF NOT EXISTS articles_ai AFTER INSERT ON articles BEGIN
    INSERT INTO articles_fts(rowid, title, body_plain) 
    VALUES (new.id, new.title, new.body_plain);
END;

CREATE TRIGGER IF NOT EXISTS articles_ad AFTER DELETE ON articles BEGIN
    INSERT INTO articles_fts(articles_fts, rowid, title, body_plain) 
    VALUES('delete', old.id, old.title, old.body_plain);
END;

-- Category/tag system for filtering
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    parent_id INTEGER REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS article_categories (
    article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, category_id)
);

-- Ink story references (links articles to triage flows)
CREATE TABLE IF NOT EXISTS triage_entry_points (
    id INTEGER PRIMARY KEY,
    ink_story_file TEXT NOT NULL,        -- e.g., 'health/hypothermia.ink.json'
    trigger_keywords TEXT NOT NULL,      -- Comma-separated for simple matching
    category_id INTEGER REFERENCES categories(id)
);

-- Attribution registry (legal compliance)
CREATE TABLE IF NOT EXISTS attributions (
    id INTEGER PRIMARY KEY,
    source_name TEXT NOT NULL,
    license_type TEXT NOT NULL,          -- 'OGL-3.0', 'CC-BY-SA-4.0', etc.
    license_url TEXT NOT NULL,
    attribution_text TEXT NOT NULL,
    requires_share_alike BOOLEAN DEFAULT 0
);

CREATE TABLE IF NOT EXISTS article_attributions (
    article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
    attribution_id INTEGER REFERENCES attributions(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, attribution_id)
);
`;
