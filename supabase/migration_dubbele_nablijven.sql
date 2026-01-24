-- Migración para agregar funcionalidad de Strafstudie
-- Solo disponible los lunes de 16:00 a 17:40

-- Agregar columnas para strafstudie
ALTER TABLE detentions 
ADD COLUMN IF NOT EXISTS is_double_period BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS time_period TEXT CHECK (
  time_period IS NULL OR 
  time_period IN ('16:00-16:50', '16:50-17:40')
);

-- Crear índice para mejorar búsquedas por período doble
CREATE INDEX IF NOT EXISTS idx_detentions_is_double_period ON detentions(is_double_period);
CREATE INDEX IF NOT EXISTS idx_detentions_time_period ON detentions(time_period);

-- Comentarios para documentación
COMMENT ON COLUMN detentions.is_double_period IS 'Indica si es strafstudie (solo lunes, 16:00-17:40)';
COMMENT ON COLUMN detentions.time_period IS 'Período de tiempo específico para strafstudie (2 periodos de 50 minutos)';
