# Nablijven Systeem

Aplicación web moderna para la gestión de detenciones escolares (nablijven), replicando y mejorando todas las funcionalidades del sistema Excel original.

## Características

- **Gestión de Estudiantes**: Administra listas de estudiantes por día (MAANDAG, DINSDAG, DONDERDAG)
- **Registro de Detenciones**: Crea y gestiona sesiones de detención con todos los campos necesarios:
  - Número de detención (Aantal?)
  - Estudiante (Leerling?) - Selección de lista
  - Profesor (Leerkracht?)
  - Razón (Reden?)
  - Tarea (Opdracht?)
  - Fecha LVS (Data LVS)
  - Checkbox "Imprimir" (Afdrukken?)
  - Checkbox "Puede usar chromebook" (Mag chromebook?)
  - Observaciones extra (Extra opmerking)
- **Edición de Detenciones**: Edita detenciones existentes directamente desde la vista de sesión
- **Calendario**: Visualiza todas las sesiones en un calendario mensual
- **Búsqueda**: Busca sesiones por estudiante, razón o profesor
- **Impresión**: Funcionalidad de impresión para sesiones marcadas
- **Tema Oscuro**: Interfaz moderna con tema oscuro

## Instalación Local

1. **Instalar dependencias:**
```bash
npm install
```

2. **Ejecutar el servidor de desarrollo:**
```bash
npm run dev
```

3. **Abrir en el navegador:**
```
http://localhost:3000
```

## Despliegue en Vercel

### Opción 1: Despliegue Directo desde GitHub

1. Conecta tu repositorio de GitHub a Vercel
2. Vercel detectará automáticamente Next.js
3. El despliegue se realizará automáticamente

### Opción 2: Usar Vercel KV para Persistencia (Recomendado)

Para producción, se recomienda usar Vercel KV para almacenamiento persistente:

1. **Instalar Vercel KV:**
```bash
npm install @vercel/kv
```

2. **Configurar en Vercel Dashboard:**
   - Ve a tu proyecto en Vercel
   - Settings → Storage → Create Database → KV
   - Copia las variables de entorno

3. **Agregar variables de entorno en Vercel:**
   - `KV_URL`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

**Nota:** Actualmente la aplicación usa almacenamiento en memoria para Vercel. Los datos se perderán al reiniciar. Para producción, se recomienda configurar Vercel KV o una base de datos.

## Importar Datos del Excel

Si deseas importar los datos existentes del Excel:

1. **Asegúrate de tener Python y openpyxl instalado:**
```bash
pip install openpyxl
```

2. **Ejecuta el script de importación:**
```bash
python scripts/import_excel.py
```

Esto importará los estudiantes y las detenciones a los archivos JSON locales.

## Estructura del Proyecto

- `/app` - Páginas y componentes de Next.js
- `/app/api` - Rutas API para gestionar datos
- `/lib` - Funciones de utilidad y gestión de datos
- `/types` - Definiciones de tipos TypeScript
- `/data` - Archivos JSON de almacenamiento (solo desarrollo local)

## Tecnologías Utilizadas

- **Next.js 14** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos con tema oscuro
- **date-fns** - Manejo de fechas con locale holandés
- **lucide-react** - Iconos modernos

## Funcionalidades vs Excel

✅ **Todas las funcionalidades del Excel implementadas:**
- Gestión de estudiantes por día
- Todos los campos de detención
- Edición de registros
- Impresión
- Calendario visual
- Búsqueda mejorada

## Notas de Despliegue

- En Vercel, los datos se almacenan en memoria (se pierden al reiniciar)
- Para producción, configura Vercel KV o una base de datos externa
- Los archivos JSON solo funcionan en desarrollo local
