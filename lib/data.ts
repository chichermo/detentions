import { Student, Detention, DetentionSession, DayOfWeek } from '@/types';
import fs from 'fs';
import path from 'path';

// Detectar si estamos en Vercel
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;

// Para Vercel, usar variables de entorno o una solución alternativa
// Por ahora, usaremos una combinación de archivos locales (desarrollo) y memoria (producción)
let memoryStore: {
  students: Student[];
  detentions: Detention[];
} = {
  students: [],
  detentions: [],
};

const DATA_DIR = path.join(process.cwd(), 'data');
const STUDENTS_FILE = path.join(DATA_DIR, 'students.json');
const DETENTIONS_FILE = path.join(DATA_DIR, 'detentions.json');

// Inicializar datos en memoria desde archivos si existen (solo en desarrollo)
if (!isVercel) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(STUDENTS_FILE)) {
    fs.writeFileSync(STUDENTS_FILE, JSON.stringify([], null, 2));
  }

  if (!fs.existsSync(DETENTIONS_FILE)) {
    fs.writeFileSync(DETENTIONS_FILE, JSON.stringify([], null, 2));
  }

  // Cargar datos iniciales desde archivos
  try {
    const studentsData = fs.readFileSync(STUDENTS_FILE, 'utf8');
    memoryStore.students = JSON.parse(studentsData);
  } catch (error) {
    memoryStore.students = [];
  }

  try {
    const detentionsData = fs.readFileSync(DETENTIONS_FILE, 'utf8');
    memoryStore.detentions = JSON.parse(detentionsData);
  } catch (error) {
    memoryStore.detentions = [];
  }
}

// Función helper para guardar en archivo (solo desarrollo)
function saveToFile(file: string, data: any) {
  if (!isVercel) {
    try {
      fs.writeFileSync(file, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving to file:', error);
    }
  }
}

export function getStudents(day?: DayOfWeek): Student[] {
  try {
    let students = memoryStore.students;
    
    // En desarrollo, intentar leer del archivo
    if (!isVercel && fs.existsSync(STUDENTS_FILE)) {
      const data = fs.readFileSync(STUDENTS_FILE, 'utf8');
      students = JSON.parse(data);
      memoryStore.students = students;
    }
    
    if (day) {
      return students.filter(s => s.day === day).sort((a, b) => a.name.localeCompare(b.name));
    }
    return students.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    return [];
  }
}

export function saveStudent(student: Student): void {
  const students = getStudents();
  const index = students.findIndex(s => s.id === student.id);
  if (index >= 0) {
    students[index] = student;
  } else {
    students.push(student);
  }
  memoryStore.students = students;
  saveToFile(STUDENTS_FILE, students);
}

export function deleteStudent(id: string): void {
  const students = getStudents();
  const filtered = students.filter(s => s.id !== id);
  memoryStore.students = filtered;
  saveToFile(STUDENTS_FILE, filtered);
}

export function getDetentions(date?: string): Detention[] {
  try {
    let detentions = memoryStore.detentions;
    
    // En desarrollo, intentar leer del archivo
    if (!isVercel && fs.existsSync(DETENTIONS_FILE)) {
      const data = fs.readFileSync(DETENTIONS_FILE, 'utf8');
      detentions = JSON.parse(data);
      memoryStore.detentions = detentions;
    }
    
    let filtered = date ? detentions.filter(d => d.date === date) : detentions;
    // Ordenar por número para asegurar orden correcto
    return filtered.sort((a, b) => a.number - b.number);
  } catch (error) {
    return [];
  }
}

export function getDetentionsByDateRange(startDate: string, endDate: string): Detention[] {
  const detentions = getDetentions();
  return detentions.filter(d => d.date >= startDate && d.date <= endDate);
}

export function saveDetention(detention: Detention): void {
  const detentions = getDetentions();
  const index = detentions.findIndex(d => d.id === detention.id);
  if (index >= 0) {
    detentions[index] = detention;
  } else {
    detentions.push(detention);
  }
  memoryStore.detentions = detentions;
  saveToFile(DETENTIONS_FILE, detentions);
}

export function deleteDetention(id: string): void {
  const detentions = getDetentions();
  const filtered = detentions.filter(d => d.id !== id);
  memoryStore.detentions = filtered;
  saveToFile(DETENTIONS_FILE, filtered);
}

export function getDetentionSessions(): DetentionSession[] {
  const detentions = getDetentions();
  const sessionsMap = new Map<string, Detention[]>();
  
  detentions.forEach(detention => {
    if (!sessionsMap.has(detention.date)) {
      sessionsMap.set(detention.date, []);
    }
    sessionsMap.get(detention.date)!.push(detention);
  });
  
  return Array.from(sessionsMap.entries()).map(([date, detentions]) => ({
    date,
    dayOfWeek: detentions[0].dayOfWeek,
    detentions: detentions.sort((a, b) => a.number - b.number),
  })).sort((a, b) => a.date.localeCompare(b.date));
}
