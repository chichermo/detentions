-- Personeelslijst voor Nablijven (gedeeld Supabase-project)
CREATE TABLE IF NOT EXISTS public.nablijven_staff (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nablijven_staff_name ON public.nablijven_staff (name);
CREATE INDEX IF NOT EXISTS idx_nablijven_staff_sort ON public.nablijven_staff (sort_order);

DROP TRIGGER IF EXISTS update_nablijven_staff_updated_at ON public.nablijven_staff;
CREATE TRIGGER update_nablijven_staff_updated_at
  BEFORE UPDATE ON public.nablijven_staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.nablijven_staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon all on nablijven_staff" ON public.nablijven_staff;
CREATE POLICY "Allow anon all on nablijven_staff"
  ON public.nablijven_staff FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated all on nablijven_staff" ON public.nablijven_staff;
CREATE POLICY "Allow authenticated all on nablijven_staff"
  ON public.nablijven_staff FOR ALL TO authenticated USING (true) WITH CHECK (true);
