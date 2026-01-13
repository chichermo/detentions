# Guía de Despliegue en Vercel

## Problema Actual

La aplicación actualmente usa el sistema de archivos para almacenar datos, lo cual no funciona en Vercel porque:
- Vercel es un entorno serverless sin estado
- Los archivos escritos se pierden entre requests
- No hay persistencia de datos

## Soluciones

### Solución Rápida (Actual)

La aplicación ahora usa almacenamiento en memoria que funciona en Vercel, pero:
- ⚠️ Los datos se pierden al reiniciar el servidor
- ✅ Funciona para pruebas y demostraciones
- ✅ No requiere configuración adicional

### Solución Recomendada para Producción: Vercel KV

Para persistencia real de datos, sigue estos pasos:

#### 1. Instalar Vercel KV

```bash
npm install @vercel/kv
```

#### 2. Crear Base de Datos KV en Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Ve a **Storage** → **Create Database** → **KV**
3. Crea la base de datos
4. Copia las variables de entorno que se generan

#### 3. Configurar Variables de Entorno

En Vercel Dashboard → Settings → Environment Variables, agrega:
- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

#### 4. Actualizar el Código

El código ya está preparado para detectar si está en Vercel. Solo necesitas actualizar `lib/data.ts` para usar Vercel KV cuando esté disponible.

### Alternativa: Base de Datos Externa

Otras opciones:
- **Supabase** (PostgreSQL gratuito)
- **MongoDB Atlas** (MongoDB gratuito)
- **PlanetScale** (MySQL serverless)

## Configuración Actual

La aplicación detecta automáticamente si está en Vercel usando:
- `process.env.VERCEL === '1'`
- `process.env.VERCEL_ENV`

Y usa almacenamiento en memoria en lugar de archivos.

## Próximos Pasos

1. ✅ Aplicación funciona en Vercel (con datos en memoria)
2. ⏳ Configurar Vercel KV para persistencia
3. ⏳ Migrar datos del Excel a Vercel KV
