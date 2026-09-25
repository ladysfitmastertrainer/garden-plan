/**
 * Vùng đất: mỗi (môn × lớp) là một nơi KHÁC HẲN nhau.
 *
 * Trước đây cả 20 vùng dùng chung một hành lang cỏ 13 ô, chỉ khác số chặng - ra
 * khỏi đảo này vào đảo kia thì y hệt nhau, nên bản đồ thế giới nhìn có vẻ rộng
 * mà chơi thì không. File này là thứ phá vỡ điều đó, trên ba tầng:
 *
 *  1. MÔN quyết định địa hình: mặt đất, vật liệu viền, kiểu đường đi, thứ rải
 *     rác hai bên. Toán là thung lũng đá; Tiếng Việt là rừng sâu; Đạo đức là
 *     đồi ven biển; Âm nhạc là đảo cát có đường đi xếp thành khuông nhạc.
 *  2. LỚP quyết định ánh sáng: lớp 1 nắng sớm, lớp 5 hoàng hôn. Cùng một khu
 *     rừng nhưng lớp 1 và lớp 5 không lẫn vào nhau được.
 *  3. Hai thứ trên nhân lên thành 20 bảng màu riêng, sinh bằng code nên không
 *     phải tô tay 20 bộ ô cảnh.
 */

import type { Grade, Subject } from '../../content/types'
import { TERRAIN, buildTiles, type TerrainColors, type TileKind, type TileSet } from '../pixel/tiles'
import type { RouteOptions, ZoneKind } from './routemap'

/** Kiểu bố cục đường đi. Mỗi môn một kiểu, xem `routemap.ts`. */
export type RouteShape = 'terrace' | 'winding' | 'coast' | 'staff'

export interface ScatterRule {
  kind: TileKind
  /** Xác suất xuất hiện trên một ô đất trống. */
  chance: number
}

export interface Biome {
  land: string
  /** Một câu tả cảnh, chào trẻ khi mới đặt chân tới. */
  flavour: string
  /** Ô mặt đất nền. */
  ground: TileKind
  /** Vật liệu đóng kín viền bản đồ. */
  border: TileKind
  /** Ô đặt quanh cổng, báo "chỗ này có quái". */
  gateHalo: TileKind
  shape: RouteShape
  width: number
  scatter: ScatterRule[]
  /** Khu môi trường riêng của vùng đất - hang, tán cây, đảo, núi lửa. */
  zone: ZoneKind | null
  /** Một câu tả khu ấy, hiện lên khi trẻ vừa bước vào. */
  zoneFlavour: string | null
  colors: TerrainColors
  tiles: TileSet
}

// ---------------------------------------------------------------------------
// Trộn màu
// ---------------------------------------------------------------------------

function toRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function toHex(rgb: [number, number, number]): string {
  return '#' + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')
}

/** Trộn `a` về phía `b` theo tỉ lệ t (0 = giữ nguyên a, 1 = thành b). */
function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = toRgb(a)
  const [br, bg, bb] = toRgb(b)
  return toHex([ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t])
}

/** Phủ một tông ánh sáng lên CẢ bảng màu, giữ nguyên tương quan sáng tối. */
function tintAll(colors: TerrainColors, tint: string, strength: number): TerrainColors {
  if (strength === 0) return colors
  const out = {} as Record<string, string>
  for (const [key, value] of Object.entries(colors)) out[key] = mix(value, tint, strength)
  return out as TerrainColors
}

// ---------------------------------------------------------------------------
// Bốn vùng đất
// ---------------------------------------------------------------------------

/** Chỉ ghi đè những màu thật sự khác gốc - còn lại kế thừa bảng đồng cỏ. */
type Palette = Partial<TerrainColors>

interface BiomeSpec {
  land: string
  flavour: string
  ground: TileKind
  border: TileKind
  gateHalo: TileKind
  shape: RouteShape
  width: number
  scatter: ScatterRule[]
  zone: ZoneKind
  zoneFlavour: string
  palette: Palette
}

const SPECS: Record<Subject, BiomeSpec> = {
  // Thung lũng đá cao, cỏ khô, đường lát đá xếp thành từng bậc.
  math: {
    land: 'Thung lũng Con Số',
    flavour: 'Gió lùa qua những bậc đá xếp chồng. Ở đây mọi thứ đều đếm được.',
    ground: 'grass',
    border: 'rock',
    gateHalo: 'tallGrass',
    shape: 'terrace',
    width: 15,
    scatter: [
      { kind: 'rock', chance: 0.06 },
      { kind: 'tallGrass', chance: 0.1 },
      { kind: 'flower', chance: 0.03 },
    ],
    // Thung lũng đá thì có hang: vách đá sẵn đó, chỉ việc khoét cửa vào.
    zone: 'cave',
    zoneFlavour: 'Trong hang tối và ẩm. Có tiếng càng cua gõ lách cách đâu đó...',
    palette: {
      grass: '#a3bb8c',
      grassDark: '#8aa373',
      tallGrass: '#8aa373',
      tallGrassDark: '#748c5f',
      path: '#cfc6b4',
      pathDark: '#aaa08d',
      treeLeaf: '#5b9a6e',
      treeLeafDark: '#417553',
      trunk: '#6b5233',
      flower: '#f2c14e',
      flowerCore: '#fff1b8',
      stone: '#aab6c6',
      stoneDark: '#6d798b',
      stoneLight: '#d8e0ec',
      floor: '#bdb4a2',
      floorDark: '#968d7c',
      floorLine: '#6f6859',
    },
  },

  // Rừng già rậm rạp, tán lá khép trên đầu, lối mòn ngoằn ngoèo.
  vietnamese: {
    land: 'Rừng Ngôn Từ',
    flavour: 'Lá dày đến mức nắng chỉ lọt xuống từng vệt. Chữ nghĩa trốn trong đó.',
    ground: 'grass',
    border: 'tree',
    gateHalo: 'tallGrass',
    shape: 'winding',
    width: 13,
    scatter: [
      { kind: 'tree', chance: 0.14 },
      { kind: 'tallGrass', chance: 0.07 },
      { kind: 'flower', chance: 0.05 },
    ],
    // Rừng già thì leo lên cây: một sàn ván bắc giữa tán lá, thú rừng ở trên đó.
    zone: 'canopy',
    zoneFlavour: 'Con leo lên tới tán cây. Lá xào xạc - có con gì đang chuyền cành!',
    palette: {
      grass: '#4f9e57',
      grassDark: '#3d8146',
      tallGrass: '#3d8146',
      tallGrassDark: '#2f6a37',
      path: '#c8a97a',
      pathDark: '#a3854f',
      treeLeaf: '#25703f',
      treeLeafDark: '#17532c',
      trunk: '#5f3b1c',
      flower: '#ff8fb0',
      flowerCore: '#ffe9a8',
      floor: '#9c8a6e',
      floorDark: '#7b6b53',
      floorLine: '#584b3a',
    },
  },

  // Đồi cỏ sáng chạy ra tới biển - nửa phải bản đồ là nước.
  ethics: {
    land: 'Đồi Ánh Sáng',
    flavour: 'Đồi cỏ đổ thẳng xuống biển. Chỗ này sáng đến mức không giấu được gì.',
    ground: 'grass',
    border: 'water',
    gateHalo: 'flower',
    shape: 'coast',
    /*
      Rộng 15 ô, nhưng phần ĐẤT vẫn đúng tám cột như hồi còn rộng 13.

      Hai cột thêm vào đều là biển, để có chỗ cho đảo (xem `seaStart` trong
      `routemap.ts`). Hồi trước vùng này cố ý hẹp để biển không nằm ngoài mép
      màn hình suốt; giờ biển rộng hơn thì càng lộ ra, và ngoài biển có thứ để
      lội ra tìm - nên nó không còn là "vùng ven biển" chỉ có tên.
    */
    width: 15,
    scatter: [
      { kind: 'flower', chance: 0.14 },
      { kind: 'tallGrass', chance: 0.13 },
      { kind: 'rock', chance: 0.03 },
    ],
    // Đồi ven biển thì có đảo, lội nước nông ra được. Cá nhảy ra từ nước nông.
    zone: 'islands',
    zoneFlavour: 'Nước chỉ ngập tới đầu gối. Dưới chân có bóng cá lượn qua lượn lại...',
    palette: {
      grass: '#9ade7e',
      grassDark: '#7cc25f',
      tallGrass: '#7cc25f',
      tallGrassDark: '#66a94c',
      path: '#f2e6ba',
      pathDark: '#dbca97',
      treeLeaf: '#57bd73',
      treeLeafDark: '#3d9e58',
      flower: '#ffd166',
      flowerCore: '#fff8dc',
      water: '#6fc9ea',
      waterDark: '#4aa9d0',
      waterLight: '#c9eefb',
      sand: '#f6ecc6',
      sandDark: '#e2d4a4',
      floor: '#e4d9b4',
      floorDark: '#bfb28c',
      floorLine: '#8f8467',
    },
  },

  // Đảo cát, đường đi là những dòng kẻ ngang xếp thành khuông nhạc.
  music: {
    land: 'Đảo Thanh Âm',
    flavour: 'Những lối đi kẻ ngang như khuông nhạc, và mỗi cổng là một nốt.',
    ground: 'sand',
    border: 'water',
    gateHalo: 'rock',
    shape: 'staff',
    width: 15,
    scatter: [
      { kind: 'rock', chance: 0.05 },
      { kind: 'flower', chance: 0.05 },
      { kind: 'tree', chance: 0.04 },
      // Cỏ khô trên cát. Thiếu nó thì đảo này là vùng DUY NHẤT không bao giờ
      // gặp quái hoang - bốn vùng đất chơi khác hẳn nhau mà không ai nói gì.
      { kind: 'tallGrass', chance: 0.12 },
    ],
    // Đảo giữa biển thì có núi lửa trên đỉnh: leo bậc đá lên miệng núi, nền tro
    // nóng giữa những vũng dung nham.
    zone: 'volcano',
    zoneFlavour: 'Miệng núi lửa nóng hầm hập. Dung nham sôi lục bục - cẩn thận nhé!',
    palette: {
      grass: '#e7dcb0',
      grassDark: '#d3c599',
      tallGrass: '#cbb98b',
      tallGrassDark: '#b5a377',
      sand: '#f0e4b8',
      sandDark: '#dccf9c',
      path: '#a97d55',
      pathDark: '#8a6340',
      treeLeaf: '#3fbfa0',
      treeLeafDark: '#2a927a',
      trunk: '#8a6340',
      flower: '#c084fc',
      flowerCore: '#f3e8ff',
      stone: '#b9a7c9',
      stoneDark: '#7e6c92',
      stoneLight: '#e4d9f0',
      water: '#59b6e8',
      waterDark: '#3a93c6',
      waterLight: '#b6e6fa',
      floor: '#cbb68e',
      floorDark: '#a3906d',
      floorLine: '#75654b',
    },
  },
}

/**
 * Ánh sáng theo lớp. Không phải trang trí suông: hai vùng cùng môn khác lớp nằm
 * cạnh nhau trên bản đồ thế giới, cần nhìn là phân biệt được ngay.
 */
const GRADE_LIGHT: Record<Grade, { tint: string; strength: number; label: string }> = {
  1: { tint: '#fff3c4', strength: 0.16, label: 'nắng sớm' },
  2: { tint: '#ffffff', strength: 0.0, label: 'giữa buổi' },
  3: { tint: '#7fc9ff', strength: 0.12, label: 'trời trong' },
  4: { tint: '#ff9a56', strength: 0.16, label: 'nắng chiều' },
  5: { tint: '#4a3d8f', strength: 0.24, label: 'hoàng hôn' },
}

/**
 * Nhuộm một màu bất kỳ theo ánh sáng của lớp. Bản đồ thế giới dùng hàm này để
 * hòn đảo ngoài kia và vùng đất bên trong nó cùng một tông - bước qua cổng mà
 * đổi hẳn màu thì hai chỗ đó không còn là một nơi nữa.
 */
export function tintForGrade(color: string, grade: Grade): string {
  const light = GRADE_LIGHT[grade]
  return mix(color, light.tint, light.strength)
}

/** Tên buổi trong ngày của một lớp - dùng cho lời chào khi vào vùng. */
export function gradeLight(grade: Grade): string {
  return GRADE_LIGHT[grade].label
}

const cache = new Map<string, Biome>()

/**
 * Vùng đất của một (môn, lớp). Kết quả được nhớ lại: dựng cả bộ ô cảnh là việc
 * nặng, mà trẻ đi ra đi vào cùng một vùng rất nhiều lần.
 */
export function biomeFor(subject: Subject, grade: Grade): Biome {
  const key = `${subject}.g${grade}`
  const hit = cache.get(key)
  if (hit) return hit

  const spec = SPECS[subject]
  const light = GRADE_LIGHT[grade]
  const colors = tintAll({ ...TERRAIN, ...spec.palette }, light.tint, light.strength)

  // Lớp càng cao, cảnh vật càng rậm - vùng đất cũng lớn lên cùng trẻ.
  const density = 1 + (grade - 1) * 0.12
  const biome: Biome = {
    land: spec.land,
    flavour: spec.flavour,
    ground: spec.ground,
    border: spec.border,
    gateHalo: spec.gateHalo,
    shape: spec.shape,
    width: spec.width,
    scatter: spec.scatter.map((rule) => ({ ...rule, chance: rule.chance * density })),
    zone: spec.zone,
    zoneFlavour: spec.zoneFlavour,
    colors,
    tiles: buildTiles(colors),
  }

  cache.set(key, biome)
  return biome
}

/**
 * Tham số dựng bản đồ đi cảnh của một vùng đất.
 *
 * Một chỗ duy nhất, vì bản đồ được dựng ở nhiều nơi - màn đi cảnh, bàn hướng
 * dẫn, test - và mọi nơi phải ra CÙNG MỘT tấm bản đồ tới từng ô: toạ độ của bạn
 * cùng lớp, chỗ đứng đã nhớ, ô quái ẩn đã tìm ra đều là toạ độ trên tấm ấy.
 * Chép tay danh sách tham số ra từng chỗ thì thêm một tham số mới (như `zone`)
 * là có chỗ quên, và hai tấm bản đồ lệch nhau mà không ai báo lỗi.
 */
export function routeOptionsFor(biome: Biome, bossIndex: number): Partial<RouteOptions> {
  return {
    shape: biome.shape,
    width: biome.width,
    ground: biome.ground,
    border: biome.border,
    gateHalo: biome.gateHalo,
    scatter: biome.scatter,
    bossIndex,
    zone: biome.zone,
  }
}
