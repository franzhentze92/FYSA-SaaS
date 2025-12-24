-- =====================================================
-- MIGRATION: Add servicio_id to fumigaciones_silos
-- =====================================================

-- Add servicio_id column to fumigaciones_silos table
ALTER TABLE fumigaciones_silos
ADD COLUMN IF NOT EXISTS servicio_id INTEGER;

-- Add index for servicio_id
CREATE INDEX IF NOT EXISTS idx_fumigaciones_silos_servicio_id ON fumigaciones_silos(servicio_id);

