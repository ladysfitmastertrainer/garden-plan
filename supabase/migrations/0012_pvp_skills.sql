-- =============================================================================
-- ĐẤU TRƯỜNG CHẠY Y HỆT TRẬN ĐÁNH QUÁI: hai con thú đánh lẫn nhau.
--
-- Trước bản này, một vòng PVP là một cuộc ĐUA BẤM: ai trả lời đúng trước thì
-- người đó đánh, người kia không làm gì cả. Trả lời đúng mà chậm hơn nửa giây
-- thì cả câu ấy coi như không có - và với hai đứa bé ngồi cạnh nhau, đứa chậm
-- tay hơn một chút sẽ không bao giờ thắng được lần nào.
--
-- Giờ CẢ HAI BÊN CÙNG RA ĐÒN nếu cùng trả lời đúng; nhanh hơn thì đánh đau hơn
-- (xem `speedBonus`). Tốc độ vẫn được thưởng, nhưng không còn nuốt trọn cả vòng.
--
-- Và vì đã giống trận đánh quái thì phải giống cho hết: trả lời đúng xong trẻ
-- CHỌN CHIÊU để tung, đúng hai chiêu con thú đang mang. Ba cột dưới đây là
-- những gì máy chủ cần để chấm việc ấy.
--
-- ---- VÌ SAO PHẢI LƯU, CHỨ KHÔNG TRA LẠI ----
--
-- Cùng lẽ với `challenger_pet` ở migration 0011: đội hình và bộ chiêu có thể
-- đổi giữa trận (trẻ vào kho đồ sắp lại), mà bộ chiêu đang dùng trên sân đấu
-- thì không được phép đổi giữa chừng.
--
-- `*_spells` còn là CÁI CHỐT CỬA: máy chủ chỉ chấp nhận cú đánh bằng một chiêu
-- có tên trong danh sách này. Thiếu nó thì một trình duyệt đã bị sửa có thể
-- khai bừa id chiêu cuối của hệ khác và tung nó mỗi vòng.
--
-- Bảo vệ dữ liệu trẻ em: toàn id và số, không một chữ nào do trẻ gõ ra.
-- =============================================================================

alter table public.pvp_matches
  -- Hai chiêu mỗi bên mang vào trận, chốt lúc thách và lúc nhận lời.
  -- Ví dụ: '["gio-chu","thien-thu"]'.
  add column if not exists challenger_spells jsonb not null default '[]'::jsonb,
  add column if not exists opponent_spells   jsonb not null default '[]'::jsonb,

  -- Chiêu cuối còn phải nghỉ mấy vòng. 0 là dùng được.
  -- Đếm theo MỌI vòng trôi qua, kể cả vòng mình trả lời sai: em đang bị dẫn
  -- trước mà phải thắng mới được nạp lại thì trận đấu khoá chặt đúng lúc em ấy
  -- cần một đường gỡ nhất.
  add column if not exists challenger_cd int not null default 0,
  add column if not exists opponent_cd   int not null default 0,

  -- Hiệu ứng chiêu cuối đang bám trên mỗi bên.
  -- Ví dụ: '[{"kind":"burn","turnsLeft":2,"perTurn":7}]'.
  add column if not exists challenger_status jsonb not null default '[]'::jsonb,
  add column if not exists opponent_status   jsonb not null default '[]'::jsonb;
