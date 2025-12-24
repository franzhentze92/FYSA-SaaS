-- Update barcos_detalle table for fondeo records
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Remove the NOT NULL constraint from 'nombre' column
ALTER TABLE barcos_detalle 
ALTER COLUMN nombre DROP NOT NULL;

-- Step 2: Add fondeo-specific columns to barcos_detalle
ALTER TABLE barcos_detalle 
ADD COLUMN IF NOT EXISTS barco_id UUID,
ADD COLUMN IF NOT EXISTS fecha_fondeo DATE,
ADD COLUMN IF NOT EXISTS muestreo_insectos JSONB;

-- Step 3: Add variedad_id column to barcos_granos
ALTER TABLE barcos_granos
ADD COLUMN IF NOT EXISTS variedad_id UUID;

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_barcos_detalle_barco_id ON barcos_detalle(barco_id);
CREATE INDEX IF NOT EXISTS idx_barcos_detalle_fecha_fondeo ON barcos_detalle(fecha_fondeo);
CREATE INDEX IF NOT EXISTS idx_barcos_detalle_cliente_email ON barcos_detalle(cliente_email);

-- Note: The barcos_granos table already has 'tipo' column which we use for grain type
-- No need to add tipo_grano column
