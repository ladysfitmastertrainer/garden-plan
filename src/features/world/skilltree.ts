/**
 * Cây kỹ năng của một vùng đất.
 *
 * Bản đồ đi cảnh trả lời câu hỏi "đi tới đâu rồi"; cây kỹ năng trả lời câu hỏi
 * "mình GIỎI cái gì rồi" - hai việc khác nhau, mà trước đây chỉ có cái đầu. Trẻ
 * đánh xong 7 chặng Toán lớp 2 thì biết là xong 7 chặng, chứ không nhìn thấy
 * bảng nhân 2 đã thạo còn xem giờ thì chưa.
 *
 * Hình cây dựng từ `prerequisites` trong curriculum.ts, nên nó KHÔNG phải hình
 * trang trí: một kỹ năng nằm trên kỹ năng khác đúng nghĩa là phải học cái dưới
 * trước. Hàm thuần, không đụng React - test được.
 */

import { skillsFor, type Skill } from '../../content/curriculum'
import type { Grade, Subject } from '../../content/types'
import { MASTERED_THRESHOLD, PREREQUISITE_THRESHOLD, type MasteryMap } from '../../engine/mastery'

/**
 * Mức sẵn sàng của một kỹ năng. KHÔNG phải quyền vào trận - trận nào cũng đánh
 * được (xem `content/worldmap.ts`). `notReady` chỉ có nghĩa "kỹ năng nền chưa
 * vững, học cái dưới trước thì dễ hơn".
 */
export type SkillState = 'notReady' | 'available' | 'learning' | 'mastered'

export interface SkillTreeNode {
  skill: Skill
  /** Chặng tương ứng trên bản đồ đi cảnh - bấm vào là vào đúng trận đó. */
  nodeIndex: number
  /** Tầng trong cây. Tầng 0 học được ngay, tầng n cần xong tầng n-1. */
  depth: number
  mastery: number
  attempts: number
  /** Tỉ lệ đúng, null khi chưa làm câu nào. */
  accuracy: number | null
  state: SkillState
  /** Kỹ năng tiên quyết NẰM TRONG cùng vùng này - dùng để vẽ đường nối. */
  parents: string[]
  /**
   * Kỹ năng tiên quyết ở lớp dưới. Không vẽ được trong cây này nhưng vẫn phải
   * nói ra, nếu không trẻ thấy một ô khoá mà không hiểu vì sao.
   */
  externalParents: string[]
}

export interface SkillTree {
  subject: Subject
  grade: Grade
  /** Các tầng, tầng 0 ở gốc. */
  levels: SkillTreeNode[][]
  nodes: SkillTreeNode[]
  /** Chặng trùm - đỉnh của cây, mở khi mọi kỹ năng đã qua. */
  crown: { title: string; unlocked: boolean; cleared: boolean; nodeIndex: number }
  masteredCount: number
  /** Điểm thạo trung bình của cả vùng, 0-100. */
  averageMastery: number
}

/** Điểm thạo của một kỹ năng, 0 khi chưa đụng tới. */
function masteryOf(map: MasteryMap, skillId: string): number {
  return map[skillId]?.mastery ?? 0
}

function stateOf(map: MasteryMap, skill: Skill): SkillState {
  const entry = map[skill.id]
  if ((entry?.mastery ?? 0) >= MASTERED_THRESHOLD) return 'mastered'
  if ((entry?.attempts ?? 0) > 0) return 'learning'

  // Chưa làm câu nào: sẵn sàng hay chưa là do các kỹ năng tiên quyết quyết định.
  const ready = skill.prerequisites.every(
    (id) => masteryOf(map, id) >= PREREQUISITE_THRESHOLD,
  )
  return ready ? 'available' : 'notReady'
}

/**
 * Tầng của một kỹ năng = chuỗi phụ thuộc DÀI NHẤT dẫn tới nó trong cùng vùng.
 * Dùng chuỗi dài nhất chứ không phải ngắn nhất để một kỹ năng luôn nằm cao hơn
 * MỌI thứ nó phụ thuộc - lấy chuỗi ngắn nhất thì có lúc đường nối chạy ngang
 * hoặc chạy ngược xuống, nhìn ra cây leo chứ không ra bậc thang.
 */
function depthsOf(skills: Skill[]): Map<string, number> {
  const own = new Set(skills.map((s) => s.id))
  const byId = new Map(skills.map((s) => [s.id, s]))
  const depths = new Map<string, number>()

  const resolve = (id: string, seen: Set<string>): number => {
    const cached = depths.get(id)
    if (cached !== undefined) return cached
    const skill = byId.get(id)
    if (!skill) return -1

    // Phòng vòng lặp trong dữ liệu: thà vẽ phẳng còn hơn treo cả màn hình.
    if (seen.has(id)) return 0
    seen.add(id)

    const parents = skill.prerequisites.filter((p) => own.has(p))
    const depth = parents.length === 0 ? 0 : Math.max(...parents.map((p) => resolve(p, seen) + 1))
    depths.set(id, depth)
    return depth
  }

  for (const skill of skills) resolve(skill.id, new Set())
  return depths
}

export function buildSkillTree(
  subject: Subject,
  grade: Grade,
  mastery: MasteryMap,
  clearedCount: number,
): SkillTree {
  const skills = skillsFor(subject, grade)
  const own = new Set(skills.map((s) => s.id))
  const depths = depthsOf(skills)

  const nodes: SkillTreeNode[] = skills.map((skill, index) => {
    const entry = mastery[skill.id]
    return {
      skill,
      nodeIndex: index,
      depth: depths.get(skill.id) ?? 0,
      mastery: entry?.mastery ?? 0,
      attempts: entry?.attempts ?? 0,
      accuracy: entry && entry.attempts > 0 ? entry.correct / entry.attempts : null,
      state: stateOf(mastery, skill),
      parents: skill.prerequisites.filter((p) => own.has(p)),
      externalParents: skill.prerequisites.filter((p) => !own.has(p)),
    }
  })

  const maxDepth = nodes.reduce((max, node) => Math.max(max, node.depth), 0)
  const levels: SkillTreeNode[][] = Array.from({ length: maxDepth + 1 }, () => [])
  for (const node of nodes) levels[node.depth]!.push(node)

  const bossIndex = skills.length
  const masteredCount = nodes.filter((n) => n.state === 'mastered').length
  const total = nodes.reduce((sum, n) => sum + n.mastery, 0)

  return {
    subject,
    grade,
    levels,
    nodes,
    crown: {
      title: `Thử thách cuối lớp ${grade}`,
      // "Đã đi hết các chặng chưa" - chỉ để đổi lời nhắn, không chặn trẻ vào.
      unlocked: clearedCount >= bossIndex,
      cleared: clearedCount > bossIndex,
      nodeIndex: bossIndex,
    },
    masteredCount,
    averageMastery: nodes.length === 0 ? 0 : Math.round(total / nodes.length),
  }
}
