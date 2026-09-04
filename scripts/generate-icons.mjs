/**
 * توليد أيقونات الإشعارات / PWA بدون أي مكتبة رسم خارجية.
 * يكتب PNG خام (RGBA) عبر zlib فقط.
 *
 * التشغيل: node scripts/generate-icons.mjs
 * المخرجات: public/icons/icon-192x192.png و public/icons/badge-72x72.png
 */
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");

// ---------- PNG encoder ----------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------- canvas helpers (anti-aliased via 3x supersampling) ----------
const SS = 3;

function render(size, shapes, background) {
  const S = size * SS;
  const acc = new Float32Array(S * S * 4);

  function put(x, y, [r, g, b, a]) {
    const i = (y * S + x) * 4;
    // source-over
    const sa = a / 255;
    acc[i] = acc[i] * (1 - sa) + r * sa;
    acc[i + 1] = acc[i + 1] * (1 - sa) + g * sa;
    acc[i + 2] = acc[i + 2] * (1 - sa) + b * sa;
    acc[i + 3] = acc[i + 3] * (1 - sa) + a;
  }

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const u = x / S;
      const v = y / S;
      if (background) {
        const c = background(u, v);
        if (c) put(x, y, c);
      }
      for (const shape of shapes) {
        const c = shape(u, v);
        if (c) put(x, y, c);
      }
    }
  }

  // downsample
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let dy = 0; dy < SS; dy++) {
        for (let dx = 0; dx < SS; dx++) {
          const i = ((y * SS + dy) * S + (x * SS + dx)) * 4;
          r += acc[i]; g += acc[i + 1]; b += acc[i + 2]; a += acc[i + 3];
        }
      }
      const n = SS * SS;
      const o = (y * size + x) * 4;
      out[o] = Math.min(255, Math.round(r / n));
      out[o + 1] = Math.min(255, Math.round(g / n));
      out[o + 2] = Math.min(255, Math.round(b / n));
      out[o + 3] = Math.min(255, Math.round(a / n));
    }
  }
  return out;
}

// شكل: مستطيل بزوايا دائرية (بإحداثيات نسبية 0..1)
function roundedRect(x0, y0, x1, y1, r, color) {
  return (u, v) => {
    if (u < x0 || u > x1 || v < y0 || v > y1) return null;
    const cx = Math.min(Math.max(u, x0 + r), x1 - r);
    const cy = Math.min(Math.max(v, y0 + r), y1 - r);
    const dx = u - cx;
    const dy = v - cy;
    if (dx * dx + dy * dy > r * r) return null;
    return color;
  };
}

function circle(cx, cy, r, color) {
  return (u, v) => {
    const dx = u - cx;
    const dy = v - cy;
    return dx * dx + dy * dy <= r * r ? color : null;
  };
}

// كفّة الميزان: نصف دائرة سفلية
function pan(cx, cy, r, color) {
  return (u, v) => {
    if (v < cy) return null;
    const dx = u - cx;
    const dy = v - cy;
    return dx * dx + dy * dy <= r * r ? color : null;
  };
}

// خيط مائل من نقطة إلى نقطة بسُمك thickness
function line(ax, ay, bx, by, thickness, color) {
  const vx = bx - ax;
  const vy = by - ay;
  const len2 = vx * vx + vy * vy;
  const h = thickness / 2;
  return (u, v) => {
    const t = Math.max(0, Math.min(1, ((u - ax) * vx + (v - ay) * vy) / len2));
    const px = ax + t * vx;
    const py = ay + t * vy;
    const dx = u - px;
    const dy = v - py;
    return dx * dx + dy * dy <= h * h ? color : null;
  };
}

// ---------- ميزان العدالة ----------
function scales(color) {
  return [
    circle(0.5, 0.215, 0.045, color),               // المقبض العلوي
    roundedRect(0.475, 0.24, 0.525, 0.735, 0.02, color), // العمود
    roundedRect(0.17, 0.285, 0.83, 0.335, 0.024, color), // العارضة
    line(0.255, 0.335, 0.255, 0.44, 0.022, color),  // تعليق يسار
    line(0.745, 0.335, 0.745, 0.44, 0.022, color),  // تعليق يمين
    pan(0.255, 0.44, 0.145, color),                 // الكفة اليسرى
    pan(0.745, 0.44, 0.145, color),                 // الكفة اليمنى
    roundedRect(0.30, 0.735, 0.70, 0.79, 0.026, color), // القاعدة
  ];
}

const WHITE = [255, 255, 255, 255];

mkdirSync(OUT_DIR, { recursive: true });

// أيقونة 192: خلفية زرقاء (لون العلامة) + ميزان أبيض
const icon192 = render(
  192,
  scales(WHITE),
  roundedRect(0, 0, 1, 1, 0.22, [30, 64, 175, 255]), // #1e40af
);
writeFileSync(join(OUT_DIR, "icon-192x192.png"), encodePng(192, 192, icon192));

// شارة 72: شكل أبيض على خلفية شفافة (أندرويد يعيد تلوينها)
const badge72 = render(72, scales(WHITE), null);
writeFileSync(join(OUT_DIR, "badge-72x72.png"), encodePng(72, 72, badge72));

console.log("✔ تم توليد public/icons/icon-192x192.png و public/icons/badge-72x72.png");
