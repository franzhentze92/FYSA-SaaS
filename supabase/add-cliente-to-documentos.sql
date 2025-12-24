-- Add cliente_email and cliente_nombre columns to documentos table
ALTER TABLE documentos 
ADD COLUMN IF NOT EXISTS cliente_email TEXT,
ADD COLUMN IF NOT EXISTS cliente_nombre TEXT;

-- Create index for faster lookups by client
CREATE INDEX IF NOT EXISTS idx_documentos_cliente_email ON documentos(cliente_email);

-- Add cliente_email and cliente_nombre columns to documentos_servicio table (if not done already)
ALTER TABLE documentos_servicio 
ADD COLUMN IF NOT EXISTS cliente_email TEXT,
ADD COLUMN IF NOT EXISTS cliente_nombre TEXT;

-- Create index for faster lookups by client
CREATE INDEX IF NOT EXISTS idx_documentos_servicio_cliente_email ON documentos_servicio(cliente_email);
