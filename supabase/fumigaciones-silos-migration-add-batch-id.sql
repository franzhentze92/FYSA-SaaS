-- =====================================================
-- MIGRATION: Add batch_id to fumigaciones_silos
-- =====================================================

-- Add batch_id column to fumigaciones_silos table
ALTER TABLE fumigaciones_silos
ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES grain_batches(id) ON DELETE CASCADE;

-- Add index for batch_id
CREATE INDEX IF NOT EXISTS idx_fumigaciones_silos_batch_id ON fumigaciones_silos(batch_id);

-- Add composite index for batch_id and fecha_fumigacion
CREATE INDEX IF NOT EXISTS idx_fumigaciones_silos_batch_fecha ON fumigaciones_silos(batch_id, fecha_fumigacion DESC);

