/**
 * Sinh icon PWA (PNG) bằng Node thuần, không cần thư viện đồ hoạ.
 *
 * Vẽ logo lâu đài Học Viện Trí Tuệ bằng các hình chữ nhật rồi đóng gói thành
 * PNG hợp lệ. Chạy: `npm run icons`
 */

import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public')

const BACKGROUND = [0x6d, 0x4a, 0xff] // --color-brand
const TOWER = [0xff, 0xff, 0xff]
const DOOR = [0x6d, 0x4a, 0xff]
const FLAG = [0xea, 0xb3, 0x08] // --color-gold

/** Danh sách hình chữ nhật, toạ độ theo tỉ lệ 0..1 để vẽ được ở mọi kích thước. */
const SHAPES = [
  // thân lâu đài
  { x: 0.22, y: 0.42, w: 0.56, h: 0.4, color: TOWER },
  // ba tháp răng cưa phía trên
  { x: 0.22, y: 0.3, w: 0.12, h: 0.12, color: TOWER },
  { x: 0.44, y: 0.26, w: 0.12, h: 0.16, color: TOWER },
  { x: 0.66, y: 0.3, w: 0.12, h: 0.12, color: TOWER },
  // cổng vòm
  { x: 0.42, y: 0.58, w: 0.16, h: 0.24, color: DOOR },
  // cột cờ và lá cờ trên tháp giữa
  { x: 0.487, y: 0.14, w: 0.026, h: 0.13, color: FLAG },
  { x: 0.513, y: 0.15, w: 0.11, h: 0.07, color: FLAG },
]

function renderRgba(size) {
  const pixels = Buffer.alloc(size * size * 4)
  const radius = size * 0.22

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const offset = (y * size + x) * 4
      if (outsideRoundedSquare(x, y, size, radius)) {
        pixels.writeUInt32BE(0, offset) // trong suốt ở bốn góc bo
        continue
      }
      const color = colorAt(x / size, y / size) ?? BACKGROUND
      pixels[offset] = color[0]
      pixels[offset + 1] = color[1]
      pixels[offset + 2] = color[2]
      pixels[offset + 3] = 255
    }
  }
  return pixels
}

function colorAt(u, v) {
  // Duyệt ngược để hình khai báo sau nằm đè lên hình khai báo trước.
  for (let i = SHAPES.length - 1; i >= 0; i--) {
    const s = SHAPES[i]
    if (u >= s.x && u < s.x + s.w && v >= s.y && v < s.y + s.h) return s.color
  }
  return null
}

function outsideRoundedSquare(x, y, size, radius) {
  const corners = [
    [radius, radius],
    [size - radius, radius],
    [radius, size - radius],
    [size - radius, size - radius],
  ]
  const nearLeft = x < radius
  const nearRight = x > size - radius
  const nearTop = y < radius
  const nearBottom = y > size - radius
  if (!((nearLeft || nearRight) && (nearTop || nearBottom))) return false

  const [cx, cy] = corners[(nearTop ? 0 : 2) + (nearLeft ? 0 : 1)]
  return (x - cx) ** 2 + (y - cy) ** 2 > radius ** 2
}

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(typeAndData))
  return Buffer.concat([length, typeAndData, crc])
}

function encodePng(size, rgba) {
  // Mỗi hàng PNG bắt đầu bằng một byte filter; 0 = không lọc.
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // độ sâu bit
  ihdr[9] = 6 // màu thật + kênh alpha
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync(OUT_DIR, { recursive: true })
for (const size of [192, 512]) {
  const file = resolve(OUT_DIR, `icon-${size}.png`)
  writeFileSync(file, encodePng(size, renderRgba(size)))
  console.log(`Đã tạo ${file}`)
}
