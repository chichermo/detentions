-- Corrige el warning "Function Search Path Mutable" en Security Advisor
-- Ejecutar en Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
