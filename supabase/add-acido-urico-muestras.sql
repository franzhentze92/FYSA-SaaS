-- Add acido_urico column to muestras_granos table
ALTER TABLE muestras_granos
ADD COLUMN IF NOT EXISTS acido_urico DECIMAL(10, 2);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_muestras_acido_urico ON muestras_granos(acido_urico);

