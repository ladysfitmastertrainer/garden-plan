/**
 * Bộ thú đồng hành và bộ chiêu thức.
 *
 * MỖI CON THÚ BỐN CHIÊU, RIÊNG CỦA NÓ. Không con nào xài chung bộ với con nào,
 * kể cả hai con cùng hệ - vì nếu ba con hệ Số Học đánh ra y hệt nhau thì "chọn
 * con nào đi theo" chỉ còn là chọn một bộ chỉ số, và con thú mất hết cá tính.
 * Sóc Số bắn tia, Rồng Số thở ra con số, Gấu Đếm giáng nắm đấm hàng chục.
 *
 * Bốn chiêu ấy mở dần, và mở theo NẤC TIẾN HOÁ của chính con thú:
 *
 *   chiêu 1, 2  - có ngay. Hệ của chính nó. 1,0 và 1,25.
 *   chiêu 3     - nấc tiến hoá thứ nhất (cấp 5). MƯỢN HỆ KHÁC, 1,5.
 *   chiêu 4     - nấc tiến hoá thứ hai (cấp 10). Chiêu cuối, 2,0, kèm hiệu ứng.
 *
 * Nấc thứ ba (cấp 20) không thêm chiêu - nó đổi hình và cộng chỉ số.
 *
 * ---- VÌ SAO CHIÊU THỨ BA PHẢI MƯỢN HỆ KHÁC ----
 *
 * Trước đây trẻ ra trận với ĐỘI BA CON khác hệ nhau, nên gặp quái hệ nào cũng
 * có ít nhất một con khắc chế được. Giờ đi có một con. Nếu cả bốn chiêu đều một
 * hệ thì gặp con quái khắc hệ mình, bấm chiêu nào cũng 0,7 - bốn cái nút cho
 * đúng một nước đi, tức là không có nước đi nào.
 *
 * Nên ở nấc tiến hoá thứ nhất, con thú HỌC ĐƯỢC SỨC MẠNH CỦA MỘT MÔN KHÁC -
 * đúng cái môn bịt kín lỗ hổng của nó (xem `oppositeElement`). Tiến hoá từ đó
 * không chỉ là mạnh lên, nó MỞ RA một lựa chọn chưa từng có. Và vì chỉ mang
 * được hai chiêu ra trận, trẻ phải quyết định thật: cầm chiêu nhà cho chắc, hay
 * cầm chiêu mượn để chờ đúng con quái ấy.
 *
 * Tên chiêu đặt bằng tiếng Việt và gắn với môn học, để trẻ tung "Bão Chữ" thì
 * vẫn đang nghĩ tới Tiếng Việt chứ không phải một hệ phép trừu tượng nào khác.
 *
 * Thú lấy hình từ `features/pixel/creatures` (đổi bảng màu theo nguyên tố) nên
 * không phải vẽ thêm sprite nào.
 */

import type { Pet, Spell } from '../engine/pets'
import { oppositeElement, resolvePet } from '../engine/pets'
import type { Subject } from './types'

/**
 * Sức của bốn bậc chiêu. Một chỗ duy nhất, để không bao giờ gõ lệch.
 *
 * Bậc 3 bằng 1,5 lần chiêu nền và bậc 4 bằng 2 lần - đó là thước đo của cả hệ
 * thống, và nó phải đọc được ngay ở đây chứ không nằm rải rác trong ba mươi hai
 * dòng dữ liệu bên dưới.
 */
export const TIER_POWER = { 1: 1, 2: 1.25, 3: 1.5, 4: 2 } as const

export const SPELLS: Record<string, Spell> = {
  // ======================= SỐ HỌC =======================
  // Sóc Số - nhanh, bắn tỉa.
  'tia-so': { id: 'tia-so', name: 'Tia Số', element: 'math', power: 1, tier: 1, flavour: 'bắn ra một tia số sáng rực' },
  'mua-con-so': { id: 'mua-con-so', name: 'Mưa Con Số', element: 'math', power: 1.25, tier: 2, flavour: 'gọi một trận mưa con số' },
  // Rồng Số - to, thở ra sức mạnh.
  'hoi-tho-so': { id: 'hoi-tho-so', name: 'Hơi Thở Số', element: 'math', power: 1, tier: 1, flavour: 'phả ra một luồng hơi rực con số' },
  'xoay-cuu-chuong': { id: 'xoay-cuu-chuong', name: 'Xoáy Cửu Chương', element: 'math', power: 1.25, tier: 2, flavour: 'cuộn lên một cơn xoáy bảng cửu chương' },
  // Gấu Đếm - chậm, nặng đòn.
  'vo-tay-dem': { id: 'vo-tay-dem', name: 'Vỗ Tay Đếm', element: 'math', power: 1, tier: 1, flavour: 'vỗ tay đếm từng nhịp, mỗi nhịp một cú đánh' },
  'nam-dam-chuc': { id: 'nam-dam-chuc', name: 'Nắm Đấm Hàng Chục', element: 'math', power: 1.25, tier: 2, flavour: 'nện xuống một nắm đấm to bằng cả hàng chục' },
  // Chiêu MƯỢN: thú hệ Thanh Âm cầm chiêu này.
  'bua-phep-tinh': { id: 'bua-phep-tinh', name: 'Búa Phép Tính', element: 'math', power: 1.5, tier: 3, flavour: 'giáng xuống một chiếc búa khổng lồ' },
  // Chiêu cuối của hệ.
  'thien-ha-so': {
    id: 'thien-ha-so',
    name: 'Thiên Hà Số',
    element: 'math',
    power: 2,
    tier: 4,
    flavour: 'kéo cả một dải thiên hà toàn con số ập xuống',
    // HÚT: hố đen ở giữa dải thiên hà hút máu đối thủ sang cho con thú.
    effect: { kind: 'drain', turns: 3, tickPercent: 0.25 },
  },

  // ======================= NGÔN TỪ =======================
  // Cú Chữ - gió và bão.
  'gio-chu': { id: 'gio-chu', name: 'Gió Chữ', element: 'vietnamese', power: 1, tier: 1, flavour: 'thổi tới một cơn gió đầy chữ cái' },
  'bao-chu': { id: 'bao-chu', name: 'Bão Chữ', element: 'vietnamese', power: 1.25, tier: 2, flavour: 'cuốn lên một cơn bão chữ' },
  // Cáo Thơ - vần và nhịp.
  'van-dieu': { id: 'van-dieu', name: 'Vần Điệu', element: 'vietnamese', power: 1, tier: 1, flavour: 'gieo một vần trúng ngay giữa mặt' },
  'song-luc-bat': { id: 'song-luc-bat', name: 'Sóng Lục Bát', element: 'vietnamese', power: 1.25, tier: 2, flavour: 'đẩy tới từng đợt sóng sáu tám nối nhau' },
  // Vẹt Kể - lời và chuyện.
  'loi-ke': { id: 'loi-ke', name: 'Lời Kể', element: 'vietnamese', power: 1, tier: 1, flavour: 'kể một câu khiến đối thủ đứng ngẩn ra' },
  'chuyen-co-tich': { id: 'chuyen-co-tich', name: 'Chuyện Cổ Tích', element: 'vietnamese', power: 1.25, tier: 2, flavour: 'mở ra một câu chuyện cổ tích ùa lấy đối thủ' },
  // Chiêu MƯỢN: thú hệ Ánh Sáng cầm chiêu này.
  'but-than': { id: 'but-than', name: 'Bút Thần', element: 'vietnamese', power: 1.5, tier: 3, flavour: 'vung cây bút thần vạch một đường sáng' },
  // Chiêu cuối của hệ.
  'thien-thu': {
    id: 'thien-thu',
    name: 'Thiên Thư',
    element: 'vietnamese',
    power: 2,
    tier: 4,
    flavour: 'mở pho thiên thư, chữ vàng bay kín trời',
    // TRÓI: chữ vàng quấn quanh đối thủ, đòn của nó yếu hẳn đi.
    effect: { kind: 'bind', turns: 2 },
  },

  // ======================= THANH ÂM =======================
  // Chuông Con - sóng và ngân.
  'song-am': { id: 'song-am', name: 'Sóng Âm', element: 'music', power: 1, tier: 1, flavour: 'đẩy tới một đợt sóng âm' },
  'chuong-ngan': { id: 'chuong-ngan', name: 'Chuông Ngân', element: 'music', power: 1.25, tier: 2, flavour: 'rung một hồi chuông ngân dài' },
  // Mèo Hát - giọng.
  'ngan-nga': { id: 'ngan-nga', name: 'Ngân Nga', element: 'music', power: 1, tier: 1, flavour: 'ngân nga một câu làm rung cả không khí' },
  'not-cao-vut': { id: 'not-cao-vut', name: 'Nốt Cao Vút', element: 'music', power: 1.25, tier: 2, flavour: 'vút lên một nốt cao chói tai' },
  // Trống Nhỏ - nhịp.
  'nhip-trong': { id: 'nhip-trong', name: 'Nhịp Trống', element: 'music', power: 1, tier: 1, flavour: 'gõ một nhịp trống dội thẳng vào ngực' },
  'don-trong': { id: 'don-trong', name: 'Dồn Trống', element: 'music', power: 1.25, tier: 2, flavour: 'dồn một hồi trống không cho ai kịp thở' },
  // Chiêu MƯỢN: thú hệ Số Học cầm chiêu này.
  'hop-xuong': { id: 'hop-xuong', name: 'Hợp Xướng', element: 'music', power: 1.5, tier: 3, flavour: 'cất lên một bản hợp xướng vang dội' },
  // Chiêu cuối của hệ.
  'thien-nhac': {
    id: 'thien-nhac',
    name: 'Thiên Nhạc',
    element: 'music',
    power: 2,
    tier: 4,
    flavour: 'tấu một khúc thiên nhạc rung cả bầu trời',
    // ĐÓNG BĂNG: khúc nhạc hay tới mức đối thủ đứng sững, mất đúng một lượt.
    effect: { kind: 'freeze', turns: 1 },
  },

  // ======================= ÁNH SÁNG =======================
  // Đom Sáng - tia và vòng.
  'tia-sang': { id: 'tia-sang', name: 'Tia Sáng', element: 'ethics', power: 1, tier: 1, flavour: 'rọi một tia sáng ấm' },
  'vong-sang': { id: 'vong-sang', name: 'Vòng Sáng', element: 'ethics', power: 1.25, tier: 2, flavour: 'toả ra một vòng sáng rộng' },
  // Nai Ánh Sáng - bước chân và cả khu rừng.
  'buoc-chan-sang': { id: 'buoc-chan-sang', name: 'Bước Chân Sáng', element: 'ethics', power: 1, tier: 1, flavour: 'in xuống một bước chân sáng rực' },
  'rung-dom-dom': { id: 'rung-dom-dom', name: 'Rừng Đom Đóm', element: 'ethics', power: 1.25, tier: 2, flavour: 'gọi cả một rừng đom đóm ùa lên' },
  // Hạc Bình Minh - cánh và hừng đông.
  'canh-som': { id: 'canh-som', name: 'Cánh Sớm', element: 'ethics', power: 1, tier: 1, flavour: 'quạt một nhát cánh mang theo nắng sớm' },
  'hung-dong': { id: 'hung-dong', name: 'Hừng Đông', element: 'ethics', power: 1.25, tier: 2, flavour: 'kéo cả vệt hừng đông quét ngang' },
  // Chiêu MƯỢN: thú hệ Ngôn Từ cầm chiêu này.
  'binh-minh': { id: 'binh-minh', name: 'Bình Minh', element: 'ethics', power: 1.5, tier: 3, flavour: 'gọi cả một buổi bình minh ùa tới' },
  // Chiêu cuối của hệ.
  'vang-duong': {
    id: 'vang-duong',
    name: 'Vầng Dương',
    element: 'ethics',
    power: 2,
    tier: 4,
    flavour: 'nâng cả một vầng dương lên khỏi đường chân trời',
    // CHÁY: nắng gắt để lại vết bỏng, đối thủ mất máu thêm mấy lượt nữa.
    effect: { kind: 'burn', turns: 3, tickPercent: 0.3 },
  },
}

/**
 * Ba nấc tiến hoá của mọi thú, đặt ở CÙNG MỘT MỐC CẤP cho cả bộ.
 *
 * Không con nào tiến hoá sớm hơn con nào. Lệch mốc thì việc chọn nuôi con nào
 * biến thành một bài toán lịch trình - trẻ tám tuổi sẽ chọn con tiến hoá sớm
 * nhất chứ không chọn con mình thích, và mất đúng cái lý do để có mười hai con.
 */
export const EVOLUTION_LEVELS = [5, 10, 20] as const

/*
  ---- MÁU CỦA MỘT CON THÚ ĐI MỘT MÌNH ----

  Những con số dưới đây vừa được nhân lên gần ba lần, và đó không phải là một
  đợt buff.

  Trước đây thanh máu của trẻ là máu BA con cộng lại - một đội mở màn cộng ra
  chừng 98. Giờ ra trận đúng một con, nên nếu giữ nguyên con số cũ thì trẻ bước
  vào trận đầu tiên với 34 máu trước một con quái đánh mỗi đòn tám điểm: bốn đòn
  là về làng. Cùng một con thú, cùng một con quái, mà trận đấu ngắn đi ba lần.

  Nhân lên để một con thú đi một mình chịu đòn ĐÚNG BẰNG cả đội ngày trước. Mọi
  con số cân bằng khác - sát thương quái, máu quái, số lượt - nhờ vậy không phải
  tính lại dòng nào.
*/

export const PETS: Pet[] = [
  // --- Số Học ---
  {
    id: 'so-con',
    name: 'Sóc Số',
    element: 'math',
    sprite: 'slime',
    maxHp: 95,
    power: 1,
    spellIds: ['tia-so', 'mua-con-so', 'hop-xuong', 'thien-ha-so'],
    evolutions: [
      { name: 'Sóc Sao Băng', sprite: 'slime-king', maxHp: 145, power: 1.2, atLevel: 5 },
      { name: 'Sóc Thiên Hà', sprite: 'slime-titan', maxHp: 205, power: 1.38, atLevel: 10 },
      { name: 'Sóc Vũ Trụ', sprite: 'slime-avatar', maxHp: 280, power: 1.55, atLevel: 20 },
    ],
  },
  {
    id: 'rong-so',
    name: 'Rồng Số',
    element: 'math',
    sprite: 'dragon',
    maxHp: 130,
    power: 1.15,
    spellIds: ['hoi-tho-so', 'xoay-cuu-chuong', 'hop-xuong', 'thien-ha-so'],
    evolutions: [
      { name: 'Rồng Số Hoàng Kim', sprite: 'dragon-elder', maxHp: 190, power: 1.35, atLevel: 5 },
      { name: 'Rồng Số Bạch Kim', sprite: 'dragon-sovereign', maxHp: 265, power: 1.5, atLevel: 10 },
      { name: 'Rồng Số Vô Cực', sprite: 'dragon-celestial', maxHp: 345, power: 1.68, atLevel: 20 },
    ],
  },
  {
    id: 'gau-dem',
    name: 'Gấu Đếm',
    element: 'math',
    sprite: 'panda',
    maxHp: 145,
    power: 0.95,
    spellIds: ['vo-tay-dem', 'nam-dam-chuc', 'hop-xuong', 'thien-ha-so'],
    evolutions: [
      { name: 'Gấu Đại Số', sprite: 'panda-guardian', maxHp: 215, power: 1.15, atLevel: 5 },
      { name: 'Gấu Hàm Số', sprite: 'panda-warden', maxHp: 290, power: 1.3, atLevel: 10 },
      { name: 'Gấu Định Lý', sprite: 'panda-colossus', maxHp: 380, power: 1.45, atLevel: 20 },
    ],
  },

  // --- Ngôn Từ ---
  {
    id: 'cu-chu',
    name: 'Cú Chữ',
    element: 'vietnamese',
    sprite: 'owl',
    maxHp: 95,
    power: 1,
    spellIds: ['gio-chu', 'bao-chu', 'binh-minh', 'thien-thu'],
    evolutions: [
      { name: 'Cú Thông Thái', sprite: 'owl-sage', maxHp: 145, power: 1.2, atLevel: 5 },
      { name: 'Cú Bác Học', sprite: 'owl-oracle', maxHp: 205, power: 1.38, atLevel: 10 },
      { name: 'Cú Thiên Thư', sprite: 'owl-archon', maxHp: 280, power: 1.55, atLevel: 20 },
    ],
  },
  {
    id: 'cao-tho',
    name: 'Cáo Thơ',
    element: 'vietnamese',
    sprite: 'fox',
    maxHp: 110,
    power: 1.1,
    spellIds: ['van-dieu', 'song-luc-bat', 'binh-minh', 'thien-thu'],
    evolutions: [
      { name: 'Cáo Chín Vần', sprite: 'fox-elder', maxHp: 170, power: 1.3, atLevel: 5 },
      { name: 'Cáo Trăm Vần', sprite: 'fox-mystic', maxHp: 235, power: 1.45, atLevel: 10 },
      { name: 'Cáo Ngàn Thơ', sprite: 'fox-celestial', maxHp: 315, power: 1.62, atLevel: 20 },
    ],
  },
  {
    id: 'vet-ke',
    name: 'Vẹt Kể',
    element: 'vietnamese',
    sprite: 'owl',
    maxHp: 125,
    power: 0.95,
    spellIds: ['loi-ke', 'chuyen-co-tich', 'binh-minh', 'thien-thu'],
    evolutions: [
      { name: 'Vẹt Kể Chuyện', sprite: 'owl-sage', maxHp: 185, power: 1.15, atLevel: 5 },
      { name: 'Vẹt Truyền Thuyết', sprite: 'owl-oracle', maxHp: 260, power: 1.3, atLevel: 10 },
      { name: 'Vẹt Sử Thi', sprite: 'owl-archon', maxHp: 340, power: 1.45, atLevel: 20 },
    ],
  },

  // --- Thanh Âm ---
  {
    id: 'chuong-con',
    name: 'Chuông Con',
    element: 'music',
    sprite: 'bell',
    maxHp: 90,
    power: 1.05,
    spellIds: ['song-am', 'chuong-ngan', 'bua-phep-tinh', 'thien-nhac'],
    evolutions: [
      { name: 'Chuông Vàng', sprite: 'bell-grand', maxHp: 140, power: 1.25, atLevel: 5 },
      { name: 'Chuông Thánh Đường', sprite: 'bell-cathedral', maxHp: 200, power: 1.42, atLevel: 10 },
      { name: 'Chuông Vĩnh Hằng', sprite: 'bell-eternal', maxHp: 275, power: 1.58, atLevel: 20 },
    ],
  },
  {
    id: 'meo-hat',
    name: 'Mèo Hát',
    element: 'music',
    sprite: 'fox',
    maxHp: 105,
    power: 1,
    spellIds: ['ngan-nga', 'not-cao-vut', 'bua-phep-tinh', 'thien-nhac'],
    evolutions: [
      { name: 'Mèo Ca Trưởng', sprite: 'fox-elder', maxHp: 160, power: 1.2, atLevel: 5 },
      { name: 'Mèo Nhạc Trưởng', sprite: 'fox-mystic', maxHp: 230, power: 1.36, atLevel: 10 },
      { name: 'Mèo Thiên Thanh', sprite: 'fox-celestial', maxHp: 310, power: 1.52, atLevel: 20 },
    ],
  },
  {
    id: 'trong-nho',
    name: 'Trống Nhỏ',
    element: 'music',
    sprite: 'slime',
    maxHp: 135,
    power: 0.9,
    spellIds: ['nhip-trong', 'don-trong', 'bua-phep-tinh', 'thien-nhac'],
    evolutions: [
      { name: 'Trống Đại Hội', sprite: 'slime-king', maxHp: 200, power: 1.1, atLevel: 5 },
      { name: 'Trống Sấm', sprite: 'slime-titan', maxHp: 280, power: 1.26, atLevel: 10 },
      { name: 'Trống Thiên Lôi', sprite: 'slime-avatar', maxHp: 370, power: 1.42, atLevel: 20 },
    ],
  },

  // --- Ánh Sáng ---
  {
    id: 'dom-sang',
    name: 'Đom Sáng',
    element: 'ethics',
    sprite: 'slime',
    maxHp: 85,
    power: 1.1,
    spellIds: ['tia-sang', 'vong-sang', 'but-than', 'vang-duong'],
    evolutions: [
      { name: 'Đom Đóm Rạng', sprite: 'slime-king', maxHp: 135, power: 1.3, atLevel: 5 },
      { name: 'Đom Đóm Rực', sprite: 'slime-titan', maxHp: 195, power: 1.47, atLevel: 10 },
      { name: 'Đom Đóm Thiên Đăng', sprite: 'slime-avatar', maxHp: 270, power: 1.63, atLevel: 20 },
    ],
  },
  {
    id: 'nai-sang',
    name: 'Nai Ánh Sáng',
    element: 'ethics',
    sprite: 'panda',
    maxHp: 125,
    power: 1,
    spellIds: ['buoc-chan-sang', 'rung-dom-dom', 'but-than', 'vang-duong'],
    evolutions: [
      { name: 'Nai Ánh Dương', sprite: 'panda-guardian', maxHp: 185, power: 1.2, atLevel: 5 },
      { name: 'Nai Thái Dương', sprite: 'panda-warden', maxHp: 260, power: 1.36, atLevel: 10 },
      { name: 'Nai Vầng Dương', sprite: 'panda-colossus', maxHp: 340, power: 1.52, atLevel: 20 },
    ],
  },
  {
    id: 'hac-sang',
    name: 'Hạc Bình Minh',
    element: 'ethics',
    sprite: 'owl',
    maxHp: 110,
    power: 1.05,
    spellIds: ['canh-som', 'hung-dong', 'but-than', 'vang-duong'],
    evolutions: [
      { name: 'Hạc Rực Rỡ', sprite: 'owl-sage', maxHp: 170, power: 1.25, atLevel: 5 },
      { name: 'Hạc Hừng Đông', sprite: 'owl-oracle', maxHp: 235, power: 1.41, atLevel: 10 },
      { name: 'Hạc Nhật Quang', sprite: 'owl-archon', maxHp: 315, power: 1.57, atLevel: 20 },
    ],
  },
]

const BY_ID = new Map(PETS.map((p) => [p.id, p]))

export function getPet(id: string): Pet | null {
  return BY_ID.get(id) ?? null
}

export function petsOfElement(element: Subject): Pet[] {
  return PETS.filter((p) => p.element === element)
}

/**
 * Con thú phát cho một hồ sơ chưa thu phục được gì, ở môn này.
 *
 * Luôn CÙNG HỆ với môn đang học. Ở đảo Toán thì con Số Học bước ra - con mà hai
 * chiêu nền của nó đánh đúng vào thứ trẻ đang học, và ở nấc tiến hoá thứ nhất
 * sẽ mượn thêm hệ bịt đúng lỗ hổng của mình.
 */
export function defaultCompanion(subject: Subject): Pet {
  return petsOfElement(subject)[0]!
}

/**
 * CON THÚ RA TRẬN. Một con, do trẻ tự chọn.
 *
 * Chỗ này từng là `buildTeam`, và nó dựng một hàng ba con theo cả một bộ luật:
 * xếp con cùng hệ lên đầu, giữ chỗ cho một con khắc chế được quái vùng này, lấp
 * chỗ trống bằng những hệ chưa có mặt. Cả bộ luật ấy sinh ra để bảo đảm một
 * điều duy nhất - trẻ luôn có một lựa chọn tử tế trước mặt.
 *
 * Giờ điều ấy được bảo đảm theo đường khác và thẳng hơn: chính con thú mang
 * sẵn hai hệ trong bốn chiêu của nó (xem đầu tệp). Nên ở đây không còn luật
 * nào cả - trẻ chọn con nào thì con ấy ra trận.
 *
 * BA ĐƯỜNG RƠI VỀ, theo thứ tự:
 *   1. con trẻ đã chọn, nếu đã thu phục được nó;
 *   2. con đã thu phục CÙNG HỆ với môn này - trẻ chưa chọn bao giờ, thì phát
 *      cho con hợp môn nhất trong số con đang có;
 *   3. con mặc định của môn, khi tay trắng.
 *
 * Luôn trả về một con thú, không bao giờ null: một trận đấu không có ai đứng
 * ra đánh thì không phải là một trận đấu.
 */
export function companionOf(
  ownedIds: string[] | undefined,
  companionId: string | undefined,
  subject: Subject,
  petXp: Record<string, number> = {},
): Pet {
  const owned = (ownedIds ?? []).map(getPet).filter((p): p is Pet => p !== null)
  const chosen = companionId ? owned.find((p) => p.id === companionId) : undefined
  const pet =
    chosen ?? owned.find((p) => p.element === subject) ?? owned[0] ?? defaultCompanion(subject)
  return resolvePet(pet, petXp[pet.id] ?? 0)
}

/**
 * Hệ mà chiêu thứ ba của con thú này mang - để giao diện nói ra trước.
 *
 * Ở ngay đây chứ không để mỗi màn hình tự suy, vì nó là một lời hứa với trẻ
 * ("nuôi con này lên cấp 5 thì nó học được Ánh Sáng") và một lời hứa thì chỉ
 * được phát ra từ một chỗ.
 */
export function borrowedElement(pet: Pet): Subject {
  return oppositeElement(pet.element)
}
