// scripts/generate-badge.js
// Builds the Android status-bar badge used by push notifications.
// Android draws the badge from its transparency only (every visible pixel becomes white),
// so it must be a white silhouette on a TRANSPARENT background — a solid background shows as a white square.
// Usage: node scripts/generate-badge.js
const sharp = require('sharp');
const path = require('path');

// Mosque shape from app/icon.svg; the window is cut out with a mask so it stays see-through.
const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="6 5 20 20">
  <defs>
    <mask id="cut">
      <rect x="0" y="0" width="32" height="32" fill="white"/>
      <circle cx="16" cy="11" r="1.5" fill="black"/>
    </mask>
  </defs>
  <path mask="url(#cut)" fill="white"
    d="M16 6l-1 2.5c-2.5 1-4.5 3-5.5 5.5H9v1h1v9h2v-5h2v5h4v-5h2v5h2v-9h1v-1h-1.5c-1-2.5-3-4.5-5.5-5.5L16 6z"/>
</svg>`);

async function main() {
  const outPath = path.join(__dirname, '..', 'public', 'icons', 'badge-72x72.png');
  await sharp(svg, { density: 384 }).resize(72, 72).png().toFile(outPath);
  console.log(`Generated: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
