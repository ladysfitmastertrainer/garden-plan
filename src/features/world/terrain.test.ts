/**
 * Độ cao, nhà và quái ẩn trên bản đồ vùng.
 *
 * Cả cơ chế độ cao đứng trên đúng một câu: vây kín bằng ô không đi qua được, rồi
 * chừa một ô bậc thang. Câu ấy đơn giản, nhưng nó hỏng theo hai kiểu mà mắt
 * không bắt được và cũng không nổ ra thành lỗi:
 *
 *   - VÁCH HỞ: một chỗ nào đó trong vách bị đè bởi đường đi hay cảnh vật, và
 *     trẻ trèo thẳng lên khu đất cao mà không cần bậc thang. Khu đất vẫn trông
 *     y hệt, chỉ là luật chơi biến mất.
 *   - VÁCH KÍN QUÁ: khu đất hoặc ngôi nhà đè lên đường chính, và một cổng chặng
 *     nào đó không còn tới được. Trẻ đi hết bản đồ mà không hiểu vì sao tắc.
 *
 * Nên test ở đây không đo "có bao nhiêu ô cao", mà đo hai điều: mọi chặng vẫn
 * tới được, và khu đất cao CHỈ vào được qua bậc thang.
 */

import { describe, expect, it } from 'vitest'

import { buildWorldMap } from '../../content/worldmap'
import { SUBJECTS, type Grade, type Subject } from '../../content/types'
import { WALKABLE } from '../pixel/tiles'
import { biomeFor } from './biome'
import { buildRouteMap, isWalkable, type ArenaRect, type RouteMap } from './routemap'

const GRADES: Grade[] = [1, 2, 3, 4, 5]

/**
 * Bản đồ dựng ĐÚNG như trong game, kể cả số chặng.
 *
 * Số chặng không phải chi tiết vụn: nó quyết định bản đồ cao bao nhiêu hàng, cổng
 * rơi vào đâu, và sân đấu trùm nằm chỗ nào. Bản đầu của tệp này gõ cứng bảy
 * chặng cho gọn, và bảy chặng là một bản đồ KHÔNG TỒN TẠI - vùng thật có mười ba
 * tới mười chín. Test xanh hết, mà mở game ra thì vùng Âm nhạc không có khu đất
 * cao nào và vùng Toán không có ngôi nhà nào.
 */
function mapFor(subject: Subject, grade: Grade): RouteMap {
  const biome = biomeFor(subject, grade)
  // Đúng danh sách chặng mà game dựng ra, kể cả chặng trùm và chặng ôn tập.
  const nodes = buildWorldMap(subject, grade, 0, {}, 0).nodes
  return buildRouteMap(nodes.length, `${subject}-g${grade}`, {
    shape: biome.shape,
    width: biome.width,
    ground: biome.ground,
    border: biome.border,
    gateHalo: biome.gateHalo,
    scatter: biome.scatter,
    bossIndex: nodes.findIndex((node) => node.kind === 'boss'),
  })
}

/** Loang từ một chỗ, nhưng KHÔNG được bước qua những ô bị cấm. */
function flood(map: RouteMap, from: { x: number; y: number }, blocked: Set<string> = new Set()) {
  const seen = new Set<string>([`${from.x},${from.y}`])
  const queue = [from]
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
      if (seen.has(key) || blocked.has(key) || !isWalkable(map, nx, ny)) continue
      seen.add(key)
      queue.push({ x: nx, y: ny })
    }
  }
  return seen
}

/** Các ô đi lại được BÊN TRONG một khu đất, tức là không tính vòng vách. */
function interior(map: RouteMap, rect: ArenaRect): Array<{ x: number; y: number }> {
  const out: Array<{ x: number; y: number }> = []
  for (let y = rect.top + 1; y <= rect.bottom - 1; y++) {
    for (let x = rect.left + 1; x <= rect.right - 1; x++) {
      if (isWalkable(map, x, y)) out.push({ x, y })
    }
  }
  return out
}

describe('khu đất cao và khu trũng', () => {
  it('mọi môn mọi lớp đều có CẢ khu cao lẫn khu trũng', () => {
    /*
      Đòi cả hai, không phải "ít nhất một".

      Bản trước của test này chấp nhận một trong hai, và nó bỏ lọt đúng thứ cần
      bắt: vùng Toán có khu trũng nên test xanh, trong khi khu CAO - nơi có nhà
      và có quái ẩn - không bao giờ dựng được vì sân đấu trùm chiếm mất chỗ. Cả
      một tính năng biến mất sau một dấu "??".
    */
    for (const subject of SUBJECTS) {
      for (const grade of GRADES) {
        const map = mapFor(subject, grade)
        expect(map.plateau, `${subject} lớp ${grade}: thiếu khu đất cao`).not.toBeNull()

        /*
          Khu trũng đòi ở mọi vùng TRỪ Âm nhạc.

          Vùng Âm nhạc dựng bản đồ thành một khuông nhạc, dòng kẻ cách nhau ba
          hàng, mà khu đất mỏng nhất cũng chiếm bốn - đặt ở đâu trong khuông
          cũng cắt đứt dòng kẻ. Lề trên đủ chỗ cho khu cao, lề dưới thì không.
          Đây là đánh đổi có chủ ý, nên nó được viết ra thành test chứ không
          nằm im trong mã: giữ hình dáng riêng của vùng đất đáng hơn là có đủ
          cả hai kiểu địa hình ở mọi nơi.
        */
        if (subject !== 'music') {
          expect(map.hollow, `${subject} lớp ${grade}: thiếu khu trũng`).not.toBeNull()
        }
      }
    }
  })

  it('CHỈ vào được khu đất cao qua bậc thang - đây là cả luật chơi', () => {
    /*
      Bịt đúng ô bậc thang rồi loang lại: nếu vẫn còn lối vào bên trong thì vách
      đá đang hở ở đâu đó, và khu đất cao chỉ còn là một mảng màu khác.
    */
    for (const subject of SUBJECTS) {
      for (const grade of GRADES) {
        const map = mapFor(subject, grade)
        for (const rect of [map.plateau, map.hollow]) {
          if (!rect) continue
          const inside = interior(map, rect)
          if (inside.length === 0) continue

          const blocked = new Set(map.stairs.map((st) => `${st.x},${st.y}`))
          const withoutStairs = flood(map, map.start, blocked)
          for (const cell of inside) {
            expect(
              withoutStairs.has(`${cell.x},${cell.y}`),
              `${subject} lớp ${grade}: ô ${cell.x},${cell.y} vào được mà không cần bậc thang`,
            ).toBe(false)
          }
        }
      }
    }
  })

  it('nhưng CÓ bậc thang thì vào được thật', () => {
    // Một khu đất vây kín hoàn toàn cũng "đúng luật", mà lại là một bức tranh
    // dán trên tường. Phải kiểm cả chiều ngược lại.
    for (const subject of SUBJECTS) {
      for (const grade of GRADES) {
        const map = mapFor(subject, grade)
        const open = flood(map, map.start)
        for (const rect of [map.plateau, map.hollow]) {
          if (!rect) continue
          const inside = interior(map, rect)
          if (inside.length === 0) continue
          const reached = inside.filter((c) => open.has(`${c.x},${c.y}`))
          expect(reached.length, `${subject} lớp ${grade}`).toBeGreaterThan(0)
        }
      }
    }
  })

  it('khu đất KHÔNG bao giờ nuốt mất một chặng nào', () => {
    // Lỗi tệ nhất có thể có: trẻ đi hết bản đồ mà không hiểu vì sao tắc.
    for (const subject of SUBJECTS) {
      for (const grade of GRADES) {
        const map = mapFor(subject, grade)
        const open = flood(map, map.start)
        for (const gate of map.gates) {
          expect(open.has(`${gate.x},${gate.y}`), `${subject} lớp ${grade} chặng ${gate.nodeIndex}`).toBe(true)
        }
      }
    }
  })

  it('bậc thang nằm trên vách, không lơ lửng giữa đồng', () => {
    for (const subject of SUBJECTS) {
      for (const grade of GRADES) {
        const map = mapFor(subject, grade)
        for (const st of map.stairs) {
          const onEdge = [map.plateau, map.hollow].some(
            (r) => r && st.y === r.bottom && st.x > r.left && st.x < r.right,
          )
          expect(onEdge, `${subject} lớp ${grade}: bậc thang ${st.x},${st.y}`).toBe(true)
        }
      }
    }
  })
})

describe('nhà trên khu đất cao', () => {
  it('cửa đi vào được, mái thì không', () => {
    for (const subject of SUBJECTS) {
      for (const grade of GRADES) {
        const map = mapFor(subject, grade)
        for (const door of map.doors) {
          expect(map.tiles[door.y]![door.x], `${subject} lớp ${grade}`).toBe('door')
          expect(WALKABLE.door).toBe(true)
          // Mái ngay trên cửa, và mái thì chặn đường.
          expect(map.tiles[door.y - 1]![door.x], `${subject} lớp ${grade}`).toBe('house')
          expect(WALKABLE.house).toBe(false)
        }
      }
    }
  })

  it('mọi vùng đất đều CÓ nhà, nằm trong khu đất cao và tới được', () => {
    for (const subject of SUBJECTS) {
      for (const grade of GRADES) {
        const map = mapFor(subject, grade)
        // Đòi có nhà thật, không cho phép "vùng này không có nhà nào cũng được".
        expect(map.doors.length, `${subject} lớp ${grade}: không có ngôi nhà nào`).toBeGreaterThan(0)
        expect(map.plateau, `${subject} lớp ${grade}`).not.toBeNull()
        const open = flood(map, map.start)
        for (const door of map.doors) {
          expect(door.x).toBeGreaterThan(map.plateau!.left)
          expect(door.x).toBeLessThan(map.plateau!.right)
          expect(open.has(`${door.x},${door.y}`), `${subject} lớp ${grade}: cửa không tới được`).toBe(true)
        }
      }
    }
  })

  it('nhà KHÔNG bao giờ dựng đè lên bậc thang', () => {
    // Dựng đè lên đó là bịt luôn lối vào, và cả khu đất cao thành vô nghĩa.
    for (const subject of SUBJECTS) {
      for (const grade of GRADES) {
        const map = mapFor(subject, grade)
        for (const door of map.doors) {
          expect(map.stairs.some((st) => st.x === door.x && st.y === door.y)).toBe(false)
        }
      }
    }
  })
})

describe('quái ẩn', () => {
  it('có chỗ ẩn, và tới được', () => {
    for (const subject of SUBJECTS) {
      for (const grade of GRADES) {
        const map = mapFor(subject, grade)
        // Một chỗ trên khu cao, một dưới khu trũng - vùng Âm nhạc không có khu
        // trũng nên chỉ có một.
        expect(map.secrets.length, `${subject} lớp ${grade}`).toBe(subject === 'music' ? 1 : 2)
        const open = flood(map, map.start)
        for (const spot of map.secrets) {
          expect(open.has(`${spot.x},${spot.y}`), `${subject} lớp ${grade}`).toBe(true)
        }
      }
    }
  })

  it('KHÔNG nằm trên đường chính, và không cạnh cổng', () => {
    /*
      Đây là điều làm nó "ẩn". Một ô ẩn nằm giữa đường thì trẻ giẫm trúng trong
      lúc đi ngang, và phần thưởng hoá ra trả cho việc đi bộ chứ không cho việc
      tìm - mà cả điểm của nó là trả cho việc tìm.
    */
    for (const subject of SUBJECTS) {
      for (const grade of GRADES) {
        const map = mapFor(subject, grade)
        for (const spot of map.secrets) {
          expect(map.tiles[spot.y]![spot.x], `${subject} lớp ${grade}`).not.toBe('path')
          for (const gate of map.gates) {
            const far = Math.abs(gate.x - spot.x) + Math.abs(gate.y - spot.y)
            expect(far, `${subject} lớp ${grade}: quá gần cổng`).toBeGreaterThan(1)
          }
        }
      }
    }
  })

  it('nằm trong khu phải leo thang mới vào được', () => {
    // Khó tìm, chứ không phải khó một cách ngẫu nhiên: muốn tới được thì trước
    // hết phải tìm ra bậc thang, rồi mới đi men tới góc trong cùng.
    for (const subject of SUBJECTS) {
      for (const grade of GRADES) {
        const map = mapFor(subject, grade)
        const blocked = new Set(map.stairs.map((st) => `${st.x},${st.y}`))
        const withoutStairs = flood(map, map.start, blocked)
        for (const spot of map.secrets) {
          expect(
            withoutStairs.has(`${spot.x},${spot.y}`),
            `${subject} lớp ${grade}: chỗ ẩn tới được mà không cần leo thang`,
          ).toBe(false)
        }
      }
    }
  })

  it('cùng hạt giống thì chỗ ẩn không đổi - trẻ chỉ cho bạn được', () => {
    const a = mapFor('math', 2)
    const b = mapFor('math', 2)
    expect(a.secrets).toEqual(b.secrets)
    expect(a.doors).toEqual(b.doors)
  })
})
