/**
 * Generates PWA icons (192x192, 512x512, 180x180) as minimal PNGs
 * using only Node.js built-in modules — no external dependencies needed.
 * Run: node scripts/generate-icons.js
 */

const { deflateSync } = require('node:zlib');
const fs = require('node:fs');
const path = require('node:path');

// ── CRC32 ────────────────────────────────────────────────────────────────────
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c;
}
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++)
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  return (crc ^ 0xffffffff) >>> 0;
}

// ── PNG chunk builder ────────────────────────────────────────────────────────
function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.allocUnsafe(4);
  len.writeUInt32BE(data.length, 0);
  const combined = Buffer.concat([t, data]);
  const crcVal = Buffer.allocUnsafe(4);
  crcVal.writeUInt32BE(crc32(combined), 0);
  return Buffer.concat([len, t, data, crcVal]);
}

// ── Icon renderer ────────────────────────────────────────────────────────────
// Draws a Sudoku-themed icon: dark bg + 3×3 grid lines + 9×9 cell lines
function makePNG(size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR — 8-bit RGBA
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Colors (RGBA)
  const BG     = [9,   9,  11, 255]; // #09090b
  const BORDER = [113, 91, 191, 255]; // primary purple
  const BLOCK  = [ 80, 65, 140, 255]; // medium purple (3×3 dividers)
  const CELL   = [ 40, 36,  70, 255]; // subtle cell lines

  const rows = [];
  const pad  = Math.max(1, size * 0.07) | 0;  // outer padding
  const inner = size - pad * 2;               // inner board size

  for (let y = 0; y < size; y++) {
    const row = Buffer.allocUnsafe(1 + size * 4);
    row[0] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      let color = BG;

      // Outer border
      if (x < pad || x >= size - pad || y < pad || y >= size - pad) {
        color = BG;
      } else {
        const ix = x - pad, iy = y - pad;
        const outer = 2;
        if (ix < outer || ix >= inner - outer || iy < outer || iy >= inner - outer) {
          color = BORDER;
        } else {
          // 9×9 cell lines + 3×3 block lines
          const cellW = inner / 9;
          const blockW = inner / 3;
          const xm9  = ix % cellW;
          const ym9  = iy % cellW;
          const xm3  = ix % blockW;
          const ym3  = iy % blockW;
          const thinLine  = cellW  * 0.12;
          const thickLine = blockW * 0.045;

          if (xm3 < thickLine || ym3 < thickLine) color = BLOCK;
          else if (xm9 < thinLine || ym9 < thinLine) color = CELL;
        }
      }

      const off = 1 + x * 4;
      row[off]     = color[0];
      row[off + 1] = color[1];
      row[off + 2] = color[2];
      row[off + 3] = color[3];
    }
    rows.push(row);
  }

  const raw        = Buffer.concat(rows);
  const compressed = deflateSync(raw, { level: 6 });
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Write files ──────────────────────────────────────────────────────────────
const outDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });

const sizes = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
];

for (const { size, name } of sizes) {
  const outPath = path.join(outDir, name);
  fs.writeFileSync(outPath, makePNG(size));
  console.log(`✓ Generated public/icons/${name} (${size}×${size})`);
}
console.log('PWA icons ready.');
