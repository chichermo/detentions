/**
 * Script para crear iconos placeholder para PWA
 * Ejecutar: node scripts/create-icons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createIcon(size, outputPath) {
  // Crear un SVG simple
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#6366f1"/>
      <circle cx="${size/2}" cy="${size/2}" r="${size/2 - size*0.1}" fill="#ffffff"/>
      <text x="${size/2}" y="${size/2}" font-family="Arial, sans-serif" font-size="${size/3}" font-weight="bold" fill="#6366f1" text-anchor="middle" dominant-baseline="middle">N</text>
    </svg>
  `;

  // Convertir SVG a PNG
  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);
  
  console.log(`✓ Created ${outputPath}`);
}

async function main() {
  const publicDir = path.join(__dirname, '..', 'public');
  
  // Asegurar que el directorio existe
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  try {
    await createIcon(192, path.join(publicDir, 'icon-192.png'));
    await createIcon(512, path.join(publicDir, 'icon-512.png'));
    console.log('\n✅ Iconos creados exitosamente!');
  } catch (error) {
    console.error('❌ Error creando iconos:', error.message);
    console.log('\n💡 Alternativa: Usa scripts/create-icons.html en tu navegador para crear los iconos manualmente.');
  }
}

main();
