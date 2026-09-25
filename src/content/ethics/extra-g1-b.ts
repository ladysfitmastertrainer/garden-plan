/**
 * Tình huống Đạo đức BỔ SUNG ĐỢT HAI - riêng lớp 1.
 *
 * Sau đợt bổ sung đầu, lớp 2 và lớp 3 đánh tám trận liền không còn gặp lại câu
 * nào, nhưng lớp 1 vẫn lặp hơn nửa: cả lớp chỉ có năm kỹ năng, tức 31 câu, mà
 * tám trận là 64 câu. Lớp 1 cũng là các em nhỏ nhất - dễ chán nhất khi gặp lại
 * đúng một câu chuyện. Nên lớp 1 được thêm ba tình huống mỗi kỹ năng nữa.
 *
 * Cùng quy ước với `extra-g1-g2.ts`.
 */

import { opt, type Bank } from '../bank'

const bank: Bank = {
  'ethics.g1.yeu-thuong-gia-dinh': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Bố đang sửa xe ngoài sân, trời nắng nóng. Con sẽ làm gì?',
      explanation: 'Để ý giúp người thân những việc nhỏ khi họ vất vả là yêu thương gia đình.',
      options: [
        opt('mang-nuoc', 'Mang cho bố cốc nước mát và đưa đồ nghề giúp bố', 'good', 'Bố sẽ đỡ mệt và rất vui vì có con phụ giúp.', ['kindness', 'responsibility']),
        opt('hoi-bo', 'Ra hỏi bố có cần con giúp gì không', 'ok', 'Hỏi là quan tâm rồi. Mang sẵn cốc nước ra thì bố càng vui.', ['kindness']),
        opt('goi-bo-vao', 'Gọi bố vào chơi với con', 'poor', 'Bố đang bận sửa xe. Con giúp bố xong sớm thì bố sẽ chơi với con.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Chị con bị ốm phải nằm trên giường. Con sẽ làm gì?',
      explanation: 'Chăm sóc người thân khi ốm là thể hiện tình yêu thương.',
      options: [
        opt('hoi-han', 'Hỏi thăm chị, lấy nước cho chị và chơi thật khẽ', 'good', 'Chị sẽ thấy ấm lòng và mau khoẻ lại.', ['kindness']),
        opt('choi-khe', 'Chơi thật khẽ để chị ngủ', 'ok', 'Giữ yên lặng là quan tâm rồi. Hỏi thăm chị một câu nữa nhé.', ['kindness']),
        opt('bat-tivi-to', 'Bật tivi thật to xem hoạt hình', 'poor', 'Chị đang mệt cần nghỉ. Tiếng tivi to làm chị khó ngủ lắm.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Mẹ nấu cơm xong, cả nhà chuẩn bị ăn. Con sẽ làm gì?',
      explanation: 'Cùng làm việc nhà là cách chia sẻ và yêu thương gia đình.',
      options: [
        opt('don-bat-dua', 'Giúp mẹ bày bát đũa và mời cả nhà ăn cơm', 'good', 'Con thật ngoan! Bữa cơm càng ấm áp khi có con giúp.', ['kindness', 'responsibility', 'respect']),
        opt('ngoi-cho', 'Ngồi vào bàn chờ mọi người', 'ok', 'Ngồi ngay ngắn chờ là lễ phép. Giúp mẹ bày bát đũa thì càng tốt.', ['respect']),
        opt('an-truoc', 'Ăn trước vì con đói quá', 'poor', 'Chờ cả nhà cùng ăn và mời mọi người là phép lịch sự trong gia đình.'),
      ],
    },
  ],

  'ethics.g1.gon-gang-ngan-nap': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Buổi sáng ngủ dậy, chăn gối trên giường con còn lộn xộn. Con sẽ làm gì?',
      explanation: 'Tự gấp chăn gối mỗi sáng là thói quen gọn gàng.',
      options: [
        opt('gap-chan', 'Gấp chăn, xếp gối gọn gàng', 'good', 'Giỏi quá! Phòng của con trông thật gọn gàng.', ['responsibility']),
        opt('keo-phang', 'Kéo chăn cho phẳng rồi đi', 'ok', 'Kéo phẳng là đỡ bừa rồi. Gấp gọn thì còn đẹp hơn nữa.', ['responsibility']),
        opt('de-nguyen', 'Để nguyên, tối lại ngủ tiếp mà', 'poor', 'Giường gọn gàng thì tối đi ngủ con thấy dễ chịu hơn nhiều.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Ăn xong bánh, con cầm vỏ bánh trên tay. Con sẽ làm gì?',
      explanation: 'Bỏ rác đúng nơi quy định giúp nhà cửa và trường lớp sạch sẽ.',
      options: [
        opt('bo-thung-rac', 'Bỏ vỏ bánh vào thùng rác', 'good', 'Đúng rồi! Nhà mình luôn sạch sẽ nhờ những việc nhỏ như thế.', ['responsibility', 'citizenship']),
        opt('de-tren-ban', 'Để vỏ bánh lên bàn, lát nữa vứt', 'ok', 'Không vứt xuống đất là tốt. Nhưng lát nữa dễ quên lắm, vứt luôn nhé.', ['responsibility']),
        opt('vut-xuong-dat', 'Vứt xuống đất cho nhanh', 'poor', 'Rác dưới đất làm nhà bẩn và kiến sẽ bò đến đấy.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Giờ ra về, bàn học của con còn giấy vụn và bút chì. Con sẽ làm gì?',
      explanation: 'Dọn chỗ ngồi của mình trước khi về là giữ gìn lớp học chung.',
      options: [
        opt('don-sach', 'Cất bút vào hộp, nhặt giấy vụn bỏ thùng rác rồi mới về', 'good', 'Rất gọn gàng! Sáng mai con có chỗ ngồi sạch sẽ.', ['responsibility', 'citizenship']),
        opt('cat-but', 'Cất bút vào cặp, giấy vụn để bạn trực nhật dọn', 'ok', 'Cất đồ của mình là tốt, nhưng giấy vụn cũng do con làm ra mà.', ['responsibility']),
        opt('ve-luon', 'Chạy về luôn cho kịp', 'poor', 'Để bàn bừa thì bạn trực nhật rất vất vả, và con có thể mất bút.'),
      ],
    },
  ],

  'ethics.g1.le-phep-chao-hoi': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Sáng đến lớp, con gặp cô giáo ở cổng trường. Con sẽ làm gì?',
      explanation: 'Chào thầy cô khi gặp là phép lịch sự của học trò.',
      options: [
        opt('chao-co', 'Khoanh tay chào: "Con chào cô ạ!"', 'good', 'Rất lễ phép! Cô sẽ bắt đầu ngày mới thật vui.', ['respect']),
        opt('vay-tay', 'Vẫy tay chào cô', 'ok', 'Có chào là tốt. Nói "Con chào cô ạ" thì lễ phép hơn.', ['respect']),
        opt('di-thang', 'Đi thẳng vào lớp', 'poor', 'Cô sẽ nghĩ con không thấy cô. Một lời chào làm cô vui lắm.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Bà cho con một quả táo. Con sẽ làm gì?',
      explanation: 'Nhận quà bằng hai tay và nói lời cảm ơn là lễ phép.',
      options: [
        opt('hai-tay', 'Nhận bằng hai tay và nói "Cháu cảm ơn bà ạ"', 'good', 'Ngoan quá! Bà sẽ rất vui vì cháu lễ phép.', ['respect']),
        opt('cam-on', 'Nói "Cháu cảm ơn bà" rồi cầm lấy', 'ok', 'Cảm ơn là tốt rồi. Nhận bằng hai tay thì càng lễ phép.', ['respect']),
        opt('giat-lay', 'Giật lấy và chạy đi ăn', 'poor', 'Bà sẽ buồn đấy. Nhận quà thì nhớ cảm ơn bà nhé.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Điện thoại nhà reo, bố mẹ đang bận nên con nghe máy. Con sẽ nói thế nào?',
      explanation: 'Nghe điện thoại lịch sự: chào hỏi, xưng hô đúng mực.',
      options: [
        opt('chao-lich-su', '"Alô, con/cháu xin nghe ạ. Bác muốn gặp ai ạ?"', 'good', 'Rất lịch sự! Người gọi sẽ khen con ngoan.', ['respect']),
        opt('goi-bo-me', '"Alô" rồi gọi to bố mẹ ra nghe ngay', 'ok', 'Gọi bố mẹ là được, nhưng nhớ chào và xin người gọi chờ một chút nhé.', ['respect']),
        opt('hoi-cot-lot', '"Ai đấy? Gọi gì thế?"', 'poor', 'Nói trống không như vậy là thiếu lễ phép với người lớn.'),
      ],
    },
  ],

  'ethics.g1.tu-cham-soc': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Buổi sáng thức dậy, con sẽ làm gì trước tiên?',
      explanation: 'Đánh răng, rửa mặt mỗi sáng giúp con sạch sẽ và khoẻ mạnh.',
      options: [
        opt('danh-rang', 'Đánh răng, rửa mặt rồi thay quần áo', 'good', 'Tuyệt! Con đã tự chăm sóc bản thân rất tốt.', ['responsibility']),
        opt('rua-mat', 'Rửa mặt thật nhanh cho tỉnh', 'ok', 'Rửa mặt là tốt, nhớ đánh răng nữa để răng không bị sâu nhé.', ['responsibility']),
        opt('an-sang-luon', 'Chạy ra ăn sáng luôn', 'poor', 'Chưa đánh răng mà ăn thì vi khuẩn trong miệng sẽ làm sâu răng đấy.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con khát nước sau giờ thể dục. Có nước lọc và nước ngọt có ga. Con sẽ chọn gì?',
      explanation: 'Uống nước lọc là tốt nhất cho sức khoẻ.',
      options: [
        opt('nuoc-loc', 'Uống nước lọc', 'good', 'Rất tốt! Nước lọc giúp cơ thể khoẻ mạnh nhất.', ['responsibility']),
        opt('it-nuoc-ngot', 'Uống nước lọc là chính, thêm một ngụm nước ngọt', 'ok', 'Nước lọc là chính thì ổn. Nước ngọt chỉ nên thỉnh thoảng thôi nhé.', ['responsibility']),
        opt('nuoc-ngot', 'Uống thật nhiều nước ngọt có ga', 'poor', 'Nước ngọt có nhiều đường, dễ làm sâu răng và không tốt cho sức khoẻ.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Con bị đau bụng ở trường. Con sẽ làm gì?',
      explanation: 'Khi thấy trong người không khoẻ, hãy báo ngay cho người lớn.',
      options: [
        opt('bao-co', 'Báo ngay cho cô giáo', 'good', 'Đúng rồi! Cô sẽ đưa con đến phòng y tế và gọi bố mẹ.', ['responsibility', 'honesty']),
        opt('noi-ban', 'Nói với bạn ngồi cạnh', 'ok', 'Nói ra là tốt, nhưng cô giáo mới là người giúp được con.', ['honesty']),
        opt('chiu-dung', 'Cố chịu, không nói với ai', 'poor', 'Cố chịu có thể làm con ốm nặng hơn. Hãy báo cô ngay nhé.'),
      ],
    },
  ],

  'ethics.g1.an-toan-vui-choi': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Các bạn rủ con trèo lên lan can tầng hai để ngắm sân trường. Con sẽ làm gì?',
      explanation: 'Không trèo lan can, cửa sổ hay chỗ cao vì rất dễ ngã.',
      options: [
        opt('tu-choi-khuyen', 'Không trèo và khuyên các bạn xuống', 'good', 'Rất đúng! Con đã giữ an toàn cho mình và bạn.', ['responsibility', 'kindness']),
        opt('dung-xem', 'Không trèo, đứng xem các bạn', 'ok', 'Con an toàn rồi. Khuyên các bạn xuống thì các bạn cũng an toàn.', ['responsibility']),
        opt('treo-cung', 'Trèo lên cùng các bạn', 'poor', 'Trèo lan can rất nguy hiểm, ngã từ trên cao có thể bị thương nặng.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con nhặt được một cái kéo nhọn trong sân chơi. Con sẽ làm gì?',
      explanation: 'Đồ vật sắc nhọn rất nguy hiểm, cần đưa cho người lớn cất.',
      options: [
        opt('dua-nguoi-lon', 'Cầm cẩn thận, mũi chúc xuống, đưa cho cô giáo', 'good', 'Rất cẩn thận! Các bạn khác sẽ không bị thương.', ['responsibility', 'citizenship']),
        opt('goi-co', 'Không cầm, gọi cô ra lấy', 'ok', 'Không tự cầm là an toàn. Đứng canh để bạn khác không nhặt nhé.', ['responsibility']),
        opt('dung-choi', 'Dùng kéo cắt lá chơi', 'poor', 'Kéo nhọn có thể làm con hoặc bạn bị đứt tay. Đưa cho người lớn nhé.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Đi chơi công viên, một người lạ cho con kẹo và rủ đi xem con thỏ đẹp. Con sẽ làm gì?',
      explanation: 'Không nhận quà và không đi theo người lạ.',
      options: [
        opt('tu-choi-chay', 'Không nhận, chạy ngay về chỗ bố mẹ', 'good', 'Rất đúng! Con đã tự bảo vệ mình.', ['responsibility']),
        opt('tu-choi', 'Nói "cháu không đi đâu ạ" và đứng yên', 'ok', 'Từ chối là đúng. Chạy về chỗ bố mẹ và kể lại thì an toàn hơn nữa.', ['responsibility']),
        opt('di-theo', 'Nhận kẹo và đi xem thỏ', 'poor', 'Rất nguy hiểm! Không bao giờ đi theo người lạ, dù họ cho quà.'),
      ],
    },
  ],
}

export default bank
