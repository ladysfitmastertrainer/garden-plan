/**
 * Quái của từng MÔI TRƯỜNG - biển, hang, tán cây, núi lửa.
 *
 * Cùng quy ước ký tự với `creatures.ts` (# viền, B thân, S tối, L sáng, E/P mắt,
 * Y điểm nhấn) và cùng một ngôn ngữ hình khối: thân tròn, mắt to, chân ngắn. Bầy
 * này đứng cạnh bầy của môn trên cùng một bản đồ, nên chúng phải nhìn ra là
 * cùng một thế giới - chỉ khác CON VẬT, không khác nét vẽ.
 *
 * Thứ tự trong `HABITAT_FAMILY` là hợp đồng với `HABITAT_BESTIARY` trong
 * `content/bestiary.ts`: con thứ i ở đây là cái tên thứ i ở đó.
 */

import type { Sprite } from './sprite'
import type { Habitat } from '../../content/types'

// --- Biển: lội nước nông ra đảo ---------------------------------------------------

/** Cá Nóc Phồng Má: tròn vo, gai tua tủa trên đầu, bụng trắng. */
export const PUFFER: Sprite = {
  palette: { '#': '#5a4210', B: '#f2c94c', S: '#c99a2e', L: '#fff4c2', E: '#ffffff', P: '#241a06', Y: '#e07a3a' },
  rows: [
    '................',
    '......#..#......',
    '..#..#B##B#..#..',
    '...##BBBBBB##...',
    '..#BBBBBBBBBB#..',
    '.#BBEPBBBBEPBB#.',
    '#BBBEPBBBBEPBBB#',
    '.#BBBBBYYBBBBB#.',
    '#BBBBBYYYYBBBBB#',
    '.#BLLLLLLLLLLB#.',
    '..#LLLLLLLLLL#..',
    '.#.#LLLLLLLL#.#.',
    '....##LLLL##....',
    '...#Y#.##.#Y#...',
    '....#......#....',
    '................',
  ],
}

/** Sứa Điện Lấp Lánh: vòm trong, tua rua lượn sóng. */
export const JELLY: Sprite = {
  palette: { '#': '#4a1f5c', B: '#d58bf0', S: '#a45cc4', L: '#f6dcff', E: '#ffffff', P: '#2a0f35' },
  rows: [
    '................',
    '.....######.....',
    '...##LLBBBB##...',
    '..#LLBBBBBBBB#..',
    '.#LBBBBBBBBBBB#.',
    '.#BBEPBBBBEPBB#.',
    '.#BBEPBBBBEPBB#.',
    '.#BBBBBSSBBBBB#.',
    '.##############.',
    '..#S#.#S#.#S#...',
    '..#S#.#S#.#S#...',
    '...#S#.#S#.#S#..',
    '...#S#.#S#.#S#..',
    '..#S#.#S#.#S#...',
    '...#...#...#....',
    '................',
  ],
}

/** Cá Kiếm Nhanh Nhảu: nhìn nghiêng, mũi kiếm dài chĩa sang trái. */
export const SWORDFISH: Sprite = {
  palette: { '#': '#12304a', B: '#4f8fd6', S: '#2f5f99', L: '#d6ecff', E: '#ffffff', P: '#0a1a2a', Y: '#e8eef5' },
  rows: [
    '................',
    '........#.......',
    '.......#B#......',
    '......#BBB#.....',
    '..###BBBBBB#..#.',
    '#YYYYBEPBBBBB##.',
    '....#BEPBBBBBB#B',
    '...#LLLLBBBBBB##',
    '....#LLLLLBBB#.#',
    '.....##LLLL##...',
    '.......#SS#.....',
    '........##......',
    '................',
    '................',
    '................',
    '................',
  ],
}

/** Cá Mập Con: vây lưng nhọn trên đỉnh đầu, hàm răng trắng. */
export const SHARK: Sprite = {
  palette: { '#': '#1c2a3a', B: '#7d93ab', S: '#566a82', L: '#eef3f8', E: '#ffffff', P: '#0b121a', Y: '#ffffff' },
  rows: [
    '.......##.......',
    '......#BB#......',
    '.....#BBBB#.....',
    '...##BBBBBB##...',
    '..#BBBBBBBBBB#..',
    '.#BBEPBBBBEPBB#.',
    '.#BBEPBBBBEPBB#.',
    '.#BBBBBBBBBBBB#.',
    '.#LL########LL#.',
    '.#L#YYYYYYYY#L#.',
    '.#LL########LL#.',
    '..#LLLLLLLLLL#..',
    '.#S#LLLLLLLL#S#.',
    '#SS#.######.#SS#',
    '.##..........##.',
    '................',
  ],
}

// --- Hang động: giáp xác và bò sát ------------------------------------------------

/** Cua Đá Đếm Càng: hai càng giơ cao, tám chân. */
export const CRAB: Sprite = {
  palette: { '#': '#4a1208', B: '#e0503a', S: '#a8321f', L: '#ffc2a8', E: '#ffffff', P: '#200805' },
  rows: [
    '................',
    '.##..........##.',
    '#BB#........#BB#',
    '#B.B#......#B.B#',
    '.#BB#......#BB#.',
    '..#B#......#B#..',
    '...#B######B#...',
    '..#BBBBBBBBBB#..',
    '.#BBEPBBBBEPBB#.',
    '.#BBEPBBBBEPBB#.',
    '.#BBBBBSSBBBBB#.',
    '..#BLLLLLLLLB#..',
    '.#.##########.#.',
    '#.#.#.#..#.#.#.#',
    '................',
    '................',
  ],
}

/** Tôm Hùm Hang: râu dài, càng hai bên, đuôi xếp đốt. */
export const LOBSTER: Sprite = {
  palette: { '#': '#3d1a0a', B: '#c96a2e', S: '#8f4418', L: '#f5c49a', E: '#ffffff', P: '#1a0a04' },
  rows: [
    '#..............#',
    '.#............#.',
    '..#..######..#..',
    '.##.#BBBBBB#.##.',
    '#BB#BEPBBEPB#BB#',
    '#B.#BEPBBEPB#.B#',
    '.##.#BBBBBB#.##.',
    '....#SBBBBS#....',
    '....#BSSSSB#....',
    '.....#BBBB#.....',
    '.....#SSSS#.....',
    '.....#BBBB#.....',
    '....#LLLLLL#....',
    '...#LL#LL#LL#...',
    '...###.##.###...',
    '................',
  ],
}

/** Thằn Lằn Mắt To: nhìn từ trên xuống, bốn chân xoạc, đuôi thon. */
export const LIZARD: Sprite = {
  palette: { '#': '#1f3d12', B: '#7cc242', S: '#4e8f2a', L: '#dff5b0', E: '#ffffff', P: '#0f1f08', Y: '#f2d24a' },
  rows: [
    '................',
    '....########....',
    '...#EEBBBBEE#...',
    '...#EPBBBBEP#...',
    '...#BBBBBBBB#...',
    '...#BBLLLLBB#...',
    '#...#BBBBBB#...#',
    '##..#BYBBYB#..##',
    '.#B##BBBBBB##B#.',
    '..#BBBYBBYBBBB#.',
    '...#BBBBBBBB#...',
    '..##BBBBBBBB##..',
    '.#B#.#BBBB#.#B#.',
    '.##...#BB#...##.',
    '.......#B#......',
    '........#.......',
  ],
}

/** Rắn Hang Cuộn Tròn: đầu ngóc lên trên một khoanh thân cuộn. */
export const SNAKE: Sprite = {
  palette: { '#': '#2a1a30', B: '#9a6bb8', S: '#6c4488', L: '#e6d0f2', E: '#ffffff', P: '#150a1a', Y: '#e0485a' },
  rows: [
    '................',
    '.....######.....',
    '....#BBBBBB#....',
    '...#BEPBBEPB#...',
    '...#BEPBBEPB#...',
    '...#BBBBBBBB#...',
    '....#BBYYBB#....',
    '.....##YY##.....',
    '...###Y##Y###...',
    '..#SSSSSSSSSS#..',
    '.#SBBBBBBBBBBS#.',
    '#SBLLSSSSSSLLBS#',
    '#SBBBBBBBBBBBBS#',
    '.#SSSSSSSSSSSS#.',
    '..############..',
    '................',
  ],
}

// --- Tán cây: thú rừng -----------------------------------------------------------

/** Khỉ Hỏi Vặn: mặt sáng, hai tai tròn chìa ra, đuôi cong. */
export const MONKEY: Sprite = {
  palette: { '#': '#3a2210', B: '#8c5a30', S: '#5e3a1c', L: '#f0cfa0', E: '#ffffff', P: '#1a0f06' },
  rows: [
    '................',
    '.....######.....',
    '...##BBBBBB##...',
    '.##BBBBBBBBBB##.',
    '#LL#BLLBBLLB#LL#',
    '#LL#LEPLLEPL#LL#',
    '.##BLEPLLEPLB##.',
    '...#LLLLLLLL#...',
    '...#LL####LL#...',
    '....#LLLLLL#....',
    '...##BBBBBB##...',
    '..#BB#BLLB#BB#..',
    '..#B#.#LL#.#B#..',
    '...#.#BBBB#.#.#.',
    '.....##..##..#S#',
    '..............#.',
  ],
}

/** Sóc Bay Tinh Nghịch: đuôi xù dựng đứng sau lưng. */
export const SQUIRREL: Sprite = {
  palette: { '#': '#3d2a18', B: '#c98a4a', S: '#8f5d2c', L: '#f5e0c0', E: '#ffffff', P: '#1a1008' },
  rows: [
    '...........###..',
    '..#..#....#SSS#.',
    '.#B##B#..#SSSSS#',
    '.#BBBBB#.#SSSSS#',
    '#BBBBBBB##SSSS#.',
    '#BEPBEPB#SSSS#..',
    '#BEPBEPB#SSS#...',
    '#BBLLLBB#SS#....',
    '.#BLLLB#SS#.....',
    '.#BLLLBB#S#.....',
    '#BBLLLBBB#......',
    '#BBLLLBBB#......',
    '.#BBBBBB#.......',
    '.#S#..#S#.......',
    '..#....#........',
    '................',
  ],
}

/** Heo Rừng Húc Bậy: lông bờm dựng, hai nanh trắng chìa ra hai bên mõm. */
export const BOAR: Sprite = {
  palette: { '#': '#2a1a12', B: '#7a5a44', S: '#54392a', L: '#c9a88c', E: '#ffffff', P: '#120a06', Y: '#fff6e0' },
  rows: [
    '................',
    '..##........##..',
    '..#S#......#S#..',
    '..#SS######SS#..',
    '..#BSSSSSSSSB#..',
    '.#BBBBBBBBBBBB#.',
    '.#BBEPBBBBEPBB#.',
    '.#BBEPBBBBEPBB#.',
    '.#BBBB####BBBB#.',
    '.#BY#LLLLLL#YB#.',
    '.#BY#L#LL#L#YB#.',
    '.#BB#LLLLLL#BB#.',
    '..#BB######BB#..',
    '..#SBBBBBBBBS#..',
    '..#SS#....#SS#..',
    '...##......##...',
  ],
}

/** Hổ Con Gầm Gừ: cam vằn đen, mõm trắng. */
export const TIGER: Sprite = {
  palette: { '#': '#2a1606', B: '#f28c28', S: '#c56414', L: '#fff2dc', E: '#ffffff', P: '#1a0d02' },
  rows: [
    '................',
    '..##........##..',
    '.#LB#......#BL#.',
    '.#BB########BB#.',
    '.#BB#BB##BB#BB#.',
    '#BBBBBBBBBBBBBB#',
    '#B#BEPBBBBEPB#B#',
    '#BBBEPBBBBEPBBB#',
    '#B#LLLL##LLLL#B#',
    '.#BLLLLLLLLLLB#.',
    '.#BBLL####LLBB#.',
    '..#BBLLLLLLBB#..',
    '..#B#BBBBBB#B#..',
    '..#BBBBBBBBBB#..',
    '..#SS#....#SS#..',
    '...##......##...',
  ],
}

// --- Núi lửa: sinh ra từ nham thạch ----------------------------------------------

/** Slime Dung Nham: giọt nham thạch sủi bọt, đỉnh còn bốc lửa. */
export const LAVA_SLIME: Sprite = {
  palette: { '#': '#3a0e04', B: '#ff6a1f', S: '#c2380e', L: '#ffd34d', E: '#fff6d0', P: '#2a0802', Y: '#ffe9a0' },
  rows: [
    '.......Y........',
    '......YLY.......',
    '.....#LLL#......',
    '....#BLLLB#.....',
    '...#BBBBBBB#....',
    '..#BBBBBBBBB#...',
    '.#BBEPBBBEPBB#..',
    '.#BBEPBBBEPBB#..',
    '#BBBBBBSBBBBBB#.',
    '#BBLLBBBBBLLBBB#',
    '#BLLLLBBBLLLLBB#',
    '#SBBBBBBBBBBBBS#',
    '.#SSSBBSSBBSSS#.',
    '..##S##SS##S##..',
    '....#..##..#....',
    '................',
  ],
}

/** Kỳ Nhông Lửa: thằn lằn đỏ, mào lửa trên đầu, chóp đuôi bốc cháy. */
export const SALAMANDER: Sprite = {
  palette: { '#': '#3a0a08', B: '#e0402a', S: '#9c2414', L: '#ffb070', E: '#ffffff', P: '#1a0504', Y: '#ffd34d' },
  rows: [
    '.....Y.Y.Y......',
    '....#YYYYYY#....',
    '...#EEBBBBEE#...',
    '...#EPBBBBEP#...',
    '...#BBBBBBBB#...',
    '...#BBLLLLBB#...',
    '#...#BBBBBB#...#',
    '##..#BYBBYB#..##',
    '.#B##BBBBBB##B#.',
    '..#BBBYBBYBBBB#.',
    '...#BBBBBBBB#...',
    '..##BSSSSSSB##..',
    '.#B#.#BBBB#.#B#.',
    '.##...#YY#...##.',
    '.......#Y#......',
    '........Y.......',
  ],
}

/** Người Đá Than Hồng: khối đá bazan, mạch nham thạch chạy dọc người. */
export const MAGMA_GOLEM: Sprite = {
  palette: { '#': '#141010', B: '#4a3c3a', S: '#2e2524', L: '#ff7a1f', E: '#ffd34d', P: '#ff3d0a' },
  rows: [
    '................',
    '....########....',
    '...#BBBBBBBB#...',
    '...#BEPBBEPB#...',
    '...#BBBLLBBB#...',
    '...##BBBBBB##...',
    '.###SSSLLSSS###.',
    '#BB#BBLBBLBB#BB#',
    '#BB#BLBBBBLB#BB#',
    '#BL#BBBLLBBB#LB#',
    '#BB#BBLBBLBB#BB#',
    '.##.#SSSSSS#.##.',
    '....#BB##BB#....',
    '....#BL##LB#....',
    '...##BB##BB##...',
    '...####..####...',
  ],
}

/** Đốm Lửa Lang Thang: một ngọn lửa tròn có mắt, ba lưỡi lửa trên đỉnh. */
export const FLAME_WISP: Sprite = {
  palette: { '#': '#5a1a04', B: '#ff8c2b', S: '#e0561a', L: '#ffe066', E: '#ffffff', P: '#3a0f02' },
  rows: [
    '.......#........',
    '......#L#.......',
    '..#..#LL#..#....',
    '.#L#.#LLB#.#L#..',
    '.#L##BLLLB##L#..',
    '.#BBBBLLLBBBBB#.',
    '#BBBBBBBBBBBBBB#',
    '#BBEPBBBBBBEPBB#',
    '#BBEPBBBBBBEPBB#',
    '#BBBBBBLLBBBBBB#',
    '.#BBBBLLLLBBBB#.',
    '.#SBBBBLLBBBBS#.',
    '..#SSBBBBBBSS#..',
    '...##SSSSSS##...',
    '.....######.....',
    '................',
  ],
}

/**
 * Bầy của từng môi trường. Thứ tự khớp với `HABITAT_BESTIARY` - xem đầu file.
 */
export const HABITAT_FAMILY: Record<Habitat, readonly Sprite[]> = {
  sea: [PUFFER, JELLY, SWORDFISH, SHARK],
  cave: [CRAB, LOBSTER, LIZARD, SNAKE],
  forest: [MONKEY, SQUIRREL, BOAR, TIGER],
  lava: [LAVA_SLIME, SALAMANDER, MAGMA_GOLEM, FLAME_WISP],
}

/** Tên gọi trong `ALL_SPRITES` - để test kiểm khổ và bảng màu như mọi hình khác. */
export const HABITAT_SPRITES: Record<string, Sprite> = {
  puffer: PUFFER,
  jelly: JELLY,
  swordfish: SWORDFISH,
  shark: SHARK,
  crab: CRAB,
  lobster: LOBSTER,
  lizard: LIZARD,
  snake: SNAKE,
  monkey: MONKEY,
  squirrel: SQUIRREL,
  boar: BOAR,
  tiger: TIGER,
  'lava-slime': LAVA_SLIME,
  salamander: SALAMANDER,
  'magma-golem': MAGMA_GOLEM,
  'flame-wisp': FLAME_WISP,
}
