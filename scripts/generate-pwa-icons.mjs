import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const publicDir = 'public';
mkdirSync(publicDir, { recursive: true });

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#e8953a"/>
      <stop offset="100%" style="stop-color:#c97a28"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="#07080c"/>
  <rect x="48" y="48" width="416" height="416" rx="72" fill="url(#g)" opacity="0.95"/>
  <text x="256" y="300" font-family="Arial,sans-serif" font-size="200" font-weight="bold" fill="#1a1208" text-anchor="middle">N</text>
</svg>
`;

const buffer = Buffer.from(svg);

for (const size of [192, 512]) {
  const out = join(publicDir, `icon-${size}.png`);
  await sharp(buffer).resize(size, size).png().toFile(out);
  console.log('wrote', out);
}

writeFileSync(join(publicDir, 'icon.svg'), svg.trim());
console.log('done');
