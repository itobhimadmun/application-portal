-- =====================================================================
-- Municipal Application & Form Portal — database schema (PostgreSQL)
-- Safe to run repeatedly: every statement is IF NOT EXISTS / idempotent.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ---------------------------------------------------------------- users
CREATE TABLE IF NOT EXISTS admin_users (
  id             SERIAL PRIMARY KEY,
  email          TEXT NOT NULL UNIQUE,
  name           TEXT NOT NULL,
  password_hash  TEXT NOT NULL,
  role           TEXT NOT NULL DEFAULT 'editor',  -- 'admin' | 'editor'
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------- taxonomies
CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  name_ne     TEXT NOT NULL,
  name_en     TEXT NOT NULL,
  icon        TEXT NOT NULL DEFAULT 'doc',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS sections (
  id             SERIAL PRIMARY KEY,
  slug           TEXT NOT NULL UNIQUE,
  name_ne        TEXT NOT NULL,
  name_en        TEXT NOT NULL,
  description_ne TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  contact        TEXT NOT NULL DEFAULT '',
  sort_order     INTEGER NOT NULL DEFAULT 0,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS wards (
  id         SERIAL PRIMARY KEY,
  number     INTEGER NOT NULL UNIQUE,
  name_ne    TEXT NOT NULL DEFAULT '',
  name_en    TEXT NOT NULL DEFAULT '',
  office_ne  TEXT NOT NULL DEFAULT '',
  office_en  TEXT NOT NULL DEFAULT '',
  contact    TEXT NOT NULL DEFAULT '',
  is_active  BOOLEAN NOT NULL DEFAULT TRUE
);

-- --------------------------------------------------------- applications
CREATE TABLE IF NOT EXISTS applications (
  id                   SERIAL PRIMARY KEY,
  slug                 TEXT NOT NULL UNIQUE,
  title_ne             TEXT NOT NULL,
  title_en             TEXT NOT NULL DEFAULT '',
  description_ne       TEXT NOT NULL DEFAULT '',
  description_en       TEXT NOT NULL DEFAULT '',
  about_ne             TEXT NOT NULL DEFAULT '',
  about_en             TEXT NOT NULL DEFAULT '',
  category_id          INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  section_id           INTEGER REFERENCES sections(id) ON DELETE SET NULL,
  all_wards            BOOLEAN NOT NULL DEFAULT TRUE,
  office_ne            TEXT NOT NULL DEFAULT '',
  office_en            TEXT NOT NULL DEFAULT '',
  fee_ne               TEXT NOT NULL DEFAULT '',
  fee_en               TEXT NOT NULL DEFAULT '',
  duration_ne          TEXT NOT NULL DEFAULT '',
  duration_en          TEXT NOT NULL DEFAULT '',
  keywords_ne          TEXT[] NOT NULL DEFAULT '{}',
  keywords_en          TEXT[] NOT NULL DEFAULT '{}',
  aliases              TEXT[] NOT NULL DEFAULT '{}',
  search_index         TEXT NOT NULL DEFAULT '',
  status               TEXT NOT NULL DEFAULT 'draft',  -- draft | published | archived
  is_sample            BOOLEAN NOT NULL DEFAULT FALSE,
  online_form_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  online_form_schema   JSONB NOT NULL DEFAULT '[]'::jsonb,
  view_count           INTEGER NOT NULL DEFAULT 0,
  created_by           INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  updated_by           INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  published_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS application_wards (
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  ward_id        INTEGER NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
  PRIMARY KEY (application_id, ward_id)
);

CREATE TABLE IF NOT EXISTS application_steps (
  id             SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  position       INTEGER NOT NULL DEFAULT 0,
  title_ne       TEXT NOT NULL DEFAULT '',
  title_en       TEXT NOT NULL DEFAULT '',
  description_ne TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS application_documents (
  id             SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  position       INTEGER NOT NULL DEFAULT 0,
  label_ne       TEXT NOT NULL DEFAULT '',
  label_en       TEXT NOT NULL DEFAULT '',
  note_ne        TEXT NOT NULL DEFAULT '',
  note_en        TEXT NOT NULL DEFAULT '',
  is_required    BOOLEAN NOT NULL DEFAULT TRUE
);

-- Files may live either in an object store (Vercel Blob / any S3-compatible
-- URL) or, when no object store is configured, directly in Postgres.
CREATE TABLE IF NOT EXISTS application_files (
  id             SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  position       INTEGER NOT NULL DEFAULT 0,
  label_ne       TEXT NOT NULL DEFAULT '',
  label_en       TEXT NOT NULL DEFAULT '',
  kind           TEXT NOT NULL DEFAULT 'pdf',      -- pdf | word | excel | other
  is_editable    BOOLEAN NOT NULL DEFAULT FALSE,
  storage        TEXT NOT NULL DEFAULT 'db',       -- db | blob
  url            TEXT,
  blob_pathname  TEXT,
  data           BYTEA,
  mime           TEXT NOT NULL DEFAULT 'application/octet-stream',
  size           INTEGER NOT NULL DEFAULT 0,
  original_name  TEXT NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------- settings
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------- search stats
CREATE TABLE IF NOT EXISTS search_log (
  id         SERIAL PRIMARY KEY,
  term       TEXT NOT NULL,
  results    INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------- index
CREATE INDEX IF NOT EXISTS applications_status_idx   ON applications (status);
CREATE INDEX IF NOT EXISTS applications_category_idx ON applications (category_id);
CREATE INDEX IF NOT EXISTS applications_section_idx  ON applications (section_id);
CREATE INDEX IF NOT EXISTS applications_search_trgm  ON applications USING gin (search_index gin_trgm_ops);
CREATE INDEX IF NOT EXISTS applications_search_fts   ON applications USING gin (to_tsvector('simple', search_index));
CREATE INDEX IF NOT EXISTS app_files_app_idx         ON application_files (application_id);
CREATE INDEX IF NOT EXISTS app_steps_app_idx         ON application_steps (application_id);
CREATE INDEX IF NOT EXISTS app_docs_app_idx          ON application_documents (application_id);
CREATE INDEX IF NOT EXISTS search_log_term_idx       ON search_log (term);

-- ------------------------------------------------- two-factor + lockout (v2)
-- Added after the first release; every statement is safe to re-run.
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS totp_secret     TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS totp_enabled    BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS failed_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS locked_until    TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS login_attempts (
  id         SERIAL PRIMARY KEY,
  email      TEXT NOT NULL,
  ip         TEXT NOT NULL DEFAULT '',
  successful BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS login_attempts_ip_idx    ON login_attempts (ip, created_at);
CREATE INDEX IF NOT EXISTS login_attempts_email_idx ON login_attempts (email, created_at);

-- ------------------------------------------- editable templates + settings (v3)
ALTER TABLE application_files ADD COLUMN IF NOT EXISTS is_template     BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE application_files ADD COLUMN IF NOT EXISTS template_fields JSONB   NOT NULL DEFAULT '[]'::jsonb;

-- ------------------------------------- cached document previews (v4)
-- Parsing a .docx on every page view would be wasteful, so the rendered
-- HTML is stored beside the file and rebuilt whenever the file changes.
ALTER TABLE application_files ADD COLUMN IF NOT EXISTS preview_html TEXT  NOT NULL DEFAULT '';
ALTER TABLE application_files ADD COLUMN IF NOT EXISTS preview_page JSONB NOT NULL DEFAULT '{}'::jsonb;
