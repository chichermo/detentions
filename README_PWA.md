# Instalación como PWA (Progressive Web App)

La aplicación ahora puede instalarse como una aplicación nativa en PC, tablet y móvil.

## Cómo Instalar

### En Móvil (Android/iPhone)

1. **Android (Chrome)**:
   - Abre la aplicación en Chrome
   - Aparecerá un banner de instalación o ve al menú (⋮) → "Instalar app"
   - O busca el icono de instalación en la barra de direcciones

2. **iPhone (Safari)**:
   - Abre la aplicación en Safari
   - Toca el botón de compartir (□↑)
   - Selecciona "Añadir a pantalla de inicio"
   - Personaliza el nombre si lo deseas y toca "Añadir"

### En PC (Windows/Mac/Linux)

1. **Chrome/Edge**:
   - Abre la aplicación en el navegador
   - Busca el icono de instalación (➕) en la barra de direcciones
   - Haz clic en "Instalar"
   - O ve a Menú → "Instalar Nablijven Systeem"

2. **Firefox**:
   - Firefox no soporta PWA completamente, pero puedes usar Chrome o Edge

## Características de la PWA

- ✅ **Instalable**: Se puede instalar en cualquier dispositivo
- ✅ **Offline**: Funciona parcialmente sin conexión (datos en caché)
- ✅ **Icono en pantalla**: Aparece como una app nativa
- ✅ **Pantalla completa**: Se abre sin barra del navegador
- ✅ **Accesos directos**: Atajos rápidos a funciones principales

## Generar Iconos

Para generar los iconos personalizados:

1. Crea dos imágenes:
   - `icon-192.png` (192x192px)
   - `icon-512.png` (512x512px)

2. Colócalas en la carpeta `public/`

3. Puedes usar herramientas online como:
   - https://realfavicongenerator.net/
   - https://www.pwabuilder.com/imageGenerator

## Notas

- Los iconos actuales son placeholders. Reemplázalos con tus propios iconos.
- La aplicación funciona mejor con conexión a internet para acceder a Supabase.
- Algunas funciones pueden requerir conexión activa.
