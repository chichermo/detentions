-- Orden Excel/bulk bewaren (proyecto Nablijven dedicado)
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS sort_order INTEGER;

CREATE INDEX IF NOT EXISTS idx_students_sort
  ON public.students(day, sort_order);

-- Si usáis el proyecto compartido Element (nablijven_*):
-- ALTER TABLE public.nablijven_students ADD COLUMN IF NOT EXISTS sort_order INTEGER;
-- CREATE INDEX IF NOT EXISTS idx_nablijven_students_sort ON public.nablijven_students(day, sort_order);
