/**
 * Bản đồ thế giới: biến cây kỹ năng thành một chặng đường trẻ đi qua.
 *
 * Mỗi node là một trận đấu gắn với một kỹ năng của lớp hiện tại, đi theo đúng
 * thứ tự chương trình. Node cuối mỗi môn là trùm (boss). Node ôn tập tự xuất
 * hiện khi lịch giãn cách báo có kỹ năng đến hạn.
 */

import { skillsFor, type Skill } from './curriculum'
import { SUBJECT_ELEMENT, SUBJECT_LABEL, type Grade, type Subject } from './types'
import { dueSkills, type MasteryMap } from '../engine/mastery'

export type NodeKind = 'battle' | 'boss' | 'review'

export interface MapNode {
  id: string
  kind: NodeKind
  index: number
  title: string
  subtitle: string
  /** Kỹ năng trọng tâm của node. Node ôn tập không gắn cố định kỹ năng nào. */
  skill: Skill | null
  cleared: boolean
}

/*
 * KHÔNG CÓ KHOÁ CHẶNG.
 *
 * Trước đây chặng chỉ mở khi `index <= clearedCount`, nên hồ sơ mới nhìn vào một
 * vùng đất là thấy 17 ổ khoá. Bỏ hẳn: chặng nào cũng đánh được ngay, kể cả trùm
 * cuối và đầu đàn trong hang.
 *
 * Cái chặn không nằm ở ổ khoá mà nằm ở CON QUÁI - máu và sát thương của nó tăng
 * theo số thứ tự chặng (xem `content/bestiary.ts`), nên nhảy cóc vào chặng cuối
 * thì thua, và thua ở đây không mất gì: vàng với kinh nghiệm vẫn được giữ, cả
 * đội thú chỉ về làng nghỉ. Trẻ tự đo được sức mình, thay vì bị một cánh cửa
 * bảo cho biết.
 */

export interface WorldMap {
  subject: Subject
  grade: Grade
  label: string
  element: string
  nodes: MapNode[]
  /** Node kế tiếp trẻ nên đánh. null nghĩa là đã đi hết bản đồ. */
  nextNode: MapNode | null
  clearedCount: number
}

export function buildWorldMap(
  subject: Subject,
  grade: Grade,
  clearedCount: number,
  mastery: MasteryMap,
  now: number,
): WorldMap {
  const skills = skillsFor(subject, grade)
  const nodes: MapNode[] = skills.map((skill, index) => ({
    id: `${subject}.g${grade}.node${index}`,
    kind: 'battle',
    index,
    title: skill.name,
    subtitle: skill.description,
    skill,
    cleared: index < clearedCount,
  }))

  const bossIndex = skills.length
  nodes.push({
    id: `${subject}.g${grade}.boss`,
    kind: 'boss',
    index: bossIndex,
    title: `Thử thách cuối lớp ${grade}`,
    subtitle: `Tổng hợp toàn bộ kỹ năng ${SUBJECT_LABEL[subject]} lớp ${grade}`,
    skill: null,
    cleared: bossIndex < clearedCount,
  })

  // Node ôn tập chỉ hiện khi thật sự có kỹ năng đến hạn - không bịa ra việc làm.
  const due = dueSkills(mastery, now).filter((m) => m.skillId.startsWith(`${subject}.`))
  if (due.length > 0) {
    nodes.push({
      id: `${subject}.g${grade}.review`,
      kind: 'review',
      index: bossIndex + 1,
      title: 'Ôn tập',
      subtitle: `${due.length} kỹ năng đến hạn ôn lại`,
      skill: null,
      cleared: false,
    })
  }

  return {
    subject,
    grade,
    label: SUBJECT_LABEL[subject],
    element: SUBJECT_ELEMENT[subject],
    nodes,
    nextNode: nodes.find((n) => !n.cleared) ?? null,
    clearedCount,
  }
}

/** Tổng số node phải hoàn thành để đi hết một môn ở một lớp. */
export function totalNodes(subject: Subject, grade: Grade): number {
  return skillsFor(subject, grade).length + 1
}
