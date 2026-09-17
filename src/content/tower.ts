/**
 * Tháp Trí Tuệ - toà tháp đứng giữa lục địa, và bốn con trùm ở trong đó.
 *
 * VÌ SAO CÓ NÓ. Cái đích xa nhất của bản đồ trước đây là trùm cuối của một môn ở
 * một lớp. Đánh xong con đó thì vùng đất ấy hết chuyện, và trẻ chỉ còn cách đi
 * sang vùng khác làm lại đúng một vòng như thế. Toà lâu đài ở giữa lục địa thì
 * đứng đó từ đầu, vẽ đẹp, và không mở ra được - một cánh cửa sơn lên tường.
 *
 * Giờ nó mở. Bên trong là bốn tầng, mỗi tầng một con trùm của một môn, và bốn
 * con này KHÔNG phải trùm cuối vùng đất phóng to.
 *
 * ---- KHÓ HƠN BẰNG CÁI GÌ ----
 *
 * Cách dễ nhất để làm một con quái khó hơn là cho nó nhiều máu hơn. Đó cũng là
 * cách tệ nhất: trận đấu không khó hơn chút nào, nó chỉ DÀI hơn. Trẻ vẫn bấm
 * đúng những nút cũ, chỉ phải bấm thêm mười lần nữa.
 *
 * Bốn con này khó hơn ở chỗ chúng đặt ra một CÂU HỎI KHÁC. Trùm vùng đất hỏi
 * "con có thuộc bài không". Trùm trong tháp hỏi thêm ba câu nữa:
 *
 *   1. ĐỔI HỆ ba câu một lần (`shiftEvery`).
 *      Trùm vùng đất mang đúng hệ của môn nó, từ đầu tới cuối. Tìm ra con thú
 *      khắc chế ở câu một là xong, mười ba câu sau chỉ việc bấm lại. Trùm trong
 *      tháp xoay qua cả bốn hệ, nên bảng phép phải được ĐỌC LẠI, và con thú vừa
 *      là chủ lực ba câu trước bỗng thành con bị khắc. Xoay theo đúng vòng khắc
 *      chế chứ không bốc ngẫu nhiên - đoán trước được là phần thưởng cho việc
 *      chịu khó nhìn.
 *
 *   2. GIÁP (`armor`).
 *      Đây là nét quan trọng nhất, và là nét biến điều trên từ lời khuyên thành
 *      luật. Bình thường đánh đúng hệ hơn đánh sai hệ 1,5 lần - hơn, nhưng chưa
 *      tới mức bắt buộc. Giáp trừ một khoản CỐ ĐỊNH sau khi đã nhân mọi hệ số,
 *      nên nó ăn gần trọn một đòn sai hệ mà chỉ sứt một góc đòn khắc chế: cùng
 *      con số ấy biến khoảng cách 1,5 lần thành hơn mười lần.
 *
 *   3. HÚT MÁU KHI TRẺ SAI (`regenOnMiss`).
 *      Phạt cái đoán mò, không phạt cái chậm. Ở trận thường, bừa năm câu rồi
 *      đúng năm câu vẫn thắng. Ở đây mỗi câu bừa trả lại cho quái đúng phần vừa
 *      lấy đi, nên chỉ đường nào thật sự chắc mới dẫn tới đích.
 *
 *   4. NỔI GIẬN ở 40% máu (`enrageAt`).
 *      Nửa sau của trận không được phép giống nửa đầu. Quái đánh mạnh hơn và
 *      đồng hồ rút ngắn một phần tư, đúng vào lúc đội thú đã sứt mẻ - chỗ mà
 *      trẻ tưởng mình sắp thắng lại là chỗ dễ thua nhất.
 *
 * Máu thì CÓ trâu hơn, nhưng đó là hệ quả chứ không phải cơ chế: trận dài 14 câu
 * nên thanh máu phải dài theo, nếu không thì bốn nét trên chưa kịp hiện ra lần
 * nào trận đã xong.
 *
 * ---- ĐỀ BÀI ----
 *
 * Câu hỏi bốc từ CẢ CHƯƠNG TRÌNH đã học, không riêng lớp hiện tại (xem
 * `towerGrades`). Trùm vùng đất kiểm tra một lớp; tháp kiểm tra cả quãng đường.
 *
 * ---- KHÔNG KHOÁ CỬA ----
 *
 * Tháp mở ngay từ đầu, y như mọi chặng khác trên bản đồ (xem ghi chú "KHÔNG CÓ
 * KHOÁ CHẶNG" trong `content/worldmap.ts`). Cái chặn nằm ở con quái, không nằm
 * ở ổ khoá: một em chưa sẵn sàng bước vào sẽ thua, mà thua ở đây không mất gì -
 * vàng và kinh nghiệm vẫn giữ, cả đội thú chỉ về làng nghỉ.
 */

import type { Enemy } from '../engine/battle'
import { getTuning } from './tuning'
import { SUBJECTS, SUBJECT_LABEL, type Grade, type Subject } from './types'

export interface TowerFloor {
  subject: Subject
  /** Tầng thứ mấy, đếm từ 1 - dùng để xếp thứ tự và đánh số trên giao diện. */
  floor: number
  name: string
  emoji: string
  /** Một câu giới thiệu, hiện ở khung trước khi vào trận. */
  tagline: string
}

/**
 * Bốn tầng, một môn một tầng.
 *
 * Thứ tự đi theo vòng khắc chế (Số Học → Ngôn Từ → Thanh Âm → Ánh Sáng) chứ
 * không theo thứ tự trong thời khoá biểu: leo tháp là đi một vòng quanh chính
 * cái vòng khắc chế mà trẻ dùng để đánh nhau suốt cả game.
 */
export const TOWER_FLOORS: TowerFloor[] = [
  {
    subject: 'math',
    floor: 1,
    name: 'Đại Toán Sư Vô Cực',
    emoji: '🔱',
    tagline: 'Nắm trong tay mọi con số đã từng được viết ra.',
  },
  {
    subject: 'vietnamese',
    floor: 2,
    name: 'Đại Văn Hào Thiên Thư',
    emoji: '📜',
    tagline: 'Đọc được cả những trang sách chưa ai viết.',
  },
  {
    subject: 'music',
    floor: 3,
    name: 'Đại Nhạc Thần Vạn Khúc',
    emoji: '🎼',
    tagline: 'Một nốt của ngài làm rung cả bốn tầng tháp.',
  },
  {
    subject: 'ethics',
    floor: 4,
    name: 'Đại Quang Thần Rạng Đông',
    emoji: '☀️',
    tagline: 'Ánh sáng soi thẳng vào chỗ con còn do dự.',
  },
]

export function towerFloor(subject: Subject): TowerFloor {
  return TOWER_FLOORS.find((f) => f.subject === subject)!
}

/** Số câu mỗi trận trong tháp. Dài hơn trận trùm để bốn nét trên kịp hiện ra. */
export const TOWER_QUESTIONS = 14

/**
 * Những lớp mà đề bài trong tháp bốc qua.
 *
 * Lấy lớp hiện tại và HAI lớp dưới. Không lấy hết từ lớp 1 lên: một em lớp 5 mà
 * một phần năm số câu rơi vào bài lớp 1 thì đó không phải bài kiểm tra khó, đó
 * là bài kiểm tra loãng. Hai lớp dưới đủ xa để những kỹ năng cũ quay lại, đủ gần
 * để câu nào cũng còn đáng hỏi.
 */
export function towerGrades(grade: Grade): Grade[] {
  const out: Grade[] = []
  for (let g = Math.max(1, grade - 2); g <= grade; g++) out.push(g as Grade)
  return out
}

/**
 * Dựng con trùm của một tầng.
 *
 * Mọi con số ở đây đều nhân với hệ số chỉnh tay của thầy cô (`getTuning`), y
 * như quái thường - lớp yếu hạ máu quái xuống là hạ cả trong tháp.
 */
export function createTowerBoss(subject: Subject, grade: Grade): Enemy {
  const floor = towerFloor(subject)
  const tuning = getTuning()

  // Trận 14 câu với một đội thú đã nuôi tới cấp cao: thanh máu phải đủ dài để
  // cơn giận ở mốc 40% kịp xảy ra trước câu cuối cùng.
  const maxHp = Math.max(1, Math.round((520 + grade * 110) * tuning.enemyHpScale))

  return {
    id: `tower-${subject}-g${grade}`,
    name: floor.name,
    emoji: floor.emoji,
    // Hệ KHỞI ĐẦU là hệ của môn - trẻ bước vào vẫn biết mình đang đối mặt với
    // cái gì. Từ câu thứ tư trở đi thì nó tự đổi.
    element: subject,
    maxHp,
    attack: Math.max(1, Math.round((14 + grade * 2) * tuning.enemyAttackScale)),
    goldReward: Math.round((260 + grade * 40) * tuning.goldScale),
    xpReward: Math.round((340 + grade * 50) * tuning.xpScale),
    // Con dữ nhất bầy của môn đó - hình trong tháp lấy từ hình trùm, tô lại.
    variant: 3,
    isBoss: true,
    isTower: true,

    armor: 8 + grade * 2,
    shiftEvery: 3,
    // Một câu sai trả lại 5% máu: ba câu bừa là mất trắng công của một câu đúng
    // có khắc chế. Đủ đau để đáng sợ, chưa tới mức không gỡ nổi.
    regenOnMiss: Math.round(maxHp * 0.05),
    enrageAt: 0.4,
    enrageAttackScale: 1.6,
  }
}

/** Tên tầng cho giao diện: "Tầng 2 · Tiếng Việt". */
export function towerFloorLabel(floor: TowerFloor): string {
  return `Tầng ${floor.floor} · ${SUBJECT_LABEL[floor.subject]}`
}

/** Bốn môn đúng thứ tự leo tháp. Dùng ở chỗ cần duyệt mà không cần cả bản khai. */
export const TOWER_SUBJECTS: Subject[] = TOWER_FLOORS.map((f) => f.subject)

/** Kiểm tra lúc dựng: thiếu một môn là một tầng trống, và không ai thấy cho tới lúc chơi. */
export function validateTower(): string[] {
  const errors: string[] = []
  for (const subject of SUBJECTS) {
    if (!TOWER_FLOORS.some((f) => f.subject === subject)) {
      errors.push(`Tháp thiếu tầng cho môn ${SUBJECT_LABEL[subject]}.`)
    }
  }
  const floors = TOWER_FLOORS.map((f) => f.floor)
  if (new Set(floors).size !== floors.length) errors.push('Có hai tầng trùng số.')
  return errors
}
