-- Execute this script manually only after creating user ID 1.
-- This file stays outside back/_sql so the migration runner ignores it.

BEGIN TRANSACTION;

UPDATE categories
SET user_id = 1
WHERE user_id IS NULL;

UPDATE transactions
SET user_id = 1
WHERE user_id IS NULL;

COMMIT;
