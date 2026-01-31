-- ============================================================
-- Voer dit uit in Supabase SQL Editor als je "500" of
-- "column does not exist" krijgt bij opslaan van nablijven.
-- ============================================================

-- Strafstudie (alleen maandag)
ALTER TABLE public.detentions 
ADD COLUMN IF NOT EXISTS is_double_period BOOLEAN DEFAULT FALSE;

ALTER TABLE public.detentions 
ADD COLUMN IF NOT EXISTS time_period TEXT;

-- Nablijven geweigerd
ALTER TABLE public.detentions 
ADD COLUMN IF NOT EXISTS nablijven_geweigerd BOOLEAN DEFAULT FALSE;

-- Optioneel: constraint voor time_period (als je die wilt)
-- ALTER TABLE public.detentions DROP CONSTRAINT IF EXISTS detentions_time_period_check;
-- ALTER TABLE public.detentions ADD CONSTRAINT detentions_time_period_check 
--   CHECK (time_period IS NULL OR time_period IN ('16:00-16:50', '16:50-17:40'));
