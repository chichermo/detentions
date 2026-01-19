-- Tabla de auditoría para historial de cambios
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_by TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_at ON audit_logs(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Función para crear logs de auditoría automáticamente
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (id, table_name, record_id, action, new_data, changed_at)
    VALUES (
      'audit-' || gen_random_uuid()::text,
      TG_TABLE_NAME,
      NEW.id,
      'INSERT',
      to_jsonb(NEW),
      NOW()
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (id, table_name, record_id, action, old_data, new_data, changed_at)
    VALUES (
      'audit-' || gen_random_uuid()::text,
      TG_TABLE_NAME,
      NEW.id,
      'UPDATE',
      to_jsonb(OLD),
      to_jsonb(NEW),
      NOW()
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (id, table_name, record_id, action, old_data, changed_at)
    VALUES (
      'audit-' || gen_random_uuid()::text,
      TG_TABLE_NAME,
      OLD.id,
      'DELETE',
      to_jsonb(OLD),
      NOW()
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers para estudiantes
DROP TRIGGER IF EXISTS audit_students ON students;
CREATE TRIGGER audit_students
  AFTER INSERT OR UPDATE OR DELETE ON students
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- Triggers para detenciones
DROP TRIGGER IF EXISTS audit_detentions ON detentions;
CREATE TRIGGER audit_detentions
  AFTER INSERT OR UPDATE OR DELETE ON detentions
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- Política RLS para audit_logs (solo lectura para usuarios)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON audit_logs FOR SELECT USING (true);
