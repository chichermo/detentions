const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const publicDir = path.join(root, 'public');
const svg = fs.readFileSync(path.join(publicDir, 'icon.svg'));

const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#07080c"/>
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e8953a"/>
      <stop offset="100%" stop-color="#c97a28"/>
    </linearGradient>
  </defs>
  <rect x="96" y="96" width="320" height="320" rx="56" fill="url(#g)"/>
  <text x="256" y="290" font-family="Arial,sans-serif" font-size="160" font-weight="bold" fill="#1a1208" text-anchor="middle">N</text>
</svg>`;

async function run() {
  await sharp(svg).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  await sharp(Buffer.from(maskableSvg)).resize(512, 512).png().toFile(path.join(publicDir, 'icon-maskable-512.png'));
  await sharp(Buffer.from(maskableSvg)).resize(192, 192).png().toFile(path.join(publicDir, 'icon-maskable-192.png'));

  for (const f of ['apple-touch-icon.png', 'icon-maskable-192.png', 'icon-maskable-512.png']) {
    const m = await sharp(path.join(publicDir, f)).metadata();
    console.log(f, `${m.width}x${m.height}`, fs.statSync(path.join(publicDir, f)).size);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
