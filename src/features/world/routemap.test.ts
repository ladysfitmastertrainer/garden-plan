/**
 * Bản đồ sinh ra phải ĐI ĐƯỢC: mọi chặng phải tới được từ chỗ xuất phát.
 * Nếu một cổng bị cây vây kín thì trẻ kẹt luôn, không chơi tiếp được - test này
 * là thứ duy nhất bắt được lỗi đó trước khi trẻ gặp.
 *
 * Từ khi mỗi môn có một kiểu bố cục riêng, số đường đi hỏng có thể xảy ra tăng
 * lên hẳn: đuốc quanh sân đấu trùm có thể bịt lối vào, biển có thể ăn lẹm vào
 * đường, lối mòn ngẫu nhiên có thể tự cắt mình. Nên phần loang đường được chạy
 * cho CẢ BỐN kiểu bố cục, mọi số chặng thực tế.
 */

import { describe, expect, it } from 'vitest'
import { GRADES, SUBJECTS } from '../../content/types'
import { biomeFor } from './biome'
import { buildRouteMap, gateAt, isWalkable, MAP_WIDTH, wanderStep, type RouteMap } from './routemap'

/** Tham số dựng bản đồ đúng như lúc chơi thật. */
function optionsFor(subject: (typeof SUBJECTS)[number], grade: (typeof GRADES)[number], count: number) {
  const biome = biomeFor(subject, grade)
  return {
    shape: biome.shape,
    width: biome.width,
    ground: biome.ground,
    border: biome.border,
    gateHalo: biome.gateHalo,
    scatter: biome.scatter,
    // Chặng áp chót là trùm, chặng chót là ôn tập - đúng thứ tự worldmap.ts dựng.
    bossIndex: Math.max(0, count - 2),
  }
}

/** Loang từ chỗ xuất phát, trả về tập ô tới được. */
function reachable(map: RouteMap): Set<string> {
  const seen = new Set<string>()
  const queue = [map.start]
  seen.add(`${map.start.x},${map.start.y}`)

  while (queue.length > 0) {
    const { x, y } = queue.shift()!
    for (const [dx, dy] of [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ] as const) {
      const nx = x + dx
      const ny = y + dy
      const key = `${nx},${ny}`
      if (seen.has(key) || !isWalkable(map, nx, ny)) continue
      seen.add(key)
      queue.push({ x: nx, y: ny })
    }
  }
  return seen
}

describe('buildRouteMap', () => {
  it('kích thước lưới đúng và mọi hàng đủ ô', () => {
    const map = buildRouteMap(7, 'math-1')
    expect(map.width).toBe(MAP_WIDTH)
    expect(map.tiles).toHaveLength(map.height)
    for (const row of map.tiles) expect(row).toHaveLength(MAP_WIDTH)
  })

  it('bản đồ cao lên khi có nhiều chặng hơn', () => {
    expect(buildRouteMap(9, 's').height).toBeGreaterThan(buildRouteMap(4, 's').height)
  })

  it('mỗi chặng có đúng một cổng', () => {
    const map = buildRouteMap(6, 'v-2')
    expect(map.gates).toHaveLength(6)
    for (const gate of map.gates) {
      expect(map.tiles[gate.y]![gate.x]).toBe('gate')
    }
  })

  it('chỗ xuất phát đi vào được', () => {
    const map = buildRouteMap(6, 'start')
    expect(isWalkable(map, map.start.x, map.start.y)).toBe(true)
  })

  it('MỌI chặng đều tới được, ở MỌI môn và MỌI lớp', () => {
    for (const subject of SUBJECTS) {
      for (const grade of GRADES) {
        for (let count = 4; count <= 10; count++) {
          const map = buildRouteMap(count, `${subject}-g${grade}`, optionsFor(subject, grade, count))
          const seen = reachable(map)
          for (const gate of map.gates) {
            expect(
              seen.has(`${gate.x},${gate.y}`),
              `${subject} lớp ${grade}, ${count} chặng: cổng ${gate.nodeIndex} bị vây kín`,
            ).toBe(true)
          }
        }
      }
    }
  })

  it('viền bản đồ đóng kín bằng đúng vật liệu của vùng đất', () => {
    for (const subject of SUBJECTS) {
      const biome = biomeFor(subject, 3)
      const map = buildRouteMap(6, `${subject}-bien`, optionsFor(subject, 3, 6))
      for (let x = 0; x < map.width; x++) {
        expect(map.tiles[0]![x]).toBe(biome.border)
        expect(map.tiles[map.height - 1]![x]).toBe(biome.border)
      }
      for (let y = 0; y < map.height; y++) {
        expect(map.tiles[y]![0]).toBe(biome.border)
        expect(map.tiles[y]![map.width - 1]).toBe(biome.border)
      }
    }
  })

  it('không đi xuyên qua cây, đá, nước hay đuốc', () => {
    const map = buildRouteMap(6, 'chan')
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const kind = map.tiles[y]![x]!
        if (kind === 'tree' || kind === 'rock' || kind === 'water' || kind === 'torch') {
          expect(isWalkable(map, x, y)).toBe(false)
        }
      }
    }
  })

  it('cùng hạt giống thì ra cùng bản đồ - trẻ quay lại thấy đúng nơi cũ', () => {
    const a = buildRouteMap(6, 'math-g1')
    const b = buildRouteMap(6, 'math-g1')
    expect(a.tiles).toEqual(b.tiles)
    expect(a.gates).toEqual(b.gates)
  })

  it('môn khác nhau thì cảnh vật khác nhau', () => {
    const a = buildRouteMap(6, 'math-g1')
    const b = buildRouteMap(6, 'music-g1')
    expect(a.tiles).not.toEqual(b.tiles)
  })

  it('gateAt tìm đúng cổng, ô thường thì trả null', () => {
    const map = buildRouteMap(5, 'tim')
    const gate = map.gates[2]!
    expect(gateAt(map, gate.x, gate.y)?.nodeIndex).toBe(2)
    expect(gateAt(map, 0, 0)).toBeNull()
  })

  it('đi ra ngoài lưới thì không đi được, không ném lỗi', () => {
    const map = buildRouteMap(4, 'ngoai')
    expect(isWalkable(map, -1, 0)).toBe(false)
    expect(isWalkable(map, 0, -1)).toBe(false)
    expect(isWalkable(map, map.width, 0)).toBe(false)
    expect(isWalkable(map, 0, map.height)).toBe(false)
  })

  it('một chặng duy nhất vẫn sinh được bản đồ hợp lệ', () => {
    const map = buildRouteMap(1, 'mot')
    expect(map.gates).toHaveLength(1)
    expect(reachable(map).has(`${map.gates[0]!.x},${map.gates[0]!.y}`)).toBe(true)
  })
})

describe('sân đấu trùm', () => {
  it('không có chặng trùm thì không có sân', () => {
    expect(buildRouteMap(6, 'khong-trum').arena).toBeNull()
  })

  it('cổng trùm nằm trong sân, và sân lát đá thật sự', () => {
    const map = buildRouteMap(8, 'trum', { ...optionsFor('math', 3, 8), bossIndex: 6 })
    const arena = map.arena!
    const boss = map.gates[6]!

    expect(boss.x).toBeGreaterThan(arena.left)
    expect(boss.x).toBeLessThan(arena.right)
    expect(boss.y).toBeGreaterThanOrEqual(arena.top)
    expect(boss.y).toBeLessThanOrEqual(arena.bottom)

    // Trừ bốn góc đuốc và chính ô cổng, còn lại phải là nền sân.
    let floor = 0
    for (let y = arena.top; y <= arena.bottom; y++) {
      for (let x = arena.left; x <= arena.right; x++) {
        if (map.tiles[y]![x] === 'arena') floor++
      }
    }
    expect(floor).toBeGreaterThan(10)
  })

  it('bốn góc sân là đuốc', () => {
    const map = buildRouteMap(8, 'duoc', { ...optionsFor('vietnamese', 2, 8), bossIndex: 6 })
    const a = map.arena!
    for (const [x, y] of [
      [a.left, a.top],
      [a.right, a.top],
      [a.left, a.bottom],
      [a.right, a.bottom],
    ] as const) {
      expect(map.tiles[y]![x]).toBe('torch')
    }
  })

  it('đuốc KHÔNG bịt lối vào sân - trẻ luôn tới được cổng trùm', () => {
    // Đây là rủi ro thật: đặt đuốc dày thêm một ô là nhốt trẻ ở ngoài sân, mà
    // lỗi đó chỉ lộ ra ở đúng vài số chặng nhất định.
    for (const subject of SUBJECTS) {
      for (let count = 2; count <= 10; count++) {
        const bossIndex = count - 2
        const map = buildRouteMap(count, `${subject}-${count}`, {
          ...optionsFor(subject, 4, count),
          bossIndex,
        })
        const boss = map.gates[bossIndex]!
        expect(
          reachable(map).has(`${boss.x},${boss.y}`),
          `${subject}, ${count} chặng: cổng trùm bị đuốc bịt`,
        ).toBe(true)
      }
    }
  })
})

describe('bốn kiểu bố cục khác nhau thật, không chỉ khác màu', () => {
  const count = 8
  const maps = Object.fromEntries(
    SUBJECTS.map((subject) => [
      subject,
      buildRouteMap(count, `${subject}-hinh`, optionsFor(subject, 3, count)),
    ]),
  )

  it('Đạo đức có biển, các môn khác thì không có biển giữa bản đồ', () => {
    const seaInside = (map: RouteMap) => {
      let n = 0
      for (let y = 1; y < map.height - 1; y++) {
        for (let x = 1; x < map.width - 1; x++) if (map.tiles[y]![x] === 'water') n++
      }
      return n
    }
    expect(seaInside(maps.ethics!)).toBeGreaterThan(10)
    expect(seaInside(maps.math!)).toBe(0)
    expect(seaInside(maps.vietnamese!)).toBe(0)
  })

  it('Âm nhạc có dòng kẻ chạy hết bề ngang - đó là khuông nhạc', () => {
    const fullRows = (map: RouteMap) =>
      map.tiles.filter((row, y) => {
        if (y === 0 || y === map.height - 1) return false
        return row.slice(1, -1).every((t) => t === 'path' || t === 'gate')
      }).length

    expect(fullRows(maps.music!)).toBeGreaterThanOrEqual(5)
    expect(fullRows(maps.vietnamese!)).toBe(0)
  })

  it('Toán có đường rộng hai ô - bậc đá, không phải lối mòn', () => {
    const pathCount = (map: RouteMap) =>
      map.tiles.flat().filter((t) => t === 'path').length / (map.width * map.height)

    expect(pathCount(maps.math!)).toBeGreaterThan(pathCount(maps.vietnamese!))
  })

  it('Tiếng Việt rậm cây hơn hẳn các vùng khác', () => {
    const trees = (map: RouteMap) =>
      map.tiles.flat().filter((t) => t === 'tree').length / (map.width * map.height)

    expect(trees(maps.vietnamese!)).toBeGreaterThan(trees(maps.math!))
    expect(trees(maps.vietnamese!)).toBeGreaterThan(trees(maps.ethics!))
  })

  it('hai lớp khác nhau của cùng một môn có bảng màu khác nhau', () => {
    for (const subject of SUBJECTS) {
      const g1 = biomeFor(subject, 1)
      const g5 = biomeFor(subject, 5)
      expect(g1.colors.grass, `${subject}: lớp 1 và lớp 5 trùng màu`).not.toBe(g5.colors.grass)
    }
  })
})

describe('hang quái dữ', () => {
  it('bản đồ đủ dài thì có hang, và hang nằm LỆCH khỏi đường chính', () => {
    for (const subject of SUBJECTS) {
      const map = buildRouteMap(8, `${subject}-hang`, optionsFor(subject, 3, 8))
      expect(map.den, `${subject}: không có hang`).not.toBeNull()
      // Lệch khỏi cổng: nếu hang trùm lên cổng thì trẻ đi qua là dính mini boss.
      for (const gate of map.gates) {
        const inside =
          gate.x >= map.den!.left &&
          gate.x <= map.den!.right &&
          gate.y >= map.den!.top &&
          gate.y <= map.den!.bottom
        expect(inside, `${subject}: cổng ${gate.nodeIndex} nằm trong hang`).toBe(false)
      }
    }
  })

  it('hang luôn ĐI TỚI ĐƯỢC - nếu không thì mini boss thành vô nghĩa', () => {
    for (const subject of SUBJECTS) {
      for (let count = 3; count <= 10; count++) {
        const map = buildRouteMap(count, `${subject}-${count}`, optionsFor(subject, 4, count))
        if (!map.den) continue
        const seen = reachable(map)
        for (const spot of map.denSpots) {
          expect(
            seen.has(`${spot.x},${spot.y}`),
            `${subject}, ${count} chặng: chỗ mini boss bị vây kín`,
          ).toBe(true)
        }
      }
    }
  })

  it('có chỗ đứng cho mini boss, và mọi chỗ đều nằm trong hang', () => {
    const map = buildRouteMap(8, 'cho-dung', optionsFor('math', 3, 8))
    expect(map.denSpots.length).toBeGreaterThan(0)
    for (const spot of map.denSpots) {
      expect(spot.x).toBeGreaterThanOrEqual(map.den!.left)
      expect(spot.x).toBeLessThanOrEqual(map.den!.right)
      expect(spot.y).toBeGreaterThanOrEqual(map.den!.top)
      expect(spot.y).toBeLessThanOrEqual(map.den!.bottom)
    }
  })

  it('bản đồ quá ngắn thì không có hang, không ném lỗi', () => {
    const map = buildRouteMap(2, 'ngan', optionsFor('math', 1, 2))
    expect(map.den).toBeNull()
    expect(map.denSpots).toEqual([])
  })
})

describe('quái đi lang thang', () => {
  const map = () => buildRouteMap(8, 'lang-thang', optionsFor('math', 3, 8))
  /** RNG giả: luôn đi, luôn chọn hướng đầu tiên. */
  const always = { int: () => 0, chance: () => true }
  const never = { int: () => 0, chance: () => false }

  it('phần lớn thời gian đứng yên - quái chạy loạn thì trẻ không bấm trúng', () => {
    const m = map()
    const gate = m.gates[0]!
    expect(wanderStep(m, gate, gate, 2, never)).toEqual(gate)
  })

  it('không bao giờ đi ra khỏi bán kính quanh chỗ của mình', () => {
    const m = map()
    const anchor = m.gates[2]!
    let pos = { x: anchor.x, y: anchor.y }
    for (let i = 0; i < 80; i++) {
      pos = wanderStep(m, pos, anchor, 2, {
        int: (min, max) => (i * 7) % (max - min + 1) + min,
        chance: () => true,
      })
      expect(Math.abs(pos.x - anchor.x)).toBeLessThanOrEqual(2)
      expect(Math.abs(pos.y - anchor.y)).toBeLessThanOrEqual(2)
    }
  })

  it('không bao giờ bước vào ô không đi được', () => {
    const m = map()
    const anchor = m.gates[1]!
    let pos = { x: anchor.x, y: anchor.y }
    for (let i = 0; i < 80; i++) {
      pos = wanderStep(m, pos, anchor, 2, {
        int: (min, max) => (i * 3) % (max - min + 1) + min,
        chance: () => true,
      })
      expect(isWalkable(m, pos.x, pos.y), `bước vào ô chắn ở ${pos.x},${pos.y}`).toBe(true)
    }
  })

  it('bị vây kín bốn phía thì đứng yên chứ không kẹt vòng lặp', () => {
    const m = map()
    // Một ô cây giữa rừng: xung quanh không có ô nào đi được trong bán kính 0.
    const stuck = { x: 0, y: 0 }
    expect(wanderStep(m, stuck, stuck, 0, always)).toEqual(stuck)
  })
})

describe('mini boss không rời hang', () => {
  it('bị giam trong khung hang dù đi bao nhiêu bước', () => {
    // Ra khỏi hang là hết ý nghĩa: trẻ gặp mini boss ngay trên đường đi mà
    // chẳng cần tìm, còn hang thành một khoảnh đất trống.
    const map = buildRouteMap(8, 'giam', optionsFor('math', 3, 8))
    const den = map.den!
    let pos = map.denSpots[0]!
    for (let i = 0; i < 100; i++) {
      pos = wanderStep(map, pos, map.denSpots[0]!, 2, {
        int: (min, max) => (i * 5) % (max - min + 1) + min,
        chance: () => true,
      }, den)
      expect(pos.x).toBeGreaterThanOrEqual(den.left)
      expect(pos.x).toBeLessThanOrEqual(den.right)
      expect(pos.y).toBeGreaterThanOrEqual(den.top)
      expect(pos.y).toBeLessThanOrEqual(den.bottom)
    }
  })

  it('quái thường KHÔNG bị giam - vẫn đi quanh chặng của nó', () => {
    const map = buildRouteMap(8, 'tu-do', optionsFor('math', 3, 8))
    const anchor = map.gates[0]!
    const moved = wanderStep(map, anchor, anchor, 2, { int: () => 0, chance: () => true })
    expect(moved).not.toEqual(anchor)
  })
})
