/**
 * Kiểm tra toàn vẹn nội dung. Chạy: `npm run validate`
 *
 * Bắt những lỗi mà TypeScript không thấy được:
 *  - câu hỏi trỏ tới kỹ năng không tồn tại;
 *  - kỹ năng chưa có câu hỏi nào, hoặc thiếu hẳn một mức độ khó;
 *  - câu hỏi thiếu lời giải thích (phần sư phạm quan trọng nhất);
 *  - đáp án đúng nằm lẫn trong danh sách nhiễu, hoặc chỉ có một phương án;
 *  - tình huống Đạo đức không có lựa chọn tốt, hoặc dùng sai thể loại;
 *  - kỹ năng tiên quyết trỏ tới id không có thật.
 *
 * Thoát với mã 1 nếu có LỖI. Cảnh báo không làm script thất bại.
 */

import { ALL_SKILLS, getSkill } from '../src/content/curriculum'
import { BANKS, GENERATORS, contentKind, sampleQuestion } from '../src/content/registry'
import { createRng } from '../src/engine/rng'
import { judge } from '../src/engine/judge'
import type { Difficulty, Question } from '../src/content/types'

const DIFFICULTIES: Difficulty[] = [1, 2, 3]
/** Sinh nhiều mẫu mỗi (kỹ năng, độ khó) để bắt lỗi chỉ xuất hiện ở một số nhánh ngẫu nhiên. */
const SAMPLES_PER_SLOT = 40

const errors: string[] = []
const warnings: string[] = []

function error(message: string): void {
  errors.push(message)
}

function warn(message: string): void {
  warnings.push(message)
}

// --- 1. Mọi id trong ngân hàng và generator phải là kỹ năng có thật ----------

for (const skillId of [...Object.keys(GENERATORS), ...Object.keys(BANKS)]) {
  if (!getSkill(skillId)) {
    error(`Nội dung trỏ tới kỹ năng không tồn tại: ${skillId}`)
  }
}

// --- 2. Kỹ năng tiên quyết phải có thật -------------------------------------

for (const skill of ALL_SKILLS) {
  for (const prereqId of skill.prerequisites) {
    if (!getSkill(prereqId)) {
      error(`Kỹ năng ${skill.id} có tiên quyết không tồn tại: ${prereqId}`)
    }
  }
}

// --- 3. Mọi kỹ năng phải có nội dung, và nội dung phải hợp lệ ----------------

let totalSampled = 0
const skillsWithoutContent: string[] = []

for (const skill of ALL_SKILLS) {
  const kind = contentKind(skill.id)
  if (kind === 'none') {
    skillsWithoutContent.push(skill.id)
    continue
  }

  for (const difficulty of DIFFICULTIES) {
    const rng = createRng(`${skill.id}#${difficulty}`)
    let produced = 0

    for (let i = 0; i < SAMPLES_PER_SLOT; i++) {
      let question: Question | null
      try {
        question = sampleQuestion(skill.id, difficulty, rng)
      } catch (cause) {
        error(`${skill.id} (độ khó ${difficulty}) ném lỗi khi sinh câu: ${String(cause)}`)
        break
      }
      if (!question) break
      produced++
      totalSampled++
      checkQuestion(skill.id, difficulty, question)
    }

    if (produced === 0) {
      // Generator luôn phải phủ đủ 3 mức; ngân hàng thiếu mức nào thì chỉ cảnh báo.
      if (kind === 'generator') {
        error(`${skill.id}: generator không sinh được câu nào ở độ khó ${difficulty}`)
      } else {
        warn(`${skill.id}: ngân hàng chưa có câu nào ở độ khó ${difficulty}`)
      }
    }
  }
}

for (const skillId of skillsWithoutContent) {
  error(`Kỹ năng chưa có câu hỏi nào: ${skillId}`)
}

// --- Kiểm tra từng câu hỏi --------------------------------------------------

function checkQuestion(skillId: string, expectedDifficulty: Difficulty, q: Question): void {
  const where = `${q.id} (${skillId}, độ khó ${expectedDifficulty})`

  if (q.skillId !== skillId) error(`${where}: skillId không khớp (${q.skillId})`)
  if (q.difficulty !== expectedDifficulty) {
    error(`${where}: độ khó không khớp (${q.difficulty})`)
  }
  if (!q.prompt.trim()) error(`${where}: đề bài rỗng`)
  if (!q.explanation.trim()) error(`${where}: THIẾU lời giải thích`)

  const skill = getSkill(skillId)!
  if (q.subject !== skill.subject) error(`${where}: môn không khớp với kỹ năng`)
  if (q.grade !== skill.grade) error(`${where}: lớp không khớp với kỹ năng`)

  switch (q.type) {
    case 'multiple-choice':
    case 'audio-choice': {
      if (q.choices.length < 2) {
        error(`${where}: chỉ có ${q.choices.length} phương án, cần ít nhất 2`)
      }
      const correct = q.choices.find((c) => c.id === q.answer.choiceId)
      if (!correct) {
        error(`${where}: đáp án đúng không nằm trong danh sách phương án`)
        break
      }
      const sameLabel = q.choices.filter((c) => c.label === correct.label)
      if (sameLabel.length > 1) {
        error(`${where}: có ${sameLabel.length} phương án trùng nhãn "${correct.label}"`)
      }
      if (new Set(q.choices.map((c) => c.id)).size !== q.choices.length) {
        error(`${where}: có phương án trùng id`)
      }
      // Chấm thử: chọn đúng phải ra đúng, chọn sai phải ra sai.
      if (!judge(q, { kind: 'choice', choiceId: correct.id }).correct) {
        error(`${where}: chọn đáp án đúng mà vẫn bị chấm sai`)
      }
      const wrong = q.choices.find((c) => c.id !== correct.id)
      if (wrong && judge(q, { kind: 'choice', choiceId: wrong.id }).correct) {
        error(`${where}: chọn đáp án sai mà vẫn được chấm đúng`)
      }
      break
    }

    case 'numeric-input': {
      if (!Number.isFinite(q.answer.value)) error(`${where}: đáp án số không hợp lệ`)
      if (!judge(q, { kind: 'numeric', value: q.answer.value }).correct) {
        error(`${where}: đáp án số của chính nó bị chấm sai`)
      }
      break
    }

    case 'text-input': {
      if (q.answer.accepted.length === 0) error(`${where}: không có đáp án nào được chấp nhận`)
      for (const accepted of q.answer.accepted) {
        if (!judge(q, { kind: 'text', value: accepted }).correct) {
          error(`${where}: đáp án "${accepted}" nằm trong danh sách nhưng bị chấm sai`)
        }
      }
      break
    }

    case 'drag-order': {
      if (q.choices.length < 2) error(`${where}: cần ít nhất 2 phần tử để sắp xếp`)
      if (q.answer.orderedIds.length !== q.choices.length) {
        error(`${where}: số phần tử trong đáp án khác số phần tử hiển thị`)
      }
      const ids = new Set(q.choices.map((c) => c.id))
      for (const id of q.answer.orderedIds) {
        if (!ids.has(id)) error(`${where}: đáp án nhắc tới phần tử không tồn tại (${id})`)
      }
      if (!judge(q, { kind: 'order', orderedIds: q.answer.orderedIds }).correct) {
        error(`${where}: thứ tự đúng của chính nó bị chấm sai`)
      }
      break
    }

    case 'match-pairs': {
      if (q.answer.pairs.length !== q.left.length || q.left.length !== q.right.length) {
        error(`${where}: số cặp nối không khớp giữa hai cột`)
      }
      const leftIds = new Set(q.left.map((c) => c.id))
      const rightIds = new Set(q.right.map((c) => c.id))
      for (const pair of q.answer.pairs) {
        if (!leftIds.has(pair.leftId)) error(`${where}: cặp nối trỏ tới vế trái không tồn tại`)
        if (!rightIds.has(pair.rightId)) error(`${where}: cặp nối trỏ tới vế phải không tồn tại`)
      }
      if (!judge(q, { kind: 'pairs', pairs: q.answer.pairs }).correct) {
        error(`${where}: đáp án nối của chính nó bị chấm sai`)
      }
      break
    }

    case 'rhythm-tap': {
      if (q.audio.pattern.length < 2) error(`${where}: tiết tấu cần ít nhất 2 tiếng gõ`)
      if (q.audio.tempo <= 0) error(`${where}: nhịp độ phải lớn hơn 0`)
      // Dựng chuỗi gõ hoàn hảo và kiểm tra nó được chấm đúng.
      const beatMs = 60_000 / q.audio.tempo
      const timestamps: number[] = [0]
      for (let i = 0; i < q.audio.pattern.length - 1; i++) {
        timestamps.push(timestamps[i]! + q.audio.pattern[i]! * beatMs)
      }
      if (!judge(q, { kind: 'rhythm', timestampsMs: timestamps }).correct) {
        error(`${where}: chuỗi gõ hoàn hảo vẫn bị chấm sai`)
      }
      break
    }

    case 'scenario': {
      if (q.subject !== 'ethics') error(`${where}: thể loại tình huống chỉ dùng cho môn Đạo đức`)
      if (q.options.length < 2) error(`${where}: tình huống cần ít nhất 2 lựa chọn`)
      if (!q.options.some((o) => o.quality === 'good')) {
        error(`${where}: tình huống KHÔNG có lựa chọn tốt nào - trẻ không có lối ra đúng`)
      }
      if (!q.options.some((o) => o.quality === 'poor')) {
        warn(`${where}: tình huống không có lựa chọn chưa tốt nào, nên không dạy được gì`)
      }
      for (const option of q.options) {
        if (!option.feedback.trim()) {
          error(`${where}: lựa chọn "${option.label}" thiếu lời phản hồi`)
        }
        if (option.quality === 'good' && option.virtues.length === 0) {
          warn(`${where}: lựa chọn tốt "${option.label}" chưa gắn phẩm chất nào`)
        }
        if (option.quality === 'poor' && option.virtues.length > 0) {
          error(`${where}: lựa chọn chưa tốt "${option.label}" không được gắn phẩm chất`)
        }
      }
      if (new Set(q.options.map((o) => o.id)).size !== q.options.length) {
        error(`${where}: có lựa chọn trùng id`)
      }
      break
    }
  }
}

// --- Báo cáo ----------------------------------------------------------------

function report(): void {
  const bySubject = new Map<string, { skills: number; covered: number }>()
  for (const skill of ALL_SKILLS) {
    const row = bySubject.get(skill.subject) ?? { skills: 0, covered: 0 }
    row.skills++
    if (contentKind(skill.id) !== 'none') row.covered++
    bySubject.set(skill.subject, row)
  }

  const labels: Record<string, string> = {
    math: 'Toán',
    vietnamese: 'Tiếng Việt',
    ethics: 'Đạo đức',
    music: 'Âm nhạc',
  }

  console.log('\n=== ĐỘ PHỦ NỘI DUNG ===')
  for (const [subject, row] of bySubject) {
    const bankCount = Object.entries(BANKS)
      .filter(([id]) => id.startsWith(`${subject}.`))
      .reduce((sum, [, entries]) => sum + entries.length, 0)
    const generated = Object.keys(GENERATORS).filter((id) => id.startsWith(`${subject}.`)).length
    const detail = generated > 0 ? `${generated} generator (vô hạn câu)` : `${bankCount} câu soạn tay`
    console.log(
      `  ${labels[subject] ?? subject}: ${row.covered}/${row.skills} kỹ năng có nội dung - ${detail}`,
    )
  }
  console.log(`  Tổng số câu đã sinh thử để kiểm tra: ${totalSampled}`)

  if (warnings.length > 0) {
    console.log(`\n=== CẢNH BÁO (${warnings.length}) ===`)
    for (const message of warnings.slice(0, 60)) console.log(`  ! ${message}`)
    if (warnings.length > 60) console.log(`  ... và ${warnings.length - 60} cảnh báo nữa`)
  }

  if (errors.length > 0) {
    console.log(`\n=== LỖI (${errors.length}) ===`)
    for (const message of errors.slice(0, 60)) console.log(`  x ${message}`)
    if (errors.length > 60) console.log(`  ... và ${errors.length - 60} lỗi nữa`)
    console.log('\nKiểm tra nội dung THẤT BẠI.\n')
    process.exit(1)
  }

  console.log('\nKiểm tra nội dung ĐẠT.\n')
}

report()
