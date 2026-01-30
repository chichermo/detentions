-- ============================================================
-- Habilitar Row Level Security (RLS) - Corrige Security Advisor
-- ============================================================
-- Ejecuta este script en Supabase: SQL Editor > New query
-- Así se corrige el error "RLS Disabled in Public" para
-- public.students y public.detentions
-- ============================================================

-- 1. Habilitar RLS en las tablas
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detentions ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para public.students (permite operaciones con anon key)
-- La app usa la clave anon; estas políticas mantienen el mismo comportamiento
DROP POLICY IF EXISTS "Allow anon all on students" ON public.students;
CREATE POLICY "Allow anon all on students"
  ON public.students
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- 3. Políticas para public.detentions
DROP POLICY IF EXISTS "Allow anon all on detentions" ON public.detentions;
CREATE POLICY "Allow anon all on detentions"
  ON public.detentions
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- 4. (Opcional) Si en el futuro usas service_role desde el backend,
--    puedes añadir políticas para authenticated cuando tengas auth:
-- CREATE POLICY "Allow authenticated all on students" ON public.students
--   FOR ALL TO authenticated USING (true) WITH CHECK (true);
