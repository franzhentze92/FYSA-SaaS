-- Schema for Historial de Pérdidas por Batch de Grano
-- Esta tabla almacena el registro semanal de pérdidas económicas y cálculos por batch de grano
-- Rastrea las pérdidas desde que el batch llegó en el barco hasta hoy

CREATE TABLE IF NOT EXISTS historial_perdidas_silos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referencia al muestreo
  muestreo_id UUID REFERENCES muestreos_granos(id) ON DELETE CASCADE,
  
  -- Referencia al batch de grano (nullable para compatibilidad hacia atrás)
  batch_id UUID REFERENCES grain_batches(id) ON DELETE CASCADE,
  
  -- Identificación del silo (mantenido para referencia)
  silo TEXT NOT NULL,              -- AP-07, AP-08, etc.
  
  -- Fecha del registro (semana)
  fecha_semana DATE NOT NULL,       -- Fecha del reporte/semana
  
  -- Tipo de grano en el silo
  tipo_grano TEXT,
  
  -- Cantidades totales del silo
  total_gorgojos_vivos INTEGER DEFAULT 0,
  total_piojillo INTEGER DEFAULT 0,
  total_tons DECIMAL(12, 3) DEFAULT 0,
  
  -- Cálculos de Ácido Úrico y Daños
  acido_urico DECIMAL(12, 4) DEFAULT 0,              -- mg/100g
  dano_gorgojos_adultos_kg DECIMAL(12, 4) DEFAULT 0,
  dano_gorgojos_total_kg DECIMAL(12, 4) DEFAULT 0,
  dano_piojillo_kg DECIMAL(12, 4) DEFAULT 0,
  dano_total_plaga_kg DECIMAL(12, 4) DEFAULT 0,
  perdida_economica_semanal DECIMAL(12, 2) DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_historial_perdidas_silo ON historial_perdidas_silos(silo);
CREATE INDEX IF NOT EXISTS idx_historial_perdidas_fecha ON historial_perdidas_silos(fecha_semana DESC);
CREATE INDEX IF NOT EXISTS idx_historial_perdidas_muestreo ON historial_perdidas_silos(muestreo_id);
CREATE INDEX IF NOT EXISTS idx_historial_perdidas_batch ON historial_perdidas_silos(batch_id);
CREATE INDEX IF NOT EXISTS idx_historial_perdidas_silo_fecha ON historial_perdidas_silos(silo, fecha_semana DESC);
CREATE INDEX IF NOT EXISTS idx_historial_perdidas_batch_fecha ON historial_perdidas_silos(batch_id, fecha_semana DESC);

-- Enable RLS
ALTER TABLE historial_perdidas_silos ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow all on historial_perdidas_silos" ON historial_perdidas_silos;

-- Policy (allow all for now)
CREATE POLICY "Allow all on historial_perdidas_silos" ON historial_perdidas_silos FOR ALL USING (true);

