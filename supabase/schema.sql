-- Tabla de estudiantes
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  grade TEXT,
  day TEXT NOT NULL CHECK (day IN ('MAANDAG', 'DINSDAG', 'DONDERDAG')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de detenciones
CREATE TABLE IF NOT EXISTS detentions (
  id TEXT PRIMARY KEY,
  number INTEGER NOT NULL,
  date TEXT NOT NULL,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('MAANDAG', 'DINSDAG', 'DONDERDAG')),
  student TEXT NOT NULL,
  teacher TEXT,
  reason TEXT,
  task TEXT,
  lvs_date TEXT,
  should_print BOOLEAN DEFAULT FALSE,
  can_use_chromebook BOOLEAN DEFAULT FALSE,
  extra_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_students_day ON students(day);
CREATE INDEX IF NOT EXISTS idx_detentions_date ON detentions(date);
CREATE INDEX IF NOT EXISTS idx_detentions_day_of_week ON detentions(day_of_week);
CREATE INDEX IF NOT EXISTS idx_detentions_number ON detentions(number);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_detentions_updated_at BEFORE UPDATE ON detentions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
