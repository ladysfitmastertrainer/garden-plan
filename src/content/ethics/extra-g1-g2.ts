/**
 * Tình huống Đạo đức BỔ SUNG, lớp 1-2.
 *
 * Vì sao có file này: mỗi kỹ năng ban đầu chỉ có ba câu, mỗi bậc khó đúng một
 * câu - mà trẻ mới vào chủ yếu nhận câu bậc 1. Nên với một em lớp 1, mỗi kỹ năng
 * thực chất chỉ có MỘT tình huống, và đánh hai ba con quái là gặp lại y nguyên.
 *
 * Mỗi kỹ năng thêm ba tình huống: HAI câu bậc 1 (chỗ thiếu nhất) và một câu bậc
 * 2. Cùng quy ước với ngân hàng gốc: không đúng/sai, chỉ tốt / tạm / chưa tốt,
 * lựa chọn chưa tốt không bao giờ gắn phẩm chất. Thứ tự ba lựa chọn được trộn
 * lúc hỏi, nên lựa chọn tốt không phải lúc nào cũng là câu dài nhất.
 *
 * Gộp NỐI vào ngân hàng gốc chứ không đè - xem `mergeBanks` trong `registry.ts`.
 */

import { opt, type Bank } from '../bank'

const bank: Bank = {
  // =========================================================================
  // LỚP 1
  // =========================================================================

  'ethics.g1.yeu-thuong-gia-dinh': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Ông bị đau lưng, đang ngồi nghỉ trên ghế. Con sẽ làm gì?',
      explanation: 'Để ý khi người thân không khoẻ và làm một việc nhỏ giúp họ là yêu thương gia đình.',
      options: [
        opt('dam-lung', 'Hỏi ông có đau không và đấm lưng nhẹ cho ông', 'good', 'Ông sẽ thấy đỡ mỏi và rất vui vì cháu biết quan tâm.', ['kindness']),
        opt('noi-nho', 'Nói nhỏ lại để ông được nghỉ', 'ok', 'Giữ yên cho ông nghỉ là tốt. Hỏi han ông một câu nữa thì ông càng vui.', ['respect']),
        opt('keo-ong', 'Kéo ông dậy chơi trốn tìm cùng', 'poor', 'Ông đang đau lưng, chạy nhảy sẽ làm ông đau thêm. Con chờ ông khoẻ đã nhé.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Hôm nay là sinh nhật mẹ nhưng con không có tiền mua quà. Con sẽ làm gì?',
      explanation: 'Món quà quý nhất với người thân là tấm lòng, không phải giá tiền.',
      options: [
        opt('ve-thiep', 'Tự vẽ một tấm thiệp và chúc mừng mẹ', 'good', 'Tấm thiệp do chính tay con làm là món quà mẹ sẽ giữ rất lâu.', ['kindness']),
        opt('om-me', 'Ôm mẹ và nói "Con chúc mẹ sinh nhật vui vẻ"', 'ok', 'Một cái ôm thật ấm áp. Thêm một việc nhỏ tự tay làm thì càng đặc biệt.', ['kindness']),
        opt('thoi-khoi', 'Thôi, không có quà thì không cần chúc', 'poor', 'Mẹ không cần quà đắt tiền đâu. Chỉ một lời chúc thôi cũng làm mẹ vui cả ngày.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Em gái con muốn chơi cùng nhưng con đang xem phim hoạt hình rất hay. Con sẽ làm gì?',
      explanation: 'Anh chị em trong nhà biết nhường nhịn và dành thời gian cho nhau thì gia đình mới vui.',
      options: [
        opt('xem-cung', 'Rủ em cùng xem, xem xong hai anh em cùng chơi', 'good', 'Vừa trọn bộ phim vừa có em chơi cùng - cả hai đều vui!', ['kindness', 'responsibility']),
        opt('hen-em', 'Bảo em đợi một lát, hết phim sẽ chơi', 'ok', 'Hẹn em là được, miễn là hết phim con nhớ giữ lời với em.', ['honesty']),
        opt('duoi-em', 'Đuổi em ra chỗ khác cho yên', 'poor', 'Em chỉ muốn được chơi với con thôi. Bị đuổi, em sẽ rất buồn.'),
      ],
    },
  ],

  'ethics.g1.gon-gang-ngan-nap': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con vừa đi học về, cởi giày dép ở cửa. Con sẽ để giày dép thế nào?',
      explanation: 'Để đồ đúng chỗ giúp nhà gọn gàng và lần sau tìm rất nhanh.',
      options: [
        opt('cat-ke', 'Xếp gọn lên kệ giày', 'good', 'Gọn gàng quá! Mai đi học con lấy ngay, không phải tìm.', ['responsibility']),
        opt('de-sat-tuong', 'Để sát vào tường cho khỏi vướng lối đi', 'ok', 'Không vướng lối đi là tốt rồi. Cất lên kệ thì còn gọn hơn nữa.', ['responsibility']),
        opt('vut-lung-tung', 'Cởi ra để luôn giữa cửa rồi chạy vào', 'poor', 'Giày để giữa cửa dễ làm người khác vấp ngã đấy.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con vẽ tranh xong, bút màu nằm rải rác trên bàn. Con sẽ làm gì?',
      explanation: 'Dùng xong cất lại ngay là thói quen gọn gàng dễ làm nhất.',
      options: [
        opt('cat-hop', 'Cất bút màu vào hộp, lau bàn cho sạch', 'good', 'Tuyệt! Lần sau vẽ con không bị thiếu cây màu nào.', ['responsibility']),
        opt('gom-mot-cho', 'Gom bút lại một góc bàn', 'ok', 'Gom lại là đỡ bừa rồi. Cất vào hộp thì bút không bị lăn rơi mất.', ['responsibility']),
        opt('de-nguyen', 'Để nguyên đấy, mai vẽ tiếp', 'poor', 'Bút để bừa dễ rơi, gãy hoặc thất lạc. Cất đi chỉ mất một chút thôi.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Tủ quần áo của con lộn xộn, sáng nào tìm áo cũng lâu. Con sẽ làm gì?',
      explanation: 'Sắp xếp đồ đạc theo từng loại giúp con tự lo cho mình và tiết kiệm thời gian.',
      options: [
        opt('xep-theo-loai', 'Nhờ mẹ chỉ cách, rồi tự xếp áo, quần thành từng chồng riêng', 'good', 'Giỏi quá! Từ nay sáng nào con cũng lấy áo trong nháy mắt.', ['responsibility', 'perseverance']),
        opt('nho-me-xep', 'Nhờ mẹ xếp lại giúp', 'ok', 'Nhờ mẹ cũng được, nhưng nếu con tự làm thì con sẽ biết đồ ở đâu.', ['responsibility']),
        opt('lay-dai', 'Kệ, cứ lấy đại cái áo nào ở trên cùng', 'poor', 'Lấy đại thì tủ càng lúc càng rối, và có hôm con sẽ mặc nhầm đồ đấy.'),
      ],
    },
  ],

  'ethics.g1.le-phep-chao-hoi': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Có khách đến nhà chơi, con đang ở trong phòng. Con sẽ làm gì?',
      explanation: 'Chào hỏi khách khi đến nhà là phép lịch sự cơ bản.',
      options: [
        opt('ra-chao', 'Ra khoanh tay chào khách', 'good', 'Rất lễ phép! Khách sẽ khen bố mẹ dạy con ngoan.', ['respect']),
        opt('chao-trong-phong', 'Nói vọng ra "Cháu chào bác ạ"', 'ok', 'Có chào là tốt rồi. Ra tận nơi chào thì lịch sự hơn nhiều.', ['respect']),
        opt('o-trong-phong', 'Ở luôn trong phòng, không ra', 'poor', 'Khách có thể nghĩ con không vui khi họ đến. Ra chào một câu nhé.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Bạn cho con mượn cục tẩy. Con sẽ nói gì?',
      explanation: 'Khi được giúp đỡ, dù là việc nhỏ, con hãy nói lời cảm ơn.',
      options: [
        opt('cam-on', '"Cảm ơn bạn nhé!"', 'good', 'Đúng rồi! Lời cảm ơn làm bạn vui và muốn giúp con lần sau.', ['respect', 'kindness']),
        opt('gat-dau', 'Gật đầu rồi dùng luôn', 'ok', 'Bạn hiểu con biết ơn, nhưng nói ra thành lời thì tốt hơn.', ['respect']),
        opt('im-lang', 'Cầm lấy và không nói gì', 'poor', 'Bạn đã giúp con mà. Chỉ cần nói "cảm ơn" thôi, dễ lắm.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Con chạy vội trong hành lang và va vào một cô giáo làm rơi sách. Con sẽ làm gì?',
      explanation: 'Làm phiền người khác thì xin lỗi ngay và giúp khắc phục.',
      options: [
        opt('xin-loi-nhat', 'Dừng lại xin lỗi cô và nhặt sách giúp cô', 'good', 'Rất đáng khen! Biết nhận lỗi và sửa ngay là người lịch sự.', ['respect', 'responsibility']),
        opt('xin-loi-chay', 'Nói "con xin lỗi cô" rồi chạy tiếp', 'ok', 'Xin lỗi là đúng, nhưng giúp cô nhặt sách thì mới trọn vẹn.', ['respect']),
        opt('chay-luon', 'Chạy luôn vì sợ bị mắng', 'poor', 'Cô sẽ buồn hơn nếu con bỏ chạy. Dừng lại xin lỗi thì cô sẽ thông cảm.'),
      ],
    },
  ],

  'ethics.g1.tu-cham-soc': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con vừa chơi ngoài sân về, tay lấm đầy đất, và đã đến giờ ăn cơm. Con sẽ làm gì?',
      explanation: 'Rửa tay bằng xà phòng trước khi ăn giúp con không bị đau bụng vì vi khuẩn.',
      options: [
        opt('rua-xa-phong', 'Rửa tay bằng xà phòng rồi mới ngồi vào mâm', 'good', 'Tuyệt vời! Đôi tay sạch sẽ giữ cho bụng con khoẻ mạnh.', ['responsibility']),
        opt('rua-nuoc', 'Rửa qua bằng nước cho sạch đất', 'ok', 'Rửa nước thì trôi đất, nhưng vi khuẩn chỉ sạch khi có xà phòng.', ['responsibility']),
        opt('an-luon', 'Ăn luôn cho nóng, tay bẩn một chút không sao', 'poor', 'Vi khuẩn trên tay sẽ theo thức ăn vào bụng, con dễ bị đau bụng lắm.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Đã 9 giờ tối, ngày mai phải đi học nhưng con vẫn muốn chơi tiếp. Con sẽ làm gì?',
      explanation: 'Ngủ đủ giấc giúp con khoẻ và sáng mai tỉnh táo để học.',
      options: [
        opt('di-ngu', 'Cất đồ chơi, đánh răng rồi đi ngủ', 'good', 'Ngoan quá! Ngủ đủ, sáng mai con sẽ thật khoẻ khoắn.', ['responsibility']),
        opt('them-chut', 'Xin chơi thêm năm phút rồi đi ngủ', 'ok', 'Năm phút thì được, miễn là hết giờ con đi ngủ thật nhé.', ['honesty']),
        opt('choi-khuya', 'Chơi tiếp đến khi buồn ngủ thì thôi', 'poor', 'Thức khuya sáng mai con sẽ mệt, ngủ gật trong lớp đấy.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Trời mưa lạnh, mẹ dặn mặc áo khoác nhưng con thấy áo khoác vướng víu. Con sẽ làm gì?',
      explanation: 'Mặc quần áo hợp thời tiết là cách tự bảo vệ sức khoẻ của mình.',
      options: [
        opt('mac-ao', 'Mặc áo khoác vào, nóng quá thì cởi ra cầm tay', 'good', 'Rất biết tự chăm sóc! Con giữ ấm mà vẫn thoải mái.', ['responsibility']),
        opt('mang-theo', 'Không mặc nhưng bỏ áo vào cặp mang theo', 'ok', 'Mang theo là tốt, nhưng nhớ mặc vào khi thấy lạnh nhé.', ['responsibility']),
        opt('khong-mac', 'Không mặc, lạnh một chút cũng chẳng sao', 'poor', 'Bị lạnh dễ ốm lắm, lúc đó con phải nghỉ học đấy.'),
      ],
    },
  ],

  'ethics.g1.an-toan-vui-choi': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Quả bóng lăn ra giữa đường, xe cộ đang qua lại. Con sẽ làm gì?',
      explanation: 'Không bao giờ chạy ra đường khi đang có xe - hãy nhờ người lớn giúp.',
      options: [
        opt('nho-nguoi-lon', 'Đứng yên trên vỉa hè và nhờ người lớn lấy giúp', 'good', 'Rất đúng! An toàn của con quan trọng hơn quả bóng nhiều.', ['responsibility']),
        opt('doi-het-xe', 'Đợi thật lâu đến khi không có xe nào rồi mới ra nhặt', 'ok', 'Có quan sát là tốt, nhưng xe có thể tới bất ngờ. Nhờ người lớn là an toàn nhất.', ['responsibility']),
        opt('chay-ra', 'Chạy ngay ra nhặt kẻo bóng bị xe cán', 'poor', 'Rất nguy hiểm! Quả bóng có thể mua lại, còn con thì không.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Các bạn rủ con ra ao sau nhà tắm, không có người lớn đi cùng. Con sẽ làm gì?',
      explanation: 'Trẻ em không được tự ý tắm ao, hồ, sông khi không có người lớn trông.',
      options: [
        opt('tu-choi', 'Không đi, và khuyên các bạn cũng đừng đi', 'good', 'Rất dũng cảm! Con vừa giữ an toàn cho mình, vừa lo cho bạn.', ['responsibility', 'kindness']),
        opt('o-nha', 'Không đi, ở nhà chơi một mình', 'ok', 'Con đã chọn an toàn. Nếu khuyên bạn hoặc báo người lớn thì còn tốt hơn.', ['responsibility']),
        opt('di-cung', 'Đi cùng, chỉ đứng ở chỗ nông thôi', 'poor', 'Ao có thể trơn và sâu bất ngờ. Không có người lớn thì rất nguy hiểm.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Con thấy một ổ điện bị hở dây trong lớp. Con sẽ làm gì?',
      explanation: 'Thấy điều nguy hiểm, không tự xử lý mà báo ngay cho người lớn.',
      options: [
        opt('bao-co', 'Tránh xa và báo ngay cho cô giáo', 'good', 'Con đã giúp cả lớp an toàn. Cô sẽ gọi người sửa ngay.', ['responsibility', 'citizenship']),
        opt('tranh-xa', 'Tránh xa ổ điện đó ra', 'ok', 'Tránh xa là đúng, nhưng các bạn khác có thể chưa biết. Báo cô nhé.', ['responsibility']),
        opt('lay-que-choc', 'Lấy que chọc thử xem có điện không', 'poor', 'Rất nguy hiểm! Điện có thể giật người qua que ướt. Đừng bao giờ thử nhé.'),
      ],
    },
  ],

  // =========================================================================
  // LỚP 2
  // =========================================================================

  'ethics.g2.ve-dep-que-huong': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Bạn mới chuyển đến hỏi quê con có gì đẹp. Con sẽ làm gì?',
      explanation: 'Biết kể về vẻ đẹp quê mình là con đã yêu và tự hào về quê hương.',
      options: [
        opt('ke-va-dan-di', 'Kể cho bạn nghe và rủ bạn cuối tuần đi xem', 'good', 'Tuyệt! Bạn mới sẽ thấy quê con thật thân thiện.', ['kindness', 'citizenship']),
        opt('ke-mot-chut', 'Kể cho bạn một cảnh đẹp con thích nhất', 'ok', 'Kể được là con đã để ý quê mình rồi đấy.', ['citizenship']),
        opt('chang-co-gi', 'Bảo "quê mình chẳng có gì đẹp cả"', 'poor', 'Quê nào cũng có nét đẹp riêng: cánh đồng, dòng sông, món ăn... Con thử nhìn kỹ xem.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Đi chơi ở cánh đồng hoa quê mình, con thấy hoa rất đẹp. Con sẽ làm gì?',
      explanation: 'Ngắm cảnh đẹp mà không phá là cách giữ gìn vẻ đẹp quê hương.',
      options: [
        opt('ngam-chup', 'Ngắm, chụp ảnh và không hái hoa', 'good', 'Rất văn minh! Hoa còn nguyên cho mọi người cùng ngắm.', ['citizenship', 'respect']),
        opt('hai-mot-bong', 'Hái một bông mang về tặng mẹ', 'ok', 'Tặng mẹ là quý, nhưng hỏi chủ vườn trước nhé - hoa ấy có người trồng.', ['kindness']),
        opt('hai-nhieu', 'Hái thật nhiều bông cho đẹp tay', 'poor', 'Nếu ai cũng hái thì cánh đồng sẽ trụi hết, chẳng còn gì để ngắm.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Cô giao vẽ tranh về quê hương. Con không biết vẽ cảnh gì. Con sẽ làm gì?',
      explanation: 'Quan sát và hỏi người thân giúp con hiểu thêm về quê mình.',
      options: [
        opt('hoi-ong-ba', 'Hỏi ông bà về cảnh đẹp ngày xưa của quê rồi vẽ', 'good', 'Hay quá! Con vừa có tranh đẹp vừa biết thêm chuyện về quê.', ['perseverance', 'citizenship']),
        opt('ve-nha-minh', 'Vẽ ngôi nhà và con đường quen thuộc của mình', 'ok', 'Góc quen thuộc cũng là quê hương đấy. Tốt lắm!', ['citizenship']),
        opt('chep-tranh-ban', 'Chép lại tranh của bạn bên cạnh', 'poor', 'Tranh của bạn là quê của bạn nhìn qua mắt bạn. Con thử vẽ bằng mắt mình nhé.'),
      ],
    },
  ],

  'ethics.g2.em-yeu-que-huong': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Xóm con tổ chức dọn vệ sinh đường làng vào sáng Chủ nhật. Con sẽ làm gì?',
      explanation: 'Góp tay làm đẹp nơi mình sống là việc làm thể hiện tình yêu quê hương.',
      options: [
        opt('tham-gia', 'Xin bố mẹ cho đi cùng, nhặt rác giúp mọi người', 'good', 'Tuyệt vời! Đường làng sạch đẹp có công của con.', ['citizenship', 'responsibility']),
        opt('co-vu', 'Ra xem và mang nước cho các cô chú', 'ok', 'Mang nước cũng là giúp đỡ rồi. Nhặt rác cùng thì càng tốt.', ['kindness']),
        opt('ngu-nuong', 'Ngủ nướng, việc đó của người lớn', 'poor', 'Quê hương là của mọi người, cả trẻ em. Góp một tay thôi cũng quý.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con thấy một bạn bẻ cành cây mới trồng ven đường. Con sẽ làm gì?',
      explanation: 'Giữ gìn cây xanh là giữ gìn quê hương.',
      options: [
        opt('nhac-nho', 'Nhắc bạn nhẹ nhàng: "Cây mới trồng, bạn đừng bẻ nhé"', 'good', 'Con đã bảo vệ cây và giúp bạn hiểu ra. Rất tốt!', ['citizenship', 'kindness']),
        opt('bao-nguoi-lon', 'Không nói gì với bạn nhưng về kể cho người lớn', 'ok', 'Báo người lớn là đúng. Nhắc bạn ngay lúc đó thì cây đỡ bị hỏng hơn.', ['citizenship']),
        opt('be-cung', 'Bẻ cùng bạn cho vui', 'poor', 'Cây non gãy cành thì khó lớn. Quê mình sẽ bớt đi một bóng mát.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Nhà con chuyển lên thành phố. Ông bà vẫn ở quê. Con sẽ làm gì để giữ tình cảm với quê?',
      explanation: 'Yêu quê hương là luôn nhớ về quê và những người thân ở đó.',
      options: [
        opt('goi-dien-ve-que', 'Thường gọi điện cho ông bà và xin bố mẹ về quê dịp nghỉ', 'good', 'Ông bà sẽ rất vui, và quê luôn là nơi con thuộc về.', ['kindness', 'citizenship']),
        opt('xem-anh', 'Hay xem lại ảnh chụp ở quê', 'ok', 'Nhớ quê là tốt. Gọi cho ông bà nữa thì ông bà cũng thấy con nhớ.', ['kindness']),
        opt('quen-luon', 'Ở thành phố vui hơn, không cần nhớ quê nữa', 'poor', 'Quê là nơi có ông bà và kỷ niệm của cả nhà. Đừng để quê buồn nhé.'),
      ],
    },
  ],

  'ethics.g2.kinh-trong-thay-co': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Gặp cô giáo cũ ở chợ, con sẽ làm gì?',
      explanation: 'Dù không còn học, con vẫn nhớ ơn và lễ phép với thầy cô.',
      options: [
        opt('chao-hoi-tham', 'Chạy lại chào cô và hỏi thăm sức khoẻ cô', 'good', 'Cô sẽ rất xúc động vì học trò cũ vẫn nhớ mình.', ['respect', 'kindness']),
        opt('chao-tu-xa', 'Khoanh tay chào cô từ xa', 'ok', 'Chào là lễ phép rồi. Lại gần hỏi thăm thì cô càng vui.', ['respect']),
        opt('lo-di', 'Giả vờ không thấy vì ngại', 'poor', 'Cô đã dạy con cả năm trời. Một lời chào sẽ làm cô vui lắm.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Cô giáo đang giảng bài, bạn ngồi cạnh rủ con nói chuyện. Con sẽ làm gì?',
      explanation: 'Trật tự nghe giảng là cách tôn trọng công sức của thầy cô.',
      options: [
        opt('ra-hieu', 'Ra hiệu cho bạn đợi ra chơi rồi nói', 'good', 'Con vừa tôn trọng cô vừa không làm bạn phật lòng.', ['respect']),
        opt('lo-di', 'Lờ bạn đi, tiếp tục nghe cô', 'ok', 'Con giữ trật tự là đúng. Nhắc bạn một cách nhẹ nhàng thì bạn cũng nghe giảng được.', ['respect']),
        opt('noi-chuyen', 'Quay sang nói chuyện với bạn', 'poor', 'Cô đang dạy mà lớp ồn thì cô rất mệt, và con cũng bỏ lỡ bài.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Sắp đến ngày 20 tháng 11. Con muốn tỏ lòng biết ơn cô giáo. Con sẽ làm gì?',
      explanation: 'Món quà ý nghĩa nhất với thầy cô là sự chăm ngoan và lời cảm ơn thật lòng.',
      options: [
        opt('thiep-va-hoc-tot', 'Viết thiệp cảm ơn cô và cố gắng học tốt hơn', 'good', 'Cô sẽ quý nhất món quà này: một học trò biết ơn và chăm chỉ.', ['respect', 'perseverance']),
        opt('mua-hoa', 'Xin mẹ tiền mua hoa tặng cô', 'ok', 'Hoa đẹp lắm. Nhưng tự viết vài dòng cảm ơn thì cô càng cảm động.', ['respect']),
        opt('khong-can', 'Không cần làm gì, cô dạy là việc của cô', 'poor', 'Thầy cô dạy con bằng cả tấm lòng. Một lời cảm ơn đâu có khó.'),
      ],
    },
  ],

  'ethics.g2.yeu-quy-ban-be': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Bạn cùng bàn quên mang bút chì. Con có hai chiếc. Con sẽ làm gì?',
      explanation: 'Chia sẻ với bạn khi bạn cần là biểu hiện của tình bạn.',
      options: [
        opt('cho-muon', 'Cho bạn mượn một chiếc', 'good', 'Bạn sẽ học được bài hôm nay nhờ con. Tốt bụng quá!', ['kindness']),
        opt('bao-co', 'Bảo bạn đi mượn cô giáo', 'ok', 'Cũng là một cách, nhưng con đang có dư mà, cho bạn mượn nhanh hơn.', ['kindness']),
        opt('giau-di', 'Giấu một chiếc đi để bạn không hỏi mượn', 'poor', 'Nếu con quên bút, con có muốn bạn làm vậy với mình không?'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Một bạn trong lớp bị ngã trầy đầu gối ở sân trường. Con sẽ làm gì?',
      explanation: 'Quan tâm, giúp đỡ bạn khi bạn gặp khó khăn là yêu quý bạn bè.',
      options: [
        opt('do-va-bao-co', 'Đỡ bạn dậy và đưa bạn đến phòng y tế hoặc báo cô', 'good', 'Con thật tốt bụng! Bạn sẽ đỡ đau và nhớ mãi.', ['kindness', 'responsibility']),
        opt('hoi-tham', 'Chạy lại hỏi bạn có đau không', 'ok', 'Hỏi thăm là quan tâm rồi. Giúp bạn đến phòng y tế nữa nhé.', ['kindness']),
        opt('cuoi', 'Đứng cười vì bạn ngã trông buồn cười', 'poor', 'Bạn đang đau mà bị cười thì càng buồn. Con thử nghĩ nếu là con xem.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Bạn thân của con chơi với một bạn mới và ít chơi với con hơn. Con sẽ làm gì?',
      explanation: 'Tình bạn tốt là biết mở lòng, không ganh tị hay giận dỗi.',
      options: [
        opt('choi-ca-ba', 'Làm quen với bạn mới để cả ba cùng chơi', 'good', 'Tuyệt! Con có thêm một người bạn thay vì mất đi một người.', ['kindness', 'respect']),
        opt('noi-voi-ban', 'Nói với bạn thân là con thấy hơi buồn', 'ok', 'Nói thật cảm xúc là tốt. Rủ cả bạn mới chơi cùng thì mọi người đều vui.', ['honesty']),
        opt('gian-doi', 'Giận bạn, không chơi với bạn nữa', 'poor', 'Bạn có quyền có thêm bạn mới. Giận dỗi chỉ làm con mất bạn thôi.'),
      ],
    },
  ],

  'ethics.g2.quy-trong-thoi-gian': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Chuông báo thức reo lúc 6 giờ sáng, con vẫn còn buồn ngủ. Con sẽ làm gì?',
      explanation: 'Dậy đúng giờ giúp con có đủ thời gian chuẩn bị mà không phải vội vàng.',
      options: [
        opt('day-ngay', 'Dậy ngay, rửa mặt cho tỉnh', 'good', 'Rất giỏi! Buổi sáng của con sẽ thong thả và vui vẻ.', ['responsibility', 'perseverance']),
        opt('nam-them', 'Nằm thêm một phút rồi dậy', 'ok', 'Một phút thì được, miễn là con không ngủ quên luôn nhé.', ['responsibility']),
        opt('tat-ngu-tiep', 'Tắt chuông, ngủ tiếp', 'poor', 'Ngủ tiếp dễ làm con đi học muộn và phải chạy vội vàng.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con hẹn bạn 3 giờ chiều cùng đi đá bóng. Đã gần 3 giờ mà con đang xem tivi. Con sẽ làm gì?',
      explanation: 'Đúng giờ hẹn là tôn trọng thời gian của người khác.',
      options: [
        opt('di-dung-gio', 'Tắt tivi và đi cho kịp giờ hẹn', 'good', 'Tuyệt! Bạn không phải chờ, và các bạn tin con hơn.', ['responsibility', 'respect']),
        opt('bao-tre', 'Nhờ mẹ gọi báo bạn con sẽ đến muộn một chút', 'ok', 'Báo trước là tốt, nhưng cố đến đúng giờ thì hơn.', ['honesty']),
        opt('xem-het', 'Xem nốt chương trình, muộn tí cũng được', 'poor', 'Bạn sẽ phải đứng đợi con. Thời gian của bạn cũng quý như của con.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Cô giao bài tập về nhà làm trong 3 ngày. Con sẽ làm thế nào?',
      explanation: 'Chia việc ra làm dần và bắt đầu sớm là cách dùng thời gian khôn ngoan.',
      options: [
        opt('chia-deu', 'Chia bài ra làm mỗi ngày một phần', 'good', 'Rất biết sắp xếp! Con không bị dồn việc vào phút cuối.', ['responsibility', 'perseverance']),
        opt('lam-het-ngay', 'Làm hết ngay trong ngày đầu tiên', 'ok', 'Làm sớm là tốt, chỉ cần con làm cẩn thận, đừng vội quá.', ['responsibility']),
        opt('de-ngay-cuoi', 'Để đến tối ngày thứ ba mới làm', 'poor', 'Dồn đến phút cuối thì dễ làm ẩu và thiếu thời gian lắm.'),
      ],
    },
  ],

  'ethics.g2.nhan-loi-sua-loi': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con lỡ tay làm đổ nước ra bàn học của bạn. Con sẽ làm gì?',
      explanation: 'Làm sai thì nhận lỗi và sửa lỗi ngay.',
      options: [
        opt('xin-loi-lau', 'Xin lỗi bạn và lấy khăn lau khô ngay', 'good', 'Đúng rồi! Bạn sẽ không giận vì con đã sửa lỗi ngay.', ['honesty', 'responsibility']),
        opt('xin-loi', 'Nói "tớ xin lỗi" với bạn', 'ok', 'Xin lỗi là tốt. Giúp bạn lau khô nữa thì trọn vẹn.', ['honesty']),
        opt('lang-di', 'Lặng lẽ quay đi như không biết', 'poor', 'Bạn sẽ buồn vì sách vở bị ướt mà không ai nhận. Dũng cảm nhận lỗi nhé.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con nói dối mẹ là đã làm bài tập, nhưng thật ra chưa làm. Con cảm thấy không yên. Con sẽ làm gì?',
      explanation: 'Nhận lỗi tuy khó nhưng giúp lòng con nhẹ nhõm và người khác tin con hơn.',
      options: [
        opt('noi-that', 'Nói thật với mẹ và đi làm bài ngay', 'good', 'Con thật dũng cảm! Mẹ sẽ vui vì con biết nhận lỗi.', ['honesty', 'responsibility']),
        opt('lam-bai-am-tham', 'Lặng lẽ đi làm bài cho xong', 'ok', 'Làm bài là tốt, nhưng nói thật với mẹ thì con mới hết áy náy.', ['responsibility']),
        opt('giau-luon', 'Giấu luôn, mai cô hỏi thì tính sau', 'poor', 'Giấu lỗi thì lỗi càng to. Nói thật sớm thì dễ sửa hơn nhiều.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Trong giờ chơi, con đá bóng trúng cửa kính lớp bên làm nứt kính. Không ai nhìn thấy. Con sẽ làm gì?',
      explanation: 'Người dũng cảm nhận lỗi cả khi không ai thấy.',
      options: [
        opt('bao-co', 'Đến nói với cô giáo và xin lỗi', 'good', 'Rất dũng cảm và trung thực! Cô sẽ trân trọng con hơn.', ['honesty', 'responsibility']),
        opt('ke-bo-me', 'Về nhà kể với bố mẹ để bố mẹ nói giúp', 'ok', 'Kể với bố mẹ là tốt, nhưng tự đến gặp cô thì con dũng cảm hơn.', ['honesty']),
        opt('im-lang', 'Im lặng, vì không ai biết', 'poor', 'Có thể bạn khác sẽ bị nghi oan. Nhận lỗi là cách đúng nhất.'),
      ],
    },
  ],

  'ethics.g2.bao-quan-do-dung-ca-nhan': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Quyển vở mới của con bị quăn góc. Con sẽ làm gì?',
      explanation: 'Giữ gìn sách vở cẩn thận giúp chúng luôn sạch đẹp và dùng được lâu.',
      options: [
        opt('boc-vo', 'Vuốt phẳng lại và bọc bìa cho vở', 'good', 'Giỏi quá! Vở được bọc sẽ luôn phẳng phiu, sạch sẽ.', ['responsibility']),
        opt('vuot-phang', 'Vuốt phẳng góc vở lại', 'ok', 'Vuốt phẳng là tốt. Bọc bìa nữa thì vở không bị quăn lại.', ['responsibility']),
        opt('ke', 'Kệ, quăn một chút không sao', 'poor', 'Góc quăn dần sẽ rách. Giữ gìn từ bây giờ nhé.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con vừa đi mưa về, cặp sách bị ướt. Con sẽ làm gì?',
      explanation: 'Chăm sóc đồ dùng khi chúng gặp sự cố giúp đồ bền lâu.',
      options: [
        opt('lay-ra-phoi', 'Lấy sách vở ra, lau khô và phơi cặp', 'good', 'Rất chu đáo! Sách vở sẽ không bị mốc và cặp nhanh khô.', ['responsibility']),
        opt('lau-cap', 'Lau bên ngoài cặp cho khô', 'ok', 'Lau ngoài là tốt, nhưng sách vở bên trong cũng có thể bị ướt đấy.', ['responsibility']),
        opt('de-nguyen', 'Để nguyên cặp ướt trong góc', 'poor', 'Để ướt lâu sách vở sẽ bị nhoè chữ và mốc.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Chiếc áo đồng phục của con bị đứt cúc. Con sẽ làm gì?',
      explanation: 'Biết tự chăm sóc và sửa chữa đồ dùng của mình là tính tự lập.',
      options: [
        opt('nho-me-day', 'Nhờ mẹ dạy cách khâu cúc rồi tự khâu', 'good', 'Tuyệt vời! Con vừa sửa được áo vừa học thêm một việc hay.', ['responsibility', 'perseverance']),
        opt('nho-me-khau', 'Đưa mẹ khâu giúp', 'ok', 'Nhờ mẹ là được, lần sau con thử tự khâu xem nhé.', ['responsibility']),
        opt('bo-ao', 'Vứt áo đi, xin mẹ mua áo mới', 'poor', 'Chỉ đứt một cúc thôi mà, khâu lại là mặc tiếp được.'),
      ],
    },
  ],

  'ethics.g2.bao-quan-do-dung-gia-dinh': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con dùng xong cái kéo của nhà. Con sẽ làm gì?',
      explanation: 'Dùng đồ chung xong cất lại chỗ cũ để mọi người cùng tìm thấy.',
      options: [
        opt('cat-cho-cu', 'Cất kéo lại đúng chỗ cũ', 'good', 'Rất tốt! Lần sau ai cần cũng tìm thấy ngay.', ['responsibility']),
        opt('de-tren-ban', 'Để trên bàn, ai cần thì lấy', 'ok', 'Chưa bị mất, nhưng để bừa trên bàn thì dễ lạc và nguy hiểm cho em nhỏ.', ['responsibility']),
        opt('de-dau-cung-duoc', 'Để luôn chỗ vừa dùng', 'poor', 'Kéo để bừa có thể làm em bé bị đứt tay, và mọi người phải đi tìm.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con thấy bạn đến chơi nhảy lên ghế sofa của nhà con. Con sẽ làm gì?',
      explanation: 'Giữ gìn đồ đạc trong nhà là trách nhiệm của mọi thành viên, kể cả khi có khách.',
      options: [
        opt('nhac-ban', 'Nhắc bạn nhẹ nhàng và rủ bạn chơi trò khác', 'good', 'Khéo quá! Ghế không hỏng mà bạn vẫn vui.', ['responsibility', 'kindness']),
        opt('nhac-bo-me', 'Gọi bố mẹ ra nói với bạn', 'ok', 'Cũng được, nhưng con tự nhắc nhẹ nhàng thì bạn đỡ ngại hơn.', ['responsibility']),
        opt('nhay-cung', 'Nhảy cùng bạn cho vui', 'poor', 'Ghế có thể bị hỏng, và nhảy trên ghế dễ ngã lắm.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Con lỡ làm vỡ chiếc cốc của bố. Bố mẹ chưa biết. Con sẽ làm gì?',
      explanation: 'Làm hỏng đồ chung thì nhận lỗi và cẩn thận hơn lần sau.',
      options: [
        opt('noi-va-don', 'Cẩn thận gom mảnh vỡ (nhờ người lớn giúp) và nói thật với bố', 'good', 'Rất trung thực và chu đáo! Bố sẽ vui vì con biết nhận lỗi.', ['honesty', 'responsibility']),
        opt('noi-that', 'Nói với bố là con làm vỡ', 'ok', 'Nhận lỗi là đúng. Nhớ nhờ người lớn dọn mảnh vỡ để không ai bị đứt tay.', ['honesty']),
        opt('giau-manh', 'Giấu mảnh vỡ vào thùng rác', 'poor', 'Mảnh vỡ có thể làm người đổ rác bị thương, và giấu lỗi không phải là cách hay.'),
      ],
    },
  ],

  'ethics.g2.cam-xuc-cua-em': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con được cô khen trước lớp. Con cảm thấy thế nào và sẽ làm gì?',
      explanation: 'Nhận ra cảm xúc vui của mình và chia sẻ nó là điều tốt.',
      options: [
        opt('vui-cam-on', 'Thấy vui, cảm ơn cô và về kể cho bố mẹ', 'good', 'Niềm vui được chia sẻ sẽ nhân đôi đấy!', ['respect']),
        opt('vui-trong-long', 'Vui trong lòng, không nói với ai', 'ok', 'Vui là tốt rồi. Kể cho người thân thì cả nhà cùng vui.', ['respect']),
        opt('khoe-kheo', 'Khoe khắp lớp và chê các bạn không được khen', 'poor', 'Vui thì tốt, nhưng chê bạn làm bạn buồn. Hãy vui mà không làm ai tổn thương.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Chú mèo nhà con bị lạc mất, con thấy rất buồn. Con sẽ làm gì?',
      explanation: 'Buồn là cảm xúc bình thường. Nói ra với người thân giúp con nhẹ lòng hơn.',
      options: [
        opt('ke-me', 'Kể với mẹ là con đang buồn và nhờ mẹ cùng đi tìm', 'good', 'Đúng rồi! Có mẹ bên cạnh con sẽ bớt buồn, và hai mẹ con cùng tìm.', ['honesty']),
        opt('khoc-mot-minh', 'Ngồi khóc một mình trong phòng', 'ok', 'Khóc cũng giúp nhẹ lòng. Nhưng kể cho ai đó thì con sẽ không phải buồn một mình.', ['honesty']),
        opt('dap-do', 'Đập đồ chơi vì bực bội', 'poor', 'Đập đồ không làm mèo về, lại làm hỏng đồ. Nói ra cảm xúc sẽ tốt hơn.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Ngày mai con phải lên hát trước cả trường, con thấy run và sợ. Con sẽ làm gì?',
      explanation: 'Gọi đúng tên nỗi sợ và tìm cách vượt qua giúp con tự tin hơn.',
      options: [
        opt('tap-va-noi', 'Nói với bố mẹ là con sợ và nhờ bố mẹ nghe con hát thử', 'good', 'Rất giỏi! Tập trước người thân giúp con bớt run nhiều lắm.', ['perseverance', 'honesty']),
        opt('tap-mot-minh', 'Tự tập hát nhiều lần trong phòng', 'ok', 'Tập nhiều là tốt. Nói ra nỗi sợ nữa thì con sẽ được động viên.', ['perseverance']),
        opt('gia-om', 'Giả vờ ốm để khỏi phải hát', 'poor', 'Trốn tránh thì nỗi sợ vẫn còn đó. Thử đối mặt, con sẽ thấy mình giỏi hơn con nghĩ.'),
      ],
    },
  ],

  'ethics.g2.kiem-che-cam-xuc': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Bạn giật mất đồ chơi của con. Con thấy rất tức. Con sẽ làm gì?',
      explanation: 'Khi tức giận, hãy hít thở sâu để bình tĩnh trước khi nói.',
      options: [
        opt('hit-tho-noi', 'Hít thở sâu rồi nói: "Bạn trả tớ nhé, mình chơi chung"', 'good', 'Rất bình tĩnh! Con vừa lấy lại đồ vừa giữ được bạn.', ['respect', 'kindness']),
        opt('bao-co', 'Đi mách cô giáo', 'ok', 'Nhờ cô giúp cũng được. Thử tự nói chuyện với bạn trước xem.', ['respect']),
        opt('danh-ban', 'Đánh bạn để giành lại', 'poor', 'Đánh bạn làm bạn đau và mọi chuyện càng tệ hơn. Bình tĩnh nói chuyện nhé.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con xếp hình mãi không xong, thấy bực mình. Con sẽ làm gì?',
      explanation: 'Nghỉ một lát khi bực bội giúp con bình tĩnh và làm tốt hơn.',
      options: [
        opt('nghi-lat', 'Nghỉ một lát, uống nước rồi thử lại', 'good', 'Tuyệt! Bình tĩnh lại, con sẽ nghĩ ra cách xếp đấy.', ['perseverance']),
        opt('nho-giup', 'Nhờ anh chị chỉ cách xếp', 'ok', 'Nhờ giúp cũng tốt. Nhưng đừng để cơn bực làm con bỏ cuộc nhé.', ['perseverance']),
        opt('pha-tung', 'Phá tung các mảnh ghép ra', 'poor', 'Phá đi thì công sức nãy giờ mất hết. Nghỉ một chút rồi làm tiếp nhé.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Con bị thua khi chơi cờ với em. Em reo lên rất vui. Con thấy khó chịu. Con sẽ làm gì?',
      explanation: 'Biết thua vui vẻ là cách kiềm chế cảm xúc và tôn trọng người chơi cùng.',
      options: [
        opt('chuc-mung', 'Chúc mừng em và rủ em chơi ván nữa', 'good', 'Con thật đáng khen! Thua vui vẻ là người chơi đẹp.', ['respect', 'kindness']),
        opt('nghi-choi', 'Nói "thôi anh không chơi nữa" rồi đi chỗ khác', 'ok', 'Đi chỗ khác để bình tĩnh cũng được, nhưng chúc mừng em thì em sẽ vui hơn.', ['respect']),
        opt('xo-ban-co', 'Xô đổ bàn cờ và bảo em chơi ăn gian', 'poor', 'Em thắng công bằng mà. Xô đổ bàn cờ làm em buồn và không ai muốn chơi cùng nữa.'),
      ],
    },
  ],

  'ethics.g2.tim-kiem-ho-tro': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con bị lạc bố mẹ ở siêu thị. Con sẽ làm gì?',
      explanation: 'Khi bị lạc, hãy đứng yên và nhờ nhân viên hoặc bảo vệ giúp đỡ.',
      options: [
        opt('nho-nhan-vien', 'Đến quầy thu ngân nhờ cô nhân viên gọi bố mẹ', 'good', 'Rất đúng! Nhân viên sẽ thông báo loa để bố mẹ tìm con.', ['responsibility']),
        opt('dung-yen', 'Đứng yên tại chỗ chờ bố mẹ quay lại', 'ok', 'Đứng yên là tốt, bố mẹ sẽ quay lại tìm. Nhờ nhân viên nữa thì nhanh hơn.', ['responsibility']),
        opt('di-theo-nguoi-la', 'Đi theo một người lạ bảo sẽ dẫn con đi tìm bố mẹ', 'poor', 'Không đi theo người lạ nhé! Hãy nhờ nhân viên mặc đồng phục hoặc bảo vệ.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con không hiểu bài toán cô vừa giảng. Con sẽ làm gì?',
      explanation: 'Hỏi khi chưa hiểu là cách tìm sự giúp đỡ đúng đắn trong học tập.',
      options: [
        opt('hoi-co', 'Giơ tay hỏi cô hoặc hỏi cô sau giờ học', 'good', 'Rất tốt! Hỏi ngay thì con hiểu bài và không bị hổng kiến thức.', ['perseverance']),
        opt('hoi-ban', 'Hỏi bạn giỏi trong giờ ra chơi', 'ok', 'Hỏi bạn cũng được. Nếu vẫn chưa hiểu thì hỏi cô nhé.', ['perseverance']),
        opt('lo-di', 'Kệ, không hiểu thì thôi', 'poor', 'Bài sau sẽ dựa vào bài này. Không hỏi bây giờ thì sau càng khó.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Một bạn lớp trên thường chặn đường đòi con đưa tiền ăn sáng. Con sẽ làm gì?',
      explanation: 'Bị bắt nạt thì phải kể ngay với người lớn tin cậy, không giữ trong lòng.',
      options: [
        opt('ke-nguoi-lon', 'Kể ngay với bố mẹ và cô giáo', 'good', 'Rất dũng cảm! Người lớn sẽ bảo vệ con và giúp bạn kia sửa sai.', ['honesty', 'responsibility']),
        opt('di-duong-khac', 'Đi đường khác để tránh bạn ấy', 'ok', 'Tránh được một lúc thôi. Kể với người lớn thì mới giải quyết hẳn.', ['responsibility']),
        opt('dua-tien-im', 'Đưa tiền và không nói với ai', 'poor', 'Giữ im lặng thì chuyện sẽ còn tiếp diễn. Con không có lỗi gì cả - hãy nói ra.'),
      ],
    },
  ],

  'ethics.g2.quy-dinh-noi-cong-cong': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Ở thư viện, con muốn nói chuyện với bạn. Con sẽ làm gì?',
      explanation: 'Thư viện cần yên tĩnh, ai cũng phải giữ trật tự.',
      options: [
        opt('ra-ngoai', 'Rủ bạn ra ngoài rồi mới nói', 'good', 'Rất văn minh! Mọi người trong thư viện vẫn đọc sách yên tĩnh.', ['citizenship', 'respect']),
        opt('thi-tham', 'Thì thầm thật nhỏ với bạn', 'ok', 'Nói nhỏ là có ý thức rồi. Ra ngoài nói thì không phiền ai cả.', ['respect']),
        opt('noi-to', 'Nói chuyện bình thường, thư viện rộng mà', 'poor', 'Tiếng nói làm mọi người mất tập trung đọc sách đấy.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Ở công viên, con ăn xong que kem nhưng không thấy thùng rác gần đó. Con sẽ làm gì?',
      explanation: 'Không vứt rác bừa bãi là quy định chung ở mọi nơi công cộng.',
      options: [
        opt('cam-den-thung', 'Cầm que kem đi tìm thùng rác để bỏ', 'good', 'Tuyệt! Công viên sạch đẹp có phần công của con.', ['citizenship']),
        opt('bo-tui', 'Bỏ vào túi, về nhà vứt', 'ok', 'Không xả rác là tốt. Nhớ về nhà vứt đi nhé.', ['citizenship']),
        opt('vut-co', 'Vứt vào bãi cỏ, sẽ có người dọn', 'poor', 'Nếu ai cũng nghĩ vậy thì công viên sẽ đầy rác.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Đi xem phim ở rạp, phim đang chiếu thì con muốn gọi điện cho bạn. Con sẽ làm gì?',
      explanation: 'Nơi công cộng có quy định riêng để mọi người cùng được thoải mái.',
      options: [
        opt('doi-het-phim', 'Đợi xem xong phim rồi mới gọi', 'good', 'Rất lịch sự! Mọi người xem phim không bị làm phiền.', ['citizenship', 'respect']),
        opt('ra-ngoai-goi', 'Ra ngoài sảnh gọi rồi quay vào', 'ok', 'Ra ngoài là có ý thức. Nhưng đi ra đi vào cũng làm người khác bị che màn hình.', ['respect']),
        opt('goi-tai-cho', 'Gọi ngay tại chỗ, nói nhỏ thôi', 'poor', 'Trong rạp tối và yên lặng, tiếng nói và ánh sáng điện thoại làm phiền nhiều người.'),
      ],
    },
  ],
}

export default bank
