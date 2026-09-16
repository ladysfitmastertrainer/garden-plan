/**
 * Hợp nhất dữ liệu hai chiều. Kịch bản gốc: trẻ chơi offline ở nhà, chơi tiếp ở
 * lớp trên máy khác, rồi máy ở nhà mới lên mạng.
 */

import { describe, expect, it } from 'vitest'
import { applyAttempt, createMastery } from '../engine/mastery'
import { mergeMasteryMaps, mergeProgress, mergeSkillMastery, mergeStudent } from './merge'
import { emptyProgress, type StudentProfile, type StudentProgress } from './types'

const T0 = 1_700_000_000_000
const HOUR = 3_600_000

const student = (patch: Partial<StudentProfile> = {}): StudentProfile => ({
  id: 's1',
  name: 'Bé An',
  avatar: '🦊',
  grade: 1,
  totalXp: 0,
  gold: 0,
  equippedItemIds: [],
  createdAt: T0,
  lastPlayedAt: T0,
  ...patch,
})

const progress = (patch: Partial<StudentProgress> = {}): StudentProgress => ({
  ...emptyProgress(),
  ...patch,
})

describe('mergeSkillMastery', () => {
  it('bản ghi làm gần đây hơn quyết định mức thạo hiện tại', () => {
    const older = { ...createMastery('x', T0), mastery: 30, lastSeenAt: T0 }
    const newer = { ...createMastery('x', T0), mastery: 70, lastSeenAt: T0 + HOUR }
    expect(mergeSkillMastery(older, newer).mastery).toBe(70)
    expect(mergeSkillMastery(newer, older).mastery).toBe(70)
  })

  it('số lần làm bài không bao giờ giảm, kể cả khi bên kia mới hơn', () => {
    const many = { ...createMastery('x', T0), attempts: 40, correct: 30, lastSeenAt: T0 }
    const few = { ...createMastery('x', T0), attempts: 3, correct: 2, lastSeenAt: T0 + HOUR }
    const merged = mergeSkillMastery(many, few)
    expect(merged.attempts).toBe(40)
    expect(merged.correct).toBe(30)
  })

  it('hợp nhất có tính giao hoán - đổi chỗ hai bên vẫn ra kết quả như nhau', () => {
    let a = createMastery('x', T0)
    for (let i = 0; i < 3; i++) a = applyAttempt(a, { correct: true, difficulty: 2, durationMs: 5000 }, T0)
    let b = createMastery('x', T0)
    for (let i = 0; i < 5; i++) b = applyAttempt(b, { correct: false, difficulty: 1, durationMs: 9000 }, T0 + HOUR)

    expect(mergeSkillMastery(a, b)).toEqual(mergeSkillMastery(b, a))
  })

  it('lịch ôn lấy theo bản ghi mới hơn để không bắt ôn lại bài vừa làm', () => {
    const home = { ...createMastery('x', T0), dueAt: T0 + HOUR, lastSeenAt: T0 }
    const school = { ...createMastery('x', T0), dueAt: T0 + 100 * HOUR, lastSeenAt: T0 + HOUR }
    expect(mergeSkillMastery(home, school).dueAt).toBe(T0 + 100 * HOUR)
  })
})

describe('mergeMasteryMaps', () => {
  it('giữ đủ kỹ năng của cả hai bên', () => {
    const local = { a: createMastery('a', T0) }
    const remote = { b: createMastery('b', T0) }
    expect(Object.keys(mergeMasteryMaps(local, remote)).sort()).toEqual(['a', 'b'])
  })

  it('kỹ năng chỉ có ở server thì được mang về máy', () => {
    const merged = mergeMasteryMaps({}, { b: { ...createMastery('b', T0), mastery: 55 } })
    expect(merged.b!.mastery).toBe(55)
  })
})

describe('mergeProgress', () => {
  it('chặng đã mở khoá thì không bao giờ bị khoá lại', () => {
    const local = progress({ clearedNodes: { math: 5, vietnamese: 0, ethics: 0, music: 0 } })
    const remote = progress({ clearedNodes: { math: 2, vietnamese: 3, ethics: 0, music: 0 } })
    const merged = mergeProgress(local, remote)
    expect(merged.clearedNodes.math).toBe(5)
    expect(merged.clearedNodes.vietnamese).toBe(3)
  })

  it('kho đồ gộp lại, không trùng lặp', () => {
    const merged = mergeProgress(
      progress({ inventory: ['mu-vai', 'kinh-tri-tue'] }),
      progress({ inventory: ['kinh-tri-tue', 'sao-thanh-am'] }),
    )
    expect([...merged.inventory].sort()).toEqual(['kinh-tri-tue', 'mu-vai', 'sao-thanh-am'])
  })

  it('điểm phẩm chất lấy giá trị cao hơn, không cộng dồn thành gấp đôi', () => {
    const merged = mergeProgress(
      progress({ virtues: { honesty: 5, kindness: 1 } }),
      progress({ virtues: { honesty: 3, respect: 2 } }),
    )
    expect(merged.virtues.honesty).toBe(5)
    expect(merged.virtues.kindness).toBe(1)
    expect(merged.virtues.respect).toBe(2)
  })

  it('số trận đã chơi lấy giá trị lớn hơn', () => {
    const merged = mergeProgress(
      progress({ battlesPlayed: 10, battlesWon: 7 }),
      progress({ battlesPlayed: 4, battlesWon: 4 }),
    )
    expect(merged.battlesPlayed).toBe(10)
    expect(merged.battlesWon).toBe(7)
  })

  it('hợp nhất với tiến độ rỗng không làm mất gì', () => {
    const local = progress({ battlesPlayed: 9, inventory: ['mu-vai'] })
    expect(mergeProgress(local, emptyProgress())).toEqual(mergeProgress(emptyProgress(), local))
  })
})

describe('mergeStudent', () => {
  it('vàng và kinh nghiệm lấy giá trị cao hơn - công sức không bị nuốt mất', () => {
    const merged = mergeStudent(
      student({ gold: 300, totalXp: 500, lastPlayedAt: T0 }),
      student({ gold: 120, totalXp: 800, lastPlayedAt: T0 + HOUR }),
    )
    expect(merged.gold).toBe(300)
    expect(merged.totalXp).toBe(800)
  })

  it('tên và ảnh đại diện lấy theo lần chơi gần đây hơn', () => {
    const merged = mergeStudent(
      student({ name: 'Tên cũ', avatar: '🦊', lastPlayedAt: T0 }),
      student({ name: 'Tên mới', avatar: '🐼', lastPlayedAt: T0 + HOUR }),
    )
    expect(merged.name).toBe('Tên mới')
    expect(merged.avatar).toBe('🐼')
  })

  it('trang bị của cả hai thiết bị đều được giữ', () => {
    const merged = mergeStudent(
      student({ equippedItemIds: ['mu-vai'] }),
      student({ equippedItemIds: ['kinh-tri-tue'] }),
    )
    expect([...merged.equippedItemIds].sort()).toEqual(['kinh-tri-tue', 'mu-vai'])
  })

  it('ngày tạo lấy sớm nhất, lần chơi cuối lấy muộn nhất', () => {
    const merged = mergeStudent(
      student({ createdAt: T0, lastPlayedAt: T0 + HOUR }),
      student({ createdAt: T0 - HOUR, lastPlayedAt: T0 }),
    )
    expect(merged.createdAt).toBe(T0 - HOUR)
    expect(merged.lastPlayedAt).toBe(T0 + HOUR)
  })

  it('hợp nhất có tính giao hoán', () => {
    const a = student({ gold: 50, totalXp: 900, lastPlayedAt: T0 })
    const b = student({ gold: 400, totalXp: 100, lastPlayedAt: T0 + HOUR })
    expect(mergeStudent(a, b)).toEqual(mergeStudent(b, a))
  })
})
