-- CHITRANYA CAPITAL PostgreSQL foundation. Apply via migrations after DATABASE_URL is configured.
-- NUMERIC types prevent floating-point rounding in financial calculations.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS securities (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), symbol VARCHAR(24) NOT NULL UNIQUE, name TEXT NOT NULL, sector VARCHAR(120), isin VARCHAR(24), listed BOOLEAN NOT NULL DEFAULT TRUE, provider_security_id VARCHAR(80), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS market_sessions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), session_date DATE NOT NULL UNIQUE, status VARCHAR(24) NOT NULL DEFAULT 'unknown', nepse_index NUMERIC(18,4), index_change NUMERIC(18,4), index_change_percent NUMERIC(12,6), turnover_npr NUMERIC(24,2), advances INTEGER, declines INTEGER, unchanged INTEGER, provider VARCHAR(80) NOT NULL, source_timestamp TIMESTAMPTZ, received_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS price_bars (id BIGSERIAL PRIMARY KEY, security_id UUID NOT NULL REFERENCES securities(id) ON DELETE CASCADE, interval VARCHAR(12) NOT NULL, bar_time TIMESTAMPTZ NOT NULL, open NUMERIC(18,4) NOT NULL, high NUMERIC(18,4) NOT NULL, low NUMERIC(18,4) NOT NULL, close NUMERIC(18,4) NOT NULL, volume NUMERIC(24,4), turnover_npr NUMERIC(24,2), provider VARCHAR(80) NOT NULL, UNIQUE (security_id, interval, bar_time, provider));
CREATE INDEX IF NOT EXISTS price_bars_security_time_idx ON price_bars (security_id, interval, bar_time DESC);
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  password_hash TEXT,
  role VARCHAR(16) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','admin')),
  disabled_at TIMESTAMPTZ,
  email_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(16) NOT NULL DEFAULT 'customer';
ALTER TABLE users ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS user_sessions_user_expiry_idx ON user_sessions (user_id, expires_at);
CREATE INDEX IF NOT EXISTS user_sessions_expiry_idx ON user_sessions (expires_at);
CREATE TABLE IF NOT EXISTS watchlists (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, name VARCHAR(80) NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS watchlist_items (watchlist_id UUID NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE, security_id UUID NOT NULL REFERENCES securities(id) ON DELETE CASCADE, note TEXT, added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY (watchlist_id, security_id));
CREATE TABLE IF NOT EXISTS portfolios (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, name VARCHAR(80) NOT NULL, base_currency CHAR(3) NOT NULL DEFAULT 'NPR', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS portfolio_transactions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE, security_id UUID NOT NULL REFERENCES securities(id), side VARCHAR(4) NOT NULL CHECK (side IN ('BUY','SELL')), trade_date DATE NOT NULL, quantity NUMERIC(24,6) NOT NULL CHECK (quantity > 0), price_per_share NUMERIC(18,4) NOT NULL CHECK (price_per_share >= 0), fees_npr NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (fees_npr >= 0), broker VARCHAR(120), reference VARCHAR(120), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE INDEX IF NOT EXISTS portfolio_transactions_date_idx ON portfolio_transactions (portfolio_id, trade_date DESC);
CREATE TABLE IF NOT EXISTS corporate_actions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), security_id UUID NOT NULL REFERENCES securities(id) ON DELETE CASCADE, action_type VARCHAR(24) NOT NULL, announcement_date DATE NOT NULL, book_close_date DATE, fiscal_year VARCHAR(16), cash_per_share NUMERIC(18,4), bonus_percent NUMERIC(12,6), right_ratio VARCHAR(32), source_url TEXT, provider VARCHAR(80) NOT NULL, source_timestamp TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE INDEX IF NOT EXISTS corporate_actions_security_date_idx ON corporate_actions (security_id, announcement_date DESC);
CREATE TABLE IF NOT EXISTS data_sync_log (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), provider VARCHAR(80) NOT NULL, data_module VARCHAR(80) NOT NULL, status VARCHAR(20) NOT NULL CHECK (status IN ('success','partial','failed')), records_received INTEGER NOT NULL DEFAULT 0, started_at TIMESTAMPTZ NOT NULL, completed_at TIMESTAMPTZ, source_timestamp TIMESTAMPTZ, error_summary TEXT);
CREATE INDEX IF NOT EXISTS data_sync_log_module_time_idx ON data_sync_log (data_module, started_at DESC);


-- Extended market intelligence and evidence tables. Provider payloads are retained
-- with source and ingestion timestamps so normalized values remain auditable.
CREATE TABLE IF NOT EXISTS market_indices (
  id BIGSERIAL PRIMARY KEY,
  index_code VARCHAR(40) NOT NULL,
  index_name VARCHAR(120) NOT NULL,
  index_kind VARCHAR(16) NOT NULL CHECK (index_kind IN ('main','sector','other')),
  session_date DATE NOT NULL,
  index_value NUMERIC(18,4),
  change_value NUMERIC(18,4),
  change_percent NUMERIC(12,6),
  provider VARCHAR(80) NOT NULL,
  source_timestamp TIMESTAMPTZ,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (index_code, session_date, provider)
);
CREATE INDEX IF NOT EXISTS market_indices_date_idx ON market_indices (session_date DESC, index_code);

CREATE TABLE IF NOT EXISTS brokers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_code VARCHAR(24) NOT NULL UNIQUE,
  broker_name TEXT NOT NULL,
  active BOOLEAN,
  provider VARCHAR(80) NOT NULL,
  source_timestamp TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS floorsheet_transactions (
  id BIGSERIAL PRIMARY KEY,
  provider_transaction_id VARCHAR(100),
  security_id UUID NOT NULL REFERENCES securities(id),
  trade_time TIMESTAMPTZ NOT NULL,
  buyer_broker_id UUID REFERENCES brokers(id),
  seller_broker_id UUID REFERENCES brokers(id),
  quantity NUMERIC(24,6) NOT NULL CHECK (quantity > 0),
  price_per_share NUMERIC(18,4) NOT NULL CHECK (price_per_share >= 0),
  turnover_npr NUMERIC(24,2) NOT NULL CHECK (turnover_npr >= 0),
  provider VARCHAR(80) NOT NULL,
  source_timestamp TIMESTAMPTZ,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS floorsheet_provider_trade_idx
  ON floorsheet_transactions (provider, provider_transaction_id)
  WHERE provider_transaction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS floorsheet_time_idx ON floorsheet_transactions (trade_time DESC);
CREATE INDEX IF NOT EXISTS floorsheet_security_time_idx ON floorsheet_transactions (security_id, trade_time DESC);
CREATE INDEX IF NOT EXISTS floorsheet_buyer_time_idx ON floorsheet_transactions (buyer_broker_id, trade_time DESC);
CREATE INDEX IF NOT EXISTS floorsheet_seller_time_idx ON floorsheet_transactions (seller_broker_id, trade_time DESC);

CREATE TABLE IF NOT EXISTS financial_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  security_id UUID NOT NULL REFERENCES securities(id) ON DELETE CASCADE,
  period_type VARCHAR(12) NOT NULL CHECK (period_type IN ('quarterly','annual')),
  fiscal_year VARCHAR(16) NOT NULL,
  period_label VARCHAR(24) NOT NULL,
  period_end DATE,
  revenue_npr NUMERIC(24,2),
  operating_profit_npr NUMERIC(24,2),
  net_profit_npr NUMERIC(24,2),
  eps_npr NUMERIC(18,6),
  book_value_per_share_npr NUMERIC(18,6),
  total_assets_npr NUMERIC(24,2),
  total_liabilities_npr NUMERIC(24,2),
  total_equity_npr NUMERIC(24,2),
  operating_cash_flow_npr NUMERIC(24,2),
  financial_ratios JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_document_url TEXT,
  provider VARCHAR(80) NOT NULL,
  source_timestamp TIMESTAMPTZ,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (security_id, period_type, fiscal_year, period_label, provider)
);
CREATE INDEX IF NOT EXISTS financial_reports_security_period_idx
  ON financial_reports (security_id, period_end DESC);

CREATE TABLE IF NOT EXISTS issuer_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  security_id UUID REFERENCES securities(id) ON DELETE SET NULL,
  announcement_type VARCHAR(40) NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  published_at TIMESTAMPTZ,
  effective_date DATE,
  source_url TEXT NOT NULL,
  provider VARCHAR(80) NOT NULL,
  source_timestamp TIMESTAMPTZ,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (provider, source_url)
);
CREATE INDEX IF NOT EXISTS issuer_announcements_published_idx
  ON issuer_announcements (published_at DESC);
CREATE INDEX IF NOT EXISTS issuer_announcements_security_idx
  ON issuer_announcements (security_id, published_at DESC);

-- A user-entered portfolio event ledger is distinct from provider-sourced
-- corporate_actions so manual records never masquerade as official notices.
CREATE TABLE IF NOT EXISTS portfolio_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  security_id UUID NOT NULL REFERENCES securities(id),
  event_type VARCHAR(24) NOT NULL CHECK (event_type IN ('cash_dividend','bonus_shares','rights_shares')),
  event_date DATE NOT NULL,
  cash_received_npr NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (cash_received_npr >= 0),
  credited_shares NUMERIC(24,6) NOT NULL DEFAULT 0 CHECK (credited_shares >= 0),
  fiscal_year VARCHAR(16),
  note TEXT,
  source_url TEXT,
  record_origin VARCHAR(16) NOT NULL DEFAULT 'user' CHECK (record_origin IN ('user','provider')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS portfolio_events_portfolio_date_idx
  ON portfolio_events (portfolio_id, event_date DESC);

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  preferred_language VARCHAR(8) NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en','ne')),
  timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Kathmandu',
  notification_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_research_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  symbol VARCHAR(24) NOT NULL,
  language VARCHAR(8) NOT NULL CHECK (language IN ('en','ne')),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_as_of TIMESTAMPTZ,
  model_id VARCHAR(120),
  prompt_version VARCHAR(40) NOT NULL,
  validation_status VARCHAR(16) NOT NULL CHECK (validation_status IN ('valid','rejected','insufficient_data')),
  response_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ai_research_symbol_time_idx
  ON ai_research_reports (symbol, generated_at DESC);
CREATE INDEX IF NOT EXISTS ai_research_user_time_idx
  ON ai_research_reports (user_id, generated_at DESC);

CREATE TABLE IF NOT EXISTS source_payload_archive (
  id BIGSERIAL PRIMARY KEY,
  provider VARCHAR(80) NOT NULL,
  data_module VARCHAR(80) NOT NULL,
  external_key VARCHAR(160),
  source_timestamp TIMESTAMPTZ,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  schema_version VARCHAR(40),
  payload JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS source_payload_module_time_idx
  ON source_payload_archive (provider, data_module, received_at DESC);
