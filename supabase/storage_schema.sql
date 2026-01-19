-- Crear bucket para archivos adjuntos
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir lectura pública
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'attachments');

-- Política para permitir subida de archivos
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'attachments');

-- Política para permitir eliminación
CREATE POLICY "Authenticated users can delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'attachments');

-- Tabla para rastrear archivos adjuntos
CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY,
  record_id TEXT NOT NULL,
  record_type TEXT NOT NULL CHECK (record_type IN ('detention', 'student')),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  size INTEGER NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_attachments_record ON attachments(record_id, record_type);
CREATE INDEX IF NOT EXISTS idx_attachments_type ON attachments(record_type);

-- RLS
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON attachments FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert access" ON attachments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated delete access" ON attachments FOR DELETE USING (true);
