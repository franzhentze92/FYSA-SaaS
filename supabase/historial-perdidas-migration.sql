-- Migration: Add batch_id column to historial_perdidas_silos table
-- Run this if the table already exists and you need to add the batch_id column

-- Add batch_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'historial_perdidas_silos' 
    AND column_name = 'batch_id'
  ) THEN
    ALTER TABLE historial_perdidas_silos
    ADD COLUMN batch_id UUID REFERENCES grain_batches(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index for batch_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_historial_perdidas_batch ON historial_perdidas_silos(batch_id);

-- Create composite index for batch_id and fecha_semana if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_historial_perdidas_batch_fecha ON historial_perdidas_silos(batch_id, fecha_semana DESC);
