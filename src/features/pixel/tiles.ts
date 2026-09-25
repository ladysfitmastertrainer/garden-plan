/**
 * Bộ ô cảnh (tile) 16×16 cho bản đồ đi bộ.
 *
 * Cùng quy ước ký tự với creatures.ts, thêm vài ký tự riêng cho cảnh vật.
 * Mỗi ô lấp đầy cả 16×16 (trừ ô có tán cây nhô ra) để ghép lại thành một mặt
 * đất liền mạch, không có kẽ hở - đúng cách bản đồ thời đó được ghép.
 *
 * QUY TẮC BẮT BUỘC: mọi màu trong file này phải lấy từ bảng TERRAIN, không được
 * gõ mã màu thẳng vào sprite. biome.ts đổi tông cả vùng đất bằng cách tráo bảng
 * màu này; một mã màu gõ lậu vào sprite sẽ không đổi theo và để lại một vệt màu
 * lạc lõng giữa bản đồ.
 */

import type { Sprite } from './sprite'
import type { Habitat } from '../../content/types'

/** Bảng màu gốc - cảnh đồng cỏ. Các vùng đất khác kế thừa rồi tráo màu. */
export const TERRAIN = {
  grass: '#7cc96a',
  grassDark: '#5fae52',
  tallGrass: '#5fae52',
  tallGrassDark: '#4b9440',
  path: '#e0c98f',
  pathDark: '#c9ab6d',
  treeLeaf: '#2f8f4e',
  treeLeafDark: '#1f6d39',
  trunk: '#7a4a22',
  flower: '#ff6f91',
  flowerCore: '#ffe066',
  stone: '#9aa6b8',
  stoneDark: '#5d6a7d',
  stoneLight: '#c9d3e0',
  dark: '#2b3550',
  gateVoid: '#3a2a52',
  water: '#5fb8e0',
  waterDark: '#3e9bc7',
  waterLight: '#a8e0f5',
  sand: '#efe2b4',
  sandDark: '#d9c894',
  /** Nền sân đấu trùm - lát đá, khác hẳn mặt đất thường. */
  floor: '#b9a68c',
  floorDark: '#8f7c63',
  floorLine: '#6d5c48',
  flame: '#ff8c2b',
  flameCore: '#ffe066',

  /*
    --- ĐỘ CAO ---

    Vùng cao và vùng trũng KHÔNG có màu riêng ở đây, và đó là chủ ý: màu của
    chúng được tính ra từ chính màu cỏ của vùng đất, sáng hơn hoặc tối hơn một
    nấc (xem `shade`). Gõ cứng một màu xanh vào đây thì ở Thung lũng Con Số -
    nơi mặt đất ngả vàng cát - khu đất cao hoá thành một mảng xanh dán lên, đọc
    ra là "chỗ khác" chứ không phải "chỗ cao hơn". Mà điều cần nói là độ cao.
  */
  /** Vách đá ngăn hai tầng - thứ duy nhất chặn đường mà không phải cây hay nước. */
  cliff: '#a48d6c',
  cliffDark: '#7b6749',
  cliffTop: '#c6b089',
  /** Nhà trên vùng cao. */
  roof: '#d2544a',
  roofDark: '#a63c36',
  wall: '#ecdcbb',
  wallDark: '#c9b28c',
  doorWood: '#7a4a22',
  doorDark: '#53310f',

  /*
    --- KHU MÔI TRƯỜNG: nước nông, hang, tán cây, núi lửa ---

    Mỗi vùng đất có một khu riêng với bầy quái riêng (xem `world/biome.ts`).
    Màu của chúng cũng nằm ở đây, cùng bảng với mọi thứ khác, để ánh sáng theo
    lớp (nắng sớm, hoàng hôn...) phủ lên cả hang lẫn miệng núi lửa - một cái
    hang lớp 5 mà vẫn sáng như buổi trưa thì nó tách hẳn ra khỏi vùng đất.
  */
  /** Nước nông: sáng hơn hẳn nước sâu - thấy được đáy cát nên biết là lội được. */
  shoal: '#86d0ea',
  shoalDark: '#6bbfdc',
  caveFloor: '#6b5f58',
  caveFloorDark: '#51463f',
  caveWall: '#5a4e4a',
  caveWallDark: '#3b322f',
  caveWallLight: '#857871',
  /** Tán cây: lá dày nhìn từ trên xuống, và sàn ván bắc ngang giữa các cành. */
  canopy: '#4f9e4a',
  canopyDark: '#357a36',
  canopyLight: '#8fd06a',
  plank: '#b98552',
  plankDark: '#8a5d33',
  ash: '#5d5654',
  ashDark: '#46403e',
  lava: '#ff6a1f',
  lavaLight: '#ffd34d',
  lavaDark: '#b3300c',
  basalt: '#4a4240',
  basaltDark: '#2c2624',
  basaltLight: '#6e6360',
}

export type TerrainColors = typeof TERRAIN

/** Cỏ: nền phẳng, rắc vài túm cỏ sẫm cho đỡ trơ. */
function grassTile(c: TerrainColors): Sprite {
  return {
    palette: { G: c.grass, g: c.grassDark },
    rows: [
      'GGGGGGGGGGGGGGGG',
      'GGGGGgGGGGGGGGGG',
      'GGGGGGGGGGGgGGGG',
      'GgGGGGGGGGGGGGGG',
      'GGGGGGGGgGGGGGGG',
      'GGGGGGGGGGGGGGgG',
      'GGGgGGGGGGGGGGGG',
      'GGGGGGGGGGGgGGGG',
      'GGGGGGGgGGGGGGGG',
      'GgGGGGGGGGGGGGGG',
      'GGGGGGGGGGGGGgGG',
      'GGGGgGGGGGGGGGGG',
      'GGGGGGGGGGgGGGGG',
      'GGGGGGGgGGGGGGGG',
      'GgGGGGGGGGGGGGGG',
      'GGGGGGGGGGGGGGGG',
    ],
  }
}

/** Cỏ cao: đậm hơn, báo hiệu vùng hay gặp quái (quy ước quen thuộc). */
function tallGrassTile(c: TerrainColors): Sprite {
  return {
    palette: { G: c.tallGrass, g: c.tallGrassDark },
    rows: [
      'GGGGGGGGGGGGGGGG',
      'GgGGgGGGgGGGgGGG',
      'GgGGgGGGgGGGgGGG',
      'GGGGGGGGGGGGGGGG',
      'GGGgGGGgGGGgGGGg',
      'GGGgGGGgGGGgGGGg',
      'GGGGGGGGGGGGGGGG',
      'GgGGgGGGgGGGgGGG',
      'GgGGgGGGgGGGgGGG',
      'GGGGGGGGGGGGGGGG',
      'GGGgGGGgGGGgGGGg',
      'GGGgGGGgGGGgGGGg',
      'GGGGGGGGGGGGGGGG',
      'GgGGgGGGgGGGgGGG',
      'GgGGgGGGgGGGgGGG',
      'GGGGGGGGGGGGGGGG',
    ],
  }
}

/** Đường mòn. */
function pathTile(c: TerrainColors): Sprite {
  return {
    palette: { P: c.path, p: c.pathDark },
    rows: [
      'PPPPPPPPPPPPPPPP',
      'PPPpPPPPPPPPPPPP',
      'PPPPPPPPPPPPpPPP',
      'PPPPPPPPPPPPPPPP',
      'PpPPPPPPPpPPPPPP',
      'PPPPPPPPPPPPPPPP',
      'PPPPPPPpPPPPPPPP',
      'PPPPPPPPPPPPPPpP',
      'PPPPPPPPPPPPPPPP',
      'PPPpPPPPPPPPPPPP',
      'PPPPPPPPPPpPPPPP',
      'PPPPPPPPPPPPPPPP',
      'PpPPPPPPPPPPPpPP',
      'PPPPPPPPPPPPPPPP',
      'PPPPPPPpPPPPPPPP',
      'PPPPPPPPPPPPPPPP',
    ],
  }
}

/** Cây: tán lá tròn trên thân, đứng trên nền đất. Ô này KHÔNG đi qua được. */
function treeTile(c: TerrainColors): Sprite {
  return {
    palette: { d: c.treeLeaf, D: c.treeLeafDark, t: c.trunk, G: c.grass, g: c.grassDark },
    rows: [
      '.....dddd.......',
      '...dddddddd.....',
      '..dddDDDdddd....',
      '.dddddDDddddd...',
      '.dddddddddddd...',
      '.ddddDDDddddd...',
      '..dddddddddd....',
      '...dddddddd.....',
      '....dddddd......',
      '......tt........',
      '......tt........',
      '......tt........',
      '.....tttt.......',
      '....GGGGGG......',
      'GGGGGGGgGGGGGGGG',
      'GGGGGGGGGGGGGGGG',
    ],
  }
}

/** Bụi hoa - chỉ để trang trí, vẫn đi qua được. */
function flowerTile(c: TerrainColors): Sprite {
  return {
    palette: { G: c.grass, g: c.grassDark, f: c.flower, y: c.flowerCore },
    rows: [
      'GGGGGGGGGGGGGGGG',
      'GGGGGgGGGGGGGGGG',
      'GGGGGGGGGGGfGGGG',
      'GGGGGGGGGGffyffG',
      'GGGfGGGGGGGfffGG',
      'GGffyffGGGGGfGGG',
      'GGGfffGGGGGGGGGG',
      'GGGGfGGGGGGGGGGG',
      'GGGGGGGGGGGGGGGG',
      'GgGGGGGGGfGGGGGG',
      'GGGGGGGGffyffGGG',
      'GGGGGGGGGfffGGGG',
      'GGGGGGGGGGfGGGGG',
      'GGGGGGGgGGGGGGGG',
      'GgGGGGGGGGGGGGGG',
      'GGGGGGGGGGGGGGGG',
    ],
  }
}

/** Tảng đá - chướng ngại, không đi qua được. */
function rockTile(c: TerrainColors): Sprite {
  return {
    palette: { s: c.stone, S: c.stoneDark, l: c.stoneLight, G: c.grass, g: c.grassDark },
    rows: [
      'GGGGGGGGGGGGGGGG',
      'GGGGGgGGGGGGGGGG',
      'GGGGGSSSSSSGGGGG',
      'GGGGSslllllSGGGG',
      'GGGSsllsssllSGGG',
      'GGSsllssssslsSGG',
      'GGSslsssssssssSG',
      'GGSssssssssssSGG',
      'GGSssssssssssSGG',
      'GGGSsssssssssSGG',
      'GGGGSSSSSSSSSGGG',
      'GGGGGGGGGGGGGGGG',
      'GgGGGGGGGGGGGgGG',
      'GGGGGGGGGGGGGGGG',
      'GGGGGgGGGGGGGGGG',
      'GGGGGGGGGGGGGGGG',
    ],
  }
}

/** Cổng đá: nơi vào trận. Đứng lên ô này là gặp quái. */
function gateTile(c: TerrainColors): Sprite {
  return {
    palette: {
      '#': c.dark,
      k: c.stoneDark,
      K: c.stone,
      l: c.stoneLight,
      d: c.gateVoid,
      G: c.grass,
    },
    rows: [
      'GGGGGGGGGGGGGGGG',
      'GGG##########GGG',
      'GG#kkkkkkkkkk#GG',
      'GG#klllllllllk#G',
      'GG#kl######lkk#G',
      'GG#kl#dddd#lkk#G',
      'GG#kl#dddd#lkk#G',
      'GG#kl#dddd#lkk#G',
      'GG#kl#dddd#lkk#G',
      'GG#kl#dddd#lkk#G',
      'GG#kl#dddd#lkk#G',
      'GG#kll####llkk#G',
      'GG#kkkkkkkkkk#GG',
      'GGG##########GGG',
      'GGGGGGGGGGGGGGGG',
      'GGGGGGGGGGGGGGGG',
    ],
  }
}

/** Nước - chặn đường, dùng làm biên cho vùng ven biển. */
function waterTile(c: TerrainColors): Sprite {
  return {
    palette: { W: c.water, w: c.waterDark, l: c.waterLight },
    rows: [
      'WWWWWWWWWWWWWWWW',
      'WWlllWWWWWWWWWWW',
      'WWWWWWWWWlllWWWW',
      'WWWWWWWWWWWWWWWW',
      'wwwwwwwwwwwwwwww',
      'WWWWWWWWWWWWWWWW',
      'WWWWlllWWWWWWWWW',
      'WWWWWWWWWWWlllWW',
      'WWWWWWWWWWWWWWWW',
      'wwwwwwwwwwwwwwww',
      'WWWWWWWWWWWWWWWW',
      'WWlllWWWWWWWWWWW',
      'WWWWWWWWlllWWWWW',
      'WWWWWWWWWWWWWWWW',
      'wwwwwwwwwwwwwwww',
      'WWWWWWWWWWWWWWWW',
    ],
  }
}

/**
 * Nền sân đấu trùm: đá lát vuông vức, mạch vữa rõ. Đi vào được.
 * Khác hẳn mặt đất thường để trẻ bước tới là biết "sắp có chuyện lớn".
 */
function arenaTile(c: TerrainColors): Sprite {
  return {
    palette: { F: c.floor, f: c.floorDark, L: c.floorLine },
    rows: [
      'LLLLLLLLLLLLLLLL',
      'LFFFFFFLFFFFFFFL',
      'LFFFFFFLFFFFFFFL',
      'LFFfFFFLFFFFfFFL',
      'LFFFFFFLFFFFFFFL',
      'LFFFFFFLFFFFFFFL',
      'LFFFFFFLFFFFFFFL',
      'LLLLLLLLLLLLLLLL',
      'LFFFFFFFLFFFFFFL',
      'LFFFFFFFLFFFFFFL',
      'LFFFFfFFLFFfFFFL',
      'LFFFFFFFLFFFFFFL',
      'LFFFFFFFLFFFFFFL',
      'LFFFFFFFLFFFFFFL',
      'LFFFFFFFLFFFFFFL',
      'LLLLLLLLLLLLLLLL',
    ],
  }
}

/** Đuốc viền sân đấu trùm. Chắn đường, và là thứ báo hiệu đã tới nơi. */
function torchTile(c: TerrainColors): Sprite {
  return {
    palette: {
      F: c.floor,
      L: c.floorLine,
      k: c.stoneDark,
      s: c.stone,
      l: c.stoneLight,
      r: c.flame,
      y: c.flameCore,
    },
    rows: [
      '.......y........',
      '......yry.......',
      '.....yrrry......',
      '.....rryrr......',
      '.....rrrrr......',
      '......rrr.......',
      '.....kssssk.....',
      '.....kslssk.....',
      '.....kssssk.....',
      '......ksk.......',
      '......ksk.......',
      '.....klslk......',
      '....kssssssk....',
      '....kkkkkkkk....',
      'FFFFFFFFFFFFFFFF',
      'LLLLLLLLLLLLLLLL',
    ],
  }
}

/** Cát: mặt đất của vùng ven biển. Đi vào được. */
function sandTile(c: TerrainColors): Sprite {
  return {
    palette: { S: c.sand, s: c.sandDark },
    rows: [
      'SSSSSSSSSSSSSSSS',
      'SSSsSSSSSSSSSSSS',
      'SSSSSSSSSSSSsSSS',
      'SSSSSSSSSSSSSSSS',
      'SsSSSSSSSsSSSSSS',
      'SSSSSSSSSSSSSSSS',
      'SSSSSSSsSSSSSSSS',
      'SSSSSSSSSSSSSSsS',
      'SSSSSSSSSSSSSSSS',
      'SSSsSSSSSSSSSSSS',
      'SSSSSSSSSSsSSSSS',
      'SSSSSSSSSSSSSSSS',
      'SsSSSSSSSSSSSsSS',
      'SSSSSSSSSSSSSSSS',
      'SSSSSSSsSSSSSSSS',
      'SSSSSSSSSSSSSSSS',
    ],
  }
}

/** Dựng cả bộ ô theo một bảng màu. biome.ts gọi hàm này cho từng vùng đất. */
/*
  --- ĐỘ CAO: CỎ SÁNG, CỎ TỐI, VÁCH ĐÁ, BẬC THANG ---

  Vùng cao và vùng trũng vẽ y hệt ô cỏ thường, chỉ khác bảng màu. Cố ý: chúng
  phải đọc ra ngay là CỎ - cùng một thứ mặt đất, chỉ ở độ cao khác - chứ không
  phải một loại địa hình mới cần học lại.
*/
/**
 * Pha sáng hoặc tối một màu, giữ nguyên sắc.
 *
 * `amount` dương là kéo về phía trắng, âm là kéo về phía đen. Dùng cho độ cao:
 * cùng một mặt đất, ba nấc sáng.
 */
function shade(hex: string, amount: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return hex
  const value = parseInt(m[1]!, 16)
  const mix = (channel: number) =>
    Math.round(amount >= 0 ? channel + (255 - channel) * amount : channel * (1 + amount))
  const r = mix((value >> 16) & 255)
  const g = mix((value >> 8) & 255)
  const b = mix(value & 255)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`
}

function highlandTile(c: TerrainColors): Sprite {
  return grassTile({ ...c, grass: shade(c.grass, 0.22), grassDark: shade(c.grassDark, 0.22) })
}

function hollowTile(c: TerrainColors): Sprite {
  return grassTile({ ...c, grass: shade(c.grass, -0.22), grassDark: shade(c.grassDark, -0.22) })
}

/**
 * Vách đá: mép trên sáng, mặt vách tối dần xuống.
 *
 * Đây là ô mang cả ý nghĩa luật chơi - nó là thứ nói "không trèo qua đây được".
 * Nên nó phải khác hẳn mọi ô khác ngay từ cái nhìn đầu: một dải sáng nằm ngang
 * ở đỉnh, rồi mặt vách kẻ dọc chạy xuống. Mắt đọc ra ngay là một BỜ DỐC nhìn
 * từ trên xuống, không phải một bức tường.
 */
function cliffTile(c: TerrainColors): Sprite {
  return {
    palette: { T: c.cliffTop, C: c.cliff, c: c.cliffDark },
    rows: [
      'TTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTTT',
      'CCCCCCCCCCCCCCCC',
      'CCcCCCCCcCCCCCCC',
      'CCcCCCCCcCCCCcCC',
      'CCcCCCcCcCCCCcCC',
      'CCCCCCcCCCCCCcCC',
      'CCCCCCcCCCCCCCCC',
      'CcCCCCCCCCCcCCCC',
      'CcCCCCCCCCCcCCCC',
      'CcCCCCCCcCCcCCCC',
      'CCCCCCCCcCCCCCCC',
      'CCCCCCCCcCCCCCCC',
      'cccccccccccccccc',
      'cccccccccccccccc',
    ],
  }
}

/**
 * Bậc thang: ba bậc đá xếp chồng, có bóng đổ dưới mỗi bậc.
 *
 * Phải nhìn ra ngay là ĐI LÊN ĐƯỢC, vì nó là lối duy nhất qua vách đá - trẻ tìm
 * không ra thì cả vùng cao thành một bức tranh dán trên tường.
 */
function stairsTile(c: TerrainColors): Sprite {
  return {
    palette: { S: c.stoneLight, s: c.stone, d: c.stoneDark },
    rows: [
      'dddddddddddddddd',
      'SSSSSSSSSSSSSSSS',
      'SSSSSSSSSSSSSSSS',
      'ssssssssssssssss',
      'dddddddddddddddd',
      'SSSSSSSSSSSSSSSS',
      'SSSSSSSSSSSSSSSS',
      'ssssssssssssssss',
      'dddddddddddddddd',
      'SSSSSSSSSSSSSSSS',
      'SSSSSSSSSSSSSSSS',
      'ssssssssssssssss',
      'dddddddddddddddd',
      'SSSSSSSSSSSSSSSS',
      'SSSSSSSSSSSSSSSS',
      'ssssssssssssssss',
    ],
  }
}

/** Mái nhà. Ô này KHÔNG đi vào được - cửa nằm ở ô ngay dưới. */
function houseTile(c: TerrainColors): Sprite {
  return {
    palette: { R: c.roof, r: c.roofDark, W: c.wall, w: c.wallDark },
    rows: [
      'wwwwwwwwwwwwwwww',
      'wwwwwwwRwwwwwwww',
      'wwwwwwRRRwwwwwww',
      'wwwwwRRRRRwwwwww',
      'wwwwRRRRRRRwwwww',
      'wwwRRRRRRRRRwwww',
      'wwRRRRRRRRRRRwww',
      'wRRRRRRRRRRRRRww',
      'rrrrrrrrrrrrrrrr',
      'rWWWWWWWWWWWWWWr',
      'rWWWWWWWWWWWWWWr',
      'rWWWwwwwwwWWWWWr',
      'rWWWWWWWWWWWWWWr',
      'rWWWWWWWWWWWWWWr',
      'rWWWWWWWWWWWWWWr',
      'rwwwwwwwwwwwwwwr',
    ],
  }
}

/** Cửa nhà: đi vào được, và đó là cả điểm của nó. */
function doorTile(c: TerrainColors): Sprite {
  return {
    palette: { W: c.wall, w: c.wallDark, D: c.doorWood, d: c.doorDark, k: c.flameCore },
    rows: [
      'wWWWWWWWWWWWWWWw',
      'wWWWWWWWWWWWWWWw',
      'wWWWWdddddddWWWw',
      'wWWWdDDDDDDDdWWw',
      'wWWWdDDDDDDDdWWw',
      'wWWWdDDDDDDDdWWw',
      'wWWWdDDDDDDDdWWw',
      'wWWWdDDDDkDDdWWw',
      'wWWWdDDDDDDDdWWw',
      'wWWWdDDDDDDDdWWw',
      'wWWWdDDDDDDDdWWw',
      'wWWWdDDDDDDDdWWw',
      'wWWWdDDDDDDDdWWw',
      'wWWWdDDDDDDDdWWw',
      'wWWWdDDDDDDDdWWw',
      'wwwwddddddddwwww',
    ],
  }
}

/*
  --- KHU MÔI TRƯỜNG ---

  Mọi ô ở đây đều KÍN cả 16×16, không chừa ô trong suốt nào. Ô trong suốt được
  lót bằng mặt đất của vùng (xem `stampTile`), mà mặt đất của vùng là cỏ hay
  cát - một cái măng đá đứng trên nền cỏ là thủng mất cảm giác đang ở trong hang.
*/

/** Nước nông: lội qua được, và quái biển nhảy ra từ đây. */
function shoalTile(c: TerrainColors): Sprite {
  return {
    palette: { S: c.shoal, s: c.shoalDark, l: c.waterLight, a: c.sand },
    rows: [
      'SSSSSSSSSSSSSSSS',
      'SSllSSSSSSSSSSSS',
      'SSSSSSSSSaSSSSSS',
      'SSSSSSSSSSSSllSS',
      'SsSSSSSSSSSSSSSS',
      'SSSSSSllSSSSSSSS',
      'SSSaSSSSSSSSSSsS',
      'SSSSSSSSSSSSSSSS',
      'SSSllSSSSSSSSSSS',
      'SSSSSSSSSSsSSSSS',
      'SSSSSSSSSSSSSaSS',
      'SSSSSSSSSllSSSSS',
      'SSsSSSSSSSSSSSSS',
      'SSSSSSSSSSSSSllS',
      'SSSSSSSaSSSSSSSS',
      'SSSSSSSSSSSSSSSS',
    ],
  }
}

/** Nền hang: đất đá tối, lấm tấm sỏi. Đi được, và quái hang nấp ở đây. */
function caveFloorTile(c: TerrainColors): Sprite {
  return {
    palette: { F: c.caveFloor, f: c.caveFloorDark, l: c.caveWallLight },
    rows: [
      'FFFFFFFFFFFFFFFF',
      'FFfFFFFFFFFFFFFF',
      'FFFFFFFFFFlfFFFF',
      'FFFFFFFFFFffFFFF',
      'FFFFFFFFFFFFFFFF',
      'FlfFFFFFFFFFFFFF',
      'FffFFFFFFFFFFfFF',
      'FFFFFFFFFFFFFFFF',
      'FFFFFFFfFFFFFFFF',
      'FFFFFFFFFFFFFFFF',
      'FFFFFFFFFFFFlfFF',
      'FFFFfFFFFFFFffFF',
      'FFFFFFFFFFFFFFFF',
      'FFFlfFFFFFFFFFFF',
      'FFFffFFFFFfFFFFF',
      'FFFFFFFFFFFFFFFF',
    ],
  }
}

/** Vách hang: đá sần, tối hơn vách núi ngoài trời. Không đi qua được. */
function caveWallTile(c: TerrainColors): Sprite {
  return {
    palette: { T: c.caveWallLight, C: c.caveWall, c: c.caveWallDark },
    rows: [
      'TTTCTTTTTCTTTTCT',
      'TTCCCTTTCCCTTCCC',
      'TCCcCCTCCcCCCCcC',
      'CCcCCCCCCcCCCcCC',
      'CCcCCcCCCCCCCcCC',
      'CCCCCcCCcCCCCCCC',
      'CcCCCCCCcCCCcCCC',
      'CcCCCCCCCCCCcCCC',
      'CCCCcCCCCCCCCCCC',
      'CCCCcCCCCcCCCCcC',
      'CCcCCCCCCcCCCCcC',
      'CCcCCCCCCCCCCCCC',
      'CCCCCCcCCCCcCCCC',
      'cCCCCCcCCCCcCCCc',
      'cccccccccccccccc',
      'cccccccccccccccc',
    ],
  }
}

/**
 * Cửa hang: vòm tối khoét vào vách đá.
 *
 * Tối đen ở giữa có chủ ý - đó là thứ nói "bên trong còn có chỗ", và là cái trẻ
 * nhìn thấy từ đường chính. Đi vào được.
 */
function caveMouthTile(c: TerrainColors): Sprite {
  return {
    palette: { T: c.caveWallLight, C: c.caveWall, c: c.caveWallDark, K: c.dark },
    rows: [
      'TTTTTTTTTTTTTTTT',
      'CCCCCCCCCCCCCCCC',
      'CCCcCKKKKKKCcCCC',
      'CCcCKKKKKKKKCcCC',
      'CCcKKKKKKKKKKcCC',
      'CcCKKKKKKKKKKCcC',
      'CcKKKKKKKKKKKKcC',
      'CcKKKKKKKKKKKKcC',
      'CcKKKKKKKKKKKKcC',
      'CcKKKKKKKKKKKKcC',
      'CcKKKKKKKKKKKKcC',
      'CcKKKKKKKKKKKKcC',
      'CcKKKKKKKKKKKKcC',
      'CcKKKKKKKKKKKKcC',
      'ccKKKKKKKKKKKKcc',
      'ccKKKKKKKKKKKKcc',
    ],
  }
}

/** Măng đá mọc từ nền hang. Chắn đường, để trong hang có lối len chứ không trống trơn. */
function stalagmiteTile(c: TerrainColors): Sprite {
  return {
    palette: { F: c.caveFloor, f: c.caveFloorDark, T: c.caveWallLight, C: c.caveWall, c: c.caveWallDark },
    rows: [
      'FFFFFFFFFFFFFFFF',
      'FFFFFFFTcFFFFFFF',
      'FFFFFFFTcFFFFFFF',
      'FFFFFFTCcFFFFFFF',
      'FFFFFFTCccFFFFFF',
      'FFFFFTCCccFFFFFF',
      'FFFFFTCCCcFFFFFF',
      'FFFFTCCCCccFFFFF',
      'FFFFTCCCCccFFFFF',
      'FFFTCCCCCCccFFFF',
      'FFFTCCCCCCccFFFF',
      'FFTCCCCCCCCccFFF',
      'FFfccccccccccfFF',
      'FFFFFFFFFFFFFFFF',
      'FFFfFFFFFFFFFFFF',
      'FFFFFFFFFFFFFFFF',
    ],
  }
}

/**
 * Sàn tán cây: ván gỗ bắc giữa những chùm lá. Đi được, và thú rừng ở đây.
 *
 * Ván chứ không phải lá: đứng trên lá thì không đọc ra là đứng được. Mấy chùm lá
 * ở bốn góc là thứ nói "đây là trên cây, không phải cái sân gỗ".
 */
function canopyTile(c: TerrainColors): Sprite {
  return {
    palette: { d: c.canopy, D: c.canopyDark, w: c.plank, W: c.plankDark },
    rows: [
      'dDdwwwwwwwwwwdDd',
      'DdwwwwwwwwwwwwdD',
      'wwwwwwwwwwwwwwww',
      'WWWWWWWWWWWWWWWW',
      'wwwwwwwwwwwwwwww',
      'wwwwwwwwwwwwwwww',
      'wwwwwwwWwwwwwwww',
      'WWWWWWWWWWWWWWWW',
      'wwwwwwwwwwwwwwww',
      'wwwwwwwwwwwwwwww',
      'wwwwWwwwwwwwwwww',
      'WWWWWWWWWWWWWWWW',
      'wwwwwwwwwwwwwwww',
      'wwwwwwwwwwwwwwww',
      'DdwwwwwwwwwwwwdD',
      'dDdwwwwwwwwwwdDd',
    ],
  }
}

/** Tán lá dày nhìn từ trên xuống - bờ rào của sàn tán cây. Không đi qua được. */
function foliageTile(c: TerrainColors): Sprite {
  return {
    palette: { d: c.canopy, D: c.canopyDark, l: c.canopyLight },
    rows: [
      'ddlddDDdddlddDDd',
      'dlllddDDdllldDDd',
      'ddlddDDDddlddDDD',
      'DdddDDdDDdddDDdD',
      'DDdDDddldDDdDDdd',
      'dDDDddllldDDDddl',
      'ddDddddlddDDddll',
      'dDDdlddDDdddDdld',
      'DDdllldDDdlddDDd',
      'DdddlddDddllldDd',
      'dDDddDDdddlddDDd',
      'ddDDDdddDDddDDdd',
      'lddDdlddDddddDld',
      'llddllldDDdlddll',
      'ldDDdlddDDllldDd',
      'dDDddDDdddlddDDd',
    ],
  }
}

/** Thang dây buộc vào thân cây: lối DUY NHẤT lên sàn tán cây. */
function vineTile(c: TerrainColors): Sprite {
  return {
    palette: {
      d: c.canopy,
      D: c.canopyDark,
      t: c.trunk,
      k: c.plankDark,
      r: c.path,
      G: c.grass,
      g: c.grassDark,
    },
    rows: [
      'dDddDDdddDDddDdd',
      'ddDdtttttttttDdd',
      'GGtkrrrrrrrktGGG',
      'GGtktttttttktGGG',
      'GgtktttttttktGGG',
      'GGtkrrrrrrrktGgG',
      'GGtktttttttktGGG',
      'GGtktttttttktGGG',
      'GGtkrrrrrrrktGGG',
      'GGtktttttttktgGG',
      'GGtktttttttktGGG',
      'GGtkrrrrrrrktGGG',
      'GgtktttttttktGGG',
      'GGtktttttttktGGG',
      'GGtkrrrrrrrktGGG',
      'GGGtttttttttGGGG',
    ],
  }
}

/** Tro núi lửa: đất xám đen, lấm tấm than hồng. Đi được, quái nham thạch ở đây. */
function ashTile(c: TerrainColors): Sprite {
  return {
    palette: { A: c.ash, a: c.ashDark, e: c.lava },
    rows: [
      'AAAAAAAAAAAAAAAA',
      'AAaAAAAAAAAAAAAA',
      'AAAAAAAAAAeAAAAA',
      'AAAAAAaAAAAAAAAA',
      'AAAAAAAAAAAAAaAA',
      'AeAAAAAAAAAAAAAA',
      'AAAAAAAAAaAAAAAA',
      'AAAAaAAAAAAAAAAA',
      'AAAAAAAAAAAAAAeA',
      'AAAAAAAAAAAAAAAA',
      'AAaAAAAAeAAAAAAA',
      'AAAAAAAAAAAAaAAA',
      'AAAAAAAAAAAAAAAA',
      'AAAAAeAAAAAAAAAA',
      'AaAAAAAAAAAAaAAA',
      'AAAAAAAAAAAAAAAA',
    ],
  }
}

/** Dung nham: sáng rực, có vảy nguội. Không bước vào được - đó là cả luật của nó. */
function lavaTile(c: TerrainColors): Sprite {
  return {
    palette: { L: c.lava, l: c.lavaLight, k: c.lavaDark },
    rows: [
      'LLLLLLllLLLLLLLL',
      'LLllLLLLLLLkkLLL',
      'LlllLLLLLLkkkkLL',
      'LLLLLLkkLLLLkLLL',
      'LLLLLkkkkLLLLLLL',
      'LLLLLLkkLLLLllLL',
      'LllLLLLLLLLlllLL',
      'LLlLLLLLLLLLlLLL',
      'LLLLLLLLllLLLLLL',
      'LLkkLLLLlllLLLLL',
      'LkkkkLLLLLLLLkkL',
      'LLkkLLLLLLLLkkkk',
      'LLLLLLllLLLLLkkL',
      'LLLLLllllLLLLLLL',
      'LLkLLLLLLLLLLLLL',
      'LLLLLLLLLLLLLLLL',
    ],
  }
}

/** Vách đá bazan quanh miệng núi lửa, mạch lửa rỉ ra ở mép. Không đi qua được. */
function basaltTile(c: TerrainColors): Sprite {
  return {
    palette: { T: c.basaltLight, C: c.basalt, c: c.basaltDark, e: c.lava },
    rows: [
      'TTTTTTTTTTTTTTTT',
      'TTTTeTTTTTTTeTTT',
      'TTTTTTTTTTTTTTTT',
      'CCCCCCCCCCCCCCCC',
      'CCcCCCeCcCCCCCCC',
      'CCcCCCCCcCCCCcCC',
      'CCcCCCcCcCCeCcCC',
      'CCCCCCcCCCCCCcCC',
      'CCCCCCcCCCCCCCCC',
      'CcCCCCCCCCCcCCCC',
      'CcCCeCCCCCCcCCCC',
      'CcCCCCCCcCCcCCCC',
      'CCCCCCCCcCCCCCCC',
      'CCCCCCCCcCCCCCeC',
      'cccccccccccccccc',
      'cccccccccccccccc',
    ],
  }
}

export function buildTiles(c: TerrainColors): TileSet {
  return {
    grass: grassTile(c),
    tallGrass: tallGrassTile(c),
    path: pathTile(c),
    tree: treeTile(c),
    flower: flowerTile(c),
    rock: rockTile(c),
    gate: gateTile(c),
    water: waterTile(c),
    arena: arenaTile(c),
    torch: torchTile(c),
    sand: sandTile(c),
    highland: highlandTile(c),
    hollow: hollowTile(c),
    cliff: cliffTile(c),
    stairs: stairsTile(c),
    house: houseTile(c),
    door: doorTile(c),
    shoal: shoalTile(c),
    caveFloor: caveFloorTile(c),
    caveWall: caveWallTile(c),
    caveMouth: caveMouthTile(c),
    stalagmite: stalagmiteTile(c),
    canopy: canopyTile(c),
    foliage: foliageTile(c),
    vine: vineTile(c),
    ash: ashTile(c),
    lava: lavaTile(c),
    basalt: basaltTile(c),
  }
}

export type TileKind =
  | 'grass'
  | 'tallGrass'
  | 'path'
  | 'tree'
  | 'flower'
  | 'rock'
  | 'gate'
  | 'water'
  | 'arena'
  | 'torch'
  | 'sand'
  | 'highland'
  | 'hollow'
  | 'cliff'
  | 'stairs'
  | 'house'
  | 'door'
  | 'shoal'
  | 'caveFloor'
  | 'caveWall'
  | 'caveMouth'
  | 'stalagmite'
  | 'canopy'
  | 'foliage'
  | 'vine'
  | 'ash'
  | 'lava'
  | 'basalt'

export type TileSet = Record<TileKind, Sprite>

export const TILES: TileSet = buildTiles(TERRAIN)

/** Ô nào đi vào được. Cây, đá, nước, đuốc thì không. */
export const WALKABLE: Record<TileKind, boolean> = {
  grass: true,
  tallGrass: true,
  path: true,
  flower: true,
  gate: true,
  arena: true,
  sand: true,
  tree: false,
  rock: false,
  water: false,
  torch: false,
  highland: true,
  hollow: true,
  stairs: true,
  // Cửa đi vào được - bước lên là vào nhà. Mái nhà thì không.
  door: true,
  house: false,
  /*
    VÁCH ĐÁ KHÔNG TRÈO QUA ĐƯỢC, và đó là toàn bộ luật của độ cao.

    Không cần một hệ "tầng" riêng với toạ độ z: chỉ cần vây vùng cao bằng vách
    đá rồi chừa đúng một ô bậc thang, là muốn lên xuống phải đi tìm bậc thang -
    đúng luật mà dòng game này vẫn chơi. Một ô không đi qua được nói được trọn
    vẹn điều đó, mà mọi thứ khác trong mã nguồn không phải biết gì thêm.
  */
  cliff: false,
  // Khu môi trường: sàn thì đi được, vách và chướng ngại thì không - cùng một
  // luật với khu đất cao, chỉ khác vật liệu.
  shoal: true,
  caveFloor: true,
  caveWall: false,
  caveMouth: true,
  stalagmite: false,
  canopy: true,
  foliage: false,
  vine: true,
  ash: true,
  lava: false,
  basalt: false,
}

/**
 * Ô nào có quái của một MÔI TRƯỜNG nấp, và là môi trường nào.
 *
 * Bụi cỏ cao không nằm ở đây: quái trong bụi cỏ là quái của môn, như trước.
 */
export const HABITAT_TILE: Partial<Record<TileKind, Habitat>> = {
  shoal: 'sea',
  caveFloor: 'cave',
  canopy: 'forest',
  ash: 'lava',
}
