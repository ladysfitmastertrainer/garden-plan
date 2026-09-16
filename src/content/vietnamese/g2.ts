/**
 * Ngân hàng câu hỏi Tiếng Việt lớp 2.
 *
 * Bám SGK Tiếng Việt 2 - Kết nối tri thức với cuộc sống (2 tập, 35 tuần).
 * Phạm vi kiến thức, các cặp phụ âm/vần cần phân biệt và chủ điểm vốn từ lấy
 * theo cột "Luyện tập" của mục lục. Ngữ liệu trong câu hỏi là câu tự soạn, không
 * lấy bài đọc của sách. Xem docs/sgk-lop-2.md.
 */

import type { Bank } from '../bank'

const bank: Bank = {
  // =========================================================================
  // Bảng chữ cái
  // =========================================================================
  'vietnamese.g2.bang-chu-cai': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Chữ cái nào đứng ngay sau chữ "b" trong bảng chữ cái?',
      correct: 'c', distractors: ['a', 'd', 'đ'],
      explanation: 'Thứ tự đầu bảng chữ cái là: a, ă, â, b, c, d, đ...',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Chữ cái nào đứng ngay trước chữ "e"?',
      correct: 'đ', distractors: ['d', 'ê', 'g'],
      explanation: 'Thứ tự là: d, đ, e, ê, g...',
    },
    {
      kind: 'order', difficulty: 2,
      prompt: 'Xếp các chữ cái theo đúng thứ tự bảng chữ cái.',
      items: ['a', 'ă', 'â', 'b', 'c'],
      explanation: 'Năm chữ cái đầu tiên là a, ă, â, b, c.',
      hint: 'Ba chữ a đứng liền nhau trước chữ b.',
    },
    {
      kind: 'order', difficulty: 2,
      prompt: 'Xếp tên các bạn theo thứ tự bảng chữ cái.',
      items: ['An', 'Bình', 'Cường', 'Dung'],
      explanation: 'Xét chữ cái đầu tiên của tên: A trước B, B trước C, C trước D.',
      hint: 'Nhìn chữ cái đầu tiên của mỗi tên.',
    },
    {
      kind: 'order', difficulty: 3,
      prompt: 'Xếp tên các bạn theo thứ tự bảng chữ cái.',
      items: ['Hà', 'Hoa', 'Hùng', 'Lan'],
      explanation: 'Ba tên đầu cùng chữ H nên xét chữ thứ hai: a, o, u. Sau đó mới tới L.',
      hint: 'Cùng chữ đầu thì so chữ tiếp theo.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Bảng chữ cái tiếng Việt có bao nhiêu chữ cái?',
      correct: '29', distractors: ['26', '24', '30'],
      explanation: 'Bảng chữ cái tiếng Việt có 29 chữ cái.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Trong ba tên "Mai, Minh, Mạnh", tên nào đứng đầu theo thứ tự bảng chữ cái?',
      correct: 'Mai', distractors: ['Minh', 'Mạnh', 'Cả ba bằng nhau'],
      explanation: 'Cùng chữ M, xét chữ thứ hai: a đứng trước i. "Mai" và "Mạnh" cùng chữ a, xét tiếp: i đứng trước n.',
      hint: 'So từng chữ cái một, từ trái sang phải.',
    },
    {
      kind: 'text', difficulty: 2,
      prompt: 'Viết chữ cái đứng ngay sau chữ "o" trong bảng chữ cái.',
      accepted: ['ô'],
      explanation: 'Thứ tự là: o, ô, ơ, p, q...',
    },
  ],

  // =========================================================================
  // Ba nhóm từ
  // =========================================================================
  'vietnamese.g2.tu-chi-su-vat': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Từ nào là từ chỉ sự vật?',
      correct: 'quyển sách', distractors: ['chạy', 'xanh', 'nhanh'],
      explanation: 'Từ chỉ sự vật gọi tên người, vật, con vật, cây cối. "Quyển sách" là một đồ vật.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Từ nào KHÔNG phải từ chỉ sự vật?',
      correct: 'đọc', distractors: ['bác sĩ', 'con mèo', 'cây bàng'],
      explanation: '"Đọc" là từ chỉ hoạt động, ba từ còn lại gọi tên người, con vật, cây cối.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Nhóm nào gồm toàn từ chỉ sự vật?',
      correct: 'bảng, phấn, cô giáo', distractors: ['viết, vẽ, hát', 'đỏ, tròn, to', 'nhanh, chậm, khẽ'],
      explanation: 'Bảng, phấn là đồ vật; cô giáo là người. Cả ba đều là từ chỉ sự vật.',
    },
    {
      kind: 'pairs', difficulty: 2,
      prompt: 'Nối từ chỉ sự vật với nhóm của nó.',
      pairs: [['bác nông dân', 'người'], ['con trâu', 'con vật'], ['cây tre', 'cây cối'], ['cái cuốc', 'đồ vật']],
      explanation: 'Từ chỉ sự vật gồm bốn nhóm: người, con vật, cây cối và đồ vật.',
    },
    {
      kind: 'text', difficulty: 2,
      prompt: 'Trong câu "Mẹ em là bác sĩ.", từ chỉ nghề nghiệp là từ nào?',
      accepted: ['bác sĩ'],
      explanation: '"Bác sĩ" là từ chỉ người theo nghề nghiệp - một từ chỉ sự vật.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Câu "Trên sân trường, các bạn chơi nhảy dây." có mấy từ chỉ sự vật?',
      correct: '3', distractors: ['1', '2', '4'],
      explanation: 'Ba từ chỉ sự vật là: sân trường, các bạn, nhảy dây (tên trò chơi).',
      hint: 'Tìm những từ gọi tên người, vật hoặc nơi chốn.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Từ nào dưới đây chỉ sự vật thuộc nhóm thiên nhiên?',
      correct: 'dòng suối', distractors: ['cái ghế', 'quyển vở', 'chiếc cặp'],
      explanation: 'Dòng suối là sự vật có sẵn trong thiên nhiên; ba từ kia là đồ vật do người làm ra.',
    },
  ],

  'vietnamese.g2.tu-chi-hoat-dong': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Từ nào là từ chỉ hoạt động?',
      correct: 'quét', distractors: ['cái chổi', 'sạch', 'gọn gàng'],
      explanation: 'Từ chỉ hoạt động cho biết người hoặc vật đang làm gì. "Quét" là một việc làm.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Trong câu "Bà kể chuyện cho em nghe.", từ chỉ hoạt động là từ nào?',
      correct: 'kể', distractors: ['bà', 'chuyện', 'em'],
      explanation: '"Kể" là việc bà đang làm.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Nhóm nào gồm toàn từ chỉ hoạt động?',
      correct: 'chạy, nhảy, bơi', distractors: ['bàn, ghế, tủ', 'cao, thấp, gầy', 'nắng, mưa, gió'],
      explanation: 'Chạy, nhảy, bơi đều là việc làm nên là từ chỉ hoạt động.',
    },
    {
      kind: 'pairs', difficulty: 2,
      prompt: 'Nối người với hoạt động thường làm.',
      pairs: [['bác sĩ', 'khám bệnh'], ['cô giáo', 'dạy học'], ['nông dân', 'cấy lúa'], ['công nhân', 'xây nhà']],
      explanation: 'Mỗi nghề gắn với những hoạt động riêng.',
    },
    {
      kind: 'text', difficulty: 2,
      prompt: 'Tìm từ chỉ hoạt động trong câu: "Các bạn nhỏ tưới cây trong vườn."',
      accepted: ['tưới', 'tưới cây'],
      explanation: '"Tưới" là việc các bạn nhỏ đang làm.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Từ nào dưới đây chỉ hoạt động thể thao?',
      correct: 'đá cầu', distractors: ['quả cầu', 'sân bóng', 'nhanh nhẹn'],
      explanation: '"Đá cầu" là một hoạt động; quả cầu và sân bóng là sự vật, nhanh nhẹn là đặc điểm.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Câu "Em rửa mặt, đánh răng rồi đi học." có mấy từ chỉ hoạt động?',
      correct: '3', distractors: ['1', '2', '4'],
      explanation: 'Ba hoạt động là: rửa mặt, đánh răng, đi học.',
      hint: 'Đếm những việc em làm.',
    },
  ],

  'vietnamese.g2.tu-chi-dac-diem': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Từ nào là từ chỉ đặc điểm?',
      correct: 'đỏ', distractors: ['bông hoa', 'hái', 'cái giỏ'],
      explanation: 'Từ chỉ đặc điểm cho biết màu sắc, hình dáng, tính nết. "Đỏ" là màu sắc.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Trong câu "Chiếc cặp của em rất mới.", từ chỉ đặc điểm là từ nào?',
      correct: 'mới', distractors: ['chiếc cặp', 'em', 'rất'],
      explanation: '"Mới" cho biết đặc điểm của chiếc cặp.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Nhóm nào gồm toàn từ chỉ đặc điểm?',
      correct: 'tròn, cao, hiền', distractors: ['hát, múa, cười', 'sách, bút, thước', 'ông, bà, cha'],
      explanation: 'Tròn là hình dáng, cao là kích thước, hiền là tính nết - đều là đặc điểm.',
    },
    {
      kind: 'pairs', difficulty: 2,
      prompt: 'Nối sự vật với đặc điểm thường thấy của nó.',
      pairs: [['quả chanh', 'chua'], ['viên đường', 'ngọt'], ['hòn đá', 'cứng'], ['bông gòn', 'mềm']],
      explanation: 'Mỗi sự vật có đặc điểm riêng về vị hoặc độ cứng mềm.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Từ nào chỉ đặc điểm về tính nết của con người?',
      correct: 'chăm chỉ', distractors: ['xanh biếc', 'vuông vắn', 'thơm ngát'],
      explanation: 'Chăm chỉ nói về tính nết; ba từ kia nói về màu sắc, hình dáng và mùi.',
    },
    {
      kind: 'text', difficulty: 2,
      prompt: 'Tìm từ trái nghĩa với "cao".',
      accepted: ['thấp'],
      explanation: 'Cao - thấp là hai đặc điểm trái ngược nhau.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Câu "Bầu trời mùa thu cao, trong và xanh ngắt." có mấy từ chỉ đặc điểm?',
      correct: '3', distractors: ['1', '2', '4'],
      explanation: 'Ba từ chỉ đặc điểm là: cao, trong, xanh ngắt.',
      hint: 'Tìm những từ tả bầu trời như thế nào.',
    },
  ],

  // =========================================================================
  // Ba kiểu câu
  // =========================================================================
  'vietnamese.g2.cau-gioi-thieu': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Câu nào là câu giới thiệu?',
      correct: 'Bố em là công nhân.',
      distractors: ['Bố em đang làm việc.', 'Bố em rất hiền.', 'Bố em ơi!'],
      explanation: 'Câu giới thiệu theo mẫu "Ai là gì?" và thường có từ "là".',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Câu giới thiệu thường có từ nào ở giữa?',
      correct: 'là', distractors: ['rất', 'đang', 'không'],
      explanation: 'Mẫu câu giới thiệu là "Ai là gì?", ví dụ: Hà là học sinh lớp 2.',
    },
    {
      kind: 'order', difficulty: 2,
      prompt: 'Sắp xếp các từ thành một câu giới thiệu.',
      items: ['Mai', 'là', 'bạn thân', 'của em'],
      explanation: 'Câu hoàn chỉnh: Mai là bạn thân của em.',
      hint: 'Từ "là" đứng sau tên người được giới thiệu.',
    },
    {
      kind: 'order', difficulty: 2,
      prompt: 'Sắp xếp các từ thành một câu giới thiệu.',
      items: ['Hà Nội', 'là', 'thủ đô', 'của nước ta'],
      explanation: 'Câu hoàn chỉnh: Hà Nội là thủ đô của nước ta.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Bộ phận nào trả lời câu hỏi "Ai?" trong câu "Cô Lan là cô giáo của em."?',
      correct: 'Cô Lan', distractors: ['là cô giáo', 'cô giáo của em', 'của em'],
      explanation: 'Bộ phận trả lời "Ai?" đứng ở đầu câu: Cô Lan.',
    },
    {
      kind: 'text', difficulty: 3,
      prompt: 'Điền từ còn thiếu: "Con trâu ___ bạn của nhà nông."',
      accepted: ['là'],
      explanation: 'Câu giới thiệu cần từ "là": Con trâu là bạn của nhà nông.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Câu nào KHÔNG phải câu giới thiệu?',
      correct: 'Em rất thích đọc sách.',
      distractors: ['Em là học sinh lớp 2A.', 'Đây là quyển vở của em.', 'Nam là lớp trưởng.'],
      explanation: '"Em rất thích đọc sách" nói về việc em làm chứ không giới thiệu em là gì.',
    },
  ],

  'vietnamese.g2.cau-neu-hoat-dong': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Câu nào là câu nêu hoạt động?',
      correct: 'Em quét nhà giúp mẹ.',
      distractors: ['Em là con của mẹ.', 'Em rất ngoan.', 'Nhà em sạch sẽ.'],
      explanation: 'Câu nêu hoạt động theo mẫu "Ai làm gì?" - cho biết người đó đang làm việc gì.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Câu "Các bạn nhỏ chơi đá cầu." trả lời cho câu hỏi nào?',
      correct: 'Ai làm gì?', distractors: ['Ai là gì?', 'Ai thế nào?', 'Ở đâu?'],
      explanation: 'Câu cho biết các bạn nhỏ đang làm gì nên thuộc mẫu "Ai làm gì?".',
    },
    {
      kind: 'order', difficulty: 2,
      prompt: 'Sắp xếp các từ thành một câu nêu hoạt động.',
      items: ['Bà', 'kể chuyện', 'cho em nghe'],
      explanation: 'Câu hoàn chỉnh: Bà kể chuyện cho em nghe.',
    },
    {
      kind: 'order', difficulty: 2,
      prompt: 'Sắp xếp các từ thành một câu nêu hoạt động.',
      items: ['Các bạn học sinh', 'chăm sóc', 'vườn hoa', 'của trường'],
      explanation: 'Câu hoàn chỉnh: Các bạn học sinh chăm sóc vườn hoa của trường.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Bộ phận nào trả lời câu hỏi "Làm gì?" trong câu "Mẹ nấu cơm trong bếp."?',
      correct: 'nấu cơm', distractors: ['Mẹ', 'trong bếp', 'cơm'],
      explanation: 'Bộ phận trả lời "Làm gì?" là "nấu cơm".',
    },
    {
      kind: 'text', difficulty: 3,
      prompt: 'Điền từ chỉ hoạt động còn thiếu: "Chim ___ trên cành cây."',
      accepted: ['hót', 'đậu', 'kêu', 'bay'],
      explanation: 'Có thể điền hót, đậu, kêu hoặc bay - đều là từ chỉ hoạt động của chim.',
      hint: 'Chim thường làm gì trên cành cây?',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Câu nào dưới đây thuộc mẫu "Ai làm gì?"',
      correct: 'Ông em trồng rau ngoài vườn.',
      distractors: ['Ông em là bộ đội về hưu.', 'Ông em rất vui tính.', 'Vườn rau xanh mướt.'],
      explanation: 'Chỉ câu đầu nói về việc ông đang làm.',
    },
  ],

  'vietnamese.g2.cau-neu-dac-diem': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Câu nào là câu nêu đặc điểm?',
      correct: 'Bông hoa rất thơm.',
      distractors: ['Bông hoa là quà tặng mẹ.', 'Em hái bông hoa.', 'Bông hoa ơi!'],
      explanation: 'Câu nêu đặc điểm theo mẫu "Ai thế nào?" - cho biết người, vật đó như thế nào.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Câu "Cô giáo em rất hiền." trả lời cho câu hỏi nào?',
      correct: 'Ai thế nào?', distractors: ['Ai là gì?', 'Ai làm gì?', 'Khi nào?'],
      explanation: 'Câu cho biết cô giáo như thế nào nên thuộc mẫu "Ai thế nào?".',
    },
    {
      kind: 'order', difficulty: 2,
      prompt: 'Sắp xếp các từ thành một câu nêu đặc điểm.',
      items: ['Chiếc áo mới', 'rất', 'đẹp'],
      explanation: 'Câu hoàn chỉnh: Chiếc áo mới rất đẹp.',
    },
    {
      kind: 'order', difficulty: 2,
      prompt: 'Sắp xếp các từ thành một câu nêu đặc điểm.',
      items: ['Cánh đồng lúa', 'vàng óng', 'dưới nắng'],
      explanation: 'Câu hoàn chỉnh: Cánh đồng lúa vàng óng dưới nắng.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Bộ phận nào trả lời câu hỏi "Thế nào?" trong câu "Dòng sông quê em rất hiền hoà."?',
      correct: 'rất hiền hoà', distractors: ['Dòng sông', 'quê em', 'Dòng sông quê em'],
      explanation: 'Bộ phận trả lời "Thế nào?" là "rất hiền hoà".',
    },
    {
      kind: 'text', difficulty: 3,
      prompt: 'Điền từ chỉ đặc điểm còn thiếu: "Đàn gà con ___ như những cục bông."',
      accepted: ['vàng', 'mềm', 'xinh', 'tròn'],
      explanation: 'Có thể điền vàng, mềm, xinh hoặc tròn - đều là từ chỉ đặc điểm.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Câu nào KHÔNG phải câu nêu đặc điểm?',
      correct: 'Em tưới cây mỗi sáng.',
      distractors: ['Cây bàng rất to.', 'Lá bàng xanh mướt.', 'Sân trường mát rượi.'],
      explanation: '"Em tưới cây mỗi sáng" nói về việc em làm, thuộc mẫu "Ai làm gì?".',
    },
  ],

  // =========================================================================
  // Dấu câu
  // =========================================================================
  'vietnamese.g2.dau-cau': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Cuối câu "Em đi học" cần đặt dấu gì?',
      correct: 'Dấu chấm (.)', distractors: ['Dấu chấm hỏi (?)', 'Dấu chấm than (!)', 'Dấu phẩy (,)'],
      explanation: 'Câu kể một sự việc thì kết thúc bằng dấu chấm.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Cuối câu "Bạn tên là gì" cần đặt dấu gì?',
      correct: 'Dấu chấm hỏi (?)', distractors: ['Dấu chấm (.)', 'Dấu chấm than (!)', 'Dấu phẩy (,)'],
      explanation: 'Câu dùng để hỏi thì kết thúc bằng dấu chấm hỏi.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Cuối câu "Ôi, bông hoa đẹp quá" cần đặt dấu gì?',
      correct: 'Dấu chấm than (!)', distractors: ['Dấu chấm (.)', 'Dấu chấm hỏi (?)', 'Dấu hai chấm (:)'],
      explanation: 'Câu bộc lộ cảm xúc ngạc nhiên, vui sướng thì kết thúc bằng dấu chấm than.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Dấu phẩy trong câu "Em có bút, thước, tẩy và vở." dùng để làm gì?',
      correct: 'Ngăn cách các từ cùng loại trong một danh sách',
      distractors: ['Kết thúc câu', 'Hỏi một điều gì đó', 'Bộc lộ cảm xúc'],
      explanation: 'Dấu phẩy tách các từ được kể liền nhau cho dễ đọc.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Câu nào đặt dấu phẩy ĐÚNG?',
      correct: 'Trong vườn có hoa hồng, hoa cúc và hoa mai.',
      distractors: [
        'Trong vườn có hoa hồng hoa cúc, và hoa mai.',
        'Trong vườn, có hoa hồng hoa cúc hoa mai.',
        'Trong vườn có, hoa hồng hoa cúc hoa mai.',
      ],
      explanation: 'Dấu phẩy tách các loại hoa được kể; trước "và" thì không cần dấu phẩy.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Chọn câu dùng dấu câu ĐÚNG.',
      correct: 'Hôm nay trời đẹp quá!',
      distractors: ['Hôm nay trời đẹp quá?', 'Bạn có khoẻ không.', 'Em đi học!?'],
      explanation: '"Đẹp quá" bộc lộ cảm xúc nên dùng dấu chấm than.',
    },
    {
      kind: 'text', difficulty: 3,
      prompt: 'Câu "Mẹ ơi, con về rồi" cần dấu gì ở cuối? Viết tên dấu câu đó.',
      accepted: ['dấu chấm than', 'chấm than', 'dấu chấm'],
      explanation: 'Câu gọi và báo tin, thường dùng dấu chấm than; dùng dấu chấm cũng chấp nhận được.',
    },
  ],

  // =========================================================================
  // Viết hoa tên riêng
  // =========================================================================
  'vietnamese.g2.viet-hoa-ten-rieng': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Cách viết tên người nào ĐÚNG?',
      correct: 'Nguyễn Văn Nam', distractors: ['nguyễn văn nam', 'Nguyễn văn Nam', 'NGUYỄN văn nam'],
      explanation: 'Tên người phải viết hoa chữ cái đầu của mỗi tiếng.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Cách viết tên thành phố nào ĐÚNG?',
      correct: 'Hà Nội', distractors: ['hà nội', 'Hà nội', 'hà Nội'],
      explanation: 'Tên riêng địa lí cũng viết hoa chữ cái đầu của mỗi tiếng.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Câu nào viết hoa ĐÚNG?',
      correct: 'Em sống ở thành phố Hải Phòng.',
      distractors: [
        'Em sống ở Thành Phố Hải Phòng.',
        'Em sống ở thành phố hải phòng.',
        'Em sống ở thành phố Hải phòng.',
      ],
      explanation: '"Thành phố" là từ chung nên không viết hoa; "Hải Phòng" là tên riêng nên viết hoa cả hai tiếng.',
    },
    {
      kind: 'text', difficulty: 2,
      prompt: 'Viết lại cho đúng: "sông hồng"',
      accepted: ['Sông Hồng', 'sông Hồng'],
      explanation: '"Hồng" là tên riêng của con sông nên phải viết hoa.',
    },
    {
      kind: 'text', difficulty: 2,
      prompt: 'Viết lại cho đúng tên bạn: "trần thu hà"',
      accepted: ['Trần Thu Hà'],
      explanation: 'Viết hoa chữ cái đầu của cả ba tiếng trong tên người.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Từ nào dưới đây KHÔNG cần viết hoa?',
      correct: 'ngọn núi', distractors: ['Việt Nam', 'Huế', 'Bác Hồ'],
      explanation: '"Ngọn núi" là từ chung; ba từ kia là tên riêng.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Chọn câu viết hoa ĐÚNG hoàn toàn.',
      correct: 'Bạn Lan quê ở tỉnh Nghệ An.',
      distractors: [
        'Bạn lan quê ở Tỉnh Nghệ An.',
        'Bạn Lan quê ở tỉnh nghệ an.',
        'bạn Lan quê ở tỉnh Nghệ An.',
      ],
      explanation: 'Viết hoa đầu câu, tên người "Lan" và tên tỉnh "Nghệ An"; từ chung "tỉnh" viết thường.',
    },
  ],

  // =========================================================================
  // Chính tả: phụ âm đầu
  // =========================================================================
  'vietnamese.g2.chinh-ta-phu-am': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Chọn cách viết ĐÚNG:',
      correct: 'con kiến', distractors: ['con ciến', 'con qiến', 'con kíến'],
      explanation: 'Trước i, e, ê thì viết "k", không viết "c": kiến, kem, kể.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Chọn cách viết ĐÚNG:',
      correct: 'ghế gỗ', distractors: ['gế gỗ', 'ghế ghỗ', 'gế ghỗ'],
      explanation: 'Trước e, ê, i thì viết "gh" (ghế); trước các chữ khác viết "g" (gỗ).',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Chọn cách viết ĐÚNG:',
      correct: 'nghe nhạc', distractors: ['nge nhạc', 'nghe ngạc', 'nge ngạc'],
      explanation: 'Trước e, ê, i thì viết "ngh": nghe, nghỉ, nghiêng.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Chọn cách viết ĐÚNG:',
      correct: 'cây tre', distractors: ['cây che', 'cây trre', 'cây tche'],
      explanation: 'Cây tre viết "tr". Phân biệt với "che" trong "che nắng".',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Chọn cách viết ĐÚNG:',
      correct: 'xe đạp', distractors: ['se đạp', 'xe đạb', 'se đạb'],
      explanation: 'Xe đạp viết "x". Phân biệt với "se" trong "se lạnh".',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Chọn cách viết ĐÚNG:',
      correct: 'quả na', distractors: ['quả la', 'quả nà', 'quả lna'],
      explanation: 'Quả na viết "n". Phân biệt l/n: lá - ná, lo - no.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Chọn cách viết ĐÚNG:',
      correct: 'giỏ hoa', distractors: ['dỏ hoa', 'rỏ hoa', 'giõ hoa'],
      explanation: 'Giỏ (đựng đồ) viết "gi". Phân biệt r/d/gi: rổ - dỗ - giỏ.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Từ nào viết SAI chính tả?',
      correct: 'cây ce', distractors: ['cây kem', 'cây chuối', 'cây tre'],
      explanation: 'Trước chữ e phải viết "k" chứ không viết "c".',
    },
    {
      kind: 'text', difficulty: 3,
      prompt: 'Điền "s" hoặc "x" vào chỗ trống: "_ách vở"',
      accepted: ['sách vở', 's'],
      explanation: 'Viết "sách vở" với chữ s.',
    },
  ],

  // =========================================================================
  // Chính tả: vần
  // =========================================================================
  'vietnamese.g2.chinh-ta-van': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Chọn cách viết ĐÚNG:',
      correct: 'bàn tay', distractors: ['bàn tai', 'bàng tay', 'bàng tai'],
      explanation: 'Bàn tay viết vần "ay". Phân biệt ai/ay: tai (nghe) - tay (cầm).',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Chọn cách viết ĐÚNG:',
      correct: 'con đường làng', distractors: ['con đường làn', 'con đườn làng', 'con đườn làn'],
      explanation: 'Cả hai tiếng đều mang vần "ang". Phân biệt an/ang: bàn - bàng.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Chọn cách viết ĐÚNG:',
      correct: 'buồn ngủ', distractors: ['buồng ngủ', 'buồn ngũ', 'buồng ngũ'],
      explanation: 'Buồn (cảm giác) viết vần "uôn"; buồng (buồng chuối) viết "uông".',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Chọn cách viết ĐÚNG:',
      correct: 'quả bưởi chín', distractors: ['quả bưỡi chín', 'quả bửơi chín', 'quả bưởi chính'],
      explanation: 'Bưởi viết "ươi" với dấu hỏi; chín viết vần "in".',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Chọn cách viết ĐÚNG:',
      correct: 'mặt trăng', distractors: ['mặt trăn', 'mặc trăng', 'mặc trăn'],
      explanation: 'Mặt viết "ăt", trăng viết "ăng".',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Chọn cách viết ĐÚNG:',
      correct: 'con hươu', distractors: ['con hưu', 'con hiêu', 'con hươi'],
      explanation: 'Con hươu viết vần "ươu". Phân biệt iêu/ươu: hiểu - hươu.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Từ nào viết SAI chính tả?',
      correct: 'cái bàng học', distractors: ['cái bàn học', 'cây bàng', 'bạn thân'],
      explanation: 'Cái bàn viết vần "an"; "bàng" chỉ dùng cho cây bàng.',
    },
    {
      kind: 'text', difficulty: 3,
      prompt: 'Điền vần "ăt" hoặc "ăc" vào chỗ trống: "m_ áo"',
      accepted: ['mặc áo', 'ăc'],
      explanation: 'Viết "mặc áo" với vần ăc.',
    },
  ],

  // =========================================================================
  // Chính tả: dấu hỏi / dấu ngã
  // =========================================================================
  'vietnamese.g2.chinh-ta-dau-thanh': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Chọn cách viết ĐÚNG:',
      correct: 'nghỉ ngơi', distractors: ['nghĩ ngơi', 'nghỉ ngới', 'nghĩ ngới'],
      explanation: '"Nghỉ ngơi" (không làm việc) viết dấu hỏi; "nghĩ" (suy nghĩ) viết dấu ngã.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Chọn cách viết ĐÚNG:',
      correct: 'suy nghĩ', distractors: ['suy nghỉ', 'suy nghị', 'suy nghì'],
      explanation: '"Nghĩ" trong suy nghĩ viết dấu ngã.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Chọn cách viết ĐÚNG:',
      correct: 'vẽ tranh', distractors: ['vẻ tranh', 'vẹ tranh', 'vè tranh'],
      explanation: '"Vẽ" (cầm bút vẽ) viết dấu ngã; "vẻ" (vẻ đẹp) viết dấu hỏi.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Chọn cách viết ĐÚNG:',
      correct: 'vẻ mặt tươi vui', distractors: ['vẽ mặt tươi vui', 'vẹ mặt tươi vui', 'vè mặt tươi vui'],
      explanation: '"Vẻ mặt" viết dấu hỏi.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Chọn cách viết ĐÚNG:',
      correct: 'ngã tư đường', distractors: ['ngả tư đường', 'ngá tư đường', 'ngà tư đường'],
      explanation: '"Ngã tư" viết dấu ngã.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Chọn cách viết ĐÚNG:',
      correct: 'cửa sổ', distractors: ['cữa sổ', 'cửa sỗ', 'cữa sỗ'],
      explanation: 'Cả hai tiếng "cửa" và "sổ" đều viết dấu hỏi.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Từ nào viết SAI dấu thanh?',
      correct: 'mỡ cửa', distractors: ['mở cửa', 'mỡ lợn', 'sửa xe'],
      explanation: '"Mở cửa" viết dấu hỏi; "mỡ" dấu ngã chỉ dùng cho mỡ lợn.',
    },
    {
      kind: 'text', difficulty: 3,
      prompt: 'Viết lại cho đúng: "sữa chữa xe đạp"',
      accepted: ['sửa chữa xe đạp'],
      explanation: '"Sửa" viết dấu hỏi, "chữa" viết dấu ngã. "Sữa" dấu ngã là sữa để uống.',
    },
  ],

  // =========================================================================
  // Mở rộng vốn từ theo chủ điểm
  // =========================================================================
  'vietnamese.g2.von-tu-chu-diem': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Từ nào thuộc chủ điểm gia đình?',
      correct: 'ông bà', distractors: ['bảng đen', 'con hổ', 'biển cả'],
      explanation: 'Ông bà là người thân trong gia đình.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Từ nào là đồ dùng học tập?',
      correct: 'thước kẻ', distractors: ['nồi cơm', 'xe máy', 'cái chổi'],
      explanation: 'Thước kẻ là đồ dùng dùng khi học.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Từ nào KHÔNG thuộc nhóm chỉ nghề nghiệp?',
      correct: 'bệnh viện', distractors: ['bác sĩ', 'giáo viên', 'thợ xây'],
      explanation: 'Bệnh viện là nơi làm việc, không phải tên nghề.',
    },
    {
      kind: 'pairs', difficulty: 2,
      prompt: 'Nối chủ điểm với từ thuộc chủ điểm đó.',
      pairs: [['Trường học', 'lớp học'], ['Gia đình', 'anh chị'], ['Muông thú', 'con hổ'], ['Cây cối', 'cành lá']],
      explanation: 'Mỗi chủ điểm có nhóm từ riêng.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Từ nào chỉ loài vật sống dưới biển?',
      correct: 'cá heo', distractors: ['con gà', 'con trâu', 'con mèo'],
      explanation: 'Cá heo sống dưới biển; gà, trâu, mèo là vật nuôi trên cạn.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Từ nào chỉ việc làm bảo vệ môi trường?',
      correct: 'trồng cây', distractors: ['xả rác', 'chặt cây', 'đốt rừng'],
      explanation: 'Trồng cây làm môi trường xanh hơn; ba việc kia làm hại môi trường.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Từ nào chỉ sản phẩm truyền thống của nước ta?',
      correct: 'nón lá', distractors: ['máy tính', 'xe buýt', 'ti vi'],
      explanation: 'Nón lá là sản phẩm truyền thống quen thuộc của Việt Nam.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Nhóm nào gồm toàn từ về các mùa trong năm?',
      correct: 'xuân, hạ, thu, đông',
      distractors: ['sáng, trưa, chiều, tối', 'đông, tây, nam, bắc', 'xanh, đỏ, tím, vàng'],
      explanation: 'Một năm có bốn mùa: xuân, hạ, thu, đông.',
    },
    {
      kind: 'text', difficulty: 3,
      prompt: 'Kể tên một người thân trong gia đình em (viết một từ).',
      accepted: ['bố', 'mẹ', 'ông', 'bà', 'anh', 'chị', 'em', 'cha', 'ba', 'má', 'cô', 'chú', 'bác', 'dì', 'cậu'],
      explanation: 'Những từ chỉ người thân: bố, mẹ, ông, bà, anh, chị, em...',
    },
  ],
}

export default bank
