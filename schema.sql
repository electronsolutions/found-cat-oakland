PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS cat_status (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  public_status TEXT NOT NULL DEFAULT 'Owner search active. Foster/adopter screening is open if no credible owner is confirmed.',
  owner_search_status TEXT NOT NULL DEFAULT 'Owner search active',
  medical_status TEXT NOT NULL DEFAULT 'Vet exam pending',
  placement_status TEXT NOT NULL DEFAULT 'Safe temporary hold; foster/adopter screening open',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS updates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  seed_key TEXT UNIQUE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status_type TEXT NOT NULL DEFAULT 'general',
  is_public INTEGER NOT NULL DEFAULT 1,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS owner_claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  lost_when TEXT,
  lost_where TEXT,
  photos_link TEXT,
  sex TEXT,
  age_estimate TEXT,
  neuter_status TEXT,
  collar_tag_history TEXT,
  microchip_details TEXT,
  identifying_details TEXT,
  personality_details TEXT,
  proof TEXT,
  message TEXT,
  review_status TEXT NOT NULL DEFAULT 'new',
  internal_notes TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  city_neighborhood TEXT,
  interest_type TEXT NOT NULL,
  household_type TEXT,
  rent_own_pets_allowed TEXT,
  current_pets TEXT,
  cats_vaccinated_tested TEXT,
  can_quarantine TEXT,
  cat_experience TEXT,
  indoor_only TEXT,
  vet_care TEXT,
  neuter_willingness TEXT,
  owner_return_willingness TEXT,
  vet_reference TEXT,
  rescue_reference TEXT,
  message TEXT,
  review_status TEXT NOT NULL DEFAULT 'new',
  internal_notes TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  incurred_on TEXT,
  receipt_url TEXT,
  is_public INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reimbursements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  received_on TEXT,
  source TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rate_limits (
  endpoint TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  window_start TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (endpoint, ip_hash, window_start)
);

INSERT OR IGNORE INTO cat_status (id) VALUES (1);

INSERT OR IGNORE INTO updates (seed_key, title, body, status_type, is_public, published_at)
VALUES
  (
    'found-east-19th-12th',
    'Found near East 19th Street and 12th Avenue around May 13',
    'A very friendly medium/long-haired male cat was found near East 19th Street and 12th Avenue in Oakland. He stayed nearby and appeared tame/social rather than feral.',
    'owner search',
    1,
    CURRENT_TIMESTAMP
  ),
  (
    'initial-microchip-scan',
    'Initial microchip scan completed',
    'Oakland Animal Services scanned for a microchip, but no chip was found in that scan. A full vet exam and more thorough scan are still planned.',
    'vet care',
    1,
    CURRENT_TIMESTAMP
  ),
  (
    'temporary-safe-hold',
    'Temporary safe hold',
    'He is currently being kept safely separated from a resident senior cat while an owner, foster, rescue, or adopter is found.',
    'foster/adoption',
    1,
    CURRENT_TIMESTAMP
  ),
  (
    'vet-care-pending',
    'Vet care pending',
    'He appears stable but very skinny and has a small torn/broken claw being kept clean. A vet exam is planned.',
    'vet care',
    1,
    CURRENT_TIMESTAMP
  );
