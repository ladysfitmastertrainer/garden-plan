/**
 * Cắt tờ hình Gemini thành từng nhân vật nền trong suốt.
 *
 * Chạy: `npm run art` (mọi tờ đang có) hoặc `npm run art -- pet-so-con` (một tờ).
 *
 * Gemini không xuất được nền trong suốt, nên prompt bắt nó vẽ trên NỀN TRẮNG
 * PHẲNG. Việc của script này:
 *
 *   1. Đoán màu nền từ viền ảnh, rồi loang từ bốn cạnh vào: điểm nào giống màu
 *      nền và chạm được tới cạnh ảnh thì là nền. Loang từ cạnh chứ không lọc
 *      theo màu, nên bụng trắng hay mắt trắng của con thú KHÔNG bị đục thủng -
 *      viền đen dày của phong cách này chặn đường loang lại.
 *   2. Gỡ quầng trắng ở mép: điểm ảnh sát nền là màu viền trộn với màu trắng, nên
 *      tách ngược ra thành màu viền + độ trong.
 *   3. Chia tờ thành từng nhân vật bằng nhát cắt dọc qua chỗ thưa mực nhất, mỗi
 *      mảng rời về con nắm phần lớn nó - xem `assignOwners`. Mảng lẻ tí hon, như
 *      logo Gemini ở góc, bị bỏ.
 *   4. Mỗi nhân vật lưu một file webp. Cả tờ dùng CHUNG một tỉ lệ thu nhỏ, để con
 *      nấc 1 vẫn bé hơn con nấc 4 đúng như trên tờ hình.
 *
 * Xong thì ghi lại `src/features/art/manifest.ts` - danh sách hình đang có, để app
 * biết con nào đã có hình mới và con nào còn phải dùng hình pixel cũ.
 */

import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, parse, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { SHEETS } from './art-sheets.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC_DIR = join(ROOT, 'art-src')
const OUT_DIR = join(ROOT, 'public', 'art')
const CHECK_DIR = join(SRC_DIR, '_check')
const MANIFEST = join(ROOT, 'src', 'features', 'art', 'manifest.ts')

/** Cạnh dài nhất của nhân vật LỚN NHẤT trên tờ, tính bằng điểm ảnh. */
const MAX_SIZE = 512
/** Khác màu nền quá ngần này (thang 0..255, kênh lệch nhiều nhất) thì không còn là nền. */
const BG_TOLERANCE = 38
/** Ngưỡng của lỗ bị bao kín - chặt hơn, để màu kem của bụng không bị đục nhầm. */
const HOLE_TOLERANCE = 14
/** Mảng nhỏ hơn tỉ lệ này của cả ảnh thì bỏ ngay - bụi, logo Gemini. */
const SPECK_RATIO = 0.0004

const EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp']

function findSource(file) {
  const base = parse(file).name
  for (const ext of EXTENSIONS) {
    const path = join(SRC_DIR, base + ext)
    if (existsSync(path)) return path
  }
  return null
}

/** Màu nền: trung vị từng kênh của các điểm trên viền ảnh. */
function backgroundColor(data, width, height) {
  const samples = [[], [], []]
  const take = (x, y) => {
    const i = (y * width + x) * 4
    for (let c = 0; c < 3; c++) samples[c].push(data[i + c])
  }
  for (let x = 0; x < width; x += 2) {
    take(x, 0)
    take(x, height - 1)
  }
  for (let y = 0; y < height; y += 2) {
    take(0, y)
    take(width - 1, y)
  }
  return samples.map((s) => s.sort((a, b) => a - b)[s.length >> 1])
}

function diff(data, i, bg) {
  return Math.max(
    Math.abs(data[i] - bg[0]),
    Math.abs(data[i + 1] - bg[1]),
    Math.abs(data[i + 2] - bg[2]),
  )
}

/** 1 = nền. Loang từ mọi điểm trên viền ảnh. */
function floodBackground(data, width, height, bg) {
  const mask = new Uint8Array(width * height)
  const stack = []
  const push = (p) => {
    if (mask[p]) return
    if (diff(data, p * 4, bg) > BG_TOLERANCE) return
    mask[p] = 1
    stack.push(p)
  }
  for (let x = 0; x < width; x++) {
    push(x)
    push((height - 1) * width + x)
  }
  for (let y = 0; y < height; y++) {
    push(y * width)
    push(y * width + width - 1)
  }
  while (stack.length) {
    const p = stack.pop()
    const x = p % width
    if (x > 0) push(p - 1)
    if (x < width - 1) push(p + 1)
    if (p >= width) push(p - width)
    if (p < width * (height - 1)) push(p + width)
  }
  return mask
}

/**
 * Đục những vùng trắng tinh bị bao kín bên trong hình - xem `FILL_HOLES` trong
 * `art-sheets.mjs`. Ngưỡng màu chặt hơn hẳn loang nền: chỉ trắng thật mới bị
 * đục, màu kem của bụng thì không. Vùng tí hon (đốm sáng trong mắt) được giữ.
 */
function fillHoles(data, width, height, bgMask, bg) {
  const seen = new Uint8Array(width * height)
  const minArea = width * height * 0.0002
  for (let start = 0; start < seen.length; start++) {
    if (bgMask[start] || seen[start] || diff(data, start * 4, bg) > HOLE_TOLERANCE) continue
    const region = [start]
    seen[start] = 1
    for (let i = 0; i < region.length; i++) {
      const p = region[i]
      const x = p % width
      for (const q of [x > 0 ? p - 1 : -1, x < width - 1 ? p + 1 : -1, p - width, p + width]) {
        if (q < 0 || q >= seen.length || seen[q] || bgMask[q]) continue
        if (diff(data, q * 4, bg) > HOLE_TOLERANCE) continue
        seen[q] = 1
        region.push(q)
      }
    }
    if (region.length >= minArea) for (const p of region) bgMask[p] = 1
  }
}

/**
 * Gỡ quầng nền ở mép. Điểm nào sát nền được coi là pha giữa màu thật và màu nền:
 * quan sát = a·thật + (1-a)·nền. Lệch khỏi nền càng ít thì càng trong.
 */
function dematte(data, width, height, bgMask, bg) {
  const alpha = new Uint8Array(width * height)
  for (let p = 0; p < alpha.length; p++) alpha[p] = bgMask[p] ? 0 : 255
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x
      if (bgMask[p]) continue
      let nearBg = false
      for (let dy = -2; dy <= 2 && !nearBg; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
          if (bgMask[ny * width + nx]) {
            nearBg = true
            break
          }
        }
      }
      if (!nearBg) continue
      const i = p * 4
      const a = Math.min(1, diff(data, i, bg) / 170)
      if (a <= 0.02) {
        alpha[p] = 0
        continue
      }
      for (let c = 0; c < 3; c++) {
        const v = (data[i + c] - (1 - a) * bg[c]) / a
        data[i + c] = Math.max(0, Math.min(255, Math.round(v)))
      }
      alpha[p] = Math.round(a * 255)
    }
  }
  return alpha
}

/** Gắn nhãn các mảng liền (8 hướng). Trả về nhãn từng điểm và hộp bao từng mảng. */
function components(alpha, width, height) {
  const labels = new Int32Array(width * height).fill(-1)
  const boxes = []
  const stack = []
  for (let start = 0; start < labels.length; start++) {
    if (alpha[start] === 0 || labels[start] !== -1) continue
    const id = boxes.length
    const box = { id, x0: width, y0: height, x1: -1, y1: -1, area: 0 }
    labels[start] = id
    stack.push(start)
    while (stack.length) {
      const p = stack.pop()
      const x = p % width
      const y = (p - x) / width
      box.area++
      if (x < box.x0) box.x0 = x
      if (x > box.x1) box.x1 = x
      if (y < box.y0) box.y0 = y
      if (y > box.y1) box.y1 = y
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
          const q = ny * width + nx
          if (alpha[q] === 0 || labels[q] !== -1) continue
          labels[q] = id
          stack.push(q)
        }
      }
    }
    boxes.push(box)
  }
  return { labels, boxes }
}

/**
 * Chia tờ hình thành `n` nhân vật bằng những ĐƯỜNG CẮT DỌC qua chỗ thưa mực nhất.
 *
 * Bản đầu gom "mảng nào chồng nhau theo chiều ngang là cùng một con" - và hỏng
 * ngay ở tờ thật: đuôi lửa của sóc nấc 2 chìa sang cột của sóc nấc 1, cánh rồng
 * nấc 4 xoè qua đầu rồng nấc 3, thế là hai con bị gộp làm một.
 *
 * Giờ đếm mực theo từng cột, làm mượt, rồi đặt `n-1` nhát cắt vào những thung
 * lũng sâu nhất - giữa hai con luôn là một dải trắng, hoặc ít nhất là một chỗ
 * thắt. Mỗi mảng liền về con nắm phần lớn nó, nên chóp đuôi lấn sang cột bên
 * cạnh vẫn đi theo chủ của nó. Chỉ mảng nằm vắt ngang nhát cắt với hai nửa đều
 * to - hai con vẽ dính vào nhau - mới bị xẻ đúng theo nhát cắt.
 *
 * Trả về chủ của từng điểm ảnh: số thứ tự nhân vật, hoặc -1.
 */
function assignOwners(labels, boxes, width, height, n) {
  const kept = new Uint8Array(boxes.length)
  for (const b of boxes) if (b.area >= width * height * SPECK_RATIO) kept[b.id] = 1

  const proj = new Float64Array(width)
  for (let p = 0; p < labels.length; p++) {
    const l = labels[p]
    if (l >= 0 && kept[l]) proj[p % width]++
  }
  let xmin = 0
  let xmax = width - 1
  while (xmin < width && proj[xmin] === 0) xmin++
  while (xmax > 0 && proj[xmax] === 0) xmax--

  // Làm mượt: một khe hẹp giữa hai sợi lông không được tính là thung lũng.
  const win = Math.max(2, Math.round(width * 0.012))
  const smooth = new Float64Array(width)
  const prefix = new Float64Array(width + 1)
  for (let x = 0; x < width; x++) prefix[x + 1] = prefix[x] + proj[x]
  for (let x = 0; x < width; x++) {
    const a = Math.max(0, x - win)
    const b = Math.min(width, x + win + 1)
    smooth[x] = (prefix[b] - prefix[a]) / (b - a)
  }
  // Trong một dải trắng dài, chọn chỗ GIỮA dải - xa mực nhất - để mảng lơ lửng
  // ở mép dải (cuốn sách, tờ giấy bay) rơi về đúng con gần nó.
  const distToInk = new Float64Array(width).fill(Infinity)
  for (let x = 0, d = Infinity; x < width; x++) {
    d = proj[x] > 0 ? 0 : d + 1
    distToInk[x] = d
  }
  for (let x = width - 1, d = Infinity; x >= 0; x--) {
    d = proj[x] > 0 ? 0 : d + 1
    distToInk[x] = Math.min(distToInk[x], d)
  }

  const total = prefix[width]
  const minSpace = (xmax - xmin) / (n * 2.5)
  const candidates = []
  for (let x = xmin + 1; x < xmax; x++) candidates.push(x)
  candidates.sort((a, b) => smooth[a] - smooth[b] || distToInk[b] - distToInk[a])
  const cuts = []
  for (const x of candidates) {
    if (cuts.length === n - 1) break
    if (cuts.some((c) => Math.abs(c - x) < minSpace)) continue
    if (prefix[x] < total * 0.02 || total - prefix[x] < total * 0.02) continue
    cuts.push(x)
  }
  cuts.sort((a, b) => a - b)
  const segmentOf = (x) => {
    let k = 0
    while (k < cuts.length && x >= cuts[k]) k++
    return k
  }

  // Mỗi mảng về con nắm phần lớn nó; mảng vắt ngang hai con thì xẻ theo nhát cắt.
  const counts = boxes.map(() => new Float64Array(cuts.length + 1))
  for (let p = 0; p < labels.length; p++) {
    const l = labels[p]
    if (l >= 0 && kept[l]) counts[l][segmentOf(p % width)]++
  }
  const whole = new Int32Array(boxes.length).fill(-2)
  for (const b of boxes) {
    if (!kept[b.id]) continue
    const c = counts[b.id]
    let best = 0
    for (let k = 1; k < c.length; k++) if (c[k] > c[best]) best = k
    whole[b.id] = c[best] / b.area >= 0.8 ? best : -1
  }
  const owner = new Int8Array(labels.length).fill(-1)
  for (let p = 0; p < labels.length; p++) {
    const l = labels[p]
    if (l < 0 || !kept[l]) continue
    owner[p] = whole[l] >= 0 ? whole[l] : segmentOf(p % width)
  }
  return { owner, count: cuts.length + 1 }
}

async function processSheet(sheet) {
  const source = findSource(sheet.file)
  if (!source) return null

  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height } = info
  const bg = backgroundColor(data, width, height)
  const bgMask = floodBackground(data, width, height, bg)
  if (sheet.fillHoles) fillHoles(data, width, height, bgMask, bg)
  const alpha = dematte(data, width, height, bgMask, bg)
  const { labels, boxes } = components(alpha, width, height)
  const { owner, count } = assignOwners(labels, boxes, width, height, sheet.ids.length)

  if (count !== sheet.ids.length) {
    throw new Error(
      `${sheet.file}: chỉ chia được ${count} nhân vật, cần ${sheet.ids.length}. ` +
        `Thường là do nền không phải màu trắng phẳng, hoặc các con xếp chồng lên nhau - tạo lại tờ này.`,
    )
  }

  const clusters = Array.from({ length: count }, () => ({ x0: width, y0: height, x1: -1, y1: -1 }))
  for (let p = 0; p < owner.length; p++) {
    const k = owner[p]
    if (k < 0) continue
    const x = p % width
    const y = (p - x) / width
    const c = clusters[k]
    if (x < c.x0) c.x0 = x
    if (x > c.x1) c.x1 = x
    if (y < c.y0) c.y0 = y
    if (y > c.y1) c.y1 = y
  }

  const pad = Math.round(Math.max(width, height) * 0.01)
  const crops = clusters.map((c) => ({
    ...c,
    x0: Math.max(0, c.x0 - pad),
    y0: Math.max(0, c.y0 - pad),
    x1: Math.min(width - 1, c.x1 + pad),
    y1: Math.min(height - 1, c.y1 + pad),
  }))
  const largest = Math.max(...crops.map((c) => Math.max(c.x1 - c.x0 + 1, c.y1 - c.y0 + 1)))
  const scale = Math.min(1, MAX_SIZE / largest)

  const results = []
  for (let k = 0; k < crops.length; k++) {
    const c = crops[k]
    const w = c.x1 - c.x0 + 1
    const h = c.y1 - c.y0 + 1
    const out = Buffer.alloc(w * h * 4)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = (c.y0 + y) * width + (c.x0 + x)
        if (owner[p] !== k) continue
        const o = (y * w + x) * 4
        out[o] = data[p * 4]
        out[o + 1] = data[p * 4 + 1]
        out[o + 2] = data[p * 4 + 2]
        out[o + 3] = alpha[p]
      }
    }
    const outW = Math.max(1, Math.round(w * scale))
    const outH = Math.max(1, Math.round(h * scale))
    const id = sheet.ids[k]
    await sharp(out, { raw: { width: w, height: h, channels: 4 } })
      .resize(outW, outH, { kernel: 'lanczos3' })
      .webp({ quality: 90, alphaQuality: 100 })
      .toFile(join(OUT_DIR, `${id}.webp`))
    results.push({ id, w: outW, h: outH })
  }

  await writeCheck(sheet, results)
  return results
}

/** Ảnh soát: mọi hình đã cắt đặt cạnh nhau trên nền ca-rô, để nhìn ra lỗi cắt. */
async function writeCheck(sheet, results) {
  const gap = 24
  const W = results.reduce((s, r) => s + r.w + gap, gap)
  const H = Math.max(...results.map((r) => r.h)) + gap * 2
  const tile = 16
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs><pattern id="c" width="${tile * 2}" height="${tile * 2}" patternUnits="userSpaceOnUse">
      <rect width="${tile * 2}" height="${tile * 2}" fill="#d8d8d8"/>
      <rect width="${tile}" height="${tile}" fill="#a8a8a8"/><rect x="${tile}" y="${tile}" width="${tile}" height="${tile}" fill="#a8a8a8"/>
    </pattern></defs><rect width="100%" height="100%" fill="url(#c)"/></svg>`
  let x = gap
  const layers = results.map((r) => {
    const layer = { input: join(OUT_DIR, `${r.id}.webp`), left: x, top: H - gap - r.h }
    x += r.w + gap
    return layer
  })
  await sharp(Buffer.from(svg)).composite(layers).png().toFile(join(CHECK_DIR, `${parse(sheet.file).name}.png`))
}

function writeManifest() {
  const entries = []
  for (const file of readdirSync(OUT_DIR).sort()) {
    if (!file.endsWith('.webp')) continue
    entries.push(parse(file).name)
  }
  return entries
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  mkdirSync(CHECK_DIR, { recursive: true })
  const only = process.argv.slice(2)
  const sheets = only.length ? SHEETS.filter((s) => only.includes(parse(s.file).name)) : SHEETS

  const sizes = {}
  let missing = 0
  let failed = 0
  for (const sheet of sheets) {
    try {
      const results = await processSheet(sheet)
      if (!results) {
        missing++
        continue
      }
      for (const r of results) sizes[r.id] = r
      console.log(`✓ ${sheet.file}: ${results.map((r) => `${r.id} ${r.w}×${r.h}`).join(', ')}`)
    } catch (error) {
      failed++
      console.error(`✗ ${error.message}`)
    }
  }

  // Manifest liệt kê MỌI file đang nằm trong public/art, kể cả tờ không chạy lần
  // này - chạy lại một tờ không được làm mất hình của những tờ khác.
  const all = {}
  for (const id of writeManifest()) {
    const meta = sizes[id] ?? (await sharp(join(OUT_DIR, `${id}.webp`)).metadata())
    all[id] = { w: meta.w ?? meta.width, h: meta.h ?? meta.height }
  }
  const body = Object.entries(all)
    .map(([id, s]) => `  '${id}': { w: ${s.w}, h: ${s.h} },`)
    .join('\n')
  mkdirSync(dirname(MANIFEST), { recursive: true })
  writeFileSync(
    MANIFEST,
    `/**
 * TỆP SINH TỰ ĐỘNG bởi \`npm run art\` - đừng sửa tay.
 *
 * Mọi hình vẽ mới đang có trong \`public/art\`, kèm kích thước thật. Hình nào chưa
 * có ở đây thì app vẽ con đó bằng sprite pixel cũ.
 */

export const ART_MANIFEST: Record<string, { w: number; h: number }> = {
${body}
}
`,
  )

  console.log(
    `\n${Object.keys(all).length} hình trong public/art. ` +
      `${sheets.length - missing - failed} tờ đã cắt, ${missing} tờ chưa có ảnh gốc, ${failed} tờ lỗi.`,
  )
  if (failed) process.exitCode = 1
}

main()
