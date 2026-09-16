/**
 * Ngân hàng câu hỏi soạn tay (Tiếng Việt, Đạo đức).
 *
 * Câu hỏi được khai báo dưới dạng DỮ LIỆU THUẦN, không phải lời gọi hàm, để
 * người soạn nội dung sửa trực tiếp trong file mà không cần biết lập trình.
 * Việc trộn đáp án và dựng đối tượng `Question` do `bankToQuestion` lo.
 */

import type { Rng } from '../engine/rng'
import type { Skill } from './curriculum'
import { choice, order, pairs, scenario, text } from './factory'
import type { Difficulty, Question, ScenarioOption } from './types'

interface EntryBase {
  difficulty: Difficulty
  prompt: string
  explanation: string
  hint?: string
  image?: string
}

/** Trắc nghiệm một đáp án đúng. */
export interface ChoiceEntry extends EntryBase {
  kind: 'choice'
  correct: string
  distractors: string[]
}

/** Trẻ gõ đáp án. `accepted` liệt kê mọi cách viết được chấp nhận. */
export interface TextEntry extends EntryBase {
  kind: 'text'
  accepted: string[]
}

/** Sắp xếp từ/cụm từ thành câu đúng. `items` là thứ tự ĐÚNG. */
export interface OrderEntry extends EntryBase {
  kind: 'order'
  items: string[]
}

/** Nối cặp. Mỗi phần tử là [vế trái, vế phải tương ứng]. */
export interface PairsEntry extends EntryBase {
  kind: 'pairs'
  pairs: Array<[string, string]>
}

/** Tình huống Đạo đức - không có đáp án đúng/sai. */
export interface ScenarioEntry extends EntryBase {
  kind: 'scenario'
  options: ScenarioOption[]
}

export type BankEntry = ChoiceEntry | TextEntry | OrderEntry | PairsEntry | ScenarioEntry

export type Bank = Record<string, BankEntry[]>

export function bankToQuestion(skill: Skill, entry: BankEntry, rng: Rng): Question {
  const common = {
    prompt: entry.prompt,
    explanation: entry.explanation,
    ...(entry.hint ? { hint: entry.hint } : {}),
    ...(entry.image ? { image: entry.image } : {}),
  }

  switch (entry.kind) {
    case 'choice':
      return choice(skill, entry.difficulty, {
        ...common,
        correct: entry.correct,
        distractors: entry.distractors,
        rng,
      })
    case 'text':
      return text(skill, entry.difficulty, { ...common, accepted: entry.accepted })
    case 'order':
      return order(skill, entry.difficulty, { ...common, items: entry.items, rng })
    case 'pairs':
      return pairs(skill, entry.difficulty, { ...common, pairs: entry.pairs, rng })
    case 'scenario':
      return scenario(skill, entry.difficulty, { ...common, options: entry.options, rng })
  }
}

/**
 * Tiện ích soạn tình huống Đạo đức: bớt lặp lại khi khai báo ba lựa chọn.
 * Thứ tự khai báo không quan trọng - `scenario()` sẽ trộn trước khi hiển thị.
 */
export function opt(
  id: string,
  label: string,
  quality: ScenarioOption['quality'],
  feedback: string,
  virtues: ScenarioOption['virtues'] = [],
): ScenarioOption {
  return { id, label, quality, feedback, virtues }
}
