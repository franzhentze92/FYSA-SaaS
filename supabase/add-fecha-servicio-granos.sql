-- Add fecha_servicio column to muestreos_granos table
ALTER TABLE muestreos_granos 
ADD COLUMN IF NOT EXISTS fecha_servicio DATE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_muestreos_fecha_servicio ON muestreos_granos(fecha_servicio DESC);

