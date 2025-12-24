-- Add damage calculation columns to muestras_granos table
ALTER TABLE muestras_granos
ADD COLUMN IF NOT EXISTS dano_gorgojos_adultos_kg DECIMAL(12, 4),
ADD COLUMN IF NOT EXISTS dano_gorgojos_total_kg DECIMAL(12, 4),
ADD COLUMN IF NOT EXISTS dano_piojillo_kg DECIMAL(12, 4),
ADD COLUMN IF NOT EXISTS dano_total_plaga_kg DECIMAL(12, 4),
ADD COLUMN IF NOT EXISTS perdida_economica_semanal DECIMAL(12, 4);

-- Add cost per kilogram column to variedades_grano table for economic loss calculation
-- Note: This column should be named costo_por_kg (see update-costo-por-kg.sql)
-- Add costo_por_kg directly (skip if already exists)
ALTER TABLE variedades_grano
ADD COLUMN IF NOT EXISTS costo_por_kg DECIMAL(10, 2);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_muestras_dano_total ON muestras_granos(dano_total_plaga_kg);
CREATE INDEX IF NOT EXISTS idx_muestras_perdida_economica ON muestras_granos(perdida_economica_semanal);

