-- Migration: consolidate duplicate categories (case-insensitive)
-- This script:
-- 1) Creates a backup table `Categories_backup` (if missing)
-- 2) Finds category names that appear more than once (case-insensitive)
-- 3) Chooses the canonical id (lowest id) per name and backs up non-canonical rows
-- 4) Re-points Products."CategoryId" to the canonical id
-- 5) Deletes duplicate category rows that have no remaining references
-- 6) Creates a UNIQUE index on lower(name) to prevent future duplicates

-- IMPORTANT: For very large installations create the index CONCURRENTLY outside
-- of a transaction to avoid long locks. See comments at the end.

BEGIN;

-- Ensure a backup table exists
CREATE TABLE IF NOT EXISTS "Categories_backup" AS TABLE "Categories" WITH NO DATA;

-- Identify duplicate category groups (case-insensitive)
WITH duplicates AS (
  SELECT lower("name") AS lname,
         min("id") AS canonical_id,
         array_agg("id") AS ids,
         count(*) AS cnt
  FROM "Categories"
  GROUP BY lower("name")
  HAVING count(*) > 1
)

-- Backup non-canonical category rows
INSERT INTO "Categories_backup"
SELECT c.*
FROM "Categories" c
JOIN duplicates d ON lower(c."name") = d.lname
WHERE c."id" <> d.canonical_id;

-- Re-point Products to canonical category ids
UPDATE "Products" p
SET "CategoryId" = d.canonical_id
FROM duplicates d
WHERE p."CategoryId" = ANY(d.ids)
  AND p."CategoryId" <> d.canonical_id;

-- Delete duplicate category rows that no longer have product references
DELETE FROM "Categories" c
USING duplicates d
WHERE lower(c."name") = d.lname
  AND c."id" <> d.canonical_id
  AND NOT EXISTS (
    SELECT 1 FROM "Products" p WHERE p."CategoryId" = c."id"
  );

COMMIT;

-- Create a case-insensitive unique index on lower(name) to prevent future duplicates.
-- NOTE: Creating an index CONCURRENTLY avoids locking writes but cannot be run
-- inside a transaction block. For large production DBs, run the following
-- statement separately (outside of a transaction):
--   CREATE UNIQUE INDEX CONCURRENTLY idx_categories_name_lower ON "Categories"(lower("name"));
-- The statement below creates the index non-concurrently if it does not exist.
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name_lower ON "Categories"(lower("name"));

-- Safety notes:
-- 1) Non-canonical categories are copied into "Categories_backup" before deletion.
-- 2) If you prefer not to delete duplicates, remove or comment-out the DELETE block.
-- 3) Always take a full DB backup before running this migration.
