/**
 * Cây kỹ năng nói với trẻ "cái này phải học trước cái kia". Nếu hình cây sai thì
 * lời đó thành nói dối, nên các test ở đây bám vào một thứ duy nhất: quan hệ
 * tiên quyết trong curriculum.ts.
 */

import { describe, expect, it } from 'vitest'
import { GRADES, SUBJECTS } from '../../content/types'
import { skillsFor } from '../../content/curriculum'
import { createMastery, type MasteryMap } from '../../engine/mastery'
import { buildSkillTree } from './skilltree'

const NOW = Date.UTC(2026, 0, 1)

/** Bản đồ thạo kỹ năng dựng tay: skillId -> điểm thạo. */
function masteryOf(entries: Record<string, number>): MasteryMap {
  const map: MasteryMap = {}
  for (const [skillId, value] of Object.entries(entries)) {
    map[skillId] = { ...createMastery(skillId, NOW), mastery: value, attempts: 1, correct: 1 }
  }
  return map
}

describe('buildSkillTree', () => {
  it('có đủ mọi kỹ năng của vùng, không thừa không thiếu', () => {
    for (const subject of SUBJECTS) {
      for (const grade of GRADES) {
        const tree = buildSkillTree(subject, grade, {}, 0)
        expect(tree.nodes).toHaveLength(skillsFor(subject, grade).length)
        expect(tree.levels.flat()).toHaveLength(tree.nodes.length)
      }
    }
  })

  it('kỹ năng luôn nằm CAO HƠN mọi kỹ năng nó phụ thuộc', () => {
    // Đây là lời hứa của cả hình vẽ. Sai cái này thì đường nối chạy ngược.
    for (const subject of SUBJECTS) {
      for (const grade of GRADES) {
        const tree = buildSkillTree(subject, grade, {}, 0)
        const depth = new Map(tree.nodes.map((n) => [n.skill.id, n.depth]))
        for (const node of tree.nodes) {
          for (const parent of node.parents) {
            expect(
              node.depth,
              `${node.skill.id} phải nằm trên ${parent}`,
            ).toBeGreaterThan(depth.get(parent)!)
          }
        }
      }
    }
  })

  it('tầng 0 là những kỹ năng học được ngay, không phụ thuộc gì trong vùng', () => {
    for (const subject of SUBJECTS) {
      const tree = buildSkillTree(subject, 3, {}, 0)
      expect(tree.levels[0]!.length).toBeGreaterThan(0)
      for (const node of tree.levels[0]!) expect(node.parents).toEqual([])
    }
  })

  it('kỹ năng cần lớp dưới thì ghi rõ là phụ thuộc NGOÀI vùng', () => {
    // math.g2.cong-tru-20 cần math.g1.cong-tru-20 - không vẽ được trong cây lớp
    // 2, nhưng phải nói ra chứ không được im lặng khoá lại.
    const tree = buildSkillTree('math', 2, {}, 0)
    const node = tree.nodes.find((n) => n.skill.id === 'math.g2.cong-tru-20')!
    expect(node.externalParents).toContain('math.g1.cong-tru-20')
    expect(node.parents).toEqual([])
  })

  it('chưa học gì thì kỹ năng có tiên quyết bị khoá, kỹ năng gốc thì mở', () => {
    const tree = buildSkillTree('math', 1, {}, 0)
    const root = tree.nodes.find((n) => n.skill.id === 'math.g1.cong-tru-10')!
    const child = tree.nodes.find((n) => n.skill.id === 'math.g1.cong-tru-20')!
    expect(root.state).toBe('available')
    expect(child.state).toBe('notReady')
  })

  it('thạo kỹ năng dưới thì kỹ năng trên mở ra', () => {
    const tree = buildSkillTree('math', 1, masteryOf({ 'math.g1.cong-tru-10': 70 }), 0)
    const child = tree.nodes.find((n) => n.skill.id === 'math.g1.cong-tru-20')!
    expect(child.state).toBe('available')
  })

  it('đã làm câu nào thì là "đang học", đủ 80 điểm thì là "đã thạo"', () => {
    const map = masteryOf({ 'math.g1.dem-100': 40, 'math.g1.hinh-phang': 90 })
    const tree = buildSkillTree('math', 1, map, 0)
    expect(tree.nodes.find((n) => n.skill.id === 'math.g1.dem-100')!.state).toBe('learning')
    expect(tree.nodes.find((n) => n.skill.id === 'math.g1.hinh-phang')!.state).toBe('mastered')
  })

  it('tỉ lệ đúng là null khi chưa làm câu nào - không hiện 0% cho trẻ chưa học', () => {
    const tree = buildSkillTree('music', 2, {}, 0)
    for (const node of tree.nodes) expect(node.accuracy).toBeNull()
  })

  it('đỉnh cây chỉ mở khi đã qua hết các chặng thường', () => {
    const skills = skillsFor('ethics', 2).length
    expect(buildSkillTree('ethics', 2, {}, skills - 1).crown.unlocked).toBe(false)
    expect(buildSkillTree('ethics', 2, {}, skills).crown.unlocked).toBe(true)
    expect(buildSkillTree('ethics', 2, {}, skills).crown.cleared).toBe(false)
    expect(buildSkillTree('ethics', 2, {}, skills + 1).crown.cleared).toBe(true)
  })

  it('đếm số kỹ năng đã thạo và điểm thạo trung bình', () => {
    const map = masteryOf({ 'math.g1.dem-100': 100, 'math.g1.hinh-phang': 80 })
    const tree = buildSkillTree('math', 1, map, 0)
    expect(tree.masteredCount).toBe(2)
    expect(tree.averageMastery).toBe(Math.round(180 / tree.nodes.length))
  })

  it('nodeIndex khớp với thứ tự chặng trên bản đồ đi cảnh', () => {
    // Bấm một ô trong cây là vào đúng trận đó, nên hai bên phải đánh số giống hệt.
    for (const subject of SUBJECTS) {
      const skills = skillsFor(subject, 4)
      const tree = buildSkillTree(subject, 4, {}, 0)
      for (const node of tree.nodes) {
        expect(skills[node.nodeIndex]!.id).toBe(node.skill.id)
      }
    }
  })
})
