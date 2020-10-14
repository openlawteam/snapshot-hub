CREATE TABLE messages (
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

CREATE INDEX mgs_address_idx on messages (address);
CREATE INDEX mgs_version_idx on messages (version);
CREATE INDEX mgs_timestamp_idx on messages (timestamp);
CREATE INDEX mgs_space_idx on messages (space);
CREATE INDEX mgs_token_idx on messages (token);
CREATE INDEX mgs_type_idx on messages (type);

CREATE TABLE hubs (
  host VARCHAR(64) NOT NULL,
  address VARCHAR(64),
  is_self INT DEFAULT 0,
  is_active INT DEFAULT 1,
  PRIMARY KEY (host)
);

CREATE INDEX hubs_address_idx on hubs (address);
CREATE INDEX hubs_is_self_idx on hubs (is_self);
