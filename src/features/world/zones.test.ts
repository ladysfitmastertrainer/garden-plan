/**
 * Khu môi trường: hang, tán cây, đảo, núi lửa - và bầy quái của từng nơi.
 *
 * Kiểm trên ĐÚNG hai mươi tấm bản đồ trẻ đi (cùng số ô cổng, cùng hạt giống với
 * `MapScreen`), vì lỗi ở đây chỉ lộ ra trên một vùng cụ thể: một cái hang bị
 * măng đá bịt mất một góc, một hòn đảo không có lối lội ra. Mắt không soát nổi
 * hai mươi tấm bản đồ, test thì soát được.
 */

import { describe, expect, it } from 'vitest'
import { HABITAT_BESTIARY, createEnemy } from '../../content/bestiary'
import { skillsFor } from '../../content/curriculum'
import { GRADES, HABITATS, SUBJECTS, type Grade, type Subject } from '../../content/types'
import { totalNodes } from '../../content/worldmap'
import { createRng } from '../../engine/rng'
import { HABITAT_FAMILY } from '../pixel/habitat-creatures'
import { HABITAT_TILE, WALKABLE } from '../pixel/tiles'
import { biomeFor, routeOptionsFor } from './biome'
import { buildRouteMap, isWalkable, wanderStep, zoneAt, ZONE_HABITAT, type RouteMap } from './routemap'

/** Đúng tấm bản đồ mà `MapScreen` dựng cho một vùng đất. */
function regionMap(subject: Subject, grade: Grade): RouteMap {
  return buildRouteMap(
    totalNodes(subject, grade) + 1,
    `${subject}-g${grade}`,
    routeOptionsFor(biomeFor(subject, grade), skillsFor(subject, grade).length),
  )
}

function reachable(map: RouteMap): Set<string> {
  const seen = new Set([`${map.start.x},${map.start.y}`])
  const queue = [map.start]
  while (queue.length > 0) {
    const { x, y } = queue.shift()!
    for (const [dx, dy] of [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ] as const) {
      const key = `${x + dx},${y + dy}`
      if (seen.has(key) || !isWalkable(map, x + dx, y + dy)) continue
      seen.add(key)
      queue.push({ x: x + dx, y: y + dy })
    }
  }
  return seen
}

const REGIONS = SUBJECTS.flatMap((subject) => GRADES.map((grade) => ({ subject, grade })))

describe('khu môi trường của từng vùng đất', () => {
  it('mỗi môn có đúng kiểu khu của nó, ở cả năm lớp', () => {
    for (const { subject, grade } of REGIONS) {
      const map = regionMap(subject, grade)
      const kind = biomeFor(subject, grade).zone
      expect(map.zones.length, `${subject} lớp ${grade} không có khu nào`).toBeGreaterThan(0)
      for (const zone of map.zones) {
        expect(zone.kind).toBe(kind)
        expect(zone.habitat).toBe(ZONE_HABITAT[zone.kind])
      }
    }
  })

  it('vùng biển có HAI hòn đảo - một hòn là chuyến đi lạc, hai hòn mới là vùng biển', () => {
    for (const grade of GRADES) {
      expect(regionMap('ethics', grade).zones.filter((z) => z.kind === 'islands')).toHaveLength(2)
    }
  })

  it('mọi ô đi được trong khu đều TỚI ĐƯỢC từ chỗ xuất phát', () => {
    for (const { subject, grade } of REGIONS) {
      const map = regionMap(subject, grade)
      const seen = reachable(map)
      for (const zone of map.zones) {
        for (let y = zone.rect.top; y <= zone.rect.bottom; y++) {
          for (let x = zone.rect.left; x <= zone.rect.right; x++) {
            if (!isWalkable(map, x, y)) continue
            expect(seen.has(`${x},${y}`), `${subject} lớp ${grade}: ô (${x},${y}) trong ${zone.kind} bị bịt`).toBe(
              true,
            )
          }
        }
      }
    }
  })

  it('khu có đủ chỗ cho quái của nơi ấy nấp - không phải một ô lẻ loi', () => {
    for (const { subject, grade } of REGIONS) {
      const map = regionMap(subject, grade)
      for (const zone of map.zones) {
        let habitatCells = 0
        for (let y = zone.rect.top; y <= zone.rect.bottom; y++) {
          for (let x = zone.rect.left; x <= zone.rect.right; x++) {
            if (HABITAT_TILE[map.tiles[y]![x]!] === zone.habitat) habitatCells++
          }
        }
        expect(habitatCells, `${subject} lớp ${grade}: ${zone.kind}`).toBeGreaterThanOrEqual(8)
      }
    }
  })

  it('hang, tán cây, núi lửa có đúng MỘT lối vào', () => {
    const ENTRY = { cave: 'caveMouth', canopy: 'vine', volcano: 'stairs' } as const
    for (const { subject, grade } of REGIONS) {
      const map = regionMap(subject, grade)
      for (const zone of map.zones) {
        if (zone.kind === 'islands') continue
        let entries = 0
        let walkableEdge = 0
        for (let y = zone.rect.top; y <= zone.rect.bottom; y++) {
          for (let x = zone.rect.left; x <= zone.rect.right; x++) {
            const onEdge =
              x === zone.rect.left || x === zone.rect.right || y === zone.rect.top || y === zone.rect.bottom
            if (!onEdge) continue
            if (map.tiles[y]![x] === ENTRY[zone.kind]) entries++
            if (WALKABLE[map.tiles[y]![x]!]) walkableEdge++
          }
        }
        expect(entries, `${subject} lớp ${grade}`).toBe(1)
        // Vách kín: lối vào là chỗ DUY NHẤT trên vành khu đi qua được.
        expect(walkableEdge, `${subject} lớp ${grade}`).toBe(1)
      }
    }
  })

  it('mỗi khu giấu một con quái ẩn ở chỗ đi được bên trong nó', () => {
    for (const { subject, grade } of REGIONS) {
      const map = regionMap(subject, grade)
      for (const zone of map.zones) {
        expect(zone.secret).not.toBeNull()
        const { x, y } = zone.secret!
        expect(isWalkable(map, x, y)).toBe(true)
        expect(zoneAt(map, x, y)).toBe(zone)
        expect(map.secrets).toContainEqual({ x, y })
      }
    }
  })

  it('ra đảo PHẢI lội nước nông - không có cầu hay dải đất nào nối sẵn', () => {
    for (const grade of GRADES) {
      const map = regionMap('ethics', grade)
      // Loang từ chỗ xuất phát nhưng coi nước nông là tường.
      const seen = new Set([`${map.start.x},${map.start.y}`])
      const queue = [map.start]
      while (queue.length > 0) {
        const { x, y } = queue.shift()!
        for (const [dx, dy] of [
          [0, 1],
          [0, -1],
          [1, 0],
          [-1, 0],
        ] as const) {
          const key = `${x + dx},${y + dy}`
          if (seen.has(key) || !isWalkable(map, x + dx, y + dy)) continue
          if (map.tiles[y + dy]![x + dx] === 'shoal') continue
          seen.add(key)
          queue.push({ x: x + dx, y: y + dy })
        }
      }
      for (const zone of map.zones) {
        expect(seen.has(`${zone.secret!.x},${zone.secret!.y}`), `lớp ${grade}`).toBe(false)
      }
    }
  })

  it('bàn hướng dẫn KHÔNG có khu nào - bài học đi bộ không thành chuyến thám hiểm', () => {
    const biome = { ...biomeFor('math', 1), zone: null }
    expect(buildRouteMap(4, 'tutorial', routeOptionsFor(biome, 3)).zones).toEqual([])
  })

  it('cùng hạt giống thì ra cùng khu - bạn cùng lớp thấy đúng cái hang mình thấy', () => {
    expect(regionMap('math', 3).zones).toEqual(regionMap('math', 3).zones)
  })
})

describe('thủy quái ngoài khơi', () => {
  const near = (map: RouteMap, x: number, y: number, d: number) => {
    for (let dy = -d; dy <= d; dy++) {
      for (let dx = -d; dx <= d; dx++) {
        if (Math.abs(dx) + Math.abs(dy) === d && isWalkable(map, x + dx, y + dy)) return true
      }
    }
    return false
  }

  it('vùng biển có ít nhất hai con, các vùng khác thì không có con nào', () => {
    for (const { subject, grade } of REGIONS) {
      const lairs = regionMap(subject, grade).seaLairs
      if (subject === 'ethics') expect(lairs.length, `lớp ${grade}`).toBeGreaterThanOrEqual(2)
      else expect(lairs, `${subject} lớp ${grade}`).toEqual([])
    }
  })

  it('ở ngoài nước, không chắn ngay mép - nhưng chỉ một sải bơi là tới chỗ trẻ đứng', () => {
    for (const grade of GRADES) {
      const map = regionMap('ethics', grade)
      for (const { x, y } of map.seaLairs) {
        expect(map.tiles[y]![x]).toBe('water')
        expect(near(map, x, y, 1), `lớp ${grade}: (${x},${y}) sát bờ`).toBe(false)
        expect(near(map, x, y, 2), `lớp ${grade}: (${x},${y}) xa quá, không bao giờ gặp`).toBe(true)
      }
    }
  })

  it('ở cách xa sân đấu trùm - không bơi chồng lên đuốc góc sân', () => {
    for (const grade of GRADES) {
      const map = regionMap('ethics', grade)
      const arena = map.arena!
      for (const { x, y } of map.seaLairs) {
        const gap = Math.max(
          Math.max(arena.left - x, x - arena.right, 0),
          Math.max(arena.top - y, y - arena.bottom, 0),
        )
        expect(gap, `lớp ${grade}: (${x},${y})`).toBeGreaterThanOrEqual(5)
      }
    }
  })

  it('chỉ bơi trong nước, dù bơi bao lâu', () => {
    const map = regionMap('ethics', 3)
    const rng = createRng('boi')
    const inWater = (x: number, y: number) => map.tiles[y]?.[x] === 'water'
    for (const lair of map.seaLairs) {
      let pos = lair
      for (let i = 0; i < 300; i++) {
        pos = wanderStep(map, pos, lair, 2, rng, undefined, inWater)
        expect(map.tiles[pos.y]![pos.x]).toBe('water')
      }
    }
  })

  it('thủy quái mang tên và hệ đúng, không bị gắn chữ của quái trên cạn', () => {
    const enemy = createEnemy({
      subject: 'ethics',
      grade: 3,
      nodeIndex: 4,
      isBoss: false,
      rng: createRng('t'),
      variant: 0,
      habitat: 'deep',
    })
    expect(enemy.name).toBe('Rắn Biển Ba Trăm Thước')
    expect(enemy.element).toBe('ethics')
  })
})

describe('bầy quái của từng môi trường', () => {
  it('mỗi môi trường có đủ bốn tên và bốn hình, khớp nhau từng con', () => {
    for (const habitat of HABITATS) {
      expect(HABITAT_BESTIARY[habitat]).toHaveLength(4)
      expect(HABITAT_FAMILY[habitat]).toHaveLength(4)
    }
  })

  it('quái hoang của một môi trường lấy tên trong bầy nơi ấy, nhưng vẫn mang hệ của môn', () => {
    for (const habitat of HABITATS) {
      for (let variant = 0; variant < 4; variant++) {
        const enemy = createEnemy({
          subject: 'ethics',
          grade: 2,
          nodeIndex: 1,
          isBoss: false,
          rng: createRng('x'),
          variant,
          habitat,
        })
        expect(enemy.name).toBe(HABITAT_BESTIARY[habitat][variant]!.name)
        expect(enemy.habitat).toBe(habitat)
        // Câu hỏi vẫn là câu Đạo đức, nên phép khắc chế vẫn tính theo hệ Ánh Sáng.
        expect(enemy.element).toBe('ethics')
      }
    }
  })

  it('không có môi trường thì vẫn là quái của môn như trước', () => {
    const enemy = createEnemy({ subject: 'math', grade: 1, nodeIndex: 0, isBoss: false, rng: createRng('y'), variant: 0 })
    expect(enemy.habitat).toBeUndefined()
    expect(enemy.name).toBe('Slime Con Số')
  })

  it('trùm không bao giờ đổi theo môi trường', () => {
    const boss = createEnemy({
      subject: 'math',
      grade: 1,
      nodeIndex: 5,
      isBoss: true,
      rng: createRng('z'),
      habitat: 'cave',
    })
    expect(boss.habitat).toBeUndefined()
    expect(boss.name).toContain('Rồng Số Học')
  })
})
