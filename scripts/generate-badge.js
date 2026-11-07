// scripts/generate-badge.js
// Builds the Android status-bar badge used by push notifications from the app icon.
// Android draws the badge from its transparency only (every visible pixel becomes white),
// so it must be a white silhouette on a TRANSPARENT background — a solid background shows as a white square.
// The bright parts of the app icon (gold star + mosque) become white; the dark navy background becomes transparent.
// Usage: node scripts/generate-badge.js
const sharp = require('sharp');
const path = require('path');

const SOURCE = path.join(__dirname, '..', 'public', 'icons', 'icon-512x512.png');
const OUTPUT = path.join(__dirname, '..', 'public', 'icons', 'badge-72x72.png');
const SIZE = 72;
const PADDING = 2;
const DARK_CUTOFF = 70;  // luminance below this is background
const THICKEN_BLUR = 5;  // widens thin lines so they stay visible at status-bar size

async function main() {
  const { data, info } = await sharp(SOURCE).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  // 1. Brightness → mask (bright = shape, dark = background)
  const mask = Buffer.alloc(width * height);
  for (let p = 0; p < width * height; p++) {
    const lum = 0.299 * data[p * 3] + 0.587 * data[p * 3 + 1] + 0.114 * data[p * 3 + 2];
    mask[p] = Math.max(0, Math.min(255, (lum - DARK_CUTOFF) * 4));
  }

  // 2. Thicken: blur then re-threshold (acts like a small dilation)
  const { data: blurred } = await sharp(mask, { raw: { width, height, channels: 1 } })
    .blur(THICKEN_BLUR)
    .extractChannel(0)
    .raw()
    .toBuffer({ resolveWithObject: true });

  // 3. White pixels with the mask as alpha
  const rgba = Buffer.alloc(width * height * 4);
  for (let p = 0; p < width * height; p++) {
    const v = blurred[p];
    rgba[p * 4] = rgba[p * 4 + 1] = rgba[p * 4 + 2] = 255;
    rgba[p * 4 + 3] = v > 40 ? 255 : Math.round((v * 255) / 40);
  }

  // 4. Crop to the shape and fit into the badge with a little padding
  const silhouette = await sharp(rgba, { raw: { width, height, channels: 4 } }).png().toBuffer();
  const trimmed = await sharp(silhouette).trim({ threshold: 1 }).toBuffer();
  const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
  await sharp(trimmed)
    .resize(SIZE - PADDING * 2, SIZE - PADDING * 2, { fit: 'contain', background: transparent })
    .extend({ top: PADDING, bottom: PADDING, left: PADDING, right: PADDING, background: transparent })
    .png()
    .toFile(OUTPUT);

  console.log(`Generated: ${OUTPUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
