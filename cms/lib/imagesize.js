'use strict';
/* Tiny image-dimension reader (PNG, JPEG, GIF, WebP) — no native dependency needed. */
const fs = require('fs');

function fromBuffer(b) {
  try {
    if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47) {                 // PNG
      return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
    }
    if (b.length > 10 && b.toString('ascii', 0, 3) === 'GIF') {              // GIF
      return { width: b.readUInt16LE(6), height: b.readUInt16LE(8) };
    }
    if (b.length > 30 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
      const fmt = b.toString('ascii', 12, 16);
      if (fmt === 'VP8 ') return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
      if (fmt === 'VP8L') {
        const bits = b.readUInt32LE(21);
        return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
      }
      if (fmt === 'VP8X') {
        return { width: 1 + (b[24] | (b[25] << 8) | (b[26] << 16)), height: 1 + (b[27] | (b[28] << 8) | (b[29] << 16)) };
      }
    }
    if (b[0] === 0xff && b[1] === 0xd8) {                                    // JPEG
      let i = 2;
      while (i < b.length - 9) {
        if (b[i] !== 0xff) { i++; continue; }
        const marker = b[i + 1];
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
          return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
        }
        i += 2 + b.readUInt16BE(i + 2);
      }
    }
  } catch (e) { /* fall through */ }
  return null;
}

function imageSize(file) {
  try {
    const fd = fs.openSync(file, 'r');
    try {
      const size = fs.fstatSync(fd).size;
      const len = Math.min(size, 256 * 1024);
      const buf = Buffer.alloc(len);
      fs.readSync(fd, buf, 0, len, 0);
      return fromBuffer(buf);
    } finally { fs.closeSync(fd); }
  } catch (e) { return null; }
}

module.exports = { imageSize, fromBuffer };
