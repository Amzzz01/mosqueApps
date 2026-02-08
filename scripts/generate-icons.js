const sharp = require('sharp');
const path = require('path');

function generateSVG(size) {
  const subFontSize = Math.round(size * 0.08);
  const mosqueSize = Math.round(size * 0.28);
  const cx = size / 2;
  const cy = size / 2;

  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.15)}" fill="#059669"/>
  <g transform="translate(${cx}, ${cy - size * 0.08})">
    <!-- Mosque dome -->
    <path d="M${-mosqueSize * 0.5},${mosqueSize * 0.1}
             Q${-mosqueSize * 0.5},${-mosqueSize * 0.45} 0,${-mosqueSize * 0.55}
             Q${mosqueSize * 0.5},${-mosqueSize * 0.45} ${mosqueSize * 0.5},${mosqueSize * 0.1} Z"
          fill="white" opacity="0.95"/>
    <!-- Minaret left -->
    <rect x="${-mosqueSize * 0.55}" y="${-mosqueSize * 0.2}" width="${mosqueSize * 0.12}" height="${mosqueSize * 0.55}" rx="2" fill="white" opacity="0.9"/>
    <!-- Minaret right -->
    <rect x="${mosqueSize * 0.43}" y="${-mosqueSize * 0.2}" width="${mosqueSize * 0.12}" height="${mosqueSize * 0.55}" rx="2" fill="white" opacity="0.9"/>
    <!-- Base -->
    <rect x="${-mosqueSize * 0.6}" y="${mosqueSize * 0.1}" width="${mosqueSize * 1.2}" height="${mosqueSize * 0.25}" rx="3" fill="white" opacity="0.95"/>
    <!-- Crescent -->
    <circle cx="0" cy="${-mosqueSize * 0.55}" r="${mosqueSize * 0.08}" fill="#fbbf24"/>
  </g>
  <text x="${cx}" y="${cy + size * 0.28}" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-weight="bold" font-size="${subFontSize}">MyMasjidApp</text>
</svg>`);
}

async function main() {
  const outDir = path.join(__dirname, '..', 'public', 'icons');
  const sizes = [192, 512];

  for (const size of sizes) {
    const svg = generateSVG(size);
    const outPath = path.join(outDir, `icon-${size}x${size}.png`);
    await sharp(svg).resize(size, size).png().toFile(outPath);
    console.log(`Generated: ${outPath}`);
  }

  console.log('Done! PWA icons generated successfully.');
}

main().catch(console.error);
