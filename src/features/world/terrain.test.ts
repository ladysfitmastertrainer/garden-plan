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

function build(subject: Subject, grade: Grade, count: number): RouteMap {
  const biome = biomeFor(subject, grade)
  const nodes = buildWorldMap(subject, grade, 0, {}, 0).nodes
  return buildRouteMap(count, `${subject}-g${grade}`, {
    shape: biome.shape,
    width: biome.width,
    ground: biome.ground,
    border: biome.border,
    gateHalo: biome.gateHalo,
    scatter: biome.scatter,
    bossIndex: nodes.findIndex((node) => node.kind === 'boss'),
  })
}

/**
 * MỌI bản đồ vùng mà trẻ có thể gặp thật.
 *
 * SỐ CHẶNG KHÔNG CỐ ĐỊNH, và đó là chỗ test này từng bỏ lọt. Danh sách chặng là:
 * mỗi kỹ năng một chặng, cộng chặng trùm, CỘNG một chặng ôn tập nếu có kỹ năng
 * nào đến hạn ôn lại. Chặng ôn tập ấy chỉ xuất hiện sau vài buổi chơi - nên bản
 * đồ của một đứa trẻ đã chơi quen cao hơn bản đồ lúc mới mở một hàng, và cổng
 * rơi vào chỗ khác.
 *
 * Bản trước chỉ dựng đúng một biến thể, nên nó xanh trong khi trẻ chơi thật gặp
 * những vùng không có khu đất cao nào.
 */
function everyMap(): Array<{ name: string; subject: Subject; map: RouteMap }> {
  const out: Array<{ name: string; subject: Subject; map: RouteMap }> = []
  for (const subject of SUBJECTS) {
    for (const grade of GRADES) {
      const base = buildWorldMap(subject, grade, 0, {}, 0).nodes.length
      for (const count of [base, base + 1]) {
        out.push({
          name: `${subject} lớp ${grade} (${count} chặng)`,
          subject,
          map: build(subject, grade, count),
        })
      }
    }
  }
  return out
}

const MAPS = everyMap()

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
  it('MỌI bản đồ đều có khu đất cao, và khu trũng ở nơi bố cục còn chỗ', () => {
    for (const { name, map } of MAPS) {
      expect(map.plateau, `${name}: thiếu khu đất cao`).not.toBeNull()

      /*
        Khu trũng đòi ở MỌI vùng, kể cả Âm nhạc.

        Vùng Âm nhạc dựng bản đồ thành khuông nhạc, dòng kẻ cách nhau ba hàng,
        mà khu đất mỏng nhất chiếm bốn - trong khuông không có chỗ nào lọt. Bản
        trước vì thế miễn cho vùng này, và đó là chỗ người dùng nhận ra ngay:
        "có vài nơi chưa có khu vực cao thấp".

        Lời giải nằm ở lề trên: dải bốn hàng phía trên dòng kẻ đầu tiên rộng tới
        mười một cột - đủ cho HAI khu đất đứng cạnh nhau. Một sườn đồi có chỗ leo
        lên và một hõm sâu ngay bên cạnh, khuông nhạc còn nguyên vẹn bên dưới.
      */
      expect(map.hollow, `${name}: thiếu khu trũng`).not.toBeNull()
    }
  })

  it('CHỈ vào được khu đất cao qua bậc thang - đây là cả luật chơi', () => {
    /*
      Bịt đúng ô bậc thang rồi loang lại: nếu vẫn còn lối vào bên trong thì vách
      đá đang hở ở đâu đó, và khu đất cao chỉ còn là một mảng màu khác.
    */
    for (const { name, map } of MAPS) {
      for (const rect of [map.plateau, map.hollow]) {
        if (!rect) continue
        const inside = interior(map, rect)
        if (inside.length === 0) continue

        const blocked = new Set(map.stairs.map((st) => `${st.x},${st.y}`))
        const withoutStairs = flood(map, map.start, blocked)
        for (const cell of inside) {
          expect(
            withoutStairs.has(`${cell.x},${cell.y}`),
            `${name}: ô ${cell.x},${cell.y} vào được mà không cần bậc thang`,
          ).toBe(false)
        }
      }
    }
  })

  it('nhưng CÓ bậc thang thì vào được thật', () => {
    // Một khu đất vây kín hoàn toàn cũng "đúng luật", mà lại là một bức tranh
    // dán trên tường. Phải kiểm cả chiều ngược lại.
    for (const { name, map } of MAPS) {
      const open = flood(map, map.start)
      for (const rect of [map.plateau, map.hollow]) {
        if (!rect) continue
        const inside = interior(map, rect)
        if (inside.length === 0) continue
        const reached = inside.filter((c) => open.has(`${c.x},${c.y}`))
        expect(reached.length, name).toBeGreaterThan(0)
      }
    }
  })

  it('khu đất KHÔNG bao giờ nuốt mất một chặng nào', () => {
    // Lỗi tệ nhất có thể có: trẻ đi hết bản đồ mà không hiểu vì sao tắc.
    for (const { name, map } of MAPS) {
      const open = flood(map, map.start)
      for (const gate of map.gates) {
        expect(open.has(`${gate.x},${gate.y}`), `${name} chặng ${gate.nodeIndex}`).toBe(true)
      }
    }
  })

  it('bậc thang nằm trên vách, không lơ lửng giữa đồng', () => {
    for (const { name, map } of MAPS) {
      for (const st of map.stairs) {
        const onEdge = [map.plateau, map.hollow].some(
          (r) => r && st.y === r.bottom && st.x > r.left && st.x < r.right,
        )
        expect(onEdge, `${name}: bậc thang ${st.x},${st.y}`).toBe(true)
      }
    }
  })
})

describe('nhà trên khu đất cao', () => {
  it('cửa đi vào được, mái thì không', () => {
    for (const { name, map } of MAPS) {
      for (const door of map.doors) {
        expect(map.tiles[door.y]![door.x], name).toBe('door')
        expect(WALKABLE.door).toBe(true)
        // Mái ngay trên cửa, và mái thì chặn đường.
        expect(map.tiles[door.y - 1]![door.x], name).toBe('house')
        expect(WALKABLE.house).toBe(false)
      }
    }
  })

  it('MỌI bản đồ đều CÓ nhà, nằm trong khu đất cao và tới được', () => {
    for (const { name, map } of MAPS) {
      // Đòi có nhà thật, không cho phép "vùng này không có nhà nào cũng được".
      expect(map.doors.length, `${name}: không có ngôi nhà nào`).toBeGreaterThan(0)
      expect(map.plateau, name).not.toBeNull()

      const open = flood(map, map.start)
      for (const door of map.doors) {
        expect(door.x).toBeGreaterThan(map.plateau!.left)
        expect(door.x).toBeLessThan(map.plateau!.right)
        expect(open.has(`${door.x},${door.y}`), `${name}: cửa không tới được`).toBe(true)
      }
    }
  })

  it('nhà KHÔNG bao giờ dựng đè lên bậc thang', () => {
    // Dựng đè lên đó là bịt luôn lối vào, và cả khu đất cao thành vô nghĩa.
    for (const { name, map } of MAPS) {
      for (const door of map.doors) {
        expect(
          map.stairs.some((st) => st.x === door.x && st.y === door.y),
          name,
        ).toBe(false)
      }
    }
  })
})

describe('quái ẩn', () => {
  it('mỗi khu đất giấu đúng một con, và tới được', () => {
    for (const { name, map } of MAPS) {
      const levels = [map.plateau, map.hollow].filter(Boolean).length
      expect(map.secrets.length, name).toBe(levels)

      const open = flood(map, map.start)
      for (const spot of map.secrets) {
        expect(open.has(`${spot.x},${spot.y}`), name).toBe(true)
      }
    }
  })

  it('KHÔNG nằm trên đường chính, và không cạnh cổng', () => {
    /*
      Đây là điều làm nó "ẩn". Một ô ẩn nằm giữa đường thì trẻ giẫm trúng trong
      lúc đi ngang, và phần thưởng hoá ra trả cho việc đi bộ chứ không cho việc
      tìm - mà cả điểm của nó là trả cho việc tìm.
    */
    for (const { name, map } of MAPS) {
      for (const spot of map.secrets) {
        expect(map.tiles[spot.y]![spot.x], name).not.toBe('path')
        for (const gate of map.gates) {
          const far = Math.abs(gate.x - spot.x) + Math.abs(gate.y - spot.y)
          expect(far, `${name}: quá gần cổng`).toBeGreaterThan(1)
        }
      }
    }
  })

  it('nằm trong khu phải leo thang mới vào được', () => {
    // Khó tìm, chứ không phải khó một cách ngẫu nhiên: muốn tới được thì trước
    // hết phải tìm ra bậc thang, rồi mới đi men tới góc trong cùng.
    for (const { name, map } of MAPS) {
      const blocked = new Set(map.stairs.map((st) => `${st.x},${st.y}`))
      const withoutStairs = flood(map, map.start, blocked)
      for (const spot of map.secrets) {
        expect(
          withoutStairs.has(`${spot.x},${spot.y}`),
          `${name}: chỗ ẩn tới được mà không cần leo thang`,
        ).toBe(false)
      }
    }
  })

  it('cùng hạt giống thì chỗ ẩn không đổi - trẻ chỉ cho bạn được', () => {
    const a = build('math', 2, 20)
    const b = build('math', 2, 20)
    expect(a.secrets).toEqual(b.secrets)
    expect(a.doors).toEqual(b.doors)
  })
})

/*
  QUÉT MỌI SỐ CHẶNG, không chỉ những số chặng hôm nay đang có.

  Danh sách chặng sinh ra từ curriculum, mà curriculum thì thầy cô thêm bớt được
  ở trang quản trị: một vùng hôm nay mười ba chặng, tháng sau có thể hai mươi.
  Bố cục bản đồ phụ thuộc thẳng vào con số ấy - bản đồ cao lên, cổng rơi vào chỗ
  khác, sân đấu trùm dịch đi - nên một cách đặt khu đất chạy đúng ở mười ba chặng
  hoàn toàn có thể chết ở mười bốn.

  Đây chính là lỗi đã xảy ra: test cũ dựng đúng một biến thể số chặng, xanh hết,
  trong khi trẻ chơi thật gặp những vùng không có khu đất cao nào.

  Từ năm chặng trở lên. Dưới mức đó bản đồ ngắn tới mức không còn chỗ cho hai khu
  đất, mà một vùng đất bốn chặng thì cũng không phải thứ curriculum nào sinh ra.
*/
describe('mọi số chặng đều dựng được địa hình', () => {
  it('từ 5 tới 30 chặng, mọi môn, mọi lớp', () => {
    const thieu: string[] = []
    for (const subject of SUBJECTS) {
      for (const grade of [1, 3, 5] as Grade[]) {
        for (let count = 5; count <= 30; count++) {
          const map = build(subject, grade, count)
          const missing: string[] = []
          if (!map.plateau) missing.push('khu cao')
          if (!map.hollow) missing.push('khu trũng')
          if (map.doors.length === 0) missing.push('nhà')
          if (map.secrets.length === 0) missing.push('chỗ ẩn')
          if (missing.length > 0) {
            thieu.push(`${subject} lớp ${grade}, ${count} chặng: thiếu ${missing.join(', ')}`)
          }
        }
      }
    }
    expect(thieu).toEqual([])
  })
})
