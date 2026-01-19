# Configuración Completa para Vercel + Supabase

Esta guía te ayudará a configurar tu aplicación para que funcione completamente en Vercel con Supabase, sin necesidad de desarrollo local.

## 📋 Checklist de Configuración

### ✅ Paso 1: Crear Tablas en Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a **SQL Editor**
3. Abre el archivo `supabase/schema.sql` de este proyecto
4. Copia **TODO** el contenido
5. Pégalo en el SQL Editor de Supabase
6. Haz clic en **Run** (o presiona Ctrl+Enter)
7. Verifica que aparezca "Success. No rows returned"

**Verificación**: Ve a **Table Editor** y deberías ver las tablas `students` y `detentions`

### ✅ Paso 2: Configurar Variables de Entorno en Vercel

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto `detentions`
3. Ve a **Settings** → **Environment Variables**
4. Haz clic en **Add New** y agrega:

#### Variable 1:
- **Key**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: `https://cdebshkodffyozgftsfq.supabase.co`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

#### Variable 2:
- **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkZWJzaGtvZGZmeW96Z2Z0c2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0ODI4OTYsImV4cCI6MjA4NDA1ODg5Nn0.kE56x58RVmD2re1G2fqb5IW6wgOjMdAcXKksiM_tKbc`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

5. Haz clic en **Save** para cada variable

### ✅ Paso 3: Redesplegar la Aplicación

1. Ve a la pestaña **Deployments**
2. Haz clic en los tres puntos (⋯) del último deployment
3. Selecciona **Redeploy**
4. Espera a que termine el build

**O simplemente haz un push a GitHub** y Vercel desplegará automáticamente.

### ✅ Paso 4: Verificar que Todo Funciona

#### Opción A: Usar el Endpoint de Health Check

Visita en tu navegador:
```
https://tu-app.vercel.app/api/health
```

Deberías ver algo como:
```json
{
  "status": "ok",
  "checks": {
    "supabase_configured": true,
    "supabase_connected": true,
    "tables_exist": true,
    "timestamp": "2025-01-XX..."
  },
  "message": "Supabase está configurado y funcionando correctamente"
}
```

#### Opción B: Probar en la Aplicación

1. Visita tu aplicación en Vercel
2. Intenta agregar un estudiante en `/students`
3. Intenta crear una detención en `/detentions/new`
4. Verifica en Supabase Dashboard → **Table Editor** que los datos aparezcan

### ✅ Paso 5: Migrar Datos Existentes (Opcional)

Si tienes datos en los archivos JSON (`data/students.json` y `data/detentions.json`) y quieres migrarlos a Supabase:

#### Opción A: Desde tu máquina local (si tienes los archivos)

```bash
# Asegúrate de tener .env.local con las credenciales
npm run migrate
```

#### Opción B: Ejecutar directamente con las credenciales

```bash
NEXT_PUBLIC_SUPABASE_URL=https://cdebshkodffyozgftsfq.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon \
node scripts/migrate_direct_to_supabase.js
```

## 🔍 Solución de Problemas

### Error: "Supabase not configured"

**Causa**: Las variables de entorno no están configuradas en Vercel

**Solución**:
1. Verifica que las variables estén en Vercel Dashboard → Settings → Environment Variables
2. Asegúrate de que los nombres sean exactos: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Verifica que estén seleccionados todos los ambientes (Production, Preview, Development)
4. Redespliega la aplicación

### Error: "relation does not exist"

**Causa**: Las tablas no están creadas en Supabase

**Solución**:
1. Ve a Supabase Dashboard → SQL Editor
2. Ejecuta el contenido de `supabase/schema.sql`
3. Verifica en Table Editor que las tablas existan

### Error: "Build failed" en Vercel

**Causa**: Puede ser un problema con las variables de entorno durante el build

**Solución**:
1. Verifica los logs de build en Vercel
2. Asegúrate de que las variables estén configuradas antes del build
3. El código está preparado para no fallar si las variables no existen (retorna arrays vacíos)

### Los datos no se guardan

**Causa**: Puede ser un problema de Row Level Security (RLS) en Supabase

**Solución**:
1. Ve a Supabase Dashboard → Authentication → Policies
2. Verifica que las tablas `students` y `detentions` tengan políticas que permitan:
   - SELECT (lectura) para todos
   - INSERT (escritura) para todos
   - UPDATE (actualización) para todos
   - DELETE (eliminación) para todos

   O temporalmente desactiva RLS:
   ```sql
   ALTER TABLE students DISABLE ROW LEVEL SECURITY;
   ALTER TABLE detentions DISABLE ROW LEVEL SECURITY;
   ```

## ✅ Verificación Final

Una vez configurado todo, deberías poder:

- ✅ Ver la aplicación funcionando en Vercel
- ✅ Agregar estudiantes y que se guarden en Supabase
- ✅ Crear detenciones y que se guarden en Supabase
- ✅ Ver los datos en Supabase Dashboard → Table Editor
- ✅ Los datos persisten después de redesplegar

## 🎉 ¡Listo!

Tu aplicación ahora funciona completamente en Vercel con Supabase. Todos los datos se guardan persistentemente y estarán disponibles siempre, sin importar cuántas veces redespliegues.
