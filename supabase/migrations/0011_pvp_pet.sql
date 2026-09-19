-- =============================================================================
-- CON THÚ RA TRẬN CỦA MỖI BÊN - để đấu trường vẽ ra được nó.
--
-- Trận PVP vốn đã tính đội thú vào máu và sức đánh (`challenger_power`), nhưng
-- chưa bao giờ VẼ chúng ra: màn đấu chỉ có hai cái tên và hai thanh máu. Trẻ
-- nuôi thú cả tháng rồi vào đấu trường không thấy con thú của mình đâu, nên nó
-- thành một con số vô hình - và một con số vô hình thì thấy phế.
--
-- Hai cột này giữ id con thú ĐỨNG ĐẦU đội của mỗi bên, chốt ngay lúc thách đấu
-- và lúc nhận lời. Chốt chứ không tra lại theo thời gian thực, vì đội thú có
-- thể đổi giữa trận (trẻ thu phục thêm con mới) - mà con đang đứng trên sân đấu
-- thì không được phép biến thành con khác giữa chừng.
--
-- CHO PHÉP NULL: trận tạo từ trước bản này không có, và giao diện rơi về con
-- thú mặc định của môn đó. Thiếu một con thú thì sân đấu vẫn chạy.
--
-- Bảo vệ dữ liệu trẻ em: một chuỗi như 'so-con' hay 'dom-sang', không hơn.
-- =============================================================================

alter table public.pvp_matches
  add column if not exists challenger_pet text,
  add column if not exists opponent_pet   text;
