-- =====================================================
-- FUMIGACIONES SILOS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS fumigaciones_silos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    silo TEXT NOT NULL,                    -- AP-01, AP-02, etc.
    tipo_grano TEXT NOT NULL,              -- Tipo de grano fumigado
    fecha_fumigacion DATE NOT NULL,        -- Fecha en que se realizó la fumigación
    producto_utilizado TEXT,               -- Nombre del producto fumigante
    dosis TEXT,                            -- Dosis aplicada
    unidad_medida TEXT,                    -- Unidad de medida de la dosis
    tecnico TEXT,                          -- Nombre del técnico que realizó la fumigación
    notas TEXT,                            -- Notas adicionales
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_fumigaciones_silos_silo ON fumigaciones_silos(silo);
CREATE INDEX IF NOT EXISTS idx_fumigaciones_silos_tipo_grano ON fumigaciones_silos(tipo_grano);
CREATE INDEX IF NOT EXISTS idx_fumigaciones_silos_fecha ON fumigaciones_silos(fecha_fumigacion DESC);
CREATE INDEX IF NOT EXISTS idx_fumigaciones_silos_silo_fecha ON fumigaciones_silos(silo, fecha_fumigacion DESC);

-- Enable RLS
ALTER TABLE fumigaciones_silos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access" ON fumigaciones_silos;
DROP POLICY IF EXISTS "Allow admin write access" ON fumigaciones_silos;

-- Allow all authenticated users to read
CREATE POLICY "Allow read access" ON fumigaciones_silos
  FOR SELECT USING (true);

-- Allow admins to insert/update/delete
CREATE POLICY "Allow admin write access" ON fumigaciones_silos
  FOR ALL USING (true);

