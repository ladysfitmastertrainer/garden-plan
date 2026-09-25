/**
 * Tình huống Đạo đức BỔ SUNG ĐỢT BA - riêng lớp 1.
 *
 * Sau đợt hai, lớp 1 có 46 tình huống, và tám trận liền (64 câu) vẫn phải lặp
 * ít nhất 18 câu - kho không đủ dày chứ bộ chọn không làm sai. Đợt này thêm bốn
 * tình huống mỗi kỹ năng: ba câu bậc 1, một câu bậc 2. Lớp 1 lên 66 câu, nên
 * tám trận liền có thể không gặp lại câu nào.
 *
 * Cùng quy ước với `extra-g1-g2.ts`. Chủ đề chọn tránh những gì đã có: không lặp
 * lại cảnh bà xách rau, mẹ đi làm về, dọn đồ chơi, tay bẩn trước bữa ăn...
 */

import { opt, type Bank } from '../bank'

const bank: Bank = {
  'ethics.g1.yeu-thuong-gia-dinh': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Ông bà ở quê gọi điện lên hỏi thăm. Con sẽ làm gì?',
      explanation: 'Hỏi thăm ông bà ở xa là cách thể hiện tình yêu thương dù không ở gần.',
      options: [
        opt('ke-chuyen', 'Chào ông bà, kể chuyện ở lớp và hỏi ông bà có khoẻ không', 'good', 'Ông bà sẽ vui cả ngày vì được nghe cháu kể chuyện.', ['kindness', 'respect']),
        opt('chao-roi-choi', 'Chào ông bà rồi đưa máy lại cho mẹ', 'ok', 'Có chào là tốt. Ông bà rất muốn nghe cháu nói thêm vài câu đấy.', ['respect']),
        opt('khong-nghe', 'Bảo mẹ là con đang bận chơi', 'poor', 'Ông bà ở xa rất nhớ cháu. Chỉ vài phút nói chuyện thôi cũng quý lắm.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Em bé nhà con đang ngủ, con muốn hát thật to bài vừa học. Con sẽ làm gì?',
      explanation: 'Biết nghĩ cho người thân trong nhà là yêu thương gia đình.',
      options: [
        opt('hat-khe', 'Đợi em dậy rồi hát cho em nghe', 'good', 'Tuyệt! Em được ngủ ngon, lại còn được nghe anh chị hát.', ['kindness']),
        opt('ra-san', 'Ra ngoài sân hát nhỏ thôi', 'ok', 'Con đã nghĩ cho em rồi. Hát cho em nghe khi em dậy thì em càng vui.', ['kindness']),
        opt('hat-to', 'Cứ hát to, em quen rồi', 'poor', 'Em bé bị đánh thức sẽ quấy khóc và mệt lắm. Đợi em dậy nhé.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Mẹ đang phơi quần áo, rổ đồ còn rất nhiều. Con sẽ làm gì?',
      explanation: 'Phụ giúp việc nhà vừa sức là biết chia sẻ với bố mẹ.',
      options: [
        opt('dua-mac', 'Đưa từng cái mắc áo cho mẹ phơi', 'good', 'Mẹ phơi nhanh hơn hẳn nhờ có con giúp. Giỏi lắm!', ['kindness', 'responsibility']),
        opt('dung-canh', 'Đứng cạnh nói chuyện với mẹ', 'ok', 'Mẹ vui vì có con bên cạnh. Đưa giúp mẹ mắc áo thì càng tốt.', ['kindness']),
        opt('chay-di-choi', 'Chạy đi chơi, phơi đồ là việc của mẹ', 'poor', 'Việc nhà là việc của cả nhà. Con giúp một chút là mẹ đỡ mỏi.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Bố mẹ cãi nhau to tiếng, con thấy sợ và buồn. Con sẽ làm gì?',
      explanation: 'Khi buồn vì chuyện trong nhà, con có thể nói ra cảm xúc của mình một cách nhẹ nhàng.',
      options: [
        opt('noi-nhe', 'Đợi bố mẹ bình tĩnh rồi nói "con thấy sợ khi bố mẹ to tiếng"', 'good', 'Con rất dũng cảm. Bố mẹ sẽ hiểu và nói chuyện nhẹ nhàng hơn.', ['honesty', 'kindness']),
        opt('ve-phong', 'Vào phòng chơi một mình cho bớt sợ', 'ok', 'Tìm chỗ bình tĩnh là tốt. Nói ra cảm xúc thì con không phải buồn một mình.', ['honesty']),
        opt('het-len', 'Hét lên bảo bố mẹ im đi', 'poor', 'Hét lên làm mọi người thêm căng thẳng. Nói nhẹ nhàng khi bố mẹ bình tĩnh nhé.'),
      ],
    },
  ],

  'ethics.g1.gon-gang-ngan-nap': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con cởi quần áo bẩn sau khi đi chơi về. Con sẽ để chúng ở đâu?',
      explanation: 'Để quần áo bẩn đúng chỗ giúp mẹ giặt dễ và nhà gọn gàng.',
      options: [
        opt('bo-gio', 'Bỏ vào giỏ đựng đồ bẩn', 'good', 'Rất gọn gàng! Mẹ sẽ không phải đi nhặt khắp nhà.', ['responsibility']),
        opt('vat-ghe', 'Vắt lên thành ghế', 'ok', 'Không vứt xuống đất là tốt rồi. Bỏ vào giỏ thì gọn hơn nữa.', ['responsibility']),
        opt('vut-san', 'Vứt luôn xuống sàn nhà', 'poor', 'Quần áo trên sàn làm nhà bừa và mẹ phải đi nhặt. Bỏ vào giỏ nhé.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con đọc truyện xong. Con sẽ để cuốn truyện ở đâu?',
      explanation: 'Sách đọc xong cất lên giá giúp sách không quăn, không rách.',
      options: [
        opt('cat-gia', 'Cất lên giá sách đúng chỗ cũ', 'good', 'Tuyệt! Lần sau con muốn đọc lại là thấy ngay.', ['responsibility']),
        opt('de-ban', 'Để ngay ngắn trên bàn', 'ok', 'Để ngay ngắn là đỡ rồi. Cất lên giá thì truyện không bị lẫn.', ['responsibility']),
        opt('up-giuong', 'Úp lên giường, lát đọc tiếp', 'poor', 'Úp sách dễ làm gãy gáy sách, nằm lên còn làm rách nữa.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Hộp bút của con có mấy cây bút hết mực và mẩu bút chì quá ngắn. Con sẽ làm gì?',
      explanation: 'Bỏ bớt đồ hỏng giúp hộp bút gọn và dễ tìm đồ.',
      options: [
        opt('don-hop', 'Bỏ bút hỏng đi, xếp lại hộp bút gọn gàng', 'good', 'Hộp bút gọn gàng, lúc học con lấy bút rất nhanh.', ['responsibility']),
        opt('hoi-me', 'Hỏi mẹ có nên bỏ không', 'ok', 'Hỏi mẹ là cẩn thận. Tự sắp xếp được thì con càng giỏi.', ['responsibility']),
        opt('nhet-them', 'Cứ nhét thêm bút mới vào', 'poor', 'Hộp bút chật cứng thì lúc cần lại lấy nhầm bút hỏng.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Bạn đến nhà chơi, hai đứa bày đồ chơi khắp phòng. Bạn sắp về. Con sẽ làm gì?',
      explanation: 'Cùng dọn dẹp sau khi chơi là gọn gàng và công bằng với mọi người.',
      options: [
        opt('cung-don', 'Rủ bạn cùng dọn thật nhanh trước khi bạn về', 'good', 'Hai bạn dọn cùng nhau thì vừa nhanh vừa vui!', ['responsibility', 'kindness']),
        opt('tu-don', 'Để bạn về rồi con tự dọn hết', 'ok', 'Con dọn là có trách nhiệm. Cùng dọn với bạn thì nhanh hơn nhiều.', ['responsibility']),
        opt('de-me-don', 'Để đó cho mẹ dọn', 'poor', 'Đồ do con bày ra thì con dọn. Mẹ còn nhiều việc lắm.'),
      ],
    },
  ],

  'ethics.g1.le-phep-chao-hoi': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con muốn đi qua chỗ hai cô chú đang đứng nói chuyện ở lối đi hẹp. Con sẽ nói gì?',
      explanation: 'Muốn đi qua hãy nói "cho cháu đi nhờ ạ" và cảm ơn.',
      options: [
        opt('xin-di-nho', '"Cô chú cho cháu đi nhờ ạ" rồi cảm ơn', 'good', 'Rất lễ phép! Cô chú sẽ vui vẻ nhường đường.', ['respect']),
        opt('doi', 'Đứng đợi cô chú nói xong', 'ok', 'Đợi là lịch sự, nhưng nói "cho cháu đi nhờ" thì nhanh và vẫn lễ phép.', ['respect']),
        opt('chen-qua', 'Chen thẳng qua giữa hai người', 'poor', 'Chen ngang làm người khác giật mình. Xin phép một câu nhé.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con giẫm phải chân một bạn khi xếp hàng. Con sẽ làm gì?',
      explanation: 'Làm người khác đau dù vô tình cũng cần xin lỗi ngay.',
      options: [
        opt('xin-loi-hoi', 'Nói "tớ xin lỗi, cậu có đau không?"', 'good', 'Đúng rồi! Bạn sẽ thấy con thật lịch sự và tốt bụng.', ['respect', 'kindness']),
        opt('xin-loi-nho', 'Nói nhỏ "xin lỗi" rồi quay đi', 'ok', 'Xin lỗi là tốt. Hỏi thăm bạn nữa thì bạn càng vui.', ['respect']),
        opt('lang-im', 'Lặng im vì con không cố ý', 'poor', 'Không cố ý nhưng bạn vẫn đau. Một lời xin lỗi là cần thiết.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Đi học về, con gặp bác bảo vệ ở cổng trường. Con sẽ làm gì?',
      explanation: 'Chào mọi người lớn trong trường là lễ phép, không chỉ thầy cô.',
      options: [
        opt('chao-bac', 'Khoanh tay chào bác bảo vệ', 'good', 'Rất ngoan! Bác sẽ vui vì được các cháu quý mến.', ['respect']),
        opt('cuoi-voi-bac', 'Cười với bác rồi đi', 'ok', 'Nụ cười thân thiện rồi. Thêm một lời chào thì lễ phép hơn.', ['respect']),
        opt('chay-qua', 'Chạy vụt qua cổng', 'poor', 'Bác bảo vệ trông các con cả ngày. Chào bác một câu nhé.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Cô giáo hỏi một câu, con biết đáp án và muốn nói ngay. Bạn khác đang trả lời. Con sẽ làm gì?',
      explanation: 'Không ngắt lời người khác, chờ đến lượt mình là lịch sự.',
      options: [
        opt('gio-tay-cho', 'Chờ bạn nói xong rồi giơ tay xin phát biểu', 'good', 'Rất lịch sự! Ai cũng được lắng nghe khi nói.', ['respect']),
        opt('noi-nho-ban', 'Nói nhỏ đáp án cho bạn ngồi cạnh', 'ok', 'Con không ngắt lời cô, nhưng nói chuyện riêng cũng làm lớp mất trật tự.', ['respect']),
        opt('noi-chen', 'Nói to đáp án chen vào', 'poor', 'Ngắt lời bạn làm bạn buồn và lớp mất trật tự. Chờ đến lượt con nhé.'),
      ],
    },
  ],

  'ethics.g1.tu-cham-soc': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Móng tay con đã dài và có đất bên trong. Con sẽ làm gì?',
      explanation: 'Móng tay dài dễ chứa vi khuẩn, cần cắt ngắn và giữ sạch.',
      options: [
        opt('nho-me-cat', 'Nhờ bố mẹ cắt móng tay giúp', 'good', 'Đúng rồi! Móng tay ngắn, sạch thì con khoẻ hơn.', ['responsibility']),
        opt('rua-tay', 'Rửa tay thật kỹ cho sạch đất', 'ok', 'Rửa sạch là tốt, nhưng móng dài vẫn dễ bẩn lại. Nhờ bố mẹ cắt nhé.', ['responsibility']),
        opt('can-mong', 'Cắn móng tay cho ngắn', 'poor', 'Cắn móng tay đưa vi khuẩn vào miệng, dễ bị đau bụng lắm.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Buổi trưa ở trường, đến giờ ngủ trưa nhưng con muốn nói chuyện với bạn. Con sẽ làm gì?',
      explanation: 'Ngủ trưa đủ giấc giúp con khoẻ và học buổi chiều tốt hơn.',
      options: [
        opt('ngu-trua', 'Nằm ngay ngắn và ngủ trưa', 'good', 'Tuyệt! Buổi chiều con sẽ tỉnh táo và vui vẻ.', ['responsibility']),
        opt('nam-yen', 'Nằm yên dù chưa buồn ngủ', 'ok', 'Nằm yên cũng giúp cơ thể nghỉ ngơi, và không làm phiền bạn.', ['responsibility', 'respect']),
        opt('noi-chuyen', 'Nói chuyện với bạn suốt giờ ngủ', 'poor', 'Không ngủ thì chiều con sẽ mệt, lại làm các bạn khác không ngủ được.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Bữa sáng có bánh mì và sữa nhưng con chỉ muốn ăn bim bim. Con sẽ làm gì?',
      explanation: 'Ăn sáng đủ chất giúp con có sức để học và chơi.',
      options: [
        opt('an-sang', 'Ăn bánh mì và uống sữa', 'good', 'Rất tốt! Bữa sáng đủ chất cho con cả buổi khoẻ khoắn.', ['responsibility']),
        opt('an-it', 'Ăn một nửa phần ăn sáng', 'ok', 'Có ăn là tốt rồi. Ăn hết phần thì con sẽ không bị đói giữa buổi.', ['responsibility']),
        opt('an-bim-bim', 'Chỉ ăn bim bim thay bữa sáng', 'poor', 'Bim bim không đủ chất, con sẽ mau đói và mệt lắm.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Con đang xem điện thoại đã lâu, mắt bắt đầu mỏi và cay. Con sẽ làm gì?',
      explanation: 'Nghỉ mắt khi xem màn hình lâu giúp bảo vệ đôi mắt.',
      options: [
        opt('nghi-mat', 'Cất điện thoại, nhìn ra xa và đi chơi việc khác', 'good', 'Rất biết tự chăm sóc! Đôi mắt của con sẽ khoẻ.', ['responsibility', 'perseverance']),
        opt('dui-mat', 'Dụi mắt rồi xem tiếp một chút', 'ok', 'Con đã để ý thấy mắt mỏi rồi. Nhưng dụi mắt không tốt, nghỉ hẳn thì hơn.', ['responsibility']),
        opt('xem-tiep', 'Xem tiếp đến hết video', 'poor', 'Mắt mỏi mà cứ xem tiếp thì dễ bị cận thị. Nghỉ ngay nhé.'),
      ],
    },
  ],

  'ethics.g1.an-toan-vui-choi': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con thấy một lọ thuốc có màu đẹp như kẹo trên bàn. Con sẽ làm gì?',
      explanation: 'Không tự ý ăn uống thuốc hay thứ lạ, dù trông giống kẹo.',
      options: [
        opt('bao-me', 'Không ăn, báo cho bố mẹ cất đi', 'good', 'Rất đúng! Thuốc uống sai có thể rất nguy hiểm.', ['responsibility']),
        opt('khong-dong', 'Không động vào lọ thuốc', 'ok', 'Không động vào là đúng. Báo bố mẹ thì em nhỏ cũng không lấy được.', ['responsibility']),
        opt('an-thu', 'Ăn thử một viên xem có ngọt không', 'poor', 'Rất nguy hiểm! Thuốc không phải kẹo, uống bừa có thể bị ngộ độc.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con đang chơi đuổi bắt thì thấy sàn hành lang vừa lau còn ướt. Con sẽ làm gì?',
      explanation: 'Không chạy trên sàn ướt vì rất dễ trượt ngã.',
      options: [
        opt('di-cham', 'Dừng chạy, đi chậm qua và nhắc các bạn', 'good', 'Tuyệt! Con và các bạn đều không bị ngã.', ['responsibility', 'kindness']),
        opt('di-cham-thoi', 'Đi chậm qua chỗ ướt', 'ok', 'Con an toàn rồi. Nhắc các bạn nữa thì mọi người cùng an toàn.', ['responsibility']),
        opt('chay-tiep', 'Chạy tiếp cho kịp bạn', 'poor', 'Sàn ướt rất trơn, chạy qua dễ ngã đập đầu lắm.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con muốn cắm sạc điện thoại cho mẹ nhưng ổ cắm ở trên cao. Con sẽ làm gì?',
      explanation: 'Trẻ em không tự cắm điện, hãy nhờ người lớn.',
      options: [
        opt('nho-me', 'Nhờ mẹ cắm sạc', 'good', 'Đúng rồi! Điện rất nguy hiểm, để người lớn làm nhé.', ['responsibility']),
        opt('dua-sac', 'Mang dây sạc đưa cho mẹ', 'ok', 'Con biết giúp mẹ rồi. Cắm điện thì để mẹ làm nhé.', ['kindness', 'responsibility']),
        opt('treo-ghe', 'Trèo lên ghế để tự cắm', 'poor', 'Trèo ghế dễ ngã, còn cắm điện có thể bị giật. Nhờ người lớn nhé.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Đi chơi ở bãi biển, sóng to và có cờ đỏ cấm tắm. Các bạn vẫn muốn ra xa. Con sẽ làm gì?',
      explanation: 'Làm theo biển báo và lời người lớn khi vui chơi ở nơi có nước.',
      options: [
        opt('o-bo-khuyen', 'Ở trên bờ chơi cát và khuyên các bạn đừng ra', 'good', 'Rất khôn ngoan! Cờ đỏ nghĩa là sóng rất nguy hiểm.', ['responsibility', 'kindness']),
        opt('choi-mep-nuoc', 'Chỉ chơi ở mép nước cạnh bố mẹ', 'ok', 'Có bố mẹ bên cạnh là tốt, nhưng cờ đỏ là không nên xuống nước.', ['responsibility']),
        opt('ra-xa', 'Ra xa cùng các bạn cho vui', 'poor', 'Sóng to có thể cuốn trôi con. Cờ đỏ là tuyệt đối không xuống nước.'),
      ],
    },
  ],
}

export default bank
