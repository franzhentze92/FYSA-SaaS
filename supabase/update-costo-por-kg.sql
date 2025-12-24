-- Rename costo_por_ton to costo_por_kg and update comment
-- Check if costo_por_ton exists and rename it, or if costo_por_kg already exists, skip
DO $$
BEGIN
  -- Check if costo_por_ton exists and costo_por_kg doesn't
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'variedades_grano' 
    AND column_name = 'costo_por_ton'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'variedades_grano' 
    AND column_name = 'costo_por_kg'
  ) THEN
    ALTER TABLE variedades_grano RENAME COLUMN costo_por_ton TO costo_por_kg;
  END IF;
END $$;

-- Update comment if needed (PostgreSQL)
COMMENT ON COLUMN variedades_grano.costo_por_kg IS 'Cost per kilogram in Quetzales (Q.) for economic loss calculation';

