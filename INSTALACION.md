# Guía de Instalación y Uso

## Instalación Rápida

1. **Instalar dependencias:**
```bash
npm install
```

2. **Ejecutar la aplicación:**
```bash
npm run dev
```

3. **Abrir en el navegador:**
```
http://localhost:3000
```

## Importar Datos del Excel (Opcional)

Si deseas importar los datos existentes del Excel:

1. **Asegúrate de tener Python y openpyxl instalado:**
```bash
pip install openpyxl
```

2. **Ejecuta el script de importación:**
```bash
python scripts/import_excel.py
```

**Nota:** El script importará los estudiantes y las detenciones. Sin embargo, las fechas de las detenciones necesitarán ser ajustadas manualmente ya que el script no puede parsear automáticamente las fechas de los nombres de las hojas del Excel.

## Estructura de Datos

Los datos se almacenan en archivos JSON en la carpeta `/data`:
- `students.json` - Lista de estudiantes
- `detentions.json` - Registro de todas las detenciones

## Funcionalidades Implementadas

✅ **Gestión de Estudiantes**
- Agregar, editar y eliminar estudiantes
- Organización por día (Lunes, Martes, Jueves)
- Formato: "Nombre - Grado/Clase"

✅ **Sesiones de Detención**
- Crear nuevas sesiones
- Múltiples detenciones por sesión
- Todos los campos del Excel original:
  - Número
  - Estudiante (con selección de lista)
  - Profesor
  - Razón
  - Tarea
  - Fecha LVS
  - Checkbox "Imprimir"
  - Checkbox "Puede usar chromebook"
  - Observaciones extra

✅ **Calendario**
- Vista mensual
- Indicadores visuales
- Navegación entre meses

✅ **Búsqueda**
- Buscar por estudiante, razón o profesor
- Filtrado en tiempo real

✅ **Impresión**
- Funcionalidad de impresión para sesiones marcadas

## Diferencias con el Excel

La aplicación mejora el sistema Excel original con:
- Interfaz web moderna y responsive
- Búsqueda y filtrado mejorados
- Vista de calendario visual
- Validación de datos
- Mejor organización de la información
