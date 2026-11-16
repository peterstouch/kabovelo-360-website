-- KABOVELO 360 payments database (Cloudflare D1)
-- Apply with: npm run db:init (local) / npm run db:init:remote (production)

CREATE TABLE IF NOT EXISTS orders (
    ref            TEXT PRIMARY KEY,          -- e.g. K360-7F3K9Q2M, also used as the Lipila referenceId
    type           TEXT NOT NULL,             -- 'booking' | 'enrollment'
    status         TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'paid' | 'failed'
    customer_name  TEXT NOT NULL,
    email          TEXT NOT NULL,
    phone          TEXT NOT NULL,             -- mobile money number, 2609XXXXXXXX
    operator       TEXT,                      -- MTN | Airtel | Zamtel
    items_json     TEXT NOT NULL,             -- priced line items (computed on the server)
    details_json   TEXT,                      -- enrollment / booking details
    subtotal       INTEGER NOT NULL,
    discount_pct   INTEGER NOT NULL DEFAULT 0,
    total          INTEGER NOT NULL,          -- amount charged in ZMW
    provider_ref   TEXT,                      -- Lipila identifier / external id
    provider_msg   TEXT,
    emailed        INTEGER NOT NULL DEFAULT 0,
    created_at     TEXT NOT NULL,
    updated_at     TEXT NOT NULL,
    paid_at        TEXT
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email);
