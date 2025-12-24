-- =====================================================
-- Make silo_id nullable in grain_batches
-- This allows batches to be disconnected from silos
-- without deleting them (for historical tracking)
-- =====================================================

-- Check if the column is already nullable
DO $$
BEGIN
  -- Alter the column to allow NULL values
  ALTER TABLE grain_batches 
  ALTER COLUMN silo_id DROP NOT NULL;
EXCEPTION
  WHEN OTHERS THEN
    -- Column might already be nullable or error occurred
    RAISE NOTICE 'silo_id column might already be nullable or error: %', SQLERRM;
END $$;

-- Also ensure silo_actual can be null
ALTER TABLE grain_batches 
ALTER COLUMN silo_actual DROP NOT NULL;

