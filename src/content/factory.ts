/**
 * Helper dựng câu hỏi.
 *
 * Mục đích: các generator và ngân hàng câu hỏi chỉ phải khai báo phần NỘI DUNG
 * (đề bài, đáp án, lời giải thích), còn phần khung (id, môn, lớp, trộn đáp án)
 * do đây lo. Nhờ vậy thêm một kỹ năng mới chỉ tốn vài dòng.
 */

import type { Rng } from '../engine/rng'
import type { Skill } from './curriculum'
import type {
  AudioChoiceQuestion,
  AudioSpec,
  Choice,
  Difficulty,
  DragOrderQuestion,
  MatchPairsQuestion,
  MultipleChoiceQuestion,
  NumericQuestion,
  Question,
  RhythmSpec,
  RhythmTapQuestion,
  ScenarioOption,
  ScenarioQuestion,
  TextQuestion,
} from './types'

/**
 * Id câu hỏi: bám vào NỘI DUNG chứ không phải bộ đếm, nên cùng một câu sinh ra
 * hai lần luôn có cùng id. `selector` dựa vào tính chất này để không hỏi lặp
 * trong một trận.
 */
export function questionId(skill: Skill, difficulty: Difficulty, seedText: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < seedText.length; i++) {
    hash ^= seedText.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return `${skill.id}#${difficulty}#${(hash >>> 0).toString(36)}`
}

interface BaseFields {
  prompt: string
  explanation: string
  hint?: string
  image?: string
}

function base(skill: Skill, difficulty: Difficulty, fields: BaseFields, seed: string) {
  return {
    id: questionId(skill, difficulty, seed),
    subject: skill.subject,
    grade: skill.grade,
    skillId: skill.id,
    difficulty,
    prompt: fields.prompt,
    explanation: fields.explanation,
    ...(fields.hint ? { hint: fields.hint } : {}),
    ...(fields.image ? { media: { image: fields.image } } : {}),
  }
}

// --- Nhập số -----------------------------------------------------------------

export function numeric(
  skill: Skill,
  difficulty: Difficulty,
  fields: BaseFields & { value: number; tolerance?: number; unit?: string },
): NumericQuestion {
  return {
    ...base(skill, difficulty, fields, `${fields.prompt}|${fields.value}`),
    type: 'numeric-input',
    answer: {
      kind: 'numeric',
      value: fields.value,
      ...(fields.tolerance !== undefined ? { tolerance: fields.tolerance } : {}),
    },
    ...(fields.unit ? { unit: fields.unit } : {}),
  }
}

// --- Trắc nghiệm -------------------------------------------------------------

/**
 * Trộn đáp án đúng vào các đáp án nhiễu.
 * Nhãn được dùng làm id sau khi rút gọn, nên đáp án nhiễu trùng nhãn với đáp án
 * đúng sẽ bị loại - tránh tình huống có hai phương án cùng đúng.
 */
export function choice(
  skill: Skill,
  difficulty: Difficulty,
  fields: BaseFields & {
    correct: string | Choice
    distractors: Array<string | Choice>
    rng: Rng
  },
): MultipleChoiceQuestion {
  const correct = toChoice(fields.correct, 'c0')
  const seen = new Set([correct.label])
  const distractors = fields.distractors
    .map((d, i) => toChoice(d, `d${i}`))
    .filter((d) => {
      if (seen.has(d.label)) return false
      seen.add(d.label)
      return true
    })

  const choices = fields.rng.shuffle([correct, ...distractors])
  return {
    ...base(skill, difficulty, fields, `${fields.prompt}|${correct.label}`),
    type: 'multiple-choice',
    choices,
    answer: { kind: 'choice', choiceId: correct.id },
  }
}

function toChoice(value: string | Choice, fallbackId: string): Choice {
  return typeof value === 'string' ? { id: fallbackId, label: value } : value
}

// --- Nhập chữ ----------------------------------------------------------------

export function text(
  skill: Skill,
  difficulty: Difficulty,
  fields: BaseFields & { accepted: string[] },
): TextQuestion {
  return {
    ...base(skill, difficulty, fields, `${fields.prompt}|${fields.accepted[0] ?? ''}`),
    type: 'text-input',
    answer: { kind: 'text', accepted: fields.accepted },
  }
}

// --- Sắp xếp -----------------------------------------------------------------

export function order(
  skill: Skill,
  difficulty: Difficulty,
  fields: BaseFields & { items: string[]; rng: Rng },
): DragOrderQuestion {
  const choices: Choice[] = fields.items.map((label, i) => ({ id: `i${i}`, label }))
  return {
    ...base(skill, difficulty, fields, `${fields.prompt}|${fields.items.join(',')}`),
    type: 'drag-order',
    // Xáo trộn khi hiển thị; đáp án vẫn là thứ tự gốc.
    choices: fields.rng.shuffle(choices),
    answer: { kind: 'order', orderedIds: choices.map((c) => c.id) },
  }
}

// --- Nối cặp -----------------------------------------------------------------

export function pairs(
  skill: Skill,
  difficulty: Difficulty,
  fields: BaseFields & { pairs: Array<[string, string]>; rng: Rng },
): MatchPairsQuestion {
  const left: Choice[] = fields.pairs.map(([l], i) => ({ id: `l${i}`, label: l }))
  const right: Choice[] = fields.pairs.map(([, r], i) => ({ id: `r${i}`, label: r }))
  return {
    ...base(skill, difficulty, fields, `${fields.prompt}|${fields.pairs.flat().join(',')}`),
    type: 'match-pairs',
    left: fields.rng.shuffle(left),
    right: fields.rng.shuffle(right),
    answer: {
      kind: 'pairs',
      pairs: fields.pairs.map((_, i) => ({ leftId: `l${i}`, rightId: `r${i}` })),
    },
  }
}

// --- Nghe nhạc ---------------------------------------------------------------

export function audioChoice(
  skill: Skill,
  difficulty: Difficulty,
  fields: BaseFields & {
    audio: AudioSpec
    correct: string
    distractors: string[]
    rng: Rng
  },
): AudioChoiceQuestion {
  const correct: Choice = { id: 'c0', label: fields.correct }
  const seen = new Set([correct.label])
  const distractors = fields.distractors
    .filter((label) => {
      if (seen.has(label)) return false
      seen.add(label)
      return true
    })
    .map((label, i) => ({ id: `d${i}`, label }))

  return {
    ...base(skill, difficulty, fields, `${fields.prompt}|${fields.correct}|${JSON.stringify(fields.audio)}`),
    type: 'audio-choice',
    audio: fields.audio,
    choices: fields.rng.shuffle([correct, ...distractors]),
    answer: { kind: 'choice', choiceId: correct.id },
  }
}

export function rhythmTap(
  skill: Skill,
  difficulty: Difficulty,
  fields: BaseFields & { audio: RhythmSpec; toleranceMs?: number },
): RhythmTapQuestion {
  return {
    ...base(skill, difficulty, fields, `${fields.prompt}|${fields.audio.pattern.join(',')}`),
    type: 'rhythm-tap',
    audio: fields.audio,
    answer: {
      kind: 'rhythm',
      pattern: fields.audio.pattern,
      // Sai số rộng tay: trẻ tiểu học gõ chưa chuẩn như nhạc công.
      toleranceMs: fields.toleranceMs ?? 250,
    },
  }
}

// --- Tình huống Đạo đức ------------------------------------------------------

export function scenario(
  skill: Skill,
  difficulty: Difficulty,
  fields: BaseFields & { options: ScenarioOption[]; rng: Rng },
): ScenarioQuestion {
  if (skill.subject !== 'ethics') {
    throw new Error(`Thể loại tình huống chỉ dùng cho môn Đạo đức, không phải ${skill.subject}`)
  }
  return {
    ...base(skill, difficulty, fields, `${fields.prompt}|${fields.options.map((o) => o.id).join(',')}`),
    subject: 'ethics',
    type: 'scenario',
    options: fields.rng.shuffle(fields.options),
  }
}

// --- Kiểu generator ----------------------------------------------------------

/**
 * Một generator sinh câu hỏi cho đúng một kỹ năng.
 * Trả về null khi không sinh được câu ở độ khó yêu cầu (ví dụ kỹ năng chỉ có
 * bài mức 1) - `selector` sẽ tự hạ độ khó hoặc đổi kỹ năng.
 */
export type Generator = (skill: Skill, difficulty: Difficulty, rng: Rng) => Question | null

export type GeneratorMap = Record<string, Generator>
