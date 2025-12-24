-- =====================================================
-- FYSA SaaS Database Schema
-- Run this in Supabase SQL Editor (supabase.com > SQL Editor)
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUM TYPES
-- =====================================================
CREATE TYPE user_role AS ENUM ('admin', 'cliente');

-- =====================================================
-- USERS TABLE (for app-level user management)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    role user_role DEFAULT 'cliente',
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default admin user
INSERT INTO users (email, nombre, role, activo) 
VALUES ('admin@fysa.com', 'Administrador FYSA', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- CLIENTES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SERVICIOS ASIGNADOS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS servicios_asignados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    servicio_id INTEGER NOT NULL,
    servicio_titulo TEXT NOT NULL,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    cliente_email TEXT NOT NULL,
    cliente_nombre TEXT NOT NULL,
    fecha_asignacion TIMESTAMPTZ DEFAULT NOW(),
    activo BOOLEAN DEFAULT true,
    UNIQUE(servicio_id, cliente_email)
);

-- =====================================================
-- FACTURAS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS facturas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fecha_factura DATE NOT NULL,
    numero_factura TEXT NOT NULL,
    cliente_email TEXT,
    reporte_ids TEXT[] DEFAULT '{}',
    notas TEXT,
    archivo_url TEXT,
    archivo_nombre TEXT,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_modificacion TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DOCUMENTOS SERVICIO TABLE (Reports)
-- =====================================================
CREATE TABLE IF NOT EXISTS documentos_servicio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    servicio_id INTEGER NOT NULL,
    fecha_servicio DATE NOT NULL,
    numero_reporte TEXT NOT NULL,
    notas TEXT,
    archivo_url TEXT,
    archivo_nombre TEXT,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_modificacion TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SILOS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS silos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    capacidad INTEGER NOT NULL DEFAULT 0,
    ubicacion TEXT NOT NULL,
    tipo_grano TEXT,
    cliente_email TEXT,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- LOTES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    silo_id UUID REFERENCES silos(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    cantidad DECIMAL NOT NULL DEFAULT 0,
    tipo_grano TEXT NOT NULL,
    fecha_ingreso DATE NOT NULL,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- BARCOS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS barcos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    capacidad INTEGER NOT NULL DEFAULT 0,
    estado TEXT DEFAULT 'activo',
    cliente_email TEXT,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- BARCOS MAESTROS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS barcos_maestros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    cliente_email TEXT NOT NULL,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios_asignados ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_servicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE silos ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE barcos ENABLE ROW LEVEL SECURITY;
ALTER TABLE barcos_maestros ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (we'll refine policies later)
-- Users table policies
CREATE POLICY "Allow all for users" ON users FOR ALL USING (true) WITH CHECK (true);

-- Clientes table policies
CREATE POLICY "Allow all for clientes" ON clientes FOR ALL USING (true) WITH CHECK (true);

-- Servicios asignados policies
CREATE POLICY "Allow all for servicios_asignados" ON servicios_asignados FOR ALL USING (true) WITH CHECK (true);

-- Facturas policies
CREATE POLICY "Allow all for facturas" ON facturas FOR ALL USING (true) WITH CHECK (true);

-- Documentos servicio policies
CREATE POLICY "Allow all for documentos_servicio" ON documentos_servicio FOR ALL USING (true) WITH CHECK (true);

-- Silos policies
CREATE POLICY "Allow all for silos" ON silos FOR ALL USING (true) WITH CHECK (true);

-- Lotes policies
CREATE POLICY "Allow all for lotes" ON lotes FOR ALL USING (true) WITH CHECK (true);

-- Barcos policies
CREATE POLICY "Allow all for barcos" ON barcos FOR ALL USING (true) WITH CHECK (true);

-- Barcos maestros policies
CREATE POLICY "Allow all for barcos_maestros" ON barcos_maestros FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- INDEXES for better performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_servicios_asignados_cliente_email ON servicios_asignados(cliente_email);
CREATE INDEX IF NOT EXISTS idx_facturas_cliente_email ON facturas(cliente_email);
CREATE INDEX IF NOT EXISTS idx_documentos_servicio_servicio_id ON documentos_servicio(servicio_id);
CREATE INDEX IF NOT EXISTS idx_silos_cliente_email ON silos(cliente_email);
CREATE INDEX IF NOT EXISTS idx_barcos_cliente_email ON barcos(cliente_email);
CREATE INDEX IF NOT EXISTS idx_barcos_maestros_cliente_email ON barcos_maestros(cliente_email);

-- =====================================================
-- STORAGE BUCKET for files (PDFs)
-- Run this separately in Supabase Dashboard > Storage
-- =====================================================
-- Create a bucket called 'documentos' for storing PDFs
-- Go to Storage > New Bucket > Name: 'documentos' > Public: true

