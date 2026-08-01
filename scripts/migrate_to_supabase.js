/**
 * Script para migrar datos de los archivos JSON locales a Supabase
 * 
 * Uso:
 * 1. Asegúrate de tener las variables de entorno configuradas en .env.local
 * 2. Ejecuta: node scripts/migrate_to_supabase.js
 * 
 * Nota: Necesitas tener dotenv instalado: npm install dotenv
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas');
  console.error('Por favor, configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Rutas de los archivos JSON
const dataDir = path.join(process.cwd(), 'data');
const studentsFile = path.join(dataDir, 'students.json');
const detentionsFile = path.join(dataDir, 'detentions.json');

async function migrateStudents() {
  console.log('\n📚 Migrando estudiantes...');
  
  if (!fs.existsSync(studentsFile)) {
    console.log('⚠️  Archivo students.json no encontrado. Saltando...');
    return;
  }

  const studentsData = JSON.parse(fs.readFileSync(studentsFile, 'utf-8'));
  
  if (studentsData.length === 0) {
    console.log('⚠️  No hay estudiantes para migrar.');
    return;
  }

  console.log(`📊 Encontrados ${studentsData.length} estudiantes`);

  // Preparar datos para Supabase
  const studentsToInsert = studentsData.map(s => ({
    id: s.id,
    name: s.name,
    grade: s.grade || null,
    day: s.day,
  }));

  // Insertar en lotes de 100
  const batchSize = 100;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < studentsToInsert.length; i += batchSize) {
    const batch = studentsToInsert.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('nablijven_students')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Error insertando lote ${Math.floor(i / batchSize) + 1}:`, error.message);
      errors += batch.length;
    } else {
      inserted += batch.length;
      console.log(`✓ Insertados ${inserted}/${studentsToInsert.length} estudiantes...`);
    }
  }

  console.log(`✅ Estudiantes migrados: ${inserted} exitosos, ${errors} errores`);
}

async function migrateDetentions() {
  console.log('\n📋 Migrando detenciones...');
  
  if (!fs.existsSync(detentionsFile)) {
    console.log('⚠️  Archivo detentions.json no encontrado. Saltando...');
    return;
  }

  const detentionsData = JSON.parse(fs.readFileSync(detentionsFile, 'utf-8'));
  
  if (detentionsData.length === 0) {
    console.log('⚠️  No hay detenciones para migrar.');
    return;
  }

  console.log(`📊 Encontradas ${detentionsData.length} detenciones`);

  // Preparar datos para Supabase
  const detentionsToInsert = detentionsData.map(d => ({
    id: d.id,
    number: d.number,
    date: d.date,
    day_of_week: d.dayOfWeek,
    student: d.student,
    teacher: d.teacher || null,
    reason: d.reason || null,
    task: d.task || null,
    lvs_date: d.lvsDate || null,
    should_print: d.shouldPrint || false,
    can_use_chromebook: d.canUseChromebook || false,
    extra_notes: d.extraNotes || null,
  }));

  // Insertar en lotes de 100
  const batchSize = 100;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < detentionsToInsert.length; i += batchSize) {
    const batch = detentionsToInsert.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('nablijven_detentions')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Error insertando lote ${Math.floor(i / batchSize) + 1}:`, error.message);
      errors += batch.length;
    } else {
      inserted += batch.length;
      console.log(`✓ Insertadas ${inserted}/${detentionsToInsert.length} detenciones...`);
    }
  }

  console.log(`✅ Detenciones migradas: ${inserted} exitosas, ${errors} errores`);
}

async function main() {
  console.log('🚀 Iniciando migración de datos a Supabase...');
  console.log(`📍 URL: ${supabaseUrl}`);
  console.log('─'.repeat(50));

  try {
    await migrateStudents();
    await migrateDetentions();
    
    console.log('\n' + '─'.repeat(50));
    console.log('✅ Migración completada exitosamente!');
    console.log('\n💡 Verifica los datos en tu dashboard de Supabase');
  } catch (error) {
    console.error('\n❌ Error durante la migración:', error);
    process.exit(1);
  }
}

main();
