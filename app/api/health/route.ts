import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Endpoint de verificación de salud
 * Verifica que Supabase esté configurado y funcionando
 */
export async function GET() {
  const checks = {
    supabase_configured: false,
    supabase_connected: false,
    tables_exist: false,
    timestamp: new Date().toISOString(),
  };

  try {
    // Verificar si Supabase está configurado
    if (supabase) {
      checks.supabase_configured = true;

      // Intentar una consulta simple para verificar conexión
      const { data, error } = await supabase
        .from('students')
        .select('count', { count: 'exact', head: true });

      if (!error) {
        checks.supabase_connected = true;
        checks.tables_exist = true;
      } else if (error.message.includes('relation') || error.message.includes('does not exist')) {
        checks.supabase_connected = true; // Conexión OK, pero tablas no existen
        checks.tables_exist = false;
      }
    }

    const allGood = checks.supabase_configured && checks.supabase_connected && checks.tables_exist;

    return NextResponse.json({
      status: allGood ? 'ok' : 'warning',
      checks,
      message: allGood
        ? 'Supabase está configurado y funcionando correctamente'
        : checks.supabase_configured
        ? checks.tables_exist
          ? 'Supabase conectado pero hay problemas'
          : 'Supabase conectado pero las tablas no existen. Ejecuta supabase/schema.sql'
        : 'Supabase no está configurado. Agrega NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY',
    }, { status: allGood ? 200 : 503 });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      checks,
      error: error.message,
    }, { status: 500 });
  }
}
