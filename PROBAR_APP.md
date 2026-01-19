# Probar la Aplicación en Vercel

## ✅ Tu URL Real
**https://detentions.vercel.app/**

## 🔍 Verificaciones a Realizar

### 1. Health Check
Visita: https://detentions.vercel.app/api/health

**Resultado esperado:**
```json
{
  "status": "ok",
  "checks": {
    "supabase_configured": true,
    "supabase_connected": true,
    "tables_exist": true
  }
}
```

### 2. Probar API de Estudiantes
Visita: https://detentions.vercel.app/api/students

**Resultado esperado:**
```json
[]
```
(Array vacío si no hay estudiantes, o array con estudiantes si hay datos)

### 3. Probar en la Aplicación

#### Agregar un Estudiante:
1. Ve a: https://detentions.vercel.app/students
2. Haz clic en "Nieuwe Leerling"
3. Completa:
   - Naam: "Test Student"
   - Graad: "1 aarde"
   - Dag: "MAANDAG"
4. Haz clic en "Opslaan"
5. Verifica en Supabase Dashboard → Table Editor → `students` que aparezca

#### Crear una Detención:
1. Ve a: https://detentions.vercel.app/detentions/new
2. Completa el formulario
3. Guarda
4. Verifica en Supabase Dashboard → Table Editor → `detentions` que aparezca

## ⚠️ Si No Funciona

### Verificar Variables de Entorno en Vercel:
1. Ve a Vercel Dashboard → Tu Proyecto → Settings → Environment Variables
2. Debes tener:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://cdebshkodffyozgftsfq.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (tu clave anon)
3. Si no las tienes, agrégalas y redespliega

### Verificar Tablas en Supabase:
1. Ve a Supabase Dashboard → Table Editor
2. Debes ver las tablas `students` y `detentions`
3. Si no existen, ejecuta el SQL de `supabase/schema.sql`
