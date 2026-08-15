-- Optie op maandag: strafstudie uitschakelen (wel nablijven, geen strafstudie)
-- Tabel: nablijven_calendar_day_settings (gedeelde Element-DB)

ALTER TABLE public.nablijven_calendar_day_settings
ADD COLUMN IF NOT EXISTS allow_strafstudie BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN public.nablijven_calendar_day_settings.allow_strafstudie IS
  'Op maandag: false = alleen gewoon nablijven, geen strafstudie toegestaan';

-- Legacy-tabelnaam (indien nog in gebruik)
ALTER TABLE IF EXISTS public.calendar_day_settings
ADD COLUMN IF NOT EXISTS allow_strafstudie BOOLEAN DEFAULT TRUE;
