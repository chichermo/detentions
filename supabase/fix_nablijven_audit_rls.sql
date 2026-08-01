-- ============================================================
-- Crear nablijven_audit_logs (faltaba) + políticas RLS
-- Ejecutar en el SQL Editor del proyecto Chill Outs
-- ============================================================

CREATE TABLE IF NOT EXISTS public.nablijven_audit_logs (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_by TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_nablijven_audit_table_record
  ON public.nablijven_audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_nablijven_audit_changed_at
  ON public.nablijven_audit_logs(changed_at DESC);

ALTER TABLE public.nablijven_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read nablijven_audit_logs" ON public.nablijven_audit_logs;
DROP POLICY IF EXISTS "Allow anon all on nablijven_audit_logs" ON public.nablijven_audit_logs;
CREATE POLICY "Allow anon all on nablijven_audit_logs"
  ON public.nablijven_audit_logs
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.nablijven_create_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.nablijven_audit_logs (id, table_name, record_id, action, new_data, changed_at)
    VALUES ('audit-' || gen_random_uuid()::text, TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), NOW());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.nablijven_audit_logs (id, table_name, record_id, action, old_data, new_data, changed_at)
    VALUES ('audit-' || gen_random_uuid()::text, TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), NOW());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.nablijven_audit_logs (id, table_name, record_id, action, old_data, changed_at)
    VALUES ('audit-' || gen_random_uuid()::text, TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), NOW());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Re-crear triggers (por si apuntaban a función vieja)
DROP TRIGGER IF EXISTS audit_nablijven_students ON public.nablijven_students;
CREATE TRIGGER audit_nablijven_students
  AFTER INSERT OR UPDATE OR DELETE ON public.nablijven_students
  FOR EACH ROW EXECUTE FUNCTION public.nablijven_create_audit_log();

DROP TRIGGER IF EXISTS audit_nablijven_detentions ON public.nablijven_detentions;
CREATE TRIGGER audit_nablijven_detentions
  AFTER INSERT OR UPDATE OR DELETE ON public.nablijven_detentions
  FOR EACH ROW EXECUTE FUNCTION public.nablijven_create_audit_log();
