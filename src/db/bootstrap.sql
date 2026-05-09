CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
    CREATE TYPE "Role" AS ENUM ('admin', 'user');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserStatus') THEN
    CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role "Role" NOT NULL DEFAULT 'user',
  status "UserStatus" NOT NULL DEFAULT 'active',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash TEXT NOT NULL,
  user_agent TEXT,
  ip_address VARCHAR(255),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type TEXT NOT NULL,
  request_status TEXT NOT NULL,
  errors TEXT,
  ip_address JSONB NOT NULL,
  origin TEXT NOT NULL,
  request_method TEXT NOT NULL,
  request_url TEXT NOT NULL,
  request_headers JSONB,
  request_body JSONB,
  response_status INTEGER,
  response_body JSONB,
  response_time_ms INTEGER,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS db_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  previous_value JSONB,
  new_value JSONB,
  status TEXT NOT NULL,
  transaction_type TEXT NOT NULL,
  transaction_details TEXT,
  affected_collection TEXT NOT NULL,
  affected_document_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address TEXT,
  origin TEXT,
  request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_request_logs_user_id ON request_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_request_logs_created_at ON request_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_db_logs_user_id ON db_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_db_logs_affected_collection ON db_logs(affected_collection);
CREATE INDEX IF NOT EXISTS idx_db_logs_created_at ON db_logs(created_at);
