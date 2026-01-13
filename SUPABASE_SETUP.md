# Configuración de Supabase

Esta guía te ayudará a conectar la aplicación con Supabase para almacenar los datos de forma persistente.

## Paso 1: Crear Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Espera a que se complete la configuración (puede tomar unos minutos)

## Paso 2: Crear las Tablas

1. En tu proyecto de Supabase, ve a **SQL Editor**
2. Abre el archivo `supabase/schema.sql` de este proyecto
3. Copia todo el contenido del archivo
4. Pégalo en el SQL Editor de Supabase
5. Haz clic en **Run** para ejecutar el SQL

Esto creará:
- Tabla `students` para almacenar estudiantes
- Tabla `detentions` para almacenar detenciones
- Índices para mejorar el rendimiento
- Triggers para actualizar automáticamente `updated_at`

## Paso 3: Obtener las Credenciales

1. En Supabase Dashboard, ve a **Settings** → **API**
2. Copia los siguientes valores:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Paso 4: Configurar Variables de Entorno

### Desarrollo Local

1. Crea un archivo `.env.local` en la raíz del proyecto
2. Agrega las siguientes variables:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_de_supabase
```

3. Reinicia el servidor de desarrollo:
```bash
npm run dev
```

### Producción en Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Ve a **Settings** → **Environment Variables**
3. Agrega las siguientes variables:
   - `NEXT_PUBLIC_SUPABASE_URL` → Tu URL de Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Tu clave anon de Supabase
4. Selecciona los ambientes donde aplicar (Production, Preview, Development)
5. Guarda los cambios
6. Redespliega la aplicación

## Paso 5: Verificar la Conexión

1. Inicia la aplicación localmente o espera a que se redespliegue en Vercel
2. Intenta agregar un estudiante o una detención
3. Ve a Supabase Dashboard → **Table Editor**
4. Deberías ver los datos en las tablas `students` y `detentions`

## Estructura de las Tablas

### Tabla `students`
- `id` (UUID) - Identificador único
- `name` (TEXT) - Nombre del estudiante
- `grade` (TEXT) - Grado/clase del estudiante
- `day` (TEXT) - Día de la semana (MAANDAG, DINSDAG, DONDERDAG)
- `created_at` (TIMESTAMP) - Fecha de creación
- `updated_at` (TIMESTAMP) - Fecha de última actualización

### Tabla `detentions`
- `id` (UUID) - Identificador único
- `number` (INTEGER) - Número de detención
- `date` (DATE) - Fecha de la detención
- `day_of_week` (TEXT) - Día de la semana
- `student` (TEXT) - Nombre del estudiante con grado
- `teacher` (TEXT) - Nombre del profesor (opcional)
- `reason` (TEXT) - Razón de la detención (opcional)
- `task` (TEXT) - Tarea asignada (opcional)
- `lvs_date` (DATE) - Fecha LVS (opcional)
- `should_print` (BOOLEAN) - Si debe imprimirse
- `can_use_chromebook` (BOOLEAN) - Si puede usar chromebook
- `extra_notes` (TEXT) - Notas adicionales (opcional)
- `created_at` (TIMESTAMP) - Fecha de creación
- `updated_at` (TIMESTAMP) - Fecha de última actualización

## Solución de Problemas

### Error: "Missing Supabase environment variables"
- Verifica que las variables de entorno estén configuradas correctamente
- Asegúrate de que los nombres sean exactos: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Reinicia el servidor después de agregar las variables

### Error: "relation does not exist"
- Verifica que hayas ejecutado el SQL del archivo `supabase/schema.sql`
- Asegúrate de que las tablas se hayan creado correctamente en Supabase

### Los datos no se guardan
- Verifica la consola del navegador para errores
- Revisa los logs de Supabase en el Dashboard
- Verifica que las políticas de Row Level Security (RLS) permitan las operaciones necesarias

## Políticas de Seguridad (RLS)

Por defecto, Supabase tiene Row Level Security habilitado. Para que la aplicación funcione, necesitas deshabilitar RLS o crear políticas que permitan el acceso:

1. Ve a **Authentication** → **Policies** en Supabase
2. Para cada tabla (`students` y `detentions`):
   - Deshabilita RLS temporalmente, O
   - Crea políticas que permitan SELECT, INSERT, UPDATE, DELETE para todos los usuarios

**Nota:** Para producción, es recomendable crear políticas más restrictivas basadas en autenticación.
