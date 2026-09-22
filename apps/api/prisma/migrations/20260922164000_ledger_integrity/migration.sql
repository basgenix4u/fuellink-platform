-- Money-safety invariants enforced by the database itself, so they hold even
-- if application code is bypassed or contains a bug.

-- 1. Every ledger transaction must balance to zero.
--    Deferred to COMMIT: entries are inserted one at a time inside a
--    transaction, so the sum is only meaningful once the transaction ends.
CREATE OR REPLACE FUNCTION assert_ledger_balanced() RETURNS TRIGGER AS $$
DECLARE
  txn_id TEXT;
  total BIGINT;
  entry_count INT;
BEGIN
  txn_id := COALESCE(NEW."transactionId", OLD."transactionId");

  SELECT COALESCE(SUM("amountKobo"), 0), COUNT(*)
    INTO total, entry_count
    FROM ledger_entries
   WHERE "transactionId" = txn_id;

  -- A transaction with no entries left (fully deleted) is acceptable.
  IF entry_count = 0 THEN
    RETURN NULL;
  END IF;

  IF entry_count < 2 THEN
    RAISE EXCEPTION 'Ledger transaction % has % entry; double-entry requires at least 2',
      txn_id, entry_count;
  END IF;

  IF total <> 0 THEN
    RAISE EXCEPTION 'Ledger transaction % does not balance: sum(amountKobo) = %',
      txn_id, total;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER ledger_entries_balanced
  AFTER INSERT OR UPDATE OR DELETE ON ledger_entries
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION assert_ledger_balanced();

-- 2. Ledger entries are immutable: correcting an error means posting a
--    reversing transaction, never editing history.
CREATE OR REPLACE FUNCTION forbid_ledger_entry_mutation() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'ledger_entries are immutable (attempted % on entry %)',
    TG_OP, OLD.id;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ledger_entries_immutable
  BEFORE UPDATE OR DELETE ON ledger_entries
  FOR EACH ROW EXECUTE FUNCTION forbid_ledger_entry_mutation();

-- 3. A zero-amount entry is always a bug.
ALTER TABLE ledger_entries
  ADD CONSTRAINT ledger_entries_amount_nonzero CHECK ("amountKobo" <> 0);

-- 4. Monetary amounts that must never be negative.
ALTER TABLE orders
  ADD CONSTRAINT orders_amounts_nonnegative
  CHECK ("subtotalKobo" >= 0 AND "feeKobo" >= 0 AND "totalKobo" >= 0);

ALTER TABLE orders
  ADD CONSTRAINT orders_quantity_positive CHECK ("quantityLitres" > 0);

ALTER TABLE orders
  ADD CONSTRAINT orders_price_positive CHECK ("pricePerLitreKobo" > 0);

-- The buyer and the seller cannot be the same organisation.
ALTER TABLE orders
  ADD CONSTRAINT orders_distinct_parties CHECK ("buyerOrgId" <> "sellerOrgId");

ALTER TABLE payments
  ADD CONSTRAINT payments_amount_positive CHECK ("amountKobo" > 0);

ALTER TABLE payouts
  ADD CONSTRAINT payouts_amount_positive CHECK ("amountKobo" > 0);

-- 5. Inventory cannot go negative, and reservations cannot exceed stock.
ALTER TABLE product_listings
  ADD CONSTRAINT listings_volumes_nonnegative
  CHECK ("availableLitres" >= 0 AND "reservedLitres" >= 0);

ALTER TABLE product_listings
  ADD CONSTRAINT listings_reserved_within_available
  CHECK ("reservedLitres" <= "availableLitres");

ALTER TABLE product_listings
  ADD CONSTRAINT listings_price_positive CHECK ("pricePerLitreKobo" > 0);

ALTER TABLE product_listings
  ADD CONSTRAINT listings_validity_window CHECK ("validUntil" > "validFrom");

ALTER TABLE tanks
  ADD CONSTRAINT tanks_level_within_capacity
  CHECK ("currentLitres" >= 0 AND "currentLitres" <= "capacityLitres");

-- 6. Loading slots cannot be overbooked.
ALTER TABLE loading_slots
  ADD CONSTRAINT slots_booking_within_capacity
  CHECK ("bookedTrucks" >= 0 AND "bookedTrucks" <= "capacityTrucks");

-- 7. Exactly one primary bank account per organisation.
CREATE UNIQUE INDEX bank_accounts_one_primary_per_org
  ON bank_accounts ("orgId")
  WHERE "isPrimary" = true AND "isActive" = true;

-- 8. An organisation may only have one active subscription.
CREATE UNIQUE INDEX subscriptions_one_active_per_org
  ON subscriptions ("orgId")
  WHERE status IN ('ACTIVE', 'TRIALING', 'PAST_DUE');
