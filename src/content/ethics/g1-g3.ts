/**
 * Ngân hàng tình huống Đạo đức lớp 1-3.
 *
 * Mọi mục đều là thể loại `scenario`: KHÔNG có đáp án đúng/sai, chỉ có ba mức
 * `good` / `ok` / `poor` kèm lời phản hồi giải thích vì sao. Lựa chọn `poor`
 * không trừ máu trong trận đấu - trẻ chỉ mất lượt và được giải thích lại.
 */

import { opt, type Bank } from '../bank'

const bank: Bank = {
  // =========================================================================
  // LỚP 1
  // =========================================================================

  'ethics.g1.yeu-thuong-gia-dinh': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Bà đang xách một túi rau nặng từ chợ về. Con sẽ làm gì?',
      explanation: 'Quan tâm tới người thân bằng những việc nhỏ hằng ngày chính là yêu thương gia đình.',
      options: [
        opt('giup', 'Chạy ra xách giúp bà một phần', 'good', 'Đúng rồi! Việc nhỏ thôi nhưng bà sẽ rất vui vì thấy con biết quan tâm.', ['kindness', 'responsibility']),
        opt('mo-cua', 'Chạy ra mở cửa cho bà vào nhà', 'ok', 'Mở cửa cũng là quan tâm rồi. Nếu xách giúp bà nữa thì còn tốt hơn.', ['kindness']),
        opt('mac-ke', 'Cứ ngồi xem tivi, bà tự xách được mà', 'poor', 'Bà đã lớn tuổi và túi rau thì nặng. Con thử nghĩ xem bà sẽ cảm thấy thế nào nhé.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Mẹ đi làm về trông rất mệt. Con sẽ làm gì?',
      explanation: 'Nhận ra người thân đang mệt và chia sẻ với họ là biểu hiện của tình yêu thương.',
      options: [
        opt('rot-nuoc', 'Rót cho mẹ cốc nước và hỏi mẹ có mệt không', 'good', 'Rất tốt! Một cốc nước và một câu hỏi quan tâm làm mẹ ấm lòng ngay.', ['kindness']),
        opt('choi-yen', 'Chơi thật yên lặng để mẹ nghỉ', 'ok', 'Giữ yên lặng cho mẹ nghỉ cũng là quan tâm. Hỏi han mẹ một câu nữa thì trọn vẹn hơn.', ['respect']),
        opt('doi-choi', 'Chạy tới đòi mẹ dẫn đi chơi ngay', 'poor', 'Mẹ đang rất mệt. Con thử đợi mẹ nghỉ một lát rồi hãy xin nhé.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Em trai con làm hỏng món đồ chơi con rất thích. Em đang khóc vì sợ. Con sẽ làm gì?',
      explanation: 'Trong gia đình, tình cảm anh chị em quan trọng hơn một món đồ chơi.',
      options: [
        opt('an-ui', 'Dỗ em nín rồi cùng em tìm cách sửa lại', 'good', 'Con thật rộng lượng! Em sẽ nhớ mãi và càng quý con hơn.', ['kindness', 'responsibility']),
        opt('buon-nhung-tha', 'Buồn nhưng nói "thôi không sao đâu" rồi đi chỗ khác', 'ok', 'Không trách em là tốt rồi. Nếu dỗ em nín nữa thì em sẽ bớt sợ hẳn.', ['kindness']),
        opt('mang-em', 'Mắng em thật to cho em chừa', 'poor', 'Em đang sợ và đã khóc rồi. Mắng em chỉ làm em sợ con hơn chứ đồ chơi cũng không lành lại.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 3,
      prompt: 'Cả nhà đang ăn cơm, con thấy món con ghét nhất. Bà là người nấu món đó. Con sẽ làm gì?',
      explanation: 'Không thích một món ăn là chuyện bình thường, nhưng cách nói ra thì thể hiện con có tôn trọng người nấu hay không.',
      options: [
        opt('an-it', 'Ăn một ít và nói "cháu cảm ơn bà đã nấu cơm"', 'good', 'Rất khéo! Con vừa giữ được phép lịch sự vừa không làm bà buồn.', ['respect', 'kindness']),
        opt('noi-nhe', 'Nói nhỏ với mẹ là con không thích món này', 'ok', 'Nói riêng thì hơn là nói to trước mặt bà. Nếu ăn thử một chút nữa thì bà sẽ vui hơn.', ['respect']),
        opt('che-bai', 'Kêu to "món này dở quá, con không ăn đâu!"', 'poor', 'Bà đã mất công nấu cho cả nhà. Chê to như vậy làm bà rất buồn - con thử nói cách khác xem.'),
      ],
    },
  ],

  'ethics.g1.gon-gang-ngan-nap': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con vừa chơi xong, đồ chơi vương vãi khắp sàn nhà. Đã đến giờ đi ngủ. Con sẽ làm gì?',
      explanation: 'Dọn đồ chơi sau khi chơi là thói quen tốt, giúp nhà cửa gọn gàng và đồ chơi không bị mất.',
      options: [
        opt('don-het', 'Cất hết đồ chơi vào hộp rồi mới đi ngủ', 'good', 'Tốt lắm! Mai con sẽ tìm đồ chơi rất nhanh vì biết chúng ở đâu.', ['responsibility']),
        opt('don-mot-nua', 'Cất những món to, còn món nhỏ để mai dọn', 'ok', 'Cũng đỡ bừa rồi. Nhưng món nhỏ dễ bị giẫm gãy hoặc thất lạc lắm đấy.', ['responsibility']),
        opt('de-me-don', 'Đi ngủ luôn, mai mẹ dọn hộ', 'poor', 'Đồ chơi là của con nên con dọn mới đúng. Mẹ cũng cần được nghỉ ngơi nữa.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Sáng mai con phải đi học sớm. Tối nay con nên làm gì với cặp sách?',
      explanation: 'Soạn sách vở từ tối hôm trước giúp sáng hôm sau không cuống và không quên đồ.',
      options: [
        opt('soan-truoc', 'Soạn đủ sách vở theo thời khoá biểu ngay tối nay', 'good', 'Rất chủ động! Sáng mai con sẽ thong thả và không quên sách.', ['responsibility', 'perseverance']),
        opt('kiem-tra', 'Xem qua thời khoá biểu rồi để sáng mai soạn', 'ok', 'Có xem trước là tốt. Nhưng sáng sớm hay vội, dễ sót sách lắm.', ['responsibility']),
        opt('de-sang', 'Không cần, sáng dậy soạn cũng kịp', 'poor', 'Sáng sớm thường rất vội. Con thử soạn trước một lần xem có nhẹ nhàng hơn không nhé.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 3,
      prompt: 'Góc học tập của con đang rất bừa bộn. Con chỉ có 10 phút trước khi đi chơi với bạn. Con sẽ làm gì?',
      explanation: 'Ngăn nắp không cần nhiều thời gian - quan trọng là làm ngay thay vì để dồn lại.',
      options: [
        opt('don-nhanh', 'Dùng 10 phút dọn phần bừa nhất rồi mới đi chơi', 'good', 'Rất giỏi! Dọn từng chút một mỗi ngày thì bàn học không bao giờ bừa quá.', ['responsibility', 'perseverance']),
        opt('hen-toi', 'Đi chơi trước và tự hứa tối về sẽ dọn', 'ok', 'Có kế hoạch là tốt, miễn là tối về con nhớ làm thật. Lời hứa với chính mình cũng phải giữ.', ['honesty']),
        opt('bo-qua', 'Kệ đấy, bừa cũng có sao đâu', 'poor', 'Bàn bừa làm con mất thời gian tìm đồ và khó tập trung học. Thử dọn xem con sẽ thấy dễ chịu hơn.'),
      ],
    },
  ],

  'ethics.g1.le-phep-chao-hoi': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con gặp cô giáo ở ngoài cổng trường vào buổi sáng. Con sẽ làm gì?',
      explanation: 'Chào hỏi là cách thể hiện sự tôn trọng và giúp con được mọi người quý mến.',
      options: [
        opt('chao', 'Dừng lại, khoanh tay chào "Em chào cô ạ"', 'good', 'Rất lễ phép! Cô sẽ rất vui khi thấy con chào.', ['respect']),
        opt('gat-dau', 'Gật đầu chào cô rồi đi tiếp', 'ok', 'Có chào là tốt rồi. Nói thành lời thì lễ phép hơn nữa.', ['respect']),
        opt('lo-di', 'Giả vờ không thấy rồi đi thẳng', 'poor', 'Cô đã nhìn thấy con đấy. Một câu chào rất nhanh thôi mà làm cô vui cả buổi.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Bạn cho con mượn cục tẩy. Con sẽ nói gì khi trả lại?',
      explanation: 'Cảm ơn khi được giúp đỡ là phép lịch sự cơ bản, dù chỉ là việc rất nhỏ.',
      options: [
        opt('cam-on', 'Trả tẩy và nói "Cảm ơn bạn nhé"', 'good', 'Đúng rồi! Lời cảm ơn làm bạn thấy vui vì đã giúp con.', ['respect', 'kindness']),
        opt('cuoi', 'Trả tẩy và cười với bạn', 'ok', 'Nụ cười cũng thân thiện. Nhưng nói thành lời cảm ơn thì rõ ràng hơn.', ['kindness']),
        opt('de-len-ban', 'Lẳng lặng đặt tẩy lên bàn bạn rồi quay đi', 'poor', 'Bạn sẽ không biết con có hài lòng không. Một câu cảm ơn ngắn thôi là đủ.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 3,
      prompt: 'Con vô tình va vào một bác lớn tuổi ở sân trường. Bác không nói gì, chỉ nhìn con. Con sẽ làm gì?',
      explanation: 'Xin lỗi ngay khi mình làm phiền người khác, không cần đợi ai nhắc.',
      options: [
        opt('xin-loi', 'Dừng lại xin lỗi bác và hỏi bác có sao không', 'good', 'Rất đáng khen! Con vừa xin lỗi vừa quan tâm tới bác.', ['respect', 'responsibility']),
        opt('xin-loi-nhanh', 'Nói nhanh "cháu xin lỗi" rồi chạy tiếp', 'ok', 'Có xin lỗi là tốt. Dừng lại một giây hỏi thăm bác thì chu đáo hơn.', ['respect']),
        opt('chay-tiep', 'Chạy tiếp vì bác có nói gì đâu', 'poor', 'Bác không nói không có nghĩa là bác không thấy phiền. Con thử quay lại xin lỗi xem.'),
      ],
    },
  ],

  'ethics.g1.tu-cham-soc': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con vừa đi chơi ngoài sân về và sắp ăn cơm. Con sẽ làm gì trước?',
      explanation: 'Rửa tay trước khi ăn giúp con không bị đau bụng vì vi khuẩn.',
      options: [
        opt('rua-tay', 'Rửa tay sạch bằng xà phòng rồi mới ăn', 'good', 'Rất tốt! Rửa tay bằng xà phòng giúp con tránh được nhiều bệnh.', ['responsibility']),
        opt('lau-tay', 'Lau tay vào khăn rồi ăn', 'ok', 'Lau tay đỡ bẩn hơn nhưng chưa sạch hẳn. Xà phòng mới rửa trôi được vi khuẩn.', ['responsibility']),
        opt('an-luon', 'Ăn luôn cho nhanh, tay có bẩn lắm đâu', 'poor', 'Tay nhìn sạch nhưng vẫn còn vi khuẩn. Chỉ mất một phút rửa tay thôi mà.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Đã 10 giờ đêm, con vẫn muốn xem nốt một tập phim hoạt hình. Mai con phải đi học. Con sẽ làm gì?',
      explanation: 'Ngủ đủ giấc giúp con tỉnh táo và học tốt hơn ngày hôm sau.',
      options: [
        opt('di-ngu', 'Tắt tivi đi ngủ, để mai xem tiếp', 'good', 'Con biết tự chăm sóc bản thân rồi đấy! Ngủ đủ thì mai học mới vào.', ['responsibility', 'perseverance']),
        opt('xem-nhanh', 'Xem nốt 5 phút rồi đi ngủ ngay', 'ok', 'Biết tự đặt giới hạn là tốt, miễn là con giữ đúng 5 phút thật.', ['honesty']),
        opt('xem-het', 'Xem hết tập phim, thiếu ngủ một hôm không sao', 'poor', 'Thiếu ngủ làm con mệt và khó tập trung cả ngày mai. Phim thì mai xem vẫn còn mà.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 3,
      prompt: 'Con thấy hơi đau bụng nhưng đang chơi rất vui với các bạn. Con sẽ làm gì?',
      explanation: 'Lắng nghe cơ thể và nói với người lớn khi thấy khác thường là cách tự bảo vệ mình.',
      options: [
        opt('noi-nguoi-lon', 'Nói với bố mẹ hoặc cô giáo về việc mình đau bụng', 'good', 'Rất đúng! Người lớn cần biết để giúp con kịp thời.', ['responsibility', 'honesty']),
        opt('nghi-mot-chut', 'Ngồi nghỉ một lát xem có đỡ không', 'ok', 'Nghỉ ngơi là hợp lí. Nhưng nếu vẫn đau thì phải nói với người lớn ngay nhé.', ['responsibility']),
        opt('giau', 'Giấu đi và chơi tiếp cho vui', 'poor', 'Giấu bệnh có thể khiến con đau nặng hơn. Nói ra không có gì đáng ngại đâu.'),
      ],
    },
  ],

  'ethics.g1.an-toan-vui-choi': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Quả bóng của con lăn ra giữa lòng đường có nhiều xe qua lại. Con sẽ làm gì?',
      explanation: 'Không bao giờ chạy ra đường để nhặt đồ - tính mạng quan trọng hơn mọi món đồ.',
      options: [
        opt('nho-nguoi-lon', 'Gọi người lớn ra nhặt giúp', 'good', 'Hoàn toàn đúng! Không món đồ nào quan trọng bằng sự an toàn của con.', ['responsibility']),
        opt('cho-vang-xe', 'Đứng đợi thật lâu cho vắng xe rồi mới ra', 'ok', 'Biết chờ là tốt, nhưng xe có thể bất ngờ tới. Nhờ người lớn vẫn an toàn nhất.', ['responsibility']),
        opt('chay-ra', 'Chạy thật nhanh ra nhặt rồi chạy vào', 'poor', 'Rất nguy hiểm! Xe không kịp phanh đâu. Con hãy nhờ người lớn nhé.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Các bạn rủ con leo lên nóc nhà xe của trường để lấy quả cầu bị mắc. Con sẽ làm gì?',
      explanation: 'Biết từ chối những trò nguy hiểm, kể cả khi bạn bè rủ rê.',
      options: [
        opt('bao-bac-bao-ve', 'Từ chối và rủ các bạn đi báo bác bảo vệ', 'good', 'Con vừa giữ an toàn cho mình vừa giúp cả nhóm. Rất bản lĩnh!', ['responsibility', 'kindness']),
        opt('tu-choi', 'Không leo nhưng cũng không nói gì với ai', 'ok', 'Con đã tự giữ an toàn. Nếu ngăn bạn nữa thì các bạn cũng được an toàn.', ['responsibility']),
        opt('leo-cung', 'Leo lên cùng các bạn cho vui', 'poor', 'Ngã từ trên cao rất nguy hiểm. Quả cầu có thể nhờ người lớn lấy giúp mà.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 3,
      prompt: 'Một người lạ nói là bạn của bố, bảo sẽ chở con về nhà sau giờ học. Bố không hề nhắc trước. Con sẽ làm gì?',
      explanation: 'Không bao giờ đi theo người lạ, dù họ nói quen bố mẹ. Luôn hỏi lại người lớn mình tin tưởng.',
      options: [
        opt('bao-co-giao', 'Từ chối, vào báo cô giáo và nhờ cô gọi cho bố mẹ', 'good', 'Hoàn toàn đúng! Đây là cách xử lí an toàn nhất.', ['responsibility']),
        opt('doi-bo', 'Nói "cháu đợi bố" rồi đứng yên ở cổng trường', 'ok', 'Không đi theo là đúng. Nhưng vào báo cô giáo thì con được người lớn bảo vệ tốt hơn.', ['responsibility']),
        opt('di-theo', 'Đi theo vì người đó nói là bạn của bố', 'poor', 'Ai cũng có thể nói như vậy. Con phải hỏi lại bố mẹ hoặc cô giáo trước đã.'),
      ],
    },
  ],

  // =========================================================================
  // LỚP 2
  // =========================================================================

  // =========================================================================
  // LỚP 3
  // =========================================================================

  'ethics.g3.giu-loi-hua': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con đã hứa cho bạn mượn truyện vào thứ hai. Sáng thứ hai con lại muốn đọc nốt. Con sẽ làm gì?',
      explanation: 'Đã hứa thì phải giữ, dù sau đó con đổi ý.',
      options: [
        opt('giu-loi', 'Đưa truyện cho bạn đúng như đã hứa', 'good', 'Rất đáng tin! Bạn sẽ luôn tin lời con nói.', ['honesty', 'responsibility']),
        opt('xin-hoan', 'Xin lỗi bạn và hỏi bạn có đồng ý cho hoãn một ngày không', 'ok', 'Hỏi ý bạn thì hơn là tự ý đổi. Nhưng bạn có thể đã chờ cả cuối tuần rồi đấy.', ['respect']),
        opt('quen-di', 'Giả vờ quên, hôm sau đưa cũng được', 'poor', 'Bạn sẽ nghĩ lời hứa của con không đáng tin. Lần sau bạn hứa với con, con sẽ cảm thấy thế nào?'),
      ],
    },
    {
      kind: 'scenario', difficulty: 3,
      prompt: 'Con lỡ hứa với hai bạn hai việc vào cùng một giờ chiều nay. Con sẽ làm gì?',
      explanation: 'Khi không thể giữ cả hai lời hứa, điều tử tế nhất là báo sớm và sắp xếp lại.',
      options: [
        opt('bao-som', 'Báo ngay cho một bạn, xin lỗi và hẹn lại giờ khác', 'good', 'Rất có trách nhiệm! Báo sớm để bạn còn kịp sắp xếp là cách xử lí tốt nhất.', ['honesty', 'responsibility']),
        opt('nho-nguoi-khac', 'Nhờ một bạn khác đi thay mình một chỗ', 'ok', 'Sáng tạo đấy, nhưng người kia hẹn con chứ không hẹn bạn ấy. Nên hỏi ý trước.', ['responsibility']),
        opt('im-lang', 'Không nói gì, đến giờ thì đi chỗ nào gần hơn', 'poor', 'Bạn còn lại sẽ chờ mãi không thấy con. Một tin nhắn thôi cũng đỡ hơn nhiều.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Con hứa với mẹ là sẽ học xong bài trước 8 giờ tối. Đến 8 giờ con mới làm được một nửa. Con sẽ làm gì?',
      explanation: 'Khi không giữ được lời hứa, điều quan trọng là nói thật thay vì che giấu.',
      options: [
        opt('noi-that', 'Nói thật với mẹ là con chưa xong và xin thêm 30 phút', 'good', 'Trung thực và chủ động! Mẹ sẽ tin con hơn là khi con giấu.', ['honesty', 'responsibility']),
        opt('lam-tiep-im', 'Lặng lẽ làm tiếp cho xong rồi mới nói với mẹ', 'ok', 'Con vẫn hoàn thành bài, nhưng mẹ đang chờ mà không biết chuyện gì.', ['responsibility']),
        opt('noi-xong-roi', 'Nói với mẹ là đã học xong rồi, mai làm nốt', 'poor', 'Nói dối để giữ hình ảnh còn tệ hơn là lỡ hẹn. Mẹ sẽ buồn vì bị nói dối hơn là vì con chậm.'),
      ],
    },
  ],

  'ethics.g3.hoan-thanh-nhiem-vu': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con được phân công trực nhật lau bảng. Hôm nay con thấy mệt. Con sẽ làm gì?',
      explanation: 'Nhiệm vụ đã nhận thì cố gắng hoàn thành, hoặc nhờ người khác giúp một cách đàng hoàng.',
      options: [
        opt('lam-xong', 'Cố gắng lau xong rồi mới nghỉ', 'good', 'Rất có trách nhiệm! Cả lớp có bảng sạch để học là nhờ con.', ['responsibility', 'perseverance']),
        opt('nho-ban', 'Nhờ bạn lau giúp và hứa hôm sau làm bù cho bạn', 'ok', 'Nhờ giúp khi mệt là hợp lí, miễn là con nhớ làm bù thật.', ['honesty']),
        opt('bo-ve', 'Bỏ về, mai lau cũng được', 'poor', 'Sáng mai cả lớp sẽ phải học với cái bảng bẩn. Nếu mệt thật, con thử nhờ bạn xem.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Nhóm con làm bài tập chung, nhưng hai bạn kia chưa làm phần của mình và mai phải nộp. Con sẽ làm gì?',
      explanation: 'Làm việc nhóm cần nhắc nhau chứ không phải một người ôm hết hoặc bỏ mặc.',
      options: [
        opt('nhac-nhom', 'Nhắn nhắc hai bạn và đề nghị cùng làm nốt tối nay', 'good', 'Đúng cách! Nhắc nhau là trách nhiệm của cả nhóm, không phải mách cô.', ['responsibility', 'kindness']),
        opt('lam-het', 'Tự làm hết phần của các bạn cho kịp', 'ok', 'Con giữ được bài nộp đúng hạn, nhưng các bạn sẽ không học được gì và lần sau lại thế.', ['responsibility']),
        opt('bao-co-ngay', 'Báo ngay với cô là hai bạn không làm', 'poor', 'Chưa nhắc bạn mà đã báo cô thì hơi vội. Thử nói với bạn một lần trước đã.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 3,
      prompt: 'Con được giao làm nhóm trưởng nhưng chưa biết phải bắt đầu từ đâu. Hạn nộp còn ba ngày. Con sẽ làm gì?',
      explanation: 'Nhận nhiệm vụ khó thì hỏi và chia việc, chứ không ôm một mình rồi bỏ dở.',
      options: [
        opt('hoi-va-chia', 'Hỏi cô cách làm rồi họp nhóm chia việc cho từng bạn', 'good', 'Rất bản lĩnh! Nhóm trưởng giỏi là người biết hỏi và biết chia việc.', ['responsibility', 'perseverance']),
        opt('tu-mo', 'Tự mò mẫm làm trước rồi tính tiếp', 'ok', 'Chủ động là tốt. Nhưng hỏi một câu có thể tiết kiệm cho con cả buổi loay hoay.', ['perseverance']),
        opt('tra-lai', 'Xin cô đổi cho bạn khác làm nhóm trưởng', 'poor', 'Chưa thử đã trả lại thì con mất cơ hội học điều mới. Thử hỏi cô cách làm trước đã.'),
      ],
    },
  ],

  'ethics.g3.xu-ly-bat-hoa': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Bạn vô tình làm đổ nước vào vở của con. Con rất bực. Con sẽ làm gì?',
      explanation: 'Bình tĩnh nói ra cảm xúc tốt hơn nhiều so với nổi nóng.',
      options: [
        opt('noi-binh-tinh', 'Hít thở sâu rồi nói "Mình buồn vì vở bị ướt, bạn giúp mình lau nhé"', 'good', 'Rất bản lĩnh! Nói ra cảm xúc mà không làm tổn thương bạn là kỹ năng rất khó.', ['respect', 'kindness']),
        opt('im-lang', 'Im lặng, tự lau vở và không nói gì', 'ok', 'Không cãi nhau là tốt. Nhưng giữ bực trong lòng lâu cũng mệt, con nên nói ra.', ['respect']),
        opt('hat-lai', 'Hất đổ nước vào vở bạn cho công bằng', 'poor', 'Bây giờ cả hai đều mất vở và mất cả tình bạn. Bạn cũng chỉ vô tình thôi mà.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 3,
      prompt: 'Hai bạn thân của con đang cãi nhau và cả hai đều kéo con về phe mình. Con sẽ làm gì?',
      explanation: 'Không cần chọn phe - giúp hai bên nói chuyện với nhau mới là cách giải quyết.',
      options: [
        opt('lam-cau-noi', 'Không chọn phe, đề nghị cả hai ngồi lại nói rõ chuyện', 'good', 'Rất chín chắn! Con giữ được cả hai tình bạn và giúp các bạn hoà lại.', ['respect', 'kindness']),
        opt('trung-lap', 'Nói với cả hai là mình không muốn dính vào', 'ok', 'Không chọn phe là đúng. Nhưng nếu giúp các bạn nói chuyện thì tốt hơn nhiều.', ['respect']),
        opt('chon-phe', 'Chọn bênh bạn thân hơn', 'poor', 'Con sẽ mất một người bạn và mâu thuẫn càng to. Thử làm cầu nối xem sao.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Bạn thân hiểu nhầm là con nói xấu bạn sau lưng và đang không nói chuyện với con. Con sẽ làm gì?',
      explanation: 'Hiểu nhầm chỉ tan khi có người chịu nói ra trước.',
      options: [
        opt('noi-ro', 'Chủ động gặp bạn, hỏi bạn nghe được gì và giải thích rõ', 'good', 'Rất chín chắn! Nói thẳng và bình tĩnh là cách nhanh nhất gỡ hiểu nhầm.', ['honesty', 'respect']),
        opt('nho-ban-khac', 'Nhờ một bạn khác nói giúp cho bạn ấy hiểu', 'ok', 'Cũng là một cách. Nhưng qua người thứ ba thì lời dễ bị lệch thêm.', ['kindness']),
        opt('gian-lai', 'Giận lại và cũng không thèm nói chuyện với bạn', 'poor', 'Cả hai cùng im lặng thì hiểu nhầm sẽ kéo dài mãi. Ai nói trước cũng được, sao không phải là con?'),
      ],
    },
  ],

  'ethics.g3.quan-tam-hang-xom': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Bác hàng xóm đi vắng, trời đổ mưa to mà quần áo bác vẫn phơi ngoài sân. Con sẽ làm gì?',
      explanation: 'Quan tâm hàng xóm bằng những việc nhỏ tạo nên tình làng nghĩa xóm.',
      options: [
        opt('goi-nguoi-lon', 'Báo bố mẹ để cùng cất giúp quần áo cho bác', 'good', 'Rất tinh ý! Bác sẽ rất cảm động khi về nhà.', ['kindness', 'citizenship']),
        opt('goi-dien', 'Nhờ bố mẹ gọi điện báo cho bác biết trời mưa', 'ok', 'Báo cho bác cũng tốt, nhưng bác ở xa thì quần áo vẫn ướt mất rồi.', ['kindness']),
        opt('ke', 'Không phải việc của mình', 'poor', 'Chỉ mất vài phút mà giúp bác đỡ một việc lớn. Nếu nhà mình như thế thì sao nhỉ?'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Nhà con đang mở nhạc rất to lúc 10 giờ đêm. Nhà bên có em bé nhỏ. Con sẽ làm gì?',
      explanation: 'Sống cùng khu dân cư thì phải để ý tới sự yên tĩnh của người xung quanh.',
      options: [
        opt('vat-nho', 'Đề nghị bố mẹ vặn nhỏ nhạc lại vì nhà bên có em bé', 'good', 'Con biết nghĩ cho người khác - đó là nếp sống văn minh.', ['respect', 'citizenship']),
        opt('dong-cua', 'Đóng chặt cửa sổ lại cho đỡ ồn', 'ok', 'Có suy nghĩ rồi đấy. Nhưng vặn nhỏ vẫn hiệu quả hơn đóng cửa.', ['respect']),
        opt('ke-tiep', 'Nhà mình thì mình mở, ai muốn ngủ thì đóng cửa lại', 'poor', 'Tiếng ồn khuya làm em bé và cả người lớn không ngủ được. Thử đặt mình vào vị trí họ xem.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 3,
      prompt: 'Bác hàng xóm hay gắt gỏng và từng mắng con vì đá bóng vào sân nhà bác. Hôm nay bác bị ngã xe trước cổng. Con sẽ làm gì?',
      explanation: 'Giúp người đang gặp nạn không phụ thuộc vào việc họ đối xử với mình thế nào trước đó.',
      options: [
        opt('giup-bac', 'Chạy tới hỏi bác có sao không và gọi người lớn tới giúp', 'good', 'Rất nhân hậu! Giúp người lúc hoạn nạn quan trọng hơn chuyện cũ.', ['kindness', 'citizenship']),
        opt('goi-nguoi', 'Chạy về gọi bố mẹ ra giúp bác', 'ok', 'Gọi người lớn là đúng. Nếu hỏi bác một câu trước khi chạy đi thì bác đỡ hoảng hơn.', ['kindness']),
        opt('lo-di', 'Đi tiếp, bác từng mắng mình mà', 'poor', 'Bác đang bị ngã và cần giúp ngay. Chuyện cũ để nói sau, bây giờ là lúc giúp người.'),
      ],
    },
  ],

  'ethics.g3.ham-hoc-hoi': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Cô giảng một chỗ mà con chưa hiểu. Cả lớp có vẻ đã hiểu hết. Con sẽ làm gì?',
      explanation: 'Hỏi khi chưa hiểu không có gì đáng xấu hổ - đó là cách nhanh nhất để tiến bộ.',
      options: [
        opt('gio-tay-hoi', 'Giơ tay hỏi lại cô ngay', 'good', 'Rất dũng cảm! Chắc chắn còn bạn khác cũng chưa hiểu và cảm ơn con đấy.', ['perseverance', 'honesty']),
        opt('hoi-ban', 'Đợi ra chơi rồi hỏi lại bạn', 'ok', 'Hỏi bạn cũng là một cách. Nhưng cô giảng thì chính xác hơn.', ['perseverance']),
        opt('gat-dau', 'Gật đầu như đã hiểu cho khỏi ngại', 'poor', 'Chỗ chưa hiểu sẽ theo con tới bài sau và càng khó hơn. Hỏi một câu thôi mà.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Con đọc một cuốn sách và gặp từ mới không biết nghĩa. Con sẽ làm gì?',
      explanation: 'Chủ động tra cứu khi gặp điều chưa biết là thói quen của người ham học.',
      options: [
        opt('tra-tu-dien', 'Tra từ điển hoặc hỏi người lớn để biết nghĩa', 'good', 'Đúng là người ham học! Mỗi từ mới làm vốn từ của con giàu thêm.', ['perseverance']),
        opt('doan-nghia', 'Đoán nghĩa dựa vào câu rồi đọc tiếp', 'ok', 'Đoán theo ngữ cảnh là kỹ năng tốt. Nhưng nên kiểm tra lại xem đoán có đúng không.', ['perseverance']),
        opt('bo-qua', 'Bỏ qua, không biết cũng chẳng sao', 'poor', 'Bỏ qua nhiều từ thì càng về sau càng khó hiểu bài. Tra một lần là nhớ luôn đấy.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 3,
      prompt: 'Con xem một video hướng dẫn gấp máy bay giấy nhưng làm mãi không giống. Con sẽ làm gì?',
      explanation: 'Người ham học không dừng ở một cách - họ thử cách khác cho đến khi hiểu.',
      options: [
        opt('xem-cham', 'Xem lại video thật chậm từng bước và làm theo từng bước một', 'good', 'Đúng cách! Chia nhỏ ra và làm chậm là bí quyết học điều mới.', ['perseverance']),
        opt('tim-cach-khac', 'Tìm một video khác hoặc hỏi bạn đã biết gấp', 'ok', 'Tìm nguồn khác cũng là một cách học. Nhưng thử lại chậm một lần nữa thường đã đủ.', ['perseverance']),
        opt('bo', 'Bỏ, chắc mình không khéo tay', 'poor', 'Không ai làm đúng ngay lần đầu đâu. Thử xem lại thật chậm một lần xem sao.'),
      ],
    },
  ],
}

export default bank
