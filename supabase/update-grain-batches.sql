-- Add missing columns to grain_batches table for entry date, origin, and notes
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE grain_batches 
ADD COLUMN IF NOT EXISTS entry_date DATE,
ADD COLUMN IF NOT EXISTS origin TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS grain_subtype TEXT;

-- Create index for entry_date
CREATE INDEX IF NOT EXISTS idx_grain_batches_entry_date ON grain_batches(entry_date);

