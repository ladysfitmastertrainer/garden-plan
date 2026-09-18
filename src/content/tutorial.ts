/**
 * BÀN HƯỚNG DẪN: dữ liệu của một vùng đất giả, một con quái giả và một bộ đề
 * giả, dựng riêng để dạy trẻ cách chơi.
 *
 * Mọi thứ ở đây là DỮ LIỆU THUẦN - không React, không store, không đọc
 * `Date.now()` - nên test được y như phần còn lại của `src/content`.
 *
 * VÌ SAO KHÔNG DÙNG NỘI DUNG THẬT: bàn hướng dẫn phải chạy y hệt nhau cho mọi
 * đứa trẻ, ở mọi lớp, mọi môn. Bốc đề từ ngân hàng thật thì một em lớp 5 vào
 * hướng dẫn sẽ gặp đề lớp 5 - đúng trình độ em ấy, nhưng sai việc: lúc này em
 * đang học cách BẤM NÚT, không phải học Toán. Đề ở đây cố tình dễ tới mức không
 * phải nghĩ, để toàn bộ sự chú ý dồn vào cơ chế.
 *
 * Và vì nó không phải nội dung thật nên nó KHÔNG được ghi vào hồ sơ: mức thạo,
 * vàng, kinh nghiệm, số trận - không thứ nào đụng tới. Xem `battleKind` bằng
 * 'tutorial' trong `store/game.ts`.
 */

import type { Enemy } from '../engine/battle'
import type { MapNode } from './worldmap'
import type { Grade, Question, Subject } from './types'

/**
 * Môn và lớp của bàn hướng dẫn: Toán lớp 1.
 *
 * Toán vì phép cộng trong phạm vi 5 là thứ mọi đứa trẻ vào app đều làm được,
 * kể cả em chưa đọc thạo - và bàn này phải chạy được cho cả em lớp 1 lẫn em
 * lớp 5. Lớp 1 vì đồng hồ đỡ đòn được nhân giãn ra cho lớp 1-2 (xem
 * `defendLimitFor`), nên trẻ có thêm thời gian ở đúng lượt dễ cuống nhất.
 */
export const TUTORIAL_SUBJECT: Subject = 'math'
export const TUTORIAL_GRADE: Grade = 1

/**
 * Kỹ năng gắn cho đề hướng dẫn.
 *
 * Là một id CÓ THẬT trong `curriculum.ts` dù không ai chấm nó: `AnswerRecord`
 * mang theo trường này đi khắp nơi, và một id bịa ra sẽ nằm lại trong bất cứ
 * chỗ nào sau này lỡ đọc tới nó. Một id thật thì tệ nhất cũng chỉ là thừa.
 */
const TUTORIAL_SKILL = 'math.g1.cong-tru-10'

/**
 * Máu của con slime, và số lượt trẻ được ra đòn.
 *
 * Hai con số này được chọn bằng phép tính, không bằng cảm giác. Sát thương một
 * đòn của trẻ ở cấp 1 là:
 *
 *     (8 + 4 × độ khó) × sức mạnh × hệ số tốc độ × hệ số chuỗi × hệ số nguyên tố
 *
 * Với đề độ khó 1 thì phần gốc là 12, và ba hệ số kia kéo con số ấy đi từ 10
 * (trả lời chậm, chọn phép không khắc chế) tới 30 (trả lời dưới bốn giây, chọn
 * đúng phép khắc chế, để con thú khoẻ nhất trong đội mặc định tung). Một khoảng
 * rộng gấp ba lần, và hai con số dưới đây phải sống được với CẢ HAI ĐẦU:
 *
 *   - 31 máu là con số nhỏ nhất mà đòn MẠNH NHẤT không hạ nổi trong một phát.
 *     Đó là điều kiện sống còn của bài học: hạ xong ngay đòn đầu thì trận nhảy
 *     thẳng sang màn thắng, và trẻ không bao giờ nhìn thấy lượt đỡ đòn - tức là
 *     mất đúng một nửa cơ chế của trận đấu.
 *   - Năm lượt là để đầu kia cũng về đích. Trẻ chọn phép không khắc chế và ngồi
 *     nghĩ lâu thì mỗi đòn chỉ 10 máu; bốn đòn như thế mới đủ, và lượt thứ năm
 *     là chỗ dư cho một câu trả lời sai.
 *
 * Một đứa trẻ nghe lời người dẫn - bấm nút ghi "Khắc chế!" - thì hạ nó ở lượt
 * thứ hai, đúng sau khi vừa kịp học một lượt đỡ đòn. Đó là đường đi mong muốn;
 * ba lượt còn lại là lưới an toàn.
 *
 * `content/tutorial.test.ts` khoá cả hai đầu ấy bằng engine thật, nên hằng số
 * cân bằng trong `engine/battle.ts` có đổi thì ở đó báo ngay.
 */
export const TUTORIAL_ENEMY_HP = 31

/** Số lượt RA ĐÒN của trẻ trong trận tập. Lượt đỡ đòn không tính vào đây. */
export const TUTORIAL_MAX_QUESTIONS = 5

/**
 * Con quái của bàn hướng dẫn.
 *
 * BÙ NHÌN RƠM, và cái tên là một lời hứa: nó không phải quái thật, nó là hình
 * nộm để tập đánh.
 *
 * `attack` bằng 3 là cố ý thấp tới mức vô hại: một đội thú cấp 1 có hàng chục
 * máu, nên dù trẻ để hụt cả bốn lượt đỡ đòn thì cũng không con nào gục. Bàn
 * hướng dẫn không phải chỗ để nếm mùi thất bại.
 */
export function tutorialEnemy(): Enemy {
  return {
    id: 'tutorial.slime-tap-su',
    /*
      TÊN PHẢI KHỚP VỚI HÌNH, và `variant: 0` bên dưới quyết định cái hình đó.

      Con số 0 trỏ tới con đầu bầy Toán trong `MONSTER_FAMILY` - một con slime
      tròn trịa, hiền lành nhất bộ. Một cái tên nghe hay hơn nhưng vẽ ra con
      khác là đúng cái bẫy mà `variant` sinh ra để tránh (xem `engine/battle.ts`),
      và ở bàn hướng dẫn nó còn tệ hơn: đây là con quái ĐẦU TIÊN đời trẻ nhìn
      thấy trong game này, nên nó cũng là lần đầu tiên trẻ học rằng cái tên trên
      thanh máu nói về con đang đứng trước mặt.

      "Tập Sự" thay cho một cái tên doạ người: nó là bạn tập, không phải đối thủ.
    */
    name: 'Slime Tập Sự',
    emoji: '🟢',
    /*
      Hệ SỐ HỌC, cùng hệ với vùng đất - và đó là điều kiện để bài học về khắc
      chế diễn ra được.

      Đội hình mặc định của một hồ sơ mới luôn có một con thú KHẮC CHẾ được hệ
      của môn đang học (xem `starterTeam`), nên bảng chọn phép chắc chắn có
      đúng một nút mang nhãn "Khắc chế!". Trẻ bấm thử và thấy số sát thương
      nhảy vọt - đó là cả bài học, và nó không cần một dòng chữ nào.
    */
    element: 'math',
    maxHp: TUTORIAL_ENEMY_HP,
    attack: 3,
    goldReward: 5,
    xpReward: 10,
    // Con đầu bầy Toán. Xem ghi chú ở `name` ngay trên.
    variant: 0,
    isBoss: false,
  }
}

/**
 * Bốn chặng giả để dựng bản đồ đi cảnh.
 *
 * Bản đồ vùng đất được sinh ra TỪ SỐ CHẶNG (xem `buildRouteMap`), và bốn là con
 * số nhỏ nhất cho ra một vùng đất TRÔNG NHƯ THẬT. Hai chặng chỉ cho một bãi đất
 * cao mười hai ô - trên điện thoại dựng đứng nó là một ô chữ nhật bé xíu trôi
 * giữa màn hình, không bao giờ trông giống cái vùng đất mà bài học này đang hứa
 * sẽ dạy. Bốn chặng cho hai mươi ô: bản đồ tràn kín màn hình, máy quay bám theo
 * nhân vật, và bộ sinh bản đồ thêm vào một cái hang cùng hai ngôi nhà trên đồi -
 * đúng ba thứ mà cuốn sổ tay ở cuối bàn sẽ nhắc tới.
 *
 * Chặng cuối là trùm, và nó có mặt chỉ để cuối đường có một sân đấu lát đá:
 * trẻ nhìn thấy đích đến trước cả khi biết trùm là gì.
 *
 * Không chặng nào ở đây dẫn tới một trận thật. Mọi lối vào trận trên bàn này -
 * đụng quái, bước lên cổng, mở cửa một ngôi nhà, hay giẫm phải cỏ cao - đều đổ
 * về cùng một trận tập. Bắt trẻ phải tìm đúng một lối là biến bài học đầu tiên
 * thành một câu đố.
 */
export function tutorialNodes(): MapNode[] {
  const walkers: MapNode[] = [0, 1, 2].map((index) => ({
    id: `tutorial.node${index}`,
    kind: 'battle',
    index,
    title: 'Chặng tập',
    subtitle: 'Một con slime tập sự đang đứng chắn đường',
    skill: null,
    cleared: false,
  }))

  return [
    ...walkers,
    {
      id: 'tutorial.boss',
      kind: 'boss',
      index: walkers.length,
      title: 'Sân đấu trùm',
      subtitle: 'Cuối mỗi vùng đất luôn có một con trùm chờ sẵn',
      skill: null,
      cleared: false,
    },
  ]
}

/**
 * Bộ đề của trận tập.
 *
 * MƯỜI CÂU, vừa đúng cho trận dài nhất có thể: năm lượt ra đòn xen kẽ năm lượt
 * đỡ đòn. Không được thiếu một câu nào - `next()` trong `store/game.ts` bốc bù
 * từ ngân hàng THẬT khi hàng đợi cạn, và một câu Toán lớp 5 rơi vào giữa bàn
 * hướng dẫn thì vừa lạc lõng vừa làm hỏng lời hứa "bàn này không chấm điểm con".
 *
 * Mọi câu đều có `hint`, vì một trong những thứ bàn này phải dạy là cái nút
 * 💡 - mà nút ấy chỉ hiện ra khi câu hỏi có gợi ý.
 */
export const TUTORIAL_QUESTIONS: Question[] = [
  choice('t1', '1 + 1 = ?', ['2', '3', '4'], 0, 'Một ngón tay, thêm một ngón tay nữa.'),
  choice('t2', '2 + 1 = ?', ['3', '2', '5'], 0, 'Đếm tiếp từ 2: ba.'),
  choice('t3', '3 + 2 = ?', ['5', '4', '6'], 0, 'Xoè 3 ngón, xoè thêm 2 ngón, rồi đếm hết.'),
  choice('t4', '4 - 1 = ?', ['3', '2', '5'], 0, 'Có 4 cái kẹo, ăn mất 1 cái.'),
  choice('t5', '2 + 2 = ?', ['4', '3', '5'], 0, 'Hai bàn tay, mỗi bàn xoè 2 ngón.'),
  choice('t6', '5 - 2 = ?', ['3', '4', '2'], 0, 'Có 5 quả, cho bạn 2 quả.'),
  choice('t7', '3 + 1 = ?', ['4', '3', '5'], 0, 'Đếm tiếp từ 3: bốn.'),
  choice('t8', '2 + 3 = ?', ['5', '4', '6'], 0, 'Xoè 2 ngón, xoè thêm 3 ngón, rồi đếm hết.'),
  choice('t9', '5 - 1 = ?', ['4', '5', '3'], 0, 'Có 5 viên bi, mất 1 viên.'),
  choice('t10', '1 + 3 = ?', ['4', '2', '5'], 0, 'Một ngón tay, thêm ba ngón tay nữa.'),
]

/** Dựng một câu trắc nghiệm của bàn hướng dẫn. `answerAt` là chỗ của đáp án đúng. */
function choice(
  id: string,
  prompt: string,
  labels: string[],
  answerAt: number,
  hint: string,
): Question {
  return {
    id: `tutorial.${id}`,
    type: 'multiple-choice',
    subject: TUTORIAL_SUBJECT,
    grade: TUTORIAL_GRADE,
    skillId: TUTORIAL_SKILL,
    difficulty: 1,
    prompt,
    hint,
    explanation: `Đáp án đúng là ${labels[answerAt]}. ${hint}`,
    choices: labels.map((label, index) => ({ id: `c${index}`, label })),
    answer: { kind: 'choice', choiceId: `c${answerAt}` },
  }
}

// --- Lời của người dẫn -------------------------------------------------------

/**
 * Những câu người dẫn nói TRƯỚC KHI thả trẻ ra đi cảnh.
 *
 * Ngắn, mỗi câu đúng một việc. Hộp thoại chạy chữ từng ký tự (xem
 * `DialogueBox`), nên một câu dài ba dòng là ba giây ngồi nhìn chữ bò ra - với
 * trẻ sáu tuổi đó là quá đủ để bấm cho qua mà không đọc.
 */
export const WALK_SCRIPT: string[] = [
  'Chào con! Ta sẽ chỉ con cách chơi.\nĐây là một vùng đất - con đi bộ trong này như đi trong một khu rừng thật.',
  'Bấm bốn mũi tên ở góc dưới bên trái để đi.\nDùng máy tính thì bấm phím mũi tên cũng được.',
  'Thấy con quái đang đi qua đi lại kia không?\nĐi tới đụng vào nó là vào trận. Thử đi!',
]

/**
 * Lời người dẫn ở từng pha của trận tập.
 *
 * Tra theo PHA và THẾ TRẬN, đúng hai thứ quyết định trẻ đang phải làm gì. Hàm
 * thuần nhận hai chuỗi chứ không nhận cả `BattleState`: nhờ vậy test nó không
 * cần dựng một trận đấu.
 */
export function battleCoach(
  phase: string,
  stance: 'attack' | 'defend',
  enemyName: string,
): string | null {
  if (phase === 'ready') return 'Bấm ⚔️ Tấn công! để con ra đòn trước.'
  if (phase === 'question') {
    return stance === 'defend'
      ? `${enemyName} đang đánh tới! Trả lời kịp giờ là con đỡ được đòn.`
      : 'Đọc đề rồi chọn đáp án. Chưa biết thì bấm 💡 xin một gợi ý.'
  }
  if (phase === 'spell')
    return 'Đúng rồi, giờ được tung phép! Nút nào ghi "Khắc chế!" đánh mạnh hơn hẳn - chọn nó đi.'
  if (phase === 'feedback') return 'Xem thanh máu tụt kìa. Bấm "Tiếp tục" để đi tiếp.'
  if (phase === 'warning') return 'Quái gồng lên rồi! Nó sắp ra đòn - chuẩn bị đỡ nhé.'
  return null
}

// --- Sổ tay ------------------------------------------------------------------

export interface HandbookEntry {
  emoji: string
  title: string
  body: string
}

/**
 * Những cơ chế KHÔNG diễn được trong một bàn tập.
 *
 * Đi bộ và đánh nhau thì tập được; còn tháp, đấu trường lớp học hay việc thú
 * tiến hoá thì phải chơi hàng giờ mới gặp - dựng một bàn giả cho từng thứ là
 * dựng cả một game thứ hai. Nên chúng nằm ở đây, mỗi thứ một thẻ, và trẻ đọc
 * SAU KHI đã tự tay đánh xong một trận - lúc ấy mấy chữ "khắc chế" hay "lượt đỡ
 * đòn" mới trỏ tới một thứ em đã thấy.
 *
 * Thứ tự có chủ ý: bắt đầu từ thứ trẻ gặp ngay trong mười phút đầu (bản đồ, cỏ
 * cao), rồi mới tới thứ gặp sau nhiều buổi (tháp, tiến hoá). Thẻ cuối cùng là
 * thẻ quan trọng nhất và cố ý đặt ở chỗ dễ nhớ nhất: trong game này không có
 * màn hình thua.
 */
export const HANDBOOK: HandbookEntry[] = [
  {
    emoji: '🗺️',
    title: 'Bản đồ thế giới',
    body: 'Mỗi hòn đảo là một môn học của một lớp. Con tới đảo nào cũng được, miễn là lớp của con hoặc lớp dưới - hôm nay ôn Toán lớp 1, mai học Âm nhạc lớp 3 đều đi thẳng được.',
  },
  {
    emoji: '🚪',
    title: 'Cổng chặng và trùm cuối',
    body: 'Mỗi vùng đất có mười tám chặng, chặng cuối là trùm. Không chặng nào bị khoá cả: con nhảy thẳng vào chặng cuối cũng được, chỉ là con quái ở đó khoẻ hơn nhiều.',
  },
  {
    emoji: '🌾',
    title: 'Cỏ cao',
    body: 'Đi vào ô cỏ cao thì thỉnh thoảng có quái hoang nhảy ra. Trận ngắn thôi, nhưng chỉ ở đây con mới thu phục được thú mới.',
  },
  {
    emoji: '🏠',
    title: 'Nhà trên đồi và quái ẩn',
    body: 'Leo thang lên khu đất cao sẽ thấy nhà. Mở cửa ra có khi được đồ, có khi đánh thức một con đầu đàn đang ngủ. Trên bản đồ còn có ô quái ẩn - nhìn không thấy gì, nhưng giẫm trúng thì thưởng rất hậu.',
  },
  {
    emoji: '🐾',
    title: 'Thú đồng hành',
    body: 'Có mười hai con, ba con mỗi hệ. Mỗi con tiến hoá ba lần - ở cấp 5, cấp 10 và cấp 20 - đổi cả tên lẫn hình. Đó là con thú của con lớn lên, không phải con mới phải đi bắt lại.',
  },
  {
    emoji: '🎒',
    title: 'Kho đồ và bộ chiêu',
    body: 'Trong kho đồ con mặc trang bị nhặt được và sắp bộ chiêu mang ra trận. Mới chơi thì con có hai chiêu và hai ô nên chưa phải sắp gì; lên cấp mới học thêm chiêu và mở thêm ô.',
  },
  {
    emoji: '🏰',
    title: 'Tháp Trí Tuệ',
    body: 'Cái tháp giữa lục địa có bốn tầng, mỗi tầng một con trùm. Chúng khó không phải vì nhiều máu, mà vì chúng ĐỔI HỆ giữa trận và có giáp chặn đòn sai hệ. Con phải vừa thuộc bài vừa nhìn cho kỹ.',
  },
  {
    emoji: '⚔️',
    title: 'Đấu trường lớp học',
    body: 'Bạn cùng lớp đang chơi sẽ hiện ra ở bảng dưới bản đồ. Ai đứng cùng hòn đảo với con thì con thách đấu được: hai đứa nhận cùng một câu hỏi, ai trả lời đúng trước thì giành quyền tấn công.',
  },
  {
    emoji: '💛',
    title: 'Vùng Đạo đức không chấm đúng sai',
    body: 'Ở Đồi Ánh Sáng, mỗi tình huống chỉ có lựa chọn hay hơn và lựa chọn chưa hay. Chọn chưa hay thì con KHÔNG bị trừ máu, chỉ mất một lượt và được nghe giải thích.',
  },
  {
    emoji: '🔥',
    title: 'Gợi ý và chuỗi đúng',
    body: 'Bấm 💡 để xin gợi ý - trả lời đúng vẫn tính, chỉ là đòn đánh nhẹ hơn một chút. Ngược lại, càng đúng liên tiếp nhiều câu thì đòn càng nặng: đó là chuỗi combo.',
  },
  {
    emoji: '🏡',
    title: 'Không có màn hình thua',
    body: 'Hết máu thì cả đội thú chỉ rút về làng nghỉ, và con GIỮ NGUYÊN toàn bộ vàng với kinh nghiệm đã kiếm được. Con quái vẫn đứng đó, đánh lại lúc nào cũng được.',
  },
]
