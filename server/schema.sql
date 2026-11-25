-- FlatMate schema. Idempotent: safe to run on every migrate.
-- Every table has a primary key, which Neon Realtime needs (stable replica identity).

CREATE TABLE IF NOT EXISTS users (
  id          text PRIMARY KEY,
  mobile      text UNIQUE,                 -- NULL for seeded demo profiles
  email       text,
  is_seed     boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Opaque session tokens issued at registration. Only the SHA-256 hash is stored.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash  text PRIMARY KEY,
  user_id     text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id     text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  age         int  NOT NULL CHECK (age BETWEEN 18 AND 99),
  gender      text NOT NULL,
  areas       text[] NOT NULL,
  budget_min  int  NOT NULL,
  budget_max  int  NOT NULL CHECK (budget_max >= budget_min),
  roommates   int  NOT NULL,
  social      int  NOT NULL CHECK (social BETWEEN 0 AND 100),
  traits      text[] NOT NULL DEFAULT '{}',
  bio         text,
  photo_keys  text[] NOT NULL DEFAULT '{}', -- object keys in the "assets" bucket
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS profiles_areas_idx ON profiles USING gin (areas);

CREATE TABLE IF NOT EXISTS swipes (
  swiper_id   text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id   text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  direction   text NOT NULL CHECK (direction IN ('like', 'pass')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (swiper_id, target_id)
);

-- One row per pair; user_a < user_b so a pair can only match once.
CREATE TABLE IF NOT EXISTS matches (
  id          text PRIMARY KEY,
  user_a      text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b      text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CHECK (user_a < user_b),
  UNIQUE (user_a, user_b)
);
CREATE INDEX IF NOT EXISTS matches_user_b_idx ON matches (user_b);

CREATE TABLE IF NOT EXISTS messages (
  id          text PRIMARY KEY,
  match_id    text NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id   text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body        text NOT NULL CHECK (length(body) BETWEEN 1 AND 2000),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_match_idx ON messages (match_id, created_at);
