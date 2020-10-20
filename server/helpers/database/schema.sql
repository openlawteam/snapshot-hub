CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(64) NOT NULL,
  address VARCHAR(64) NOT NULL,
  version VARCHAR(6) NOT NULL,
  timestamp BIGINT NOT NULL,
  space VARCHAR(64),
  token VARCHAR(64),
  type VARCHAR(12) NOT NULL,
  payload JSON,
  sig VARCHAR(256) NOT NULL,
  metadata JSON,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS mgs_address_idx on messages (address);
CREATE INDEX IF NOT EXISTS mgs_version_idx on messages (version);
CREATE INDEX IF NOT EXISTS mgs_timestamp_idx on messages (timestamp);
CREATE INDEX IF NOT EXISTS mgs_space_idx on messages (space);
CREATE INDEX IF NOT EXISTS mgs_token_idx on messages (token);
CREATE INDEX IF NOT EXISTS mgs_type_idx on messages (type);

CREATE TABLE IF NOT EXISTS hubs (
  host VARCHAR(64) NOT NULL,
  address VARCHAR(64),
  is_self INT DEFAULT 0,
  is_active INT DEFAULT 1,
  PRIMARY KEY (host)
);

CREATE INDEX IF NOT EXISTS hubs_address_idx on hubs (address);
CREATE INDEX IF NOT EXISTS hubs_is_self_idx on hubs (is_self);
