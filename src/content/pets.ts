/**
 * Bộ thú đồng hành và bộ phép thuật.
 *
 * Mỗi môn học một nguyên tố, mỗi nguyên tố ba thú và ba phép. Thú lấy hình từ
 * `features/pixel/creatures` (đổi bảng màu theo nguyên tố) nên không phải vẽ
 * thêm sprite nào.
 *
 * Tên phép đặt bằng tiếng Việt và gắn với môn học, để trẻ tung "Bão Chữ" thì
 * vẫn đang nghĩ tới Tiếng Việt chứ không phải một hệ phép trừu tượng nào khác.
 *
 * Mỗi thú có một hình thái TIẾN HOÁ ở cấp 5: đổi tên, đổi hình, máu và sức mạnh
 * nhảy một bậc, và học thêm phép mạnh nhất của hệ mình. Tiến hoá gắn thẳng vào
 * con gốc nên bộ sưu tập vẫn là 12 ô - đó là con thú của trẻ lớn lên, không phải
 * một con mới phải đi bắt lại.
 */

import type { Pet, Spell } from '../engine/pets'
import { counterElement, resolvePet } from '../engine/pets'
import { SUBJECTS, type Subject } from './types'

export const SPELLS: Record<string, Spell> = {
  // --- Số Học ---
  'tia-so': { id: 'tia-so', name: 'Tia Số', element: 'math', power: 1, flavour: 'bắn ra một tia số sáng rực' },
  'mua-con-so': { id: 'mua-con-so', name: 'Mưa Con Số', element: 'math', power: 1.25, flavour: 'gọi một trận mưa con số' },
  'bua-phep-tinh': { id: 'bua-phep-tinh', name: 'Búa Phép Tính', element: 'math', power: 1.45, flavour: 'giáng xuống một chiếc búa khổng lồ' },

  // --- Ngôn Từ ---
  'gio-chu': { id: 'gio-chu', name: 'Gió Chữ', element: 'vietnamese', power: 1, flavour: 'thổi tới một cơn gió đầy chữ cái' },
  'bao-chu': { id: 'bao-chu', name: 'Bão Chữ', element: 'vietnamese', power: 1.25, flavour: 'cuốn lên một cơn bão chữ' },
  'but-than': { id: 'but-than', name: 'Bút Thần', element: 'vietnamese', power: 1.45, flavour: 'vung cây bút thần vạch một đường sáng' },

  // --- Thanh Âm ---
  'song-am': { id: 'song-am', name: 'Sóng Âm', element: 'music', power: 1, flavour: 'đẩy tới một đợt sóng âm' },
  'chuong-ngan': { id: 'chuong-ngan', name: 'Chuông Ngân', element: 'music', power: 1.25, flavour: 'rung một hồi chuông ngân dài' },
  'hop-xuong': { id: 'hop-xuong', name: 'Hợp Xướng', element: 'music', power: 1.45, flavour: 'cất lên một bản hợp xướng vang dội' },

  // --- Ánh Sáng ---
  'tia-sang': { id: 'tia-sang', name: 'Tia Sáng', element: 'ethics', power: 1, flavour: 'rọi một tia sáng ấm' },
  'vong-sang': { id: 'vong-sang', name: 'Vòng Sáng', element: 'ethics', power: 1.25, flavour: 'toả ra một vòng sáng rộng' },
  'binh-minh': { id: 'binh-minh', name: 'Bình Minh', element: 'ethics', power: 1.45, flavour: 'gọi cả một buổi bình minh ùa tới' },
}

export const PETS: Pet[] = [
  // --- Số Học ---
  { id: 'so-con', name: 'Sóc Số', element: 'math', sprite: 'slime', maxHp: 34, power: 1, spellIds: ['tia-so', 'mua-con-so'], evolution: { name: 'Sóc Sao Băng', sprite: 'slime-king', maxHp: 52, power: 1.2, spellIds: ['bua-phep-tinh'], atLevel: 5 } },
  { id: 'rong-so', name: 'Rồng Số', element: 'math', sprite: 'dragon', maxHp: 46, power: 1.15, spellIds: ['tia-so', 'mua-con-so', 'bua-phep-tinh'], evolution: { name: 'Rồng Số Hoàng Kim', sprite: 'dragon-elder', maxHp: 68, power: 1.35, spellIds: ['bua-phep-tinh'], atLevel: 5 } },
  { id: 'gau-dem', name: 'Gấu Đếm', element: 'math', sprite: 'panda', maxHp: 52, power: 0.95, spellIds: ['tia-so', 'bua-phep-tinh'], evolution: { name: 'Gấu Đại Số', sprite: 'panda-guardian', maxHp: 76, power: 1.15, spellIds: ['mua-con-so'], atLevel: 5 } },

  // --- Ngôn Từ ---
  { id: 'cu-chu', name: 'Cú Chữ', element: 'vietnamese', sprite: 'owl', maxHp: 34, power: 1, spellIds: ['gio-chu', 'bao-chu'], evolution: { name: 'Cú Thông Thái', sprite: 'owl-sage', maxHp: 52, power: 1.2, spellIds: ['but-than'], atLevel: 5 } },
  { id: 'cao-tho', name: 'Cáo Thơ', element: 'vietnamese', sprite: 'fox', maxHp: 40, power: 1.1, spellIds: ['gio-chu', 'bao-chu', 'but-than'], evolution: { name: 'Cáo Chín Vần', sprite: 'fox-elder', maxHp: 60, power: 1.3, spellIds: ['but-than'], atLevel: 5 } },
  { id: 'vet-ke', name: 'Vẹt Kể', element: 'vietnamese', sprite: 'owl', maxHp: 44, power: 0.95, spellIds: ['gio-chu', 'but-than'], evolution: { name: 'Vẹt Kể Chuyện', sprite: 'owl-sage', maxHp: 66, power: 1.15, spellIds: ['bao-chu'], atLevel: 5 } },

  // --- Thanh Âm ---
  { id: 'chuong-con', name: 'Chuông Con', element: 'music', sprite: 'bell', maxHp: 32, power: 1.05, spellIds: ['song-am', 'chuong-ngan'], evolution: { name: 'Chuông Vàng', sprite: 'bell-grand', maxHp: 50, power: 1.25, spellIds: ['hop-xuong'], atLevel: 5 } },
  { id: 'meo-hat', name: 'Mèo Hát', element: 'music', sprite: 'fox', maxHp: 38, power: 1, spellIds: ['song-am', 'chuong-ngan', 'hop-xuong'], evolution: { name: 'Mèo Ca Trưởng', sprite: 'fox-elder', maxHp: 58, power: 1.2, spellIds: ['hop-xuong'], atLevel: 5 } },
  { id: 'trong-nho', name: 'Trống Nhỏ', element: 'music', sprite: 'slime', maxHp: 48, power: 0.9, spellIds: ['song-am', 'hop-xuong'], evolution: { name: 'Trống Đại Hội', sprite: 'slime-king', maxHp: 72, power: 1.1, spellIds: ['chuong-ngan'], atLevel: 5 } },

  // --- Ánh Sáng ---
  { id: 'dom-sang', name: 'Đom Sáng', element: 'ethics', sprite: 'slime', maxHp: 30, power: 1.1, spellIds: ['tia-sang', 'vong-sang'], evolution: { name: 'Đom Đóm Rạng', sprite: 'slime-king', maxHp: 48, power: 1.3, spellIds: ['binh-minh'], atLevel: 5 } },
  { id: 'nai-sang', name: 'Nai Ánh Sáng', element: 'ethics', sprite: 'panda', maxHp: 44, power: 1, spellIds: ['tia-sang', 'vong-sang', 'binh-minh'], evolution: { name: 'Nai Ánh Dương', sprite: 'panda-guardian', maxHp: 66, power: 1.2, spellIds: ['binh-minh'], atLevel: 5 } },
  { id: 'hac-sang', name: 'Hạc Bình Minh', element: 'ethics', sprite: 'owl', maxHp: 40, power: 1.05, spellIds: ['tia-sang', 'binh-minh'], evolution: { name: 'Hạc Rực Rỡ', sprite: 'owl-sage', maxHp: 60, power: 1.25, spellIds: ['vong-sang'], atLevel: 5 } },
]

const BY_ID = new Map(PETS.map((p) => [p.id, p]))

export function getPet(id: string): Pet | null {
  return BY_ID.get(id) ?? null
}

export function petsOfElement(element: Subject): Pet[] {
  return PETS.filter((p) => p.element === element)
}

/**
 * Đội hình mặc định khi trẻ chưa thu phục con nào.
 *
 * Luôn phát một thú CÙNG nguyên tố với môn đang học, cộng hai thú khác nguyên
 * tố. Ba nguyên tố khác nhau trong đội là cố ý: dù gặp quái hệ nào trẻ cũng
 * luôn có ít nhất một lựa chọn khắc chế, nên quyết định "chọn phép nào" lúc nào
 * cũng có ý nghĩa.
 */
export function starterTeam(subject: Subject): Pet[] {
  // Thứ tự có chủ ý:
  //   1. cùng hệ với môn - con trẻ gắn bó nhất;
  //   2. hệ KHẮC CHẾ được quái của môn đó - nếu thiếu con này thì gặp quái nào
  //      bảng chọn phép cũng chỉ còn lựa chọn xấu, và quyết định thành giả;
  //   3. một hệ thứ ba cho đủ ba lựa chọn khác nhau.
  const counter = counterElement(subject)
  const third = SUBJECTS.find((e) => e !== subject && e !== counter)!
  return [subject, counter, third].map((element) => petsOfElement(element)[0]!)
}

/** Đội hình dựng từ danh sách thú trẻ đã thu phục; thiếu thì bù bằng đội mặc định. */
/**
 * Đội hình dựng từ thú đã thu phục, ĐÃ cộng cấp và đã tiến hoá.
 *
 * `petXp` truyền vào để con thú ra trận đúng bằng sức nó đang có. Bỏ qua tham
 * số này là con đã tiến hoá vẫn đánh yếu như lúc mới bắt.
 */
export function buildTeam(
  ownedIds: string[],
  subject: Subject,
  size = 3,
  petXp: Record<string, number> = {},
): Pet[] {
  const owned = ownedIds
    .map(getPet)
    .filter((p): p is Pet => p !== null)
    .map((p) => resolvePet(p, petXp[p.id] ?? 0))
  // Ưu tiên thú cùng nguyên tố với môn đang học đứng đầu đội.
  const sorted = [...owned].sort(
    (a, b) => Number(b.element === subject) - Number(a.element === subject),
  )
  const team = sorted.slice(0, size)
  for (const fallback of starterTeam(subject)) {
    if (team.length >= size) break
    if (!team.some((p) => p.id === fallback.id)) team.push(fallback)
  }

  // GIỮ CHỖ cho một con khắc chế được quái của vùng này. Trẻ thu phục ba con
  // cùng hệ là chuyện rất dễ xảy ra, và khi đó bảng chọn phép chỉ còn toàn lựa
  // chọn xấu - trẻ bấm nút nào cũng như nhau, đúng cái chán ta đang chữa.
  const counter = counterElement(subject)
  if (!team.some((p) => p.element === counter)) {
    const rescue = petsOfElement(counter).find((p) => !team.some((t) => t.id === p.id))
    if (rescue) team[team.length - 1] = rescue
  }

  return team
}
