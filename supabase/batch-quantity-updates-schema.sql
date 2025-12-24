-- Schema for Batch Quantity Updates
-- Esta tabla almacena los cambios de cantidad en batches (despachos, ajustes, etc.)
-- Se registra cada vez que se actualiza la cantidad de un batch

CREATE TABLE IF NOT EXISTS batch_quantity_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES grain_batches(id) ON DELETE CASCADE NOT NULL,
  silo_id UUID REFERENCES silos(id) ON DELETE CASCADE NOT NULL,
  cantidad_anterior DECIMAL(12, 3) NOT NULL,
  cantidad_nueva DECIMAL(12, 3) NOT NULL,
  cantidad_cambio DECIMAL(12, 3) NOT NULL, -- Positivo = aumento, Negativo = disminución
  unit TEXT NOT NULL DEFAULT 'tonnes',
  notas TEXT,
  fecha TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_batch_quantity_updates_batch ON batch_quantity_updates(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_quantity_updates_silo ON batch_quantity_updates(silo_id);
CREATE INDEX IF NOT EXISTS idx_batch_quantity_updates_fecha ON batch_quantity_updates(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_batch_quantity_updates_batch_fecha ON batch_quantity_updates(batch_id, fecha DESC);

