import { describe, expect, it } from 'vitest'

import { spawnSpot } from './spawn'
import { biomeFor, routeOptionsFor } from './biome'
import { buildRouteMap, isWalkable, type RouteMap } from './routemap'
import { buildWorldMap, totalNodes } from '../../content/worldmap'
import { skillsFor } from '../../content/curriculum'
import type { MasteryMap } from '../../engine/mastery'
import type { Grade, Subject } from '../../content/types'

const NOW = 1_700_000_000_000

/** Đúng tấm bản đồ mà `MapScreen` dựng cho một vùng đất. */
function regionMap(subject: Subject, grade: Grade): RouteMap {
  const biome = biomeFor(subject, grade)
  return buildRouteMap(
    totalNodes(subject, grade) + 1,
    `${subject}-g${grade}`,
    routeOptionsFor(biome, skillsFor(subject, grade).length),
  )
}

/*
  ---- MỘT VÙNG ĐẤT, MỘT TẤM BẢN ĐỒ, CHO MỌI ĐỨA TRẺ ----

  Đây là lỗi làm hai em cùng lớp nhìn thấy nhau sai chỗ, và nó im lặng tuyệt
  đối: địa hình vốn dựng từ SỐ CHẶNG, mà số chặng có thêm một chặng Ôn tập chỉ
  khi CHÍNH em ấy có kỹ năng đến hạn. Bản đồ sinh từ dưới lên nên hai tấm nhìn
  y hệt nhau - chỉ có toạ độ lệch đi bốn hàng.
*/
describe('bản đồ vùng đất giống nhau với mọi đứa trẻ', () => {
  /** Một hồ sơ có kỹ năng Tiếng Việt lớp 2 đến hạn ôn lại. */
  const withDue: MasteryMap = {
    'vietnamese.g2.chinh-ta-phu-am': {
      skillId: 'vietnamese.g2.chinh-ta-phu-am',
      mastery: 60,
      box: 3,
      dueAt: NOW - 86_400_000,
      attempts: 8,
      correct: 5,
      streak: 1,
      lastSeenAt: NOW - 172_800_000,
    },
  }

  it('số chặng THÌ đổi theo từng em - đó là gốc của lỗi', () => {
    const plain = buildWorldMap('vietnamese', 2, 0, {}, NOW)
    const due = buildWorldMap('vietnamese', 2, 0, withDue, NOW)

    expect(due.nodes.length).toBe(plain.nodes.length + 1)
    expect(due.nodes[due.nodes.length - 1]!.kind).toBe('review')
  })

  it('nhưng SỐ Ô CỔNG dựng địa hình thì không, nên hai tấm bản đồ trùng khít', () => {
    // `totalNodes` chỉ đọc chương trình học, không đọc tiến độ của ai cả.
    const slots = totalNodes('vietnamese', 2) + 1
    expect(slots).toBe(skillsFor('vietnamese', 2).length + 2)

    const map = regionMap('vietnamese', 2)
    const again = regionMap('vietnamese', 2)
    expect(map.height).toBe(again.height)
    expect(map.start).toEqual(again.start)
    expect(map.tiles).toEqual(again.tiles)
  })

  /*
    Chỗ dành sẵn cho chặng Ôn tập phải là chỗ CUỐI CÙNG.

    Nhét nó vào giữa thì mọi chặng phía sau bị đẩy lùi một ô cổng, và cả đàn quái
    canh chặng cũng đi theo - tức là lại đúng cái lỗi vừa chữa, chỉ khác chỗ.
  */
  it('ô cổng dành cho chặng Ôn tập nằm ở cuối, sau cả sân đấu trùm', () => {
    const map = regionMap('vietnamese', 2)
    const last = Math.max(...map.gates.map((gate) => gate.nodeIndex))
    const bossIndex = skillsFor('vietnamese', 2).length

    expect(last).toBe(bossIndex + 1)
    expect(map.gates.some((gate) => gate.nodeIndex === bossIndex)).toBe(true)
  })
})

describe('chỗ đặt chân khi bước vào vùng đất', () => {
  const map = regionMap('vietnamese', 2)

  it('luôn là một ô đi lại được', () => {
    for (const seed of ['be-an', 'be-binh', 'be-chi', 'be-dung', 'be-en']) {
      const spot = spawnSpot(map, seed)
      expect(isWalkable(map, spot.x, spot.y), seed).toBe(true)
    }
  })

  it('không bao giờ rơi trúng cổng, cửa nhà hay ô quái ẩn', () => {
    for (let i = 0; i < 60; i++) {
      const spot = spawnSpot(map, `hs-${i}`)
      expect(map.gates.some((g) => g.x === spot.x && g.y === spot.y)).toBe(false)
      expect(map.doors.some((d) => d.x === spot.x && d.y === spot.y)).toBe(false)
      expect(map.secrets.some((s) => s.x === spot.x && s.y === spot.y)).toBe(false)
    }
  })

  /*
    MỌI MÁY PHẢI TÍNH RA CÙNG MỘT KẾT QUẢ.

    Chỗ bạn mình đứng trên màn hình của mình phải đúng là chỗ bạn ấy thấy mình
    đứng. Một phép bốc ngẫu nhiên thật thì hai máy ra hai chỗ, và cả hệ thống
    "thấy nhau trên bản đồ" nói dối ngay từ giây đầu tiên.
  */
  it('cùng một đứa trẻ thì lần nào, máy nào cũng ra đúng một ô', () => {
    expect(spawnSpot(map, 'be-an')).toEqual(spawnSpot(map, 'be-an'))
    expect(spawnSpot(regionMap('vietnamese', 2), 'be-an')).toEqual(spawnSpot(map, 'be-an'))
  })

  it('đứng gần điểm xuất phát, không văng ra giữa bản đồ', () => {
    for (let i = 0; i < 60; i++) {
      const spot = spawnSpot(map, `hs-${i}`)
      expect(Math.abs(spot.x - map.start.x)).toBeLessThanOrEqual(2)
      expect(Math.abs(spot.y - map.start.y)).toBeLessThanOrEqual(2)
    }
  })

  /*
    Cả điểm của hàm này: hai đứa trẻ vào cùng một vùng KHÔNG được chồng khít lên
    nhau. Không thể hứa "không bao giờ trùng" - nhúm ô quanh điểm xuất phát chỉ
    có mươi ô - nhưng phải rải ra thay vì dồn hết vào một chỗ.
  */
  it('một lớp ba mươi em thì rải ra nhiều ô, không dồn về một ô', () => {
    const spots = new Set(
      Array.from({ length: 30 }, (_, i) => {
        const spot = spawnSpot(map, `hoc-sinh-${i}`)
        return `${spot.x},${spot.y}`
      }),
    )
    expect(spots.size).toBeGreaterThanOrEqual(4)
  })

  it('bản đồ hỏng tới mức không còn ô nào quanh đó thì trả về điểm xuất phát', () => {
    expect(spawnSpot({ ...map, tiles: [] }, 'be-an')).toEqual(map.start)
  })
})
