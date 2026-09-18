-- =============================================================================
-- CÂU TRẺ VỪA NÓI - một cột, và chỉ chứa MÃ CÂU.
--
-- Trẻ cùng lớp gặp nhau trên bản đồ thì phải nói được với nhau một câu. Cột này
-- là cả đường truyền cho việc đó: máy trẻ ghi vào đây mã của một câu trong bảng
-- đóng ở `src/content/chat.ts`, và máy bên kia đọc ra rồi tra ngược thành chữ.
--
-- KHÔNG BAO GIỜ CHỨA CHỮ DO TRẺ GÕ. Cột này rộng nhất cũng chỉ giữ một mã như
-- 'chao' hay 'hen-sau'; API kiểm mã có trong bảng không rồi mới ghi. Nhờ vậy
-- không có chỗ nào cho một lời bắt nạt, một số điện thoại, hay một cái tên thật
-- lọt vào cơ sở dữ liệu - và cũng không cần ai ngồi kiểm duyệt.
--
-- KHÔNG CÓ CỘT THỜI ĐIỂM đi kèm, và đó là chủ ý. Câu nói tự hết hạn ở phía máy
-- trẻ: máy nói gửi kèm mã câu trong vài nhịp tim rồi thôi gửi, nên dòng này tự
-- trở về rỗng. Thêm một cột thời điểm nghĩa là thêm một chỗ nữa phải nhớ dọn.
--
-- Bảo vệ dữ liệu trẻ em: đây vẫn không phải thông tin cá nhân, và cũng không
-- phải lịch sử trò chuyện - nó bị GHI ĐÈ liên tục, không giữ lại câu nào.
-- =============================================================================

alter table public.class_presence
  add column if not exists emote text;
