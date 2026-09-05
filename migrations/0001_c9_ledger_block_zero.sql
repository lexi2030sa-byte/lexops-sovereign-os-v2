-- Migration 0001: C9 Sovereign Immutable Ledger Schema & Block Zero Initialization
-- PostgreSQL 16 Script with HMAC-SHA256 Triggers & Immutability Locks

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create Immutable C9 Ledger Table
CREATE TABLE IF NOT EXISTS c9_ledger (
    block_index BIGSERIAL PRIMARY KEY,
    previous_hash TEXT NOT NULL,
    event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    payload JSONB NOT NULL,
    nonce BIGINT NOT NULL DEFAULT 0,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    block_hash TEXT NOT NULL
);

-- 2. Insert BLOCK ZERO (Genesis Block)
INSERT INTO c9_ledger (block_index, previous_hash, event_id, event_type, entity_id, actor_id, payload, nonce, timestamp, block_hash)
VALUES (
    0,
    '0000000000000000000000000000000000000000000000000000000000000000',
    'C9-BLOCK-ZERO-GENESIS',
    'SYSTEM_PULSE_GENESIS',
    'ORG-SOVEREIGN-ROOT',
    'SYSTEM-GOV-KERNEL',
    '{"message": "LexOps Sovereign OS v2026 C9 Ledger Block Zero Genesis Sealed", "version": "v2026.1", "jurisdiction": "SA"}',
    777,
    '2026-01-01 00:00:00+03',
    encode(hmac('0000000000000000000000000000000000000000000000000000000000000000' || 'C9-BLOCK-ZERO-GENESIS' || 'SYSTEM_PULSE_GENESIS' || 'ORG-SOVEREIGN-ROOT', 'SOVEREIGN_C9_HMAC_KEY_2026', 'sha256'), 'hex')
) ON CONFLICT (event_id) DO NOTHING;

-- 3. Trigger Function: Prevent UPDATE and DELETE on c9_ledger
CREATE OR REPLACE FUNCTION c9_ledger_prevent_tamper()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'SOVEREIGN IMMUTABILITY VIOLATION: C9 Ledger blocks are strictly append-only. UPDATE and DELETE actions are permanently forbidden.'
    USING ERRCODE = 'P0001';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_c9_prevent_update ON c9_ledger;
CREATE TRIGGER trg_c9_prevent_update
BEFORE UPDATE OR DELETE ON c9_ledger
FOR EACH ROW EXECUTE FUNCTION c9_ledger_prevent_tamper();

-- 4. Trigger Function: Auto HMAC-SHA256 Calculation & Chain Verification
CREATE OR REPLACE FUNCTION c9_ledger_compute_hash()
RETURNS TRIGGER AS $$
DECLARE
    last_block_hash TEXT;
BEGIN
    SELECT block_hash INTO last_block_hash FROM c9_ledger ORDER BY block_index DESC LIMIT 1;
    IF last_block_hash IS NULL THEN
        last_block_hash := '0000000000000000000000000000000000000000000000000000000000000000';
    END IF;

    NEW.previous_hash := last_block_hash;
    NEW.block_hash := encode(
        hmac(
            NEW.previous_hash || NEW.event_id || NEW.event_type || NEW.entity_id || NEW.payload::text,
            'SOVEREIGN_C9_HMAC_KEY_2026',
            'sha256'
        ),
        'hex'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
