/**
 * Script para crear iconos placeholder para PWA
 * Ejecutar: node scripts/create-placeholder-icons.js
 */

const fs = require('fs');
const path = require('path');

// Crear un SVG simple que puede servir como placeholder
const createSVGIcon = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#6366f1"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 20}" fill="#ffffff"/>
  <text x="${size/2}" y="${size/2}" font-family="Arial, sans-serif" font-size="${size/3}" font-weight="bold" fill="#6366f1" text-anchor="middle" dominant-baseline="middle">N</text>
</svg>`;

// Nota: Este script crea SVGs, pero necesitamos PNGs
// Para crear PNGs reales, necesitarías una librería como sharp o canvas
// Por ahora, crearemos un archivo de instrucciones

const instructions = `# Crear Iconos para PWA

Los iconos deben ser archivos PNG. Puedes crearlos de varias formas:

## Opción 1: Usar herramienta online
1. Ve a https://realfavicongenerator.net/
2. Sube una imagen o crea una nueva
3. Descarga icon-192.png e icon-512.png
4. Colócalos en la carpeta public/

## Opción 2: Usar scripts/create-icons.html
1. Abre scripts/create-icons.html en tu navegador
2. Haz clic en "Descargar Iconos"
3. Coloca los archivos descargados en public/

## Opción 3: Crear manualmente
- icon-192.png: 192x192px, fondo #6366f1, letra "N" blanca
- icon-512.png: 512x512px, fondo #6366f1, letra "N" blanca
`;

fs.writeFileSync(path.join(__dirname, '..', 'INSTRUCCIONES_ICONOS.md'), instructions);
console.log('Instrucciones creadas en INSTRUCCIONES_ICONOS.md');
