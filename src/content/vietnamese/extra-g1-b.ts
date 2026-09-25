/**
 * Câu hỏi Tiếng Việt BỔ SUNG ĐỢT HAI - lớp 1, ba kỹ năng đầu.
 *
 * Sau đợt một, tám trận liền của một em lớp 1 mới vào ra 54 câu khác nhau và
 * vẫn lặp 10/64 câu: em ấy chỉ mở được Âm và chữ cái, Vần, Dấu thanh, mà ba kỹ
 * năng ấy có 54 câu. Thêm bốn câu mỗi kỹ năng (ba câu bậc 1, một câu bậc 2) thì
 * đủ 66 câu cho 64 lượt hỏi.
 *
 * Cùng quy ước với `extra-g1.ts`.
 */

import type { Bank } from '../bank'

const bank: Bank = {
  'vietnamese.g1.am-chu-cai': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Tiếng "lúa" bắt đầu bằng âm nào?',
      correct: 'l', distractors: ['n', 'u', 'đ'],
      explanation: 'Tiếng "lúa" có âm đầu l. Chú ý phân biệt l và n.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Tiếng "đèn" bắt đầu bằng âm nào?',
      correct: 'đ', distractors: ['d', 'e', 'b'],
      explanation: 'Tiếng "đèn" có âm đầu đ - chữ d có thêm nét ngang.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Đồ vật nào có tên bắt đầu bằng âm "v"?',
      correct: 'vở', distractors: ['bút', 'thước', 'cặp'],
      explanation: 'Tiếng "vở" có âm đầu v.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Tiếng nào bắt đầu bằng âm "ph"?',
      correct: 'phố', distractors: ['pin', 'hồ', 'bố'],
      explanation: '"phố" có âm đầu ph; "pin" chỉ có âm đầu p.',
    },
  ],

  'vietnamese.g1.van-don-gian': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Tiếng "cau" có vần gì?',
      correct: 'au', distractors: ['a', 'ao', 'âu'],
      explanation: 'Tiếng "cau" gồm âm đầu c và vần au.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Ghép âm "t" với vần "ai" được tiếng nào?',
      correct: 'tai', distractors: ['tay', 'tao', 'ta'],
      explanation: 't + ai = tai.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Tiếng nào có vần "em"?',
      correct: 'kem', distractors: ['ken', 'keo', 'ke'],
      explanation: '"kem" có vần em; "ken" có vần en, "keo" có vần eo.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Tiếng "nhện" có vần gì?',
      correct: 'ên', distractors: ['en', 'ênh', 'ê'],
      explanation: 'Tiếng "nhện" gồm âm đầu nh, vần ên và dấu nặng.',
      hint: 'Bỏ âm đầu "nh" và dấu thanh ra.',
    },
  ],

  'vietnamese.g1.dau-thanh': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Tiếng "võng" mang dấu thanh gì?',
      correct: 'dấu ngã', distractors: ['dấu hỏi', 'dấu sắc', 'dấu huyền'],
      explanation: '"võng" viết với dấu ngã, như trong "cái võng".',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Tiếng "chợ" mang dấu thanh gì?',
      correct: 'dấu nặng', distractors: ['dấu sắc', 'dấu hỏi', 'dấu ngã'],
      explanation: 'Dấu nặng là dấu chấm đặt dưới chữ: chợ.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Thêm dấu sắc vào tiếng "ca" được tiếng nào?',
      correct: 'cá', distractors: ['cà', 'cả', 'cạ'],
      explanation: 'Dấu sắc là nét xiên từ phải xuống trái: ca - cá.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Trong câu "Mẹ mua cá ở chợ", tiếng nào mang thanh ngang?',
      correct: 'mua', distractors: ['Mẹ', 'cá', 'chợ'],
      explanation: '"mua" không có dấu nào; Mẹ, chợ có dấu nặng, cá có dấu sắc.',
      hint: 'Tìm tiếng không có dấu.',
    },
  ],
}

export default bank
