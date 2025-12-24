-- =====================================================
-- FYSA SaaS Additional Tables
-- Run this in Supabase SQL Editor AFTER the main schema
-- =====================================================

-- =====================================================
-- GRAIN BATCHES TABLE (for silos)
-- =====================================================
CREATE TABLE IF NOT EXISTS grain_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    silo_id UUID REFERENCES silos(id) ON DELETE CASCADE,
    barco_id TEXT,
    grano_id TEXT,
    variedad_id TEXT,
    grain_type TEXT NOT NULL,
    quantity DECIMAL NOT NULL DEFAULT 0,
    unit TEXT DEFAULT 'tonnes',
    silo_actual INTEGER,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- BATCH MOVEMENTS TABLE (historial de movimientos)
-- =====================================================
CREATE TABLE IF NOT EXISTS batch_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID REFERENCES grain_batches(id) ON DELETE CASCADE,
    silo_origen INTEGER NOT NULL,
    silo_destino INTEGER NOT NULL,
    cantidad DECIMAL NOT NULL,
    notas TEXT,
    fecha TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- BARCOS DETALLE TABLE (ships with grains)
-- =====================================================
CREATE TABLE IF NOT EXISTS barcos_detalle (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    bl TEXT,
    eta TEXT,
    requiere_tratamiento_oirsa BOOLEAN DEFAULT false,
    notas TEXT,
    cliente_email TEXT,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- BARCOS GRANOS TABLE (grains in ships)
-- =====================================================
CREATE TABLE IF NOT EXISTS barcos_granos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barco_id UUID REFERENCES barcos_detalle(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    variedad TEXT,
    cantidad DECIMAL NOT NULL DEFAULT 0,
    unidad TEXT DEFAULT 'MT'
);

-- =====================================================
-- DOCUMENTOS TABLE (for auditoria, tecnicos, croquis)
-- =====================================================
CREATE TABLE IF NOT EXISTS documentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo TEXT NOT NULL, -- 'auditoria', 'tecnicos', 'croquis'
    titulo TEXT NOT NULL,
    descripcion TEXT,
    archivo_url TEXT,
    archivo_nombre TEXT,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_modificacion TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Enable RLS and policies for new tables
-- =====================================================
ALTER TABLE grain_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE barcos_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE barcos_granos ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for grain_batches" ON grain_batches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for batch_movements" ON batch_movements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for barcos_detalle" ON barcos_detalle FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for barcos_granos" ON barcos_granos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for documentos" ON documentos FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- VARIEDADES GRANO TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS variedades_grano (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_grano TEXT NOT NULL,
    variedad TEXT NOT NULL,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE variedades_grano ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for variedades_grano" ON variedades_grano FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- MAPAS CALOR TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS mapas_calor (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    cliente_email TEXT NOT NULL,
    cliente_nombre TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('control-roedores', 'monitoreo-trampas-luz')),
    fecha DATE NOT NULL,
    archivo_url TEXT NOT NULL,
    archivo_nombre TEXT NOT NULL,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_modificacion TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mapas_calor ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for mapas_calor" ON mapas_calor FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_grain_batches_silo_id ON grain_batches(silo_id);
CREATE INDEX IF NOT EXISTS idx_batch_movements_batch_id ON batch_movements(batch_id);
CREATE INDEX IF NOT EXISTS idx_barcos_granos_barco_id ON barcos_granos(barco_id);
CREATE INDEX IF NOT EXISTS idx_documentos_tipo ON documentos(tipo);
CREATE INDEX IF NOT EXISTS idx_variedades_grano_tipo ON variedades_grano(tipo_grano);
CREATE INDEX IF NOT EXISTS idx_mapas_calor_cliente_id ON mapas_calor(cliente_id);
CREATE INDEX IF NOT EXISTS idx_mapas_calor_cliente_email ON mapas_calor(cliente_email);
CREATE INDEX IF NOT EXISTS idx_mapas_calor_tipo ON mapas_calor(tipo);
CREATE INDEX IF NOT EXISTS idx_mapas_calor_fecha ON mapas_calor(fecha);

