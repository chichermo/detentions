# Migración de Datos a Supabase

Esta guía te ayudará a migrar los datos que importaste del Excel (estudiantes y detenciones) a tu base de datos de Supabase.

## Prerrequisitos

1. ✅ **Tablas creadas en Supabase**: Asegúrate de haber ejecutado el SQL schema (`supabase/schema.sql`) en tu proyecto de Supabase
2. ✅ **Variables de entorno configuradas**: Debes tener un archivo `.env.local` con tus credenciales de Supabase
3. ✅ **Datos JSON disponibles**: Los archivos `data/students.json` y `data/detentions.json` deben existir

## Pasos para Migrar

### 1. Verificar que tienes los datos

Asegúrate de que los archivos existen:
- `data/students.json` - Lista de estudiantes
- `data/detentions.json` - Lista de detenciones

Si no los tienes, primero ejecuta el script de importación del Excel:
```bash
python scripts/import_excel.py
```

### 2. Configurar variables de entorno

Crea o verifica tu archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon
```

### 3. Ejecutar la migración

Ejecuta el script de migración:

```bash
npm run migrate
```

O directamente:

```bash
node scripts/migrate_to_supabase.js
```

### 4. Verificar los resultados

El script mostrará:
- ✅ Cantidad de estudiantes migrados
- ✅ Cantidad de detenciones migradas
- ❌ Cualquier error que ocurra

También puedes verificar en tu dashboard de Supabase:
1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a **Table Editor**
3. Verifica las tablas `students` y `detentions`

## ¿Qué hace el script?

- **Lee los archivos JSON** locales (`data/students.json` y `data/detentions.json`)
- **Convierte el formato** de los datos para que coincidan con el schema de Supabase
- **Inserta los datos** en lotes de 100 registros para mejor rendimiento
- **Usa `upsert`** para evitar duplicados (si un registro ya existe, se actualiza)

## Notas Importantes

- ⚠️ **El script usa `upsert`**: Si ejecutas el script múltiples veces, no creará duplicados, pero actualizará los registros existentes
- ✅ **Los datos originales se mantienen**: Los archivos JSON locales no se modifican
- 🔄 **Puedes ejecutarlo múltiples veces**: Es seguro ejecutar el script varias veces

## Solución de Problemas

### Error: "Variables de entorno no configuradas"
- Verifica que el archivo `.env.local` existe y tiene las variables correctas
- Asegúrate de que las variables empiezan con `NEXT_PUBLIC_`

### Error: "relation does not exist"
- Las tablas no están creadas en Supabase
- Ejecuta el SQL schema (`supabase/schema.sql`) en el SQL Editor de Supabase

### Error: "duplicate key value"
- Esto no debería pasar porque usamos `upsert`, pero si ocurre, verifica que los IDs en los JSON son únicos

### Los datos no aparecen en Supabase
- Verifica que estás mirando el proyecto correcto en Supabase
- Revisa la consola del script para ver si hubo errores
- Verifica que las variables de entorno apuntan al proyecto correcto

## Después de la Migración

Una vez completada la migración:

1. ✅ **Verifica los datos** en Supabase Dashboard
2. ✅ **Prueba la aplicación** localmente para asegurarte de que todo funciona
3. ✅ **Configura las variables en Vercel** para producción
4. ✅ **Redespliega** la aplicación en Vercel

¡Listo! Tus datos ahora están en Supabase y se guardarán persistentemente. 🎉
