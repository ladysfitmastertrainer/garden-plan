/**
 * Sự kiện 20/10: giờ giấc, chỗ in dấu tia sét, và lời nguyền.
 */

import { describe, expect, it } from 'vitest'
import {
  CURSES,
  EVENT_END,
  EVENT_START,
  HIDDEN_BOSSES,
  curseBattle,
  eventPhase,
  formatCountdown,
  lightningSpot,
} from './event2010'
import { biomeFor, routeOptionsFor } from '../features/world/biome'
import { buildRouteMap } from '../features/world/routemap'
import { totalNodes } from './worldmap'
import { SUBJECTS, GRADES } from './types'
import { WALKABLE } from '../features/pixel/tiles'
import { createBattle } from '../engine/battle'
import { numericQuestion } from '../engine/test-fixtures'
import { findLootItem } from '../engine/rewards'
import { companionOf } from './pets'

describe('giờ của sự kiện', () => {
  it('bắt đầu đúng 0h00 ngày 20/10/2026 giờ Việt Nam, kết thúc sau đúng một ngày', () => {
    expect(new Date(EVENT_START).toISOString()).toBe('2026-10-19T17:00:00.000Z')
    expect(EVENT_END - EVENT_START).toBe(24 * 60 * 60 * 1000)
  })

  it('trước, trong và sau ngày sự kiện', () => {
    expect(eventPhase(EVENT_START - 1)).toBe('before')
    expect(eventPhase(EVENT_START)).toBe('live')
    expect(eventPhase(EVENT_END - 1)).toBe('live')
    expect(eventPhase(EVENT_END)).toBe('over')
  })

  it('đếm ngược đọc được', () => {
    expect(formatCountdown((2 * 86400 + 3 * 3600 + 4 * 60 + 5) * 1000)).toBe('2 ngày 03:04:05')
    expect(formatCountdown(65_000)).toBe('00:01:05')
    expect(formatCountdown(-5)).toBe('00:00:00')
  })
})

describe('dấu tia sét', () => {
  const mapOf = (subject: (typeof SUBJECTS)[number], grade: (typeof GRADES)[number]) => {
    const biome = biomeFor(subject, grade)
    const n = totalNodes(subject, grade)
    return buildRouteMap(n + 1, `${subject}-g${grade}`, routeOptionsFor(biome, n - 1))
  }

  it('luôn in được, trên mặt đất trơn đi tới được, KHÔNG nằm trên đường hay cổng', () => {
    for (const subject of SUBJECTS) {
      for (const grade of GRADES) {
        const map = mapOf(subject, grade)
        const spot = lightningSpot(map, `em-a-${subject}-g${grade}`)
        expect(spot, `${subject} lớp ${grade}: không chỗ nào in dấu`).not.toBeNull()
        const tile = map.tiles[spot!.y]![spot!.x]!
        expect(WALKABLE[tile], `${subject} lớp ${grade}: dấu nằm trên ô ${tile}`).toBe(true)
        expect(['path', 'gate', 'door', 'stairs', 'arena']).not.toContain(tile)
        expect(map.gates.some((g) => g.x === spot!.x && g.y === spot!.y)).toBe(false)
        expect(spot).not.toEqual(map.start)
      }
    }
  })

  it('cố định với cùng một em - tìm ra từ trước thì đúng ngày vẫn ở đó', () => {
    const map = mapOf('math', 2)
    expect(lightningSpot(map, 'em-a')).toEqual(lightningSpot(map, 'em-a'))
  })

  it('mỗi em một chỗ - bạn cùng lớp không chỉ chỗ cho nhau được', () => {
    const map = mapOf('vietnamese', 3)
    const spots = new Set(
      Array.from({ length: 12 }, (_, i) => JSON.stringify(lightningSpot(map, `em-${i}`))),
    )
    expect(spots.size).toBeGreaterThan(1)
  })
})

describe('trùm ẩn và lời nguyền', () => {
  it('mỗi môn một con, mỗi con một món đồ độc quyền có thật', () => {
    for (const subject of SUBJECTS) {
      const boss = HIDDEN_BOSSES[subject]
      expect(boss.subject).toBe(subject)
      expect(findLootItem(boss.rewardItemId)?.rarity).toBe('event')
    }
  })

  const battle = () =>
    createBattle(
      {
        enemy: {
          id: 'q',
          name: 'Quái',
          emoji: '👾',
          element: 'math',
          maxHp: 100,
          attack: 20,
          goldReward: 1,
          xpReward: 1,
          variant: 0,
          isBoss: false,
        },
        player: { maxHp: 50, power: 1 },
        pet: companionOf([], undefined, 'math', {}),
        defendLimitMs: 10_000,
      },
      numericQuestion,
      0,
    )

  it('bốn lời nguyền, mỗi cái làm đúng điều nó nói', () => {
    const base = battle()
    expect(curseBattle(base, 'weaken').pet.hp).toBe(Math.round(base.pet.hp * 0.8))
    expect(curseBattle(base, 'fury').enemy.attack).toBe(25)
    expect(curseBattle(base, 'hurry').defendLimitMs).toBe(7_000)
    const tough = curseBattle(base, 'tough')
    expect(tough.enemy.maxHp).toBe(120)
    expect(tough.enemyHp).toBe(120)
    for (const kind of Object.keys(CURSES) as Array<keyof typeof CURSES>) {
      expect(curseBattle(base, kind).log.some((line) => line.includes('Lời nguyền'))).toBe(true)
    }
  })
})
