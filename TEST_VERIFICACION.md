# Verificación de Configuración

## ✅ Paso 1: Tablas Creadas en Supabase

¡Perfecto! Has ejecutado el schema SQL y las tablas se crearon correctamente.

**Verificación adicional:**
1. Ve a Supabase Dashboard → **Table Editor**
2. Deberías ver dos tablas:
   - `students`
   - `detentions`
3. Haz clic en cada una para ver su estructura

## ✅ Paso 2: Configurar Variables en Vercel

Ahora necesitas configurar las variables de entorno en Vercel:

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** → **Environment Variables**
4. Agrega estas dos variables:

### Variable 1:
- **Key**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: `https://cdebshkodffyozgftsfq.supabase.co`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

### Variable 2:
- **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkZWJzaGtvZGZmeW96Z2Z0c2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0ODI4OTYsImV4cCI6MjA4NDA1ODg5Nn0.kE56x58RVmD2re1G2fqb5IW6wgOjMdAcXKksiM_tKbc`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

5. Haz clic en **Save** para cada variable

## ✅ Paso 3: Redesplegar

Después de agregar las variables:

1. Ve a **Deployments**
2. Haz clic en los tres puntos (⋯) del último deployment
3. Selecciona **Redeploy**
4. Espera a que termine el build (debería tomar 1-2 minutos)

## ✅ Paso 4: Probar que Funciona

Una vez redesplegado, prueba de estas formas:

### Opción A: Health Check (Más Rápido)

Visita en tu navegador:
```
https://tu-app.vercel.app/api/health
```

**Resultado esperado:**
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

### Opción B: Probar en la Aplicación

1. Visita tu aplicación en Vercel
2. Ve a la página de **Estudiantes** (`/students`)
3. Intenta agregar un estudiante de prueba:
   - Nombre: "Test Student"
   - Grado: "1 aarde"
   - Día: "MAANDAG"
4. Haz clic en guardar
5. Verifica en Supabase Dashboard → **Table Editor** → `students` que el estudiante aparezca

### Opción C: Probar Detenciones

1. Ve a **Nieuwe Nablijven** (`/detentions/new`)
2. Crea una detención de prueba
3. Guarda
4. Verifica en Supabase Dashboard → **Table Editor** → `detentions` que la detención aparezca

## 🔍 Si Algo No Funciona

### Error en Health Check: "Supabase not configured"
- Verifica que las variables estén en Vercel
- Asegúrate de haber redesplegado después de agregar las variables

### Error: "relation does not exist"
- Las tablas no se crearon correctamente
- Vuelve a ejecutar el SQL schema en Supabase

### Los datos no se guardan
- Verifica que RLS esté desactivado (el schema lo hace automáticamente)
- Revisa los logs en Vercel Dashboard → Deployments → Logs

## 📝 Nota sobre Migración de Datos

Si quieres migrar los datos existentes del Excel a Supabase, puedes ejecutar el script de migración después de que todo esté funcionando.
