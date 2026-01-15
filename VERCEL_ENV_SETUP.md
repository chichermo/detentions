# Configuración de Variables de Entorno en Vercel

## Variables Necesarias

Para que la aplicación funcione correctamente en Vercel, necesitas agregar estas variables de entorno:

### 1. Ve a Vercel Dashboard

1. Abre [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto `detentions`
3. Ve a **Settings** → **Environment Variables**

### 2. Agrega las Siguientes Variables

Haz clic en **Add New** y agrega cada una:

#### Variable 1: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: `https://cdebshkodffyozgftsfq.supabase.co`
- **Environments**: Selecciona todas (Production, Preview, Development)

#### Variable 2: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkZWJzaGtvZGZmeW96Z2Z0c2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0ODI4OTYsImV4cCI6MjA4NDA1ODg5Nn0.kE56x58RVmD2re1G2fqb5IW6wgOjMdAcXKksiM_tKbc`
- **Environments**: Selecciona todas (Production, Preview, Development)

### 3. Guarda y Redespliega

1. Haz clic en **Save** para cada variable
2. Ve a la pestaña **Deployments**
3. Haz clic en los tres puntos (⋯) del último deployment
4. Selecciona **Redeploy**

O simplemente haz un nuevo push a GitHub y Vercel desplegará automáticamente con las nuevas variables.

## Verificación

Después del redespliegue, verifica que:
- ✅ El build se completa sin errores
- ✅ La aplicación carga correctamente
- ✅ Puedes crear estudiantes y detenciones
- ✅ Los datos se guardan y persisten

## Notas de Seguridad

- ⚠️ **NUNCA** compartas tu `service_role` key públicamente
- ✅ La `anon` key es segura para usar en el frontend (tiene permisos limitados)
- ✅ Las variables con `NEXT_PUBLIC_` son visibles en el cliente, pero eso es normal para Supabase
