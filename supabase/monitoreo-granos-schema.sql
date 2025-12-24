-- Schema for Monitoreo de Granos AP (Grain Monitoring Reports)
-- Updated to match actual PDF table structure

-- Drop existing tables with CASCADE to handle dependencies
DROP TABLE IF EXISTS muestras_granos CASCADE;
DROP TABLE IF EXISTS muestreos_ubicaciones CASCADE;
DROP TABLE IF EXISTS muestreos_insectos CASCADE;
DROP TABLE IF EXISTS muestreos_granos CASCADE;

-- Main table for grain sampling reports (header info)
CREATE TABLE muestreos_granos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Report metadata
  numero_reporte TEXT NOT NULL,
  fecha_reporte DATE,
  cliente TEXT NOT NULL,
  
  -- Summary
  total_muestras INTEGER DEFAULT 0,
  total_insectos INTEGER DEFAULT 0,
  nivel_riesgo TEXT DEFAULT 'bajo' CHECK (nivel_riesgo IN ('bajo', 'medio', 'alto', 'critico')),
  
  -- PDF file
  archivo_nombre TEXT,
  archivo_url TEXT,
  
  -- Raw text for reference
  texto_extraido TEXT,
  
  -- Audit
  creado_por TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual sample rows from the table
CREATE TABLE muestras_granos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  muestreo_id UUID REFERENCES muestreos_granos(id) ON DELETE CASCADE,
  
  -- Location
  silo TEXT NOT NULL,              -- AP-07, AP-08, etc.
  muestra TEXT,                    -- Arriba, Abajo (sample position)
  
  -- Origin
  barco TEXT,                      -- Ship name
  tipo_grano TEXT,                 -- Malta, Cprs, Srw, etc.
  
  -- Storage
  fecha_almacenamiento DATE,
  dias_almacenamiento INTEGER,
  
  -- Pest counts - Piojillo/Ácaro
  piojillo_acaro INTEGER DEFAULT 0,
  
  -- Tribolium
  trib_vivos INTEGER DEFAULT 0,
  trib_muertos INTEGER DEFAULT 0,
  
  -- Rhyzopertha
  rhyz_vivos INTEGER DEFAULT 0,
  rhyz_muertos INTEGER DEFAULT 0,
  
  -- Cryptolestes
  chry_vivos INTEGER DEFAULT 0,
  chry_muertos INTEGER DEFAULT 0,
  
  -- Sitophilus
  sito_vivos INTEGER DEFAULT 0,
  sito_muertos INTEGER DEFAULT 0,
  
  -- Stegobium
  steg_vivos INTEGER DEFAULT 0,
  steg_muertos INTEGER DEFAULT 0,
  
  -- Observations (weight/quantity)
  observaciones DECIMAL(12, 3),
  
  -- Calculated totals
  total_insectos_vivos INTEGER DEFAULT 0,
  total_insectos_muertos INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_muestreos_fecha ON muestreos_granos(fecha_reporte DESC);
CREATE INDEX IF NOT EXISTS idx_muestreos_cliente ON muestreos_granos(cliente);
CREATE INDEX IF NOT EXISTS idx_muestreos_numero ON muestreos_granos(numero_reporte);
CREATE INDEX IF NOT EXISTS idx_muestras_silo ON muestras_granos(silo);
CREATE INDEX IF NOT EXISTS idx_muestras_muestreo ON muestras_granos(muestreo_id);

-- Enable RLS
ALTER TABLE muestreos_granos ENABLE ROW LEVEL SECURITY;
ALTER TABLE muestras_granos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all on muestreos_granos" ON muestreos_granos;
DROP POLICY IF EXISTS "Allow all on muestras_granos" ON muestras_granos;

-- Policies (allow all for now)
CREATE POLICY "Allow all on muestreos_granos" ON muestreos_granos FOR ALL USING (true);
CREATE POLICY "Allow all on muestras_granos" ON muestras_granos FOR ALL USING (true);
