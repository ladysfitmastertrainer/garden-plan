import { describe, expect, it } from 'vitest'

import { tutorialStartSpot } from './start-spot'
import { TUTORIAL_GRADE, TUTORIAL_SUBJECT, tutorialNodes } from '../../content/tutorial'
import { biomeFor } from '../world/biome'
import { buildRouteMap, isWalkable } from '../world/routemap'

/** Đúng tấm bản đồ mà `TutorialScreen` dựng ra. */
function tutorialMap() {
  const nodes = tutorialNodes()
  const biome = biomeFor(TUTORIAL_SUBJECT, TUTORIAL_GRADE)
  return buildRouteMap(nodes.length, 'tutorial', {
    shape: biome.shape,
    width: biome.width,
    ground: biome.ground,
    border: biome.border,
    gateHalo: biome.gateHalo,
    scatter: biome.scatter,
    bossIndex: nodes.findIndex((node) => node.kind === 'boss'),
  })
}

describe('chỗ đặt trẻ khi vào bàn hướng dẫn', () => {
  it('đứng trên một ô đi lại được', () => {
    const map = tutorialMap()
    const spot = tutorialStartSpot(map)
    expect(isWalkable(map, spot.x, spot.y)).toBe(true)
  })

  it('không đứng sẵn trên một cái cổng', () => {
    const map = tutorialMap()
    const spot = tutorialStartSpot(map)
    expect(map.gates.some((gate) => gate.x === spot.x && gate.y === spot.y)).toBe(false)
  })

  /*
    Đây là cả lý do hàm này tồn tại: điểm xuất phát của bản đồ cách chặng đầu
    tiên đúng MỘT ô, nên bấm một cái mũi tên là vào trận ngay - và bài học về
    việc đi bộ không kịp xảy ra.
  */
  it('cách xa con quái đầu tiên, đủ để trẻ thật sự phải đi', () => {
    const map = tutorialMap()
    const spot = tutorialStartSpot(map)
    const first = map.gates.find((gate) => gate.nodeIndex === 0)!

    const steps = Math.abs(spot.x - first.x) + Math.abs(spot.y - first.y)
    expect(steps).toBeGreaterThanOrEqual(6)
  })

  it('đi được từ chỗ đứng tới con quái mà không phải xuyên qua vách', () => {
    const map = tutorialMap()
    const spot = tutorialStartSpot(map)
    const first = map.gates.find((gate) => gate.nodeIndex === 0)!

    // Hàng dưới cùng là hàng thông suốt: mọi ô giữa hai chỗ đều đi lại được,
    // nên trẻ chỉ cần bấm một hướng duy nhất là tới nơi.
    const from = Math.min(spot.x, first.x)
    const to = Math.max(spot.x, first.x)
    for (let x = from; x <= to; x++) {
      expect(isWalkable(map, x, spot.y), `ô (${x}, ${spot.y})`).toBe(true)
    }
  })

  it('bản đồ hỏng tới mức không còn hàng nào thì trả về điểm xuất phát gốc', () => {
    const map = { ...tutorialMap(), tiles: [] }
    expect(tutorialStartSpot(map)).toEqual(map.start)
  })
})
