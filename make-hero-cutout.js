/* One-off: build a transparent hero cutout from the new photo.
   Border flood-fill removes only the connected white studio
   background, so the white shirt/collar is preserved. */
const sharp = require('sharp');

(async () => {
  const src = 'public/assets/leftsideimage.jpg';
  const out = 'public/assets/hero-cutout.webp';

  const { data, info } = await sharp(src)
    .resize({ width: 1100 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width, h = info.height, c = info.channels;
  const idx = (x, y) => y * w + x;
  const isWhite = (i) => data[i * c] > 232 && data[i * c + 1] > 232 && data[i * c + 2] > 232;

  // --- Pass 1: flood fill the connected background from all borders ---
  const bg = new Uint8Array(w * h);
  const stack = [];
  const seed = (x, y) => {
    const i = idx(x, y);
    if (!bg[i] && isWhite(i)) { bg[i] = 1; stack.push(i); }
  };
  for (let x = 0; x < w; x++) { seed(x, 0); seed(x, h - 1); }
  for (let y = 0; y < h; y++) { seed(0, y); seed(w - 1, y); }

  while (stack.length) {
    const i = stack.pop();
    const x = i % w, y = (i / w) | 0;
    if (x > 0) seed(x - 1, y);
    if (x < w - 1) seed(x + 1, y);
    if (y > 0) seed(x, y - 1);
    if (y < h - 1) seed(x, y + 1);
  }

  // --- Pass 2: eat 2px of bright halo left by anti-aliasing ---
  for (let pass = 0; pass < 2; pass++) {
    const grow = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = idx(x, y);
        if (bg[i]) continue;
        const bright = data[i * c] > 210 && data[i * c + 1] > 210 && data[i * c + 2] > 210;
        if (!bright) continue;
        const near =
          (x > 0 && bg[i - 1]) || (x < w - 1 && bg[i + 1]) ||
          (y > 0 && bg[i - w]) || (y < h - 1 && bg[i + w]);
        if (near) grow.push(i);
      }
    }
    for (const i of grow) bg[i] = 1;
  }

  // --- Apply transparency ---
  for (let i = 0; i < w * h; i++) if (bg[i]) data[i * c + 3] = 0;

  // --- Feather the alpha edge by ~1px so the cutout is not jagged ---
  const alpha = Buffer.alloc(w * h);
  for (let i = 0; i < w * h; i++) alpha[i] = data[i * c + 3];
  const { data: soft, info: sinfo } = await sharp(alpha, { raw: { width: w, height: h, channels: 1 } })
    .blur(0.7)
    .raw()
    .toBuffer({ resolveWithObject: true });
  // blur may expand the single channel to gray-RGB — index per source channel
  const sc = sinfo.channels;
  if (soft.length !== w * h) console.log(`note: blur returned ${sc} channels, remapping`);
  for (let i = 0; i < w * h; i++) data[i * c + 3] = soft[i * sc];

  await sharp(data, { raw: { width: w, height: h, channels: c } })
    .webp({ quality: 82, alphaQuality: 90 })
    .toFile(out);

  const before = (w * h);
  let cut = 0;
  for (let i = 0; i < w * h; i++) if (bg[i]) cut++;
  console.log(`done: ${w}x${h}, background removed: ${(100 * cut / before).toFixed(1)}% -> ${out}`);
})();
