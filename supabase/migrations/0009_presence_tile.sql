-- =============================================================================
-- BẠN CÙNG LỚP ĐỨNG Ở Ô NÀO - hai con số còn thiếu để cả lớp nhìn thấy nhau.
--
-- `class_presence` từ trước tới nay chỉ biết bạn ấy đang ở ĐẢO nào (môn + lớp).
-- Đủ để bảng "bạn cùng lớp" liệt kê tên và để luật "chỉ thách được người cùng
-- đảo" chạy đúng, nhưng KHÔNG đủ để vẽ bạn ấy ra: bước vào một vùng đất là một
-- tấm bản đồ tám mươi ô, và "đang ở đảo Toán lớp 2" không nói được em ấy đứng ở
-- đâu trên tám mươi ô đó.
--
-- Nên hai cột này. Toạ độ Ô, không phải điểm ảnh: bản đồ được sinh lại từ hạt
-- giống trên từng máy nên hai máy có cùng lưới ô, còn cỡ điểm ảnh thì mỗi máy
-- một khác tuỳ màn hình.
--
-- CHO PHÉP NULL, và đó không phải sự lười: trẻ đang đứng ở bản đồ thế giới thì
-- không có ô nào cả. Cùng một lẽ với `subject` và `grade` ngay trên.
--
-- Bảo vệ dữ liệu trẻ em: đây vẫn không phải thông tin cá nhân. Hai con số nói
-- "nhân vật đang đứng ở ô thứ mấy của một tấm bản đồ trong game", sống vài chục
-- giây rồi bị ghi đè, và bị xoá hẳn khi trẻ đóng tab.
-- =============================================================================

alter table public.class_presence
  add column if not exists x int,
  add column if not exists y int;
