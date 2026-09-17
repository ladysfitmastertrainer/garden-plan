/**
 * Bộ nhân vật pixel 16×16.
 *
 * Quy ước ký tự dùng chung cho mọi sprite, để đọc lưới nào cũng hiểu ngay:
 *   .  trong suốt      #  viền ngoài (màu tối nhất)
 *   B  thân chính      S  phần tối của thân
 *   L  bụng / phần sáng
 *   E  lòng trắng mắt  P  con ngươi
 *   Y  điểm nhấn (mỏ, chân, sừng...)
 *
 * Mọi nhân vật dùng chung một ngôn ngữ hình khối: thân tròn, mắt to, chân ngắn.
 * Đây là chủ ý - máy điện tử cầm tay ngày xưa chỉ có vài chục điểm ảnh nên nhân
 * vật phải đọc ra được từ silhouette, và giữ cùng một kiểu thì cả bộ mới ăn nhập.
 */

import type { Sprite } from './sprite'
import type { Subject } from '../../content/types'

// --- Nhân vật của trẻ ---------------------------------------------------------

/** Cáo: hai tai nhọn, bụng trắng. */
export const FOX: Sprite = {
  palette: {
    '#': '#5b2d0e',
    B: '#e8823c',
    S: '#c26326',
    L: '#ffe6c9',
    E: '#ffffff',
    P: '#241206',
    Y: '#8a4a18',
  },
  rows: [
    '................',
    '..#..........#..',
    '.#B#........#B#.',
    '.#BB#......#BB#.',
    '.#BBB######BBB#.',
    '.#BBBBBBBBBBBB#.',
    '#BBBBBBBBBBBBBB#',
    '#BBEPBBBBBBEPBB#',
    '#BBEPBBSSBBEPBB#',
    '#BBBBBLLLLBBBBB#',
    '#BBBBLLLLLLBBBB#',
    '.#BBBLLLLLLBBB#.',
    '.#BBBBLLLLBBBB#.',
    '..#BBBBBBBBBB#..',
    '...YY#BB#YY#....',
    '....##....##....',
  ],
}

/** Gấu trúc: tai tròn, khoang mắt đen. */
export const PANDA: Sprite = {
  palette: {
    '#': '#1d1d1f',
    B: '#f7f5f2',
    S: '#2b2b2f',
    L: '#ffffff',
    E: '#ffffff',
    P: '#1d1d1f',
    Y: '#3a3a40',
  },
  rows: [
    '................',
    '..##........##..',
    '.#SS#......#SS#.',
    '.#SSS######SSS#.',
    '.#BBBBBBBBBBBB#.',
    '#BBBBBBBBBBBBBB#',
    '#BSSSBBBBBBSSSB#',
    '#BSEPSBBBBSEPSB#',
    '#BSSSBBYYBBSSSB#',
    '#BBBBBBYYBBBBBB#',
    '#BBBBLLLLLLBBBB#',
    '.#BBBLLLLLLBBB#.',
    '.#SBBBLLLLBBBS#.',
    '..#SBBBBBBBBS#..',
    '...##SS##SS##...',
    '................',
  ],
}

/** Rồng con: sừng nhỏ, vảy bụng sáng. */
export const DRAGON: Sprite = {
  palette: {
    '#': '#124a2e',
    B: '#3fbf6d',
    S: '#2b8f51',
    L: '#d9f7a8',
    E: '#ffffff',
    P: '#0d2f1d',
    Y: '#ffd447',
  },
  rows: [
    '................',
    '....Y......Y....',
    '...#Y#....#Y#...',
    '...#BB####BB#...',
    '..#BBBBBBBBBB#..',
    '.#BBBBBBBBBBBB#.',
    '#BBBBBBBBBBBBBB#',
    '#BEPBBBSSBBBEPB#',
    '#BEPBBBSSBBBEPB#',
    '#BBBBBLLLLBBBBB#',
    '#SBBBLLLLLLBBBS#',
    '.#SBBLLLLLLBBS#.',
    '.#SSBBLLLLBBSS#.',
    '..#SSBBBBBBSS#..',
    '...##YY##YY##...',
    '................',
  ],
}

export const HERO_CREATURES = { fox: FOX, panda: PANDA, dragon: DRAGON } as const
export type HeroCreatureId = keyof typeof HERO_CREATURES

/** Tên hiển thị khi trẻ chọn nhân vật. */
export const HERO_NAMES: Record<HeroCreatureId, string> = {
  fox: 'Cáo Lửa',
  panda: 'Trúc Mập',
  dragon: 'Rồng Con',
}

/**
 * Hồ sơ cũ lưu emoji làm ảnh đại diện. Ánh xạ sang nhân vật pixel để những hồ sơ
 * đã tạo trước đây vẫn chơi được, không phải tạo lại.
 */
export function creatureFromAvatar(avatar: string): HeroCreatureId {
  if (avatar === '🐼' || avatar === '🐨' || avatar === '🐧') return 'panda'
  if (avatar === '🐢' || avatar === '🦄' || avatar === '🐸') return 'dragon'
  return 'fox'
}

// --- Quái ----------------------------------------------------------------------

/** Slime: khối tròn mềm, môn Toán. */
export const SLIME: Sprite = {
  palette: {
    '#': '#1a5c2a',
    B: '#5fd97a',
    S: '#3aa855',
    L: '#c8f7cf',
    E: '#ffffff',
    P: '#12301a',
  },
  rows: [
    '................',
    '................',
    '......####......',
    '....##BBBB##....',
    '...#BBBBBBBB#...',
    '..#BBBBBBBBBB#..',
    '..#BBBBBBBBBB#..',
    '.#BBEPBBBBEPBB#.',
    '.#BBEPBBBBEPBB#.',
    '.#BBBBBSSBBBBB#.',
    '.#BBBBBSSBBBBB#.',
    '#BBBBBBBBBBBBBB#',
    '#BLLLLLLLLLLLLB#',
    '#LLLLLLLLLLLLLL#',
    '.##############.',
    '................',
  ],
}

/** Cú: mắt tròn to, mỏ vàng, môn Tiếng Việt. */
export const OWL: Sprite = {
  palette: {
    '#': '#3a2413',
    B: '#a9784a',
    S: '#7d5533',
    L: '#e8cda6',
    E: '#ffffff',
    P: '#1a1008',
    Y: '#ffc94d',
  },
  rows: [
    '................',
    '..##........##..',
    '.#BB#......#BB#.',
    '.#BBB######BBB#.',
    '#BBBBBBBBBBBBBB#',
    '#BB#EEE##EEE#BB#',
    '#B#EEPEEEEPEE#B#',
    '#B#EEPEEEEPEE#B#',
    '#BB#EEEYYEEE#BB#',
    '#BBBBBBYYBBBBBB#',
    '#BBBBBBBBBBBBBB#',
    '.#BBLLLLLLLLBB#.',
    '.#SBLLLLLLLLBS#.',
    '..#SBBBBBBBBS#..',
    '...##YY##YY##...',
    '................',
  ],
}

/** Chuông lạc nhịp: thân chuông, môn Âm nhạc. */
export const BELL: Sprite = {
  palette: {
    '#': '#3b2a6b',
    B: '#a78bfa',
    S: '#7c5cd6',
    L: '#e9defd',
    E: '#ffffff',
    P: '#241a45',
    Y: '#ffd447',
  },
  rows: [
    '.......YY.......',
    '......#YY#......',
    '.....##BB##.....',
    '....#BBBBBB#....',
    '...#BBBBBBBB#...',
    '..#BBBBBBBBBB#..',
    '..#BBBBBBBBBB#..',
    '.#BBEPBBBBEPBB#.',
    '.#BBEPBBBBEPBB#.',
    '.#BBBBBSSBBBBB#.',
    '#BBBBBBBBBBBBBB#',
    '#SSSSSSSSSSSSSS#',
    '#LLLLLLLLLLLLLL#',
    '.##############.',
    '......#YY#......',
    '.......YY.......',
  ],
}

/** Bóng tối: khối sương mờ, môn Đạo đức. */
export const SHADOW: Sprite = {
  palette: {
    '#': '#2b3550',
    B: '#7f8db5',
    S: '#5a6788',
    L: '#c3cde6',
    E: '#ffffff',
    P: '#1b2236',
    Y: '#ffe98a',
  },
  rows: [
    '.....####.......',
    '...##BBBB##.....',
    '..#BBBBBBBB#....',
    '.#BBBBBBBBBB#...',
    '#BBBBBBBBBBBB#..',
    '#BBEPBBBBEPBB#..',
    '#BBEPBBBBEPBB#..',
    '#BBBBBBBBBBBBB#.',
    '#BBBBBSSBBBBBB#.',
    '#BBBBBBBBBBBBB#.',
    '.#BBBBBBBBBBB#..',
    '..#BBBBBBBBB#...',
    '...#SBSBSBS#....',
    '....#S#S#S#.....',
    '.....#.#.#......',
    '................',
  ],
}

// --- Hình thái tiến hoá ---------------------------------------------------------
//
// Cùng một con thú lớn lên, không phải loài khác: giữ nguyên dáng gốc rồi thêm
// sừng, gai, mũ miện và đôi mắt sắc hơn, đồng thời cho thân hình chiếm gần hết
// khung 16×16. Cấp 1 tròn trịa dễ thương, tiến hoá xong thì bệ vệ hẳn.
//
// Vẫn dùng đúng bảng ký tự cũ (B thân, S phần tối, # viền) để `recolor` theo
// nguyên tố còn tô được - thiếu chữ B thì con thú tiến hoá xong mất luôn màu hệ.

/** Slime đội vương miện gai. */
export const SLIME_KING: Sprite = {
  palette: { '#': '#1a5c2a', B: '#5fd97a', S: '#3aa855', L: '#c8f7cf', E: '#ffffff', P: '#12301a', Y: '#ffd447' },
  rows: [
    '................',
    '...Y..Y..Y..Y...',
    '..YYYYYYYYYYYY..',
    '..############..',
    '.##BBBBBBBBBB##.',
    '#BBBBBBBBBBBBBB#',
    '#BSSSBBBBBBSSSB#',
    '#BEEPBBBBBBPEEB#',
    '#BBBBBBBBBBBBBB#',
    '#BBBBSSSSSSBBBB#',
    '#BBBBBBBBBBBBBB#',
    '#BBBBBBBBBBBBBB#',
    '#BLLLLLLLLLLLLB#',
    '#LLLLLLLLLLLLLL#',
    '.##############.',
    '................',
  ],
}

/**
 * Cáo chín đuôi: đầu hình NÊM, thóp dần xuống thành mõm nhọn có mũi đen.
 *
 * Bản đầu tiên vẽ đầu tròn + tai nhọn, nhìn gần như trùng với cú tiến hoá. Cái
 * phân biệt cáo với cú không nằm ở đôi tai mà ở SILHOUETTE: cáo là hình tam
 * giác chúc xuống, cú là khối tròn bè ngang.
 */
export const FOX_ELDER: Sprite = {
  palette: { '#': '#7a3b12', B: '#ff9a4d', S: '#d16a22', L: '#ffe0c2', E: '#ffffff', P: '#2a1408', Y: '#ffd447' },
  rows: [
    '.##..........##.',
    '.#B#........#B#.',
    '.#BB#......#BB#.',
    '.#BSB#....#BSB#.',
    '.#BBB######BBB#.',
    '#BBBBBBBBBBBBBB#',
    '#SSSBBBBBBBBSSS#',
    '#EEPBBBBBBBBPEE#',
    'Y#BBBBBBBBBBBB#Y',
    'YY#BBBBBBBBBB#YY',
    'YYY#BBBBBBBB#YYY',
    '.YY#BBLLLLBB#YY.',
    '..Y#BLLLLLLB#Y..',
    '...#BLLLLLLB#...',
    '....#LLLLLL#....',
    '.....#PPPP#.....',
  ],
}

/** Cú hiền triết, sừng dài và lông mày nặng. */
export const OWL_SAGE: Sprite = {
  palette: { '#': '#3a2413', B: '#a9784a', S: '#7d5533', L: '#e8cda6', E: '#ffffff', P: '#1a1008', Y: '#ffc94d' },
  rows: [
    '.##..........##.',
    '#BB#........#BB#',
    '#BBB########BBB#',
    '#BBBBBBBBBBBBBB#',
    '#BSSSSS##SSSSSB#',
    '#B#EEPEEEEPEE#B#',
    '#B#EEPEEEEPEE#B#',
    '#BB#EEEYYEEE#BB#',
    '#BBBBBBYYBBBBBB#',
    '#BBBBBBBBBBBBBB#',
    '#BBLLLLLLLLLLBB#',
    '#BSLLLLLLLLLLSB#',
    '.#SBLLLLLLLLBS#.',
    '..#SBBBBBBBBS#..',
    '...#YY####YY#...',
    '................',
  ],
}

/** Gấu hộ vệ, vai giáp và mắt nghiêm. */
export const PANDA_GUARDIAN: Sprite = {
  palette: { '#': '#1f1f1f', B: '#f4f4f4', S: '#2b2b2b', L: '#ffffff', E: '#ffffff', P: '#101010', Y: '#ffd447' },
  rows: [
    '..##........##..',
    '.#SS#......#SS#.',
    '.#SSS######SSS#.',
    '#BBBBBBBBBBBBBB#',
    '#BSSSBBBBBBSSSB#',
    '#SSEPSBBBBSPESS#',
    '#SSEPSBBBBSPESS#',
    '#BBSSBBBBBBSSBB#',
    '#BBBBBSSSSBBBBB#',
    'Y#BBBBBBBBBBBB#Y',
    'YY#BLLLLLLLLB#YY',
    '.Y#LLLLLLLLLL#Y.',
    '..#LLLLLLLLLL#..',
    '..#BBBBBBBBBB#..',
    '...##BB##BB##...',
    '................',
  ],
}

/** Rồng trưởng lão, sừng lớn và cánh xoè. */
export const DRAGON_ELDER: Sprite = {
  palette: { '#': '#1f4d7a', B: '#5bc0f0', S: '#2f8fc4', L: '#d6f1ff', E: '#ffffff', P: '#0d2438', Y: '#ffd447' },
  rows: [
    '..Y..........Y..',
    '..YY........YY..',
    '..#YY######YY#..',
    '.#BBBBBBBBBBBB#.',
    '#BBBBBBBBBBBBBB#',
    '#SSSBBBBBBBBSSS#',
    '#EEPBBBBBBBBPEE#',
    '#BBBBBYYYYBBBBB#',
    'S#BBBBBBBBBBBB#S',
    'SS#BBLLLLLLBB#SS',
    'SSS#LLLLLLLL#SSS',
    '.SS#LLLLLLLL#SS.',
    '..#BBBBBBBBBB#..',
    '..#BBBBBBBBBB#..',
    '...##BB##BB##...',
    '................',
  ],
}

/** Chuông lớn, vành chạm và mũ miện. */
export const BELL_GRAND: Sprite = {
  palette: { '#': '#3b2a6b', B: '#a78bfa', S: '#7c5cd6', L: '#e9defd', E: '#ffffff', P: '#241a44', Y: '#ffd447' },
  rows: [
    '................',
    '....Y..YY..Y....',
    '....YYYYYYYY....',
    '...##########...',
    '..##BBBBBBBB##..',
    '.#BBBBBBBBBBBB#.',
    '#BBBBBBBBBBBBBB#',
    '#BBEEPBBBBPEEBB#',
    '#BBBBBBBBBBBBBB#',
    '#BBBBBBBBBBBBBB#',
    '#BBBBBBBBBBBBBB#',
    '#SSSSSSSSSSSSSS#',
    '#LLLLLLLLLLLLLL#',
    '################',
    '......YYYY......',
    '.......YY.......',
  ],
}

// --- Hai nấc tiến hoá trên -------------------------------------------------------
//
// Nấc 1 (cấp 5) là con thú lớn lên: thêm sừng, thêm mũ, thân bệ vệ hơn. Hai nấc
// trên đi tiếp theo đúng hướng đó, và mỗi nấc phải NHÌN RA NGAY từ xa - nếu phải
// soi mới thấy khác thì cái mốc cấp 20 không đáng để trẻ đi tới.
//
// Cách phân biệt là DIỆN TÍCH SILHOUETTE, không phải chi tiết: nấc 2 thân chiếm
// gần trọn khung, nấc 3 thêm hào quang (ký tự Y) toả kín mép khung. Trên một ô
// 16×16 phóng to bằng CSS, chi tiết nhỏ biến mất còn khối lớn thì không.
//
// Vẫn dùng đúng bảng ký tự cũ (B thân, S phần tối, # viền) để `recolor` theo
// nguyên tố còn tô được. Riêng Y giữ nguyên vàng ở mọi hệ - đó là ánh hào quang,
// cố ý không nhuộm theo môn học.

/** Slime khổng lồ, vương miện hai tầng. */
export const SLIME_TITAN: Sprite = {
  palette: { '#': '#14481f', B: '#6fe98a', S: '#3aa855', L: '#d6ffdc', E: '#ffffff', P: '#0d2414', Y: '#ffd447' },
  rows: [
    '..Y.Y.YYYY.Y.Y..',
    '.YYYYYYYYYYYYYY.',
    '.##############.',
    '################',
    '#BBBBBBBBBBBBBB#',
    '#BSSSBBBBBBSSSB#',
    '#BEEPBBBBBBPEEB#',
    '#BEEPBBBBBBPEEB#',
    '#BBBBBBBBBBBBBB#',
    '#BBBBSSSSSSBBBB#',
    '#BBBBBBBBBBBBBB#',
    '#BBBBBBBBBBBBBB#',
    '#BLLLLLLLLLLLLB#',
    '#LLLLLLLLLLLLLL#',
    '.##############.',
    '..Y..Y....Y..Y..',
  ],
}

/** Slime hoá thần: hào quang phủ kín khung. */
export const SLIME_AVATAR: Sprite = {
  palette: { '#': '#0e3618', B: '#8bffa4', S: '#3aa855', L: '#eaffee', E: '#ffffff', P: '#08190d', Y: '#ffe66d' },
  rows: [
    'Y.Y.YYYYYYYY.Y.Y',
    'YYYYYYYYYYYYYYYY',
    'Y##############Y',
    'Y##BBBBBBBBBB##Y',
    '#BBBBBBBBBBBBBB#',
    '#BSSSBBBBBBSSSB#',
    '#BEEPBBBBBBPEEB#',
    '#BEEPBBBBBBPEEB#',
    'Y#BBBBBBBBBBBB#Y',
    'Y#BBBSSSSSSBBB#Y',
    '#BBBBBBBBBBBBBB#',
    '#BBBBBBBBBBBBBB#',
    '#BLLLLLLLLLLLLB#',
    '#LLLLLLLLLLLLLL#',
    'Y##############Y',
    '.Y.Y.YYYYYY.Y.Y.',
  ],
}

/** Cú tiên tri: sừng dài, vòng nguyệt quế trên đầu. */
export const OWL_ORACLE: Sprite = {
  palette: { '#': '#33200f', B: '#bf8a56', S: '#7d5533', L: '#f2dcba', E: '#ffffff', P: '#150d06', Y: '#ffc94d' },
  rows: [
    '.##.YYYYYYYY.##.',
    '#BB#YY####YY#BB#',
    '#BBB########BBB#',
    '#BBBBBBBBBBBBBB#',
    '#BSSSSS##SSSSSB#',
    '#B#EEPEEEEPEE#B#',
    '#B#EEPEEEEPEE#B#',
    '#BBBBBYYYYBBBBB#',
    '#BBBBBBYYBBBBBB#',
    '#BBBBLLLLLLBBBB#',
    '#BBBLLLLLLLLBBB#',
    '#BBBLLLLLLLLBBB#',
    '#BBBBLLLLLLBBBB#',
    '.#BBBBBBBBBBBB#.',
    '..Y#BBBBBBBB#Y..',
    '....Y#....#Y....',
  ],
}

/** Cú thiên sứ: hào quang toả kín, sừng vàng. */
export const OWL_ARCHON: Sprite = {
  palette: { '#': '#2a1a0b', B: '#d9a26a', S: '#7d5533', L: '#fff0d8', E: '#ffffff', P: '#120a04', Y: '#ffe07a' },
  rows: [
    'Y##YYYYYYYYYY##Y',
    '#BB#YY####YY#BB#',
    '#BBB########BBB#',
    '#BBBBBBBBBBBBBB#',
    '#BSSSSS##SSSSSB#',
    '#B#EEPEEEEPEE#B#',
    '#B#EEPEEEEPEE#B#',
    '#BBBBBYYYYBBBBB#',
    'Y#BBBBBYYBBBBB#Y',
    'Y#BBBLLLLLLBBB#Y',
    '#BBBLLLLLLLLBBB#',
    '#BBBLLLLLLLLBBB#',
    '#BBBBLLLLLLBBBB#',
    'Y#BBBBBBBBBBBB#Y',
    'YY#BBBBBBBBBB#YY',
    '.YY#YY####YY#YY.',
  ],
}

/** Chuông thánh đường: vành kép, tháp nhọn. */
export const BELL_CATHEDRAL: Sprite = {
  palette: { '#': '#33245e', B: '#b79dfb', S: '#7c5cd6', L: '#efe7ff', E: '#ffffff', P: '#1d1538', Y: '#ffd447' },
  rows: [
    '...Y...YY...Y...',
    '...YY.YYYY.YY...',
    '...YYYY##YYYY...',
    '..YYYY####YYYY..',
    '..##BBBBBBBB##..',
    '.##BBBBBBBBBB##.',
    '.#BBBBBBBBBBBB#.',
    '#BBBSSSSSSSSBBB#',
    '#BBBBBBBBBBBBBB#',
    '#BBEPBBBBBBPEBB#',
    '#BBBBBBBBBBBBBB#',
    '#BBBBBBBBBBBBBB#',
    '#BLLLLLLLLLLLLB#',
    '################',
    'YYYYYYYYYYYYYYYY',
    '..YY#YY..YY#YY..',
  ],
}

/** Chuông vĩnh hằng: tiếng ngân thành vòng sáng quanh thân. */
export const BELL_ETERNAL: Sprite = {
  palette: { '#': '#281b4d', B: '#cdb8ff', S: '#7c5cd6', L: '#f8f4ff', E: '#ffffff', P: '#150f2b', Y: '#ffe66d' },
  rows: [
    'Y..Y...YY...Y..Y',
    'YY.YY.YYYY.YY.YY',
    'YYYYYYY##YYYYYYY',
    'YYYYYY####YYYYYY',
    'YY##BBBBBBBB##YY',
    'Y##BBBBBBBBBB##Y',
    'Y#BBBBBBBBBBBB#Y',
    '#BBBSSSSSSSSBBB#',
    '#BBBBBBBBBBBBBB#',
    '#BBEPBBBBBBPEBB#',
    '#BBBBBBBBBBBBBB#',
    '#BBBBBBBBBBBBBB#',
    '#BLLLLLLLLLLLLB#',
    '################',
    'YYYYYYYYYYYYYYYY',
    'YYYY#YY..YY#YYYY',
  ],
}

/** Cáo huyền bí: đuôi xoè rộng hơn, mõm sắc. */
export const FOX_MYSTIC: Sprite = {
  palette: { '#': '#6b3310', B: '#ffab63', S: '#d16a22', L: '#ffeacf', E: '#ffffff', P: '#241105', Y: '#ffd447' },
  rows: [
    '.##..........##.',
    '#BB#........#BB#',
    '#BBB#......#BBB#',
    '#BSBB#....#BBSB#',
    '#BBBB######BBBB#',
    '#BBBBBBBBBBBBBB#',
    '#SSSBBBBBBBBSSS#',
    '#EEPBBBBBBBBPEE#',
    'Y#BBBBBBBBBBBB#Y',
    'YY#BBBBBBBBBB#YY',
    'YYY#BBBBBBBB#YYY',
    'YYY#BBLLLLBB#YYY',
    '.YY#BLLLLLLB#YY.',
    '..Y#BLLLLLLB#Y..',
    '..Y#BLLLLLLB#Y..',
    '...Y#YPPPPY#Y...',
  ],
}

/** Cáo thiên giới: chín đuôi thành vòng lửa vàng. */
export const FOX_CELESTIAL: Sprite = {
  palette: { '#': '#5c2a0c', B: '#ffc089', S: '#d16a22', L: '#fff3e3', E: '#ffffff', P: '#1d0d04', Y: '#ffe66d' },
  rows: [
    'Y##.YYYYYYYY.##Y',
    'Y#BB#YY##YY#BB#Y',
    'Y#BBB#YYYY#BBB#Y',
    '#BSBB#YYYY#BBSB#',
    '#BBBB######BBBB#',
    '#BBBBBBBBBBBBBB#',
    '#SSSBBBBBBBBSSS#',
    '#EEPBBBBBBBBPEE#',
    'Y#BBBBBBBBBBBB#Y',
    'YY#BBBBBBBBBB#YY',
    'YYY#BBBBBBBB#YYY',
    'YYY#BBLLLLBB#YYY',
    'YYY#BLLLLLLB#YYY',
    '.YY#BLLLLLLB#YY.',
    '..Y#BLLLLLLB#Y..',
    '...Y#YPPPPY#Y...',
  ],
}

/** Gấu trấn thủ: vai rộng, đai vàng ngang ngực. */
export const PANDA_WARDEN: Sprite = {
  palette: { '#': '#17171a', B: '#fbfaf8', S: '#2b2b2f', L: '#ffffff', E: '#ffffff', P: '#17171a', Y: '#ffd447' },
  rows: [
    '.##..........##.',
    '#BB#........#BB#',
    '#BBB#YYYYYY#BBB#',
    '#BBBB######BBBB#',
    '#BBBBBBBBBBBBBB#',
    '#BSSSBBBBBBSSSB#',
    '#BSEPSBBBBSPESB#',
    '#BSSSBBYYBBSSSB#',
    '#BBBBBBYYBBBBBB#',
    '#BBBBLLLLLLBBBB#',
    '#BBBLLLLLLLLBBB#',
    '#BBBLLLLLLLLBBB#',
    '#BBBBLLLLLLBBBB#',
    '.#BBBBBBBBBBBB#.',
    '.#SS#BBBBBB#SS#.',
    '..##........##..',
  ],
}

/** Gấu khổng lồ: hào quang sau lưng, đai vàng kín thân. */
export const PANDA_COLOSSUS: Sprite = {
  palette: { '#': '#101012', B: '#ffffff', S: '#2b2b2f', L: '#ffffff', E: '#ffffff', P: '#101012', Y: '#ffe66d' },
  rows: [
    'Y##YYYYYYYYYY##Y',
    '#BB#YY####YY#BB#',
    '#BBB#YYYYYY#BBB#',
    '#BBBB######BBBB#',
    '#BBBBBBBBBBBBBB#',
    '#BSSSBBBBBBSSSB#',
    '#BSEPSBBBBSPESB#',
    '#BSSSBBYYBBSSSB#',
    'Y#BBBBBYYBBBBB#Y',
    'Y#BBBLLLLLLBBB#Y',
    '#BBBLLLLLLLLBBB#',
    '#BBBLLLLLLLLBBB#',
    '#BBBBLLLLLLBBBB#',
    'Y#BBBBBBBBBBBB#Y',
    '.#SS#BBBBBB#SS#.',
    '..##.YYYYYY.##..',
  ],
}

/** Rồng đế vương: mào gai, vuốt vàng. */
export const DRAGON_SOVEREIGN: Sprite = {
  palette: { '#': '#123a4d', B: '#67d6e8', S: '#3a9ac6', L: '#dcf7ff', E: '#ffffff', P: '#0a1f2b', Y: '#ffd447' },
  rows: [
    '..Y..........Y..',
    '..Y.YYYYYYYY.Y..',
    '..############..',
    '.##BBBBBBBBBB##.',
    '#BBBBBBBBBBBBBB#',
    '#BSSBBBBBBBBSSB#',
    '#BEPBBBBBBBBPEB#',
    '#BBBBBYYYYBBBBB#',
    '#BBBBBB##BBBBBB#',
    '#BBBBBBBBBBBBBB#',
    'Y#BBBLLLLLLBBB#Y',
    'YY#BLLLLLLLLB#YY',
    'YYY#LLLLLLLL#YYY',
    '.YY#BBBBBBBB#YY.',
    '..Y##BB##BB##Y..',
    '....##....##....',
  ],
}

/** Rồng thiên giới: hào quang phủ kín, mào vàng rực. */
export const DRAGON_CELESTIAL: Sprite = {
  palette: { '#': '#0d2c3b', B: '#8ae6f5', S: '#3a9ac6', L: '#edfcff', E: '#ffffff', P: '#06161e', Y: '#ffe66d' },
  rows: [
    'Y.Y.YYYYYYYY.Y.Y',
    'YYY#YYYYYYYY#YYY',
    'YY############YY',
    'Y##BBBBBBBBBB##Y',
    '#BBBBBBBBBBBBBB#',
    '#BSSBBBBBBBBSSB#',
    '#BEPBBBBBBBBPEB#',
    '#BBBBBYYYYBBBBB#',
    'Y#BBBBB##BBBBB#Y',
    'Y#BBBBBBBBBBBB#Y',
    'Y#BBBLLLLLLBBB#Y',
    'YY#BLLLLLLLLB#YY',
    'YYY#LLLLLLLL#YYY',
    'YYY#BBBBBBBB#YYY',
    '.YY##BB##BB##YY.',
    '..Y.##....##.Y..',
  ],
}

// --- Bầy quái của từng môn ------------------------------------------------------
//
// Mỗi môn có BỐN con quái khác hình hẳn nhau, đúng theo bốn cái tên trong
// `content/bestiary.ts`. Trước đây cả bốn dùng chung một hình chỉ đổi bảng màu -
// đó là mẹo tiết kiệm bộ nhớ của máy điện tử ngày xưa, nhưng ta không thiếu bộ
// nhớ, mà trẻ thì đọc tên "Rô-bốt Cộng Trừ" rồi nhìn thấy đúng con slime lúc nãy.

/** Nhện Phép Tính: tám chân, bốn mắt - môn Toán. */
export const SPIDER: Sprite = {
  palette: { '#': '#2a1836', B: '#7b4fa8', S: '#5a3480', E: '#ffffff', P: '#1a0f22' },
  rows: [
    '................',
    '.#............#.',
    '..#..######..#..',
    '...##BBBBBB##...',
    '.#.#BBBBBBBB#.#.',
    '..##BEPBBEPB##..',
    '.#.#BEPBBEPB#.#.',
    '..##BBBBBBBB##..',
    '.#.##BBBBBB##.#.',
    '..#.#BBBBBB#.#..',
    '.#...#BBBB#...#.',
    '......######....',
    '.....#SSSSSS#...',
    '.....#SSSSSS#...',
    '......######....',
    '................',
  ],
}

/** Gấu Đếm Ngược: to, chậm, hai tai tròn - môn Toán. */
export const BEAR: Sprite = {
  palette: { '#': '#3d2414', B: '#a9703f', S: '#6f4526', L: '#f2d3a8', E: '#ffffff', P: '#1a0f08' },
  rows: [
    '................',
    '...##......##...',
    '..#BB#....#BB#..',
    '..#BBB####BBB#..',
    '...#BBBBBBBB#...',
    '..#BBBBBBBBBB#..',
    '..#BEPBBBBEPB#..',
    '..#BEPBBBBEPB#..',
    '..#BBBB##BBBB#..',
    '..#BBB#LL#BBB#..',
    '...#BB#LL#BB#...',
    '....##BBBB##....',
    '...#BBBBBBBB#...',
    '..#BBBBBBBBBB#..',
    '..#SS#....#SS#..',
    '...##......##...',
  ],
}

/** Rô-bốt Cộng Trừ: đầu vuông, ăng-ten, dấu cộng trước ngực - môn Toán. */
export const ROBOT: Sprite = {
  palette: { '#': '#20262e', B: '#9fb3c8', S: '#6b7f94', E: '#c8f7ff', P: '#0d2a3a' },
  rows: [
    '.......##.......',
    '......#BB#......',
    '..############..',
    '..#BBBBBBBBBB#..',
    '..#BEPEBBEPEB#..',
    '..#BBBBBBBBBB#..',
    '..#B#BBBBBB#B#..',
    '..############..',
    '....########....',
    '...#SSSSSSSS#...',
    '...#SSS##SSS#...',
    '...#S######S#...',
    '...#SSS##SSS#...',
    '...#SSSSSSSS#...',
    '...##########...',
    '...##......##...',
  ],
}

/** Mực Lem Luốc: đầu tròn, tua rua lòng thòng, nhỏ mực - môn Tiếng Việt. */
export const SQUID: Sprite = {
  palette: { '#': '#1b2a4a', B: '#5a7fc4', S: '#34517f', E: '#ffffff', P: '#101a2e' },
  rows: [
    '................',
    '.....######.....',
    '...##BBBBBB##...',
    '..#BBBBBBBBBB#..',
    '..#BBBBBBBBBB#..',
    '..#BEPBBBBEPB#..',
    '..#BEPBBBBEPB#..',
    '..#BBBBBBBBBB#..',
    '..#BBBSSSSBBB#..',
    '...##BBBBBB##...',
    '..#B#.#BB#.#B#..',
    '..#B#.#BB#.#B#..',
    '..#B#..#B#..#B#.',
    '...#....#B#.....',
    '.........#......',
    '................',
  ],
}

/** Vẹt Nói Nhịu: mỏ vàng bè, cánh xoè - môn Tiếng Việt. */
export const PARROT: Sprite = {
  palette: { '#': '#14401f', B: '#3fbf5e', S: '#1f8038', L: '#bff2c8', Y: '#f5c43a', E: '#ffffff', P: '#0a1f10' },
  rows: [
    '................',
    '......####......',
    '....##BBBB##....',
    '...#BBBBBBBB#...',
    '...#BEPBBEPB#...',
    '...#BBYYYYBB#...',
    '...#BBYYYYBB#...',
    '...##BBBBBB##...',
    '..#BBBBBBBBBB#..',
    '.#BBSSBBBBSSBB#.',
    '.#BBSSBBBBSSBB#.',
    '..#BBBBBBBBBB#..',
    '...##BBBBBB##...',
    '.....#LLLL#.....',
    '......#LL#......',
    '.......##.......',
  ],
}

/** Sách Cũ Biết Bay: bìa mở, hai mép giấy vỗ như cánh - môn Tiếng Việt. */
export const BOOK: Sprite = {
  palette: { '#': '#4a2d12', B: '#c9903f', S: '#f5ead2', L: '#fffaf0', E: '#ffffff', P: '#2a1a08' },
  rows: [
    '................',
    '..############..',
    '.#LBBBBBBBBBBL#.',
    '.#LBEPBBBBEPBL#.',
    '.#LBEPBBBBEPBL#.',
    '.#LBBBBBBBBBBL#.',
    '.#LBBB#SS#BBBL#.',
    '..#BBBB##BBBB#..',
    '..#BBBBBBBBBB#..',
    '..#SSSSSSSSSS#..',
    '..#SSSSSSSSSS#..',
    '..############..',
    '...##########...',
    '....########....',
    '................',
    '................',
  ],
}

/** Trống Ương Bướng: thùng trống căng dây chằng - môn Âm nhạc. */
export const DRUM: Sprite = {
  palette: { '#': '#4a1d10', B: '#c0452c', S: '#f0d9a8', L: '#e8c98a', E: '#ffffff', P: '#2a0f08' },
  rows: [
    '................',
    '...##########...',
    '..#LLLLLLLLLL#..',
    '.#LLLLLLLLLLLL#.',
    '.#BBBBBBBBBBBB#.',
    '.#BEPBBBBBBEPB#.',
    '.#BEPBBBBBBEPB#.',
    '.#BBBBBBBBBBBB#.',
    '.#SBBSSBBSSBBS#.',
    '.#BSSBBSSBBSSB#.',
    '.#SBBSSBBSSBBS#.',
    '.#BBBBBBBBBBBB#.',
    '.#LLLLLLLLLLLL#.',
    '..#LLLLLLLLLL#..',
    '...##########...',
    '................',
  ],
}

/** Sáo Ma Mãnh: ống dài, ba lỗ bấm, dựng đứng lên - môn Âm nhạc. */
export const FLUTE: Sprite = {
  palette: { '#': '#2e2416', B: '#cbb072', S: '#8f7540', L: '#f2e4bd', E: '#ffffff', P: '#1a1408' },
  rows: [
    '....########....',
    '...#BBBBBBBB#...',
    '...#BEPBBEPB#...',
    '...#BEPBBEPB#...',
    '...#BBBBBBBB#...',
    '...#BB#BB#BB#...',
    '...#BBBBBBBB#...',
    '...#BB#BB#BB#...',
    '...#BBBBBBBB#...',
    '...#BB#BB#BB#...',
    '...#BBBBBBBB#...',
    '...#SSSSSSSS#...',
    '...#SSSSSSSS#...',
    '....########....',
    '.....#LLLL#.....',
    '......####......',
  ],
}

/** Mèo Hát Sai Tông: tai nhọn, ria dài, mồm há tướng - môn Âm nhạc. */
export const CAT: Sprite = {
  palette: { '#': '#3a2a1a', B: '#d9b06a', S: '#8f6a38', Y: '#e8697a', E: '#ffffff', P: '#1a1008' },
  rows: [
    '................',
    '..##........##..',
    '..#B#......#B#..',
    '..#BB######BB#..',
    '..#BBBBBBBBBB#..',
    '.#BBBBBBBBBBBB#.',
    '.#BEPBBBBBBEPB#.',
    '.#BEPBBBBBBEPB#.',
    '.#BBBBBYYBBBBB#.',
    '.#BBSBBSSBBSBB#.',
    '.#BBBBB##BBBBB#.',
    '..#BBBBBBBBBB#..',
    '...##BBBBBB##...',
    '.....######.....',
    '....##....##....',
    '................',
  ],
}

/** Quỷ Lười Biếng: hai sừng, cái mồm ngáp dài - môn Đạo đức. */
export const IMP: Sprite = {
  palette: { '#': '#2e1030', B: '#a34fb0', S: '#6b2a76', L: '#ffd9e8', E: '#ffffff', P: '#1a0820' },
  rows: [
    '................',
    '..#..........#..',
    '..##........##..',
    '...##BBBBBB##...',
    '..#BBBBBBBBBB#..',
    '.#BBBBBBBBBBBB#.',
    '.#BEPBBBBBBEPB#.',
    '.#BBBBBBBBBBBB#.',
    '.#BBB######BBB#.',
    '.#BBB#LLLL#BBB#.',
    '..#BB######BB#..',
    '..#BBBBBBBBBB#..',
    '...#SSSSSSSS#...',
    '...#SS#..#SS#...',
    '...##.....##....',
    '................',
  ],
}

/** Sương Ích Kỷ: một đám mù dày, chỉ ló ra đôi mắt - môn Đạo đức. */
export const FOG: Sprite = {
  palette: { '#': '#4a5560', L: '#c4ced8', S: '#8d9aa8', E: '#ffffff', P: '#2a3038' },
  rows: [
    '................',
    '....######......',
    '..##LLLLLL####..',
    '.#LLLLLLLLLLLL#.',
    '#LLLLLLLLLLLLLL#',
    '#LLEPLLLLLLEPLL#',
    '#LLEPLLLLLLEPLL#',
    '#LLLLLLLLLLLLLL#',
    '#LLLLLSSSSLLLLL#',
    '.#LLLLLLLLLLLL#.',
    '.#LLLLLLLLLLLL#.',
    '..############..',
    '...#LL#..#LL#...',
    '....##....##....',
    '................',
    '................',
  ],
}

/** Bóng Tối Dối Trá: trùm kín đầu, chỉ thấy mắt trong khe mũ - môn Đạo đức. */
export const LIAR: Sprite = {
  palette: { '#': '#12101c', B: '#3a3352', S: '#1d1a2c', E: '#ffe066', P: '#12101c' },
  rows: [
    '................',
    '.....######.....',
    '...##BBBBBB##...',
    '..#BBBBBBBBBB#..',
    '.#BBBBBBBBBBBB#.',
    '.#BB########BB#.',
    '.#B#EPSSSSEP#B#.',
    '.#B#SSSSSSSS#B#.',
    '.#BB########BB#.',
    '.#BBBBBBBBBBBB#.',
    '#BBBBBBBBBBBBBB#',
    '#BBBBSSSSSSBBBB#',
    '#BBBBBBBBBBBBBB#',
    '.##BBBBBBBBBB##.',
    '...##########...',
    '................',
  ],
}

// --- Bốn con trùm ---------------------------------------------------------------
//
// Trùm có hình RIÊNG, không phải quái thường tô đỏ. Con trùm là cái hẹn ở cuối
// vùng đất: trẻ nhìn thấy nó đứng giữa sân đấu suốt cả chặng đường đi tới, nên
// nó phải đáng để đi tới.

/** Rồng Số Học: sừng cong, hàm răng vàng - trùm môn Toán. */
export const NUMBER_DRAGON: Sprite = {
  palette: { '#': '#2a1010', B: '#c43a3a', S: '#7d1f1f', Y: '#f5d76e', E: '#ffffff', P: '#1a0808' },
  rows: [
    '..#..........#..',
    '..##........##..',
    '...##BBBBBB##...',
    '..#BBBBBBBBBB#..',
    '.#BBBBBBBBBBBB#.',
    '#BBEPBBBBBBEPBB#',
    '#BBEPBBBBBBEPBB#',
    '#BBBBBBBBBBBBBB#',
    '#BB#YYYYYYYY#BB#',
    '.#B#YY#YY#YY#B#.',
    '.#BB########BB#.',
    '..#BBBBBBBBBB#..',
    '..#SSSSSSSSSS#..',
    '...##SSSSSS##...',
    '.....######.....',
    '....##....##....',
  ],
}

/** Phượng Hoàng Ngôn Từ: mào lửa, hai cánh xoè rộng - trùm môn Tiếng Việt. */
export const WORD_PHOENIX: Sprite = {
  palette: { '#': '#4a1a08', B: '#e8743a', S: '#a83c14', L: '#f5c246', Y: '#fff0b8', E: '#ffffff', P: '#2a0f04' },
  rows: [
    '.......##.......',
    '......#YY#......',
    '.....##BB##.....',
    '#...#BBBBBB#...#',
    '##.#BEPBBEPB#.##',
    '#L##BBBBBBBB##L#',
    '#LL#BBYYYYBB#LL#',
    '#LLL#BBBBBB#LLL#',
    '.#LLL#BBBB#LLL#.',
    '..#LL#BBBB#LL#..',
    '...##BBBBBB##...',
    '....#SSSSSS#....',
    '....#SS##SS#....',
    '.....#S##S#.....',
    '.....##..##.....',
    '....##....##....',
  ],
}

/** Long Vương Thanh Âm: thân chuông đồng, quả lắc vàng - trùm môn Âm nhạc. */
export const SOUND_KING: Sprite = {
  palette: { '#': '#2a2410', B: '#4fa8c4', S: '#26647d', L: '#bfe8f5', Y: '#f5d76e', E: '#ffffff', P: '#101a20' },
  rows: [
    '.......##.......',
    '......#YY#......',
    '....##YYYY##....',
    '...#BBBBBBBB#...',
    '..#BBBBBBBBBB#..',
    '.#BBEPBBBBEPBB#.',
    '.#BBEPBBBBEPBB#.',
    '#BBBBBBBBBBBBBB#',
    '#BBBB#SSSS#BBBB#',
    '#BBBB#SSSS#BBBB#',
    '#BBBBBBBBBBBBBB#',
    '#LLLLLLLLLLLLLL#',
    '################',
    '.....#YYYY#.....',
    '......#YY#......',
    '.......##.......',
  ],
}

/** Chúa Tể Bóng Đêm: sừng cong, mắt vàng cháy trong khe mũ - trùm môn Đạo đức. */
export const DARK_LORD: Sprite = {
  palette: { '#': '#0d0a14', B: '#2e2844', S: '#161327', Y: '#8f5fd9', E: '#ffe066', P: '#0d0a14' },
  rows: [
    '..##........##..',
    '..#B#......#B#..',
    '..#BB######BB#..',
    '.#BBBBBBBBBBBB#.',
    '#BBBBBBBBBBBBBB#',
    '#BB##########BB#',
    '#B#EPSSSSSSEP#B#',
    '#B#SSSSSSSSSS#B#',
    '#BB##########BB#',
    '#BBBBBBBBBBBBBB#',
    '#BBBB#YYYY#BBBB#',
    '#BBBB#YYYY#BBBB#',
    '#BBBBBBBBBBBBBB#',
    '.#BBBBBBBBBBBB#.',
    '..############..',
    '...##......##...',
  ],
}

/**
 * Bốn con quái của mỗi môn, XẾP ĐÚNG THỨ TỰ tên trong `content/bestiary.ts`.
 *
 * Thứ tự là hợp đồng giữa hai file: `Enemy.variant` là chỉ số trong mảng này,
 * nên tên con quái và hình con quái luôn khớp nhau. Đổi thứ tự ở một bên mà quên
 * bên kia là trẻ đọc "Gấu Đếm Ngược" rồi nhìn thấy con nhện.
 */
export const MONSTER_FAMILY: Record<Subject, readonly Sprite[]> = {
  math: [SLIME, SPIDER, BEAR, ROBOT],
  vietnamese: [OWL, SQUID, PARROT, BOOK],
  music: [BELL, DRUM, FLUTE, CAT],
  ethics: [SHADOW, IMP, FOG, LIAR],
}

/** Trùm cuối của mỗi vùng đất. Một hình riêng, không phải quái thường tô đỏ. */
export const BOSS_SPRITE: Record<Subject, Sprite> = {
  math: NUMBER_DRAGON,
  vietnamese: WORD_PHOENIX,
  music: SOUND_KING,
  ethics: DARK_LORD,
}

/**
 * Hình của một con quái. Dùng chung cho cả bản đồ đi cảnh lẫn khung trận đấu, để
 * con trẻ thấy trên đường đi đúng là con bước vào trận.
 */
/**
 * Bảng màu của trùm trong Tháp Trí Tuệ: thân xám đá, viền đen, điểm nhấn vàng.
 *
 * Cố ý tô lại hình TRÙM của chính môn đó chứ không vẽ bốn con mới. Bốn con trong
 * tháp là cùng một loài với trùm vùng đất, chỉ ở một bậc khác - "Rồng Số Học" và
 * "Đại Toán Sư Vô Cực" phải nhìn ra họ hàng với nhau thì cái bậc ấy mới có nghĩa.
 * Vẽ bốn con lạ hoắc thì chúng chỉ là bốn con quái nữa.
 */
const TOWER_TINT: Record<string, string> = {
  B: '#b9c2d6',
  S: '#6d7690',
  '#': '#15161f',
  Y: '#ffd447',
}

/** Hình con trùm trong tháp: hình trùm của môn đó, tô lại thành tượng đá dát vàng. */
export function towerSpriteFor(subject: Subject): Sprite {
  return recolor(BOSS_SPRITE[subject], TOWER_TINT)
}

export function monsterSpriteFor(subject: Subject, variant: number, isBoss: boolean): Sprite {
  if (isBoss) return BOSS_SPRITE[subject]
  const family = MONSTER_FAMILY[subject]
  return family[((variant % family.length) + family.length) % family.length] ?? family[0]!
}

export const ALL_SPRITES: Record<string, Sprite> = {
  fox: FOX,
  panda: PANDA,
  dragon: DRAGON,
  slime: SLIME,
  owl: OWL,
  bell: BELL,
  shadow: SHADOW,
  spider: SPIDER,
  bear: BEAR,
  robot: ROBOT,
  squid: SQUID,
  parrot: PARROT,
  book: BOOK,
  drum: DRUM,
  flute: FLUTE,
  cat: CAT,
  imp: IMP,
  fog: FOG,
  liar: LIAR,
  'number-dragon': NUMBER_DRAGON,
  'word-phoenix': WORD_PHOENIX,
  'sound-king': SOUND_KING,
  'dark-lord': DARK_LORD,
  'slime-king': SLIME_KING,
  'fox-elder': FOX_ELDER,
  'owl-sage': OWL_SAGE,
  'panda-guardian': PANDA_GUARDIAN,
  'dragon-elder': DRAGON_ELDER,
  'bell-grand': BELL_GRAND,
  'slime-titan': SLIME_TITAN,
  'slime-avatar': SLIME_AVATAR,
  'owl-oracle': OWL_ORACLE,
  'owl-archon': OWL_ARCHON,
  'bell-cathedral': BELL_CATHEDRAL,
  'bell-eternal': BELL_ETERNAL,
  'fox-mystic': FOX_MYSTIC,
  'fox-celestial': FOX_CELESTIAL,
  'panda-warden': PANDA_WARDEN,
  'panda-colossus': PANDA_COLOSSUS,
  'dragon-sovereign': DRAGON_SOVEREIGN,
  'dragon-celestial': DRAGON_CELESTIAL,
}

// --- Tô lại bảng màu -------------------------------------------------------------

/**
 * Đổi bảng màu của một hình có sẵn.
 *
 * Đây là mẹo quen thuộc của game thời đó: máy không đủ bộ nhớ chứa hàng chục
 * hình nên cùng một hình được tô lại thành con khác. Quái thì KHÔNG còn dùng mẹo
 * này nữa - mỗi con một hình riêng, xem `MONSTER_FAMILY` - nhưng thú cưng vẫn
 * dùng: cùng một con thú mang hệ Toán hay hệ Nhạc chỉ khác nhau ở tông màu, và
 * ở đó việc tô lại là ĐÚNG ý chứ không phải đi tắt.
 */
export function recolor(sprite: Sprite, overrides: Record<string, string>): Sprite {
  return { rows: sprite.rows, palette: { ...sprite.palette, ...overrides } }
}

// --- Sprite theo hướng đi --------------------------------------------------------

/**
 * Mỗi nhân vật có ba góc nhìn: mặt trước (đi xuống), mặt sau (đi lên) và mặt
 * nghiêng (đi ngang, lật gương cho hướng còn lại).
 *
 * Ba là con số tối thiểu để việc đi lại đọc ra được. Bốn góc thì phải vẽ thêm
 * một bộ nữa mà mắt gần như không phân biệt được trái với phải ở khổ 16×16, nên
 * lật gương là đủ - đúng cách game thời đó vẫn làm để tiết kiệm bộ nhớ.
 */
export interface CreatureViews {
  down: Sprite
  up: Sprite
  side: Sprite
}

/** Cáo nhìn từ sau: thấy gáy và hai tai, không có mặt. */
const FOX_BACK: Sprite = {
  palette: FOX.palette,
  rows: [
    '................',
    '..#..........#..',
    '.#S#........#S#.',
    '.#SS#......#SS#.',
    '.#SSS######SSS#.',
    '.#BBBBBBBBBBBB#.',
    '#BBBBBBBBBBBBBB#',
    '#BBBBBBBBBBBBBB#',
    '#BBBBBBSSBBBBBB#',
    '#BBBBBSSSSBBBBB#',
    '#BBBBBSSSSBBBBB#',
    '.#BBBBSSSSBBBB#.',
    '.#BBBBBSSBBBBB#.',
    '..#BBBBBBBBBB#..',
    '...YY#BB#YY#....',
    '....##....##....',
  ],
}

/** Cáo nhìn nghiêng: một tai, một mắt, mõm nhô ra phía trước. */
const FOX_SIDE: Sprite = {
  palette: FOX.palette,
  rows: [
    '................',
    '.....#......#...',
    '....#B#....#B#..',
    '....#BB####BB#..',
    '...#BBBBBBBBB#..',
    '..#BBBBBBBBBB#..',
    '.#BBBBBBBBBBB#..',
    '#LLBBEPBBBBBB#..',
    '#LLBBEPBBBBBB#..',
    '#LLLBBBBBBBBB#..',
    '.#LLLBBBBBBBB#..',
    '.#LLLBBBBBBBB#..',
    '..#LLBBBBBBB#...',
    '...#BBBBBBB#....',
    '....YY##YY#.....',
    '.....##.##......',
  ],
}

const PANDA_BACK: Sprite = {
  palette: PANDA.palette,
  rows: [
    '................',
    '..##........##..',
    '.#SS#......#SS#.',
    '.#SSS######SSS#.',
    '.#BBBBBBBBBBBB#.',
    '#BBBBBBBBBBBBBB#',
    '#BBBBBBBBBBBBBB#',
    '#BBBBBSSSSBBBBB#',
    '#BBBBSSSSSSBBBB#',
    '#BBBBSSSSSSBBBB#',
    '#BBBBSSSSSSBBBB#',
    '.#BBBBSSSSBBBB#.',
    '.#SBBBBBBBBBBS#.',
    '..#SBBBBBBBBS#..',
    '...##SS##SS##...',
    '................',
  ],
}

const PANDA_SIDE: Sprite = {
  palette: PANDA.palette,
  rows: [
    '................',
    '....##.....##...',
    '...#SS#...#SS#..',
    '...#SSS###SSS#..',
    '..#BBBBBBBBBB#..',
    '.#BBBBBBBBBBB#..',
    '#BBBSSSBBBBBB#..',
    '#BBSEPSBBBBBBB#.',
    '#BBSSSSBBBBBBB#.',
    '#BBBBBBBBBBBBB#.',
    '.#BBBBBBBBBBB#..',
    '.#BBBBBBBBBBB#..',
    '..#SBBBBBBBS#...',
    '...#BBBBBBB#....',
    '....SS##SS#.....',
    '.....##.##......',
  ],
}

const DRAGON_BACK: Sprite = {
  palette: DRAGON.palette,
  rows: [
    '................',
    '....Y......Y....',
    '...#Y#....#Y#...',
    '...#SS####SS#...',
    '..#BBBBBBBBBB#..',
    '.#BBBBBBBBBBBB#.',
    '#BBBBBBBBBBBBBB#',
    '#BBBBBSSSSBBBBB#',
    '#BBBBSSSSSSBBBB#',
    '#BBBSSSSSSSSBBB#',
    '#BBBBSSSSSSBBBB#',
    '.#BBBBSSSSBBBB#.',
    '.#SBBBBBBBBBBS#.',
    '..#SSBBBBBBSS#..',
    '...##YY##YY##...',
    '................',
  ],
}

const DRAGON_SIDE: Sprite = {
  palette: DRAGON.palette,
  rows: [
    '................',
    '.......Y........',
    '......#Y#.......',
    '...###SS#.......',
    '..#BBBBBB###....',
    '.#BBBBBBBBBB#...',
    '#BBBBBBBBBBBB#..',
    '#LLBEPBBBBBBB#..',
    '#LLBEPBBBBBBB#..',
    '#LLLBBBBBBBBB#..',
    '.#LLBBBBBBBBB#..',
    '.#LLLBBBBBBBB#..',
    '..#LLBBBBBBB#...',
    '...#SBBBBBS#....',
    '....YY##YY#.....',
    '.....##.##......',
  ],
}

export const CREATURE_VIEWS: Record<HeroCreatureId, CreatureViews> = {
  fox: { down: FOX, up: FOX_BACK, side: FOX_SIDE },
  panda: { down: PANDA, up: PANDA_BACK, side: PANDA_SIDE },
  dragon: { down: DRAGON, up: DRAGON_BACK, side: DRAGON_SIDE },
}

/** Sprite hợp với hướng đang đi. Hướng trái dùng lại hình nghiêng, lật gương. */
export function viewFor(
  creature: HeroCreatureId,
  direction: 'up' | 'down' | 'left' | 'right',
): { sprite: Sprite; flip: boolean } {
  const views = CREATURE_VIEWS[creature]
  if (direction === 'up') return { sprite: views.up, flip: false }
  if (direction === 'down') return { sprite: views.down, flip: false }
  return { sprite: views.side, flip: direction === 'left' }
}
