-- Calendario: días bloqueados y avisos
CREATE TABLE IF NOT EXISTS calendar_day_settings (
  date TEXT PRIMARY KEY,
  blocked BOOLEAN DEFAULT FALSE,
  allow_detentions BOOLEAN DEFAULT TRUE,
  notice_title TEXT,
  notice TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_day_settings_blocked ON calendar_day_settings(blocked);

-- Asistencia y doble detención (lunes)
ALTER TABLE detentions
ADD COLUMN IF NOT EXISTS did_not_attend BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS source_detention_id TEXT REFERENCES detentions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_detentions_did_not_attend ON detentions(did_not_attend);
CREATE INDEX IF NOT EXISTS idx_detentions_source_detention_id ON detentions(source_detention_id);

COMMENT ON COLUMN detentions.did_not_attend IS 'Leerling is niet komen opdagen (zonder geweigerd)';
COMMENT ON COLUMN detentions.source_detention_id IS 'Koppeling naar oorspronkelijke nablijven (dubbele strafstudie op maandag)';

ALTER TABLE calendar_day_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon all on calendar_day_settings"
  ON calendar_day_settings FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE TRIGGER update_calendar_day_settings_updated_at
  BEFORE UPDATE ON calendar_day_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
