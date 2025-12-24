-- Create table for Fumigación Aprovigra data
-- This allows manual CSV import or sync from Google Sheets

CREATE TABLE IF NOT EXISTS fumigacion_aprovigra (
  id TEXT PRIMARY KEY,
  form_title TEXT,
  date_submitted DATE,
  fecha_servicio DATE,
  nombre_cliente TEXT,
  tipo_servicio TEXT,
  productos_utilizados TEXT,
  dosis TEXT,
  unidad_medida TEXT,
  mezcla_utilizada TEXT,
  cantidad DECIMAL(12, 3) DEFAULT 0,
  comentarios TEXT,
  tecnico TEXT,
  status TEXT DEFAULT 'Pending',
  pdf_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_fumigacion_fecha ON fumigacion_aprovigra(fecha_servicio DESC);
CREATE INDEX IF NOT EXISTS idx_fumigacion_cliente ON fumigacion_aprovigra(nombre_cliente);
CREATE INDEX IF NOT EXISTS idx_fumigacion_tipo ON fumigacion_aprovigra(tipo_servicio);
CREATE INDEX IF NOT EXISTS idx_fumigacion_tecnico ON fumigacion_aprovigra(tecnico);

-- Enable RLS
ALTER TABLE fumigacion_aprovigra ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read
CREATE POLICY "Allow read access" ON fumigacion_aprovigra
  FOR SELECT USING (true);

-- Allow admins to insert/update/delete
CREATE POLICY "Allow admin write access" ON fumigacion_aprovigra
  FOR ALL USING (true);

