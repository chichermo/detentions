/**
 * Script para migrar datos directamente a Supabase
 * Puede ejecutarse desde cualquier lugar, solo necesita las credenciales
 * 
 * Uso:
 * node scripts/migrate_direct_to_supabase.js
 * 
 * O con variables de entorno:
 * NEXT_PUBLIC_SUPABASE_URL=tu_url NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key node scripts/migrate_direct_to_supabase.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno (pueden venir de .env.local o del sistema)
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Si no están en el entorno, intentar cargar desde .env.local
if (!supabaseUrl || !supabaseAnonKey) {
  try {
    require('dotenv').config({ path: '.env.local' });
    supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  } catch (e) {
    // dotenv no disponible o archivo no existe
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas');
  console.error('\nPor favor, proporciona las variables de una de estas formas:');
  console.error('1. Variables de entorno del sistema:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL=tu_url NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key node scripts/migrate_direct_to_supabase.js');
  console.error('2. Archivo .env.local con las variables');
  console.error('3. O edita este script y agrega las credenciales directamente (no recomendado para producción)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Rutas de los archivos JSON (relativas al directorio del proyecto)
const dataDir = path.join(__dirname, '..', 'data');
const studentsFile = path.join(dataDir, 'students.json');
const detentionsFile = path.join(dataDir, 'detentions.json');

async function migrateStudents() {
  console.log('\n📚 Migrando estudiantes...');
  
  if (!fs.existsSync(studentsFile)) {
    console.log('⚠️  Archivo students.json no encontrado. Saltando...');
    return { inserted: 0, errors: 0 };
  }

  const studentsData = JSON.parse(fs.readFileSync(studentsFile, 'utf-8'));
  
  if (studentsData.length === 0) {
    console.log('⚠️  No hay estudiantes para migrar.');
    return { inserted: 0, errors: 0 };
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
      .from('students')
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
  return { inserted, errors };
}

async function migrateDetentions() {
  console.log('\n📋 Migrando detenciones...');
  
  if (!fs.existsSync(detentionsFile)) {
    console.log('⚠️  Archivo detentions.json no encontrado. Saltando...');
    return { inserted: 0, errors: 0 };
  }

  const detentionsData = JSON.parse(fs.readFileSync(detentionsFile, 'utf-8'));
  
  if (detentionsData.length === 0) {
    console.log('⚠️  No hay detenciones para migrar.');
    return { inserted: 0, errors: 0 };
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
      .from('detentions')
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
  return { inserted, errors };
}

async function testConnection() {
  console.log('\n🔍 Probando conexión con Supabase...');
  
  try {
    // Intentar hacer una consulta simple
    const { data, error } = await supabase
      .from('students')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Error de conexión:', error.message);
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.error('\n💡 Las tablas no existen. Por favor:');
        console.error('1. Ve a Supabase Dashboard → SQL Editor');
        console.error('2. Ejecuta el contenido de supabase/schema.sql');
      }
      return false;
    }
    
    console.log('✅ Conexión exitosa con Supabase');
    return true;
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Migración de datos a Supabase');
  console.log('─'.repeat(50));
  console.log(`📍 URL: ${supabaseUrl}`);
  console.log('─'.repeat(50));

  // Probar conexión primero
  const connected = await testConnection();
  if (!connected) {
    console.error('\n❌ No se pudo conectar a Supabase. Por favor verifica:');
    console.error('1. Que las credenciales sean correctas');
    console.error('2. Que las tablas estén creadas (ejecuta supabase/schema.sql)');
    process.exit(1);
  }

  try {
    const studentsResult = await migrateStudents();
    const detentionsResult = await migrateDetentions();
    
    console.log('\n' + '─'.repeat(50));
    console.log('📊 Resumen de la migración:');
    console.log(`   Estudiantes: ${studentsResult.inserted} insertados, ${studentsResult.errors} errores`);
    console.log(`   Detenciones: ${detentionsResult.inserted} insertadas, ${detentionsResult.errors} errores`);
    console.log('─'.repeat(50));
    console.log('✅ Migración completada!');
    console.log('\n💡 Verifica los datos en tu dashboard de Supabase:');
    console.log(`   ${supabaseUrl.replace('/rest/v1', '')}/project/_/editor`);
  } catch (error) {
    console.error('\n❌ Error durante la migración:', error);
    process.exit(1);
  }
}

main();
