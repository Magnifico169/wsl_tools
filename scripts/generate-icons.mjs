/**
 * Generates placeholder icons for Tauri bundle.
 * icon.ico uses BMP-in-ICO format (required by Windows RC.EXE).
 * Replace with: npm run tauri icon path/to/your-icon.png
 */
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import zlib from "zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, "..", "src-tauri", "icons");
mkdirSync(iconsDir, { recursive: true });

const COLOR = { r: 59, g: 130, b: 246 };

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return ~c >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type);
  const crcBuf = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcBuf));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function createPng(size, { r, g, b }) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const row = Buffer.alloc(1 + size * 3);
  for (let x = 0; x < size; x++) {
    row[1 + x * 3] = r;
    row[1 + x * 3 + 1] = g;
    row[1 + x * 3 + 2] = b;
  }
  const raw = Buffer.alloc((1 + size * 3) * size);
  for (let y = 0; y < size; y++) row.copy(raw, y * row.length);
  const compressed = zlib.deflateSync(raw);

  return Buffer.concat([
    signature,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", compressed),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Windows RC.EXE requires classic BMP-based ICO (not PNG renamed to .ico). */
function createMultiSizeIco(sizes, color) {
  const images = sizes.map((size) => {
    const xorRowBytes = size * 4;
    const xorSize = xorRowBytes * size;
    const andRowBytes = Math.ceil(size / 8);
    const andRowPadded =
      andRowBytes % 4 === 0 ? andRowBytes : andRowBytes + (4 - (andRowBytes % 4));
    const andSize = andRowPadded * size;
    return { size, dibSize: 40 + xorSize + andSize, xorSize, andSize, xorRowBytes, andRowPadded };
  });

  const headerSize = 6 + 16 * images.length;
  let dataOffset = headerSize;
  const dataParts = [];

  for (const img of images) {
    const part = Buffer.alloc(img.dibSize);
    let o = 0;
    part.writeUInt32LE(40, o);
    o += 4;
    part.writeInt32LE(img.size, o);
    o += 4;
    part.writeInt32LE(img.size * 2, o);
    o += 4;
    part.writeUInt16LE(1, o);
    o += 2;
    part.writeUInt16LE(32, o);
    o += 2;
    o += 8;
    part.writeUInt32LE(img.xorSize + img.andSize, o);
    o += 4;
    o += 4;

    for (let y = img.size - 1; y >= 0; y--) {
      for (let x = 0; x < img.size; x++) {
        part[o++] = color.b;
        part[o++] = color.g;
        part[o++] = color.r;
        part[o++] = 255;
      }
    }
    for (let i = 0; i < img.andSize; i++) part[o++] = 0;
    dataParts.push(part);
  }

  const totalSize =
    headerSize + dataParts.reduce((sum, p) => sum + p.length, 0);
  const buf = Buffer.alloc(totalSize);
  let o = 0;

  buf.writeUInt16LE(0, o);
  o += 2;
  buf.writeUInt16LE(1, o);
  o += 2;
  buf.writeUInt16LE(images.length, o);
  o += 2;

  let offset = headerSize;
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const s = img.size;
    buf[o++] = s >= 256 ? 0 : s;
    buf[o++] = s >= 256 ? 0 : s;
    buf[o++] = 0;
    buf[o++] = 0;
    buf.writeUInt16LE(1, o);
    o += 2;
    buf.writeUInt16LE(32, o);
    o += 2;
    buf.writeUInt32LE(img.dibSize, o);
    o += 4;
    buf.writeUInt32LE(offset, o);
    o += 4;
    offset += img.dibSize;
  }

  for (const part of dataParts) {
    part.copy(buf, o);
    o += part.length;
  }

  return buf;
}

const pngSizes = [
  ["32x32.png", 32],
  ["128x128.png", 128],
  ["128x128@2x.png", 256],
  ["icon.png", 512],
];

for (const [name, size] of pngSizes) {
  writeFileSync(join(iconsDir, name), createPng(size, COLOR));
  console.log("wrote", name);
}

writeFileSync(join(iconsDir, "icon.ico"), createMultiSizeIco([16, 32, 48, 256], COLOR));
console.log("wrote icon.ico (valid BMP ICO)");

writeFileSync(join(iconsDir, "icon.icns"), createPng(32, COLOR));
console.log("wrote icon.icns (PNG placeholder for macOS builds)");
