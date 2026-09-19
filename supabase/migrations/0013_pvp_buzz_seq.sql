-- =============================================================================
-- CHỐT CỬA CHO HAI LƯỢT BẤM TỚI CÙNG MỘT LÚC.
--
-- Một vòng đấu giờ chỉ chốt khi CẢ HAI đã bấm (xem migration 0012). Và vì hai
-- đứa trẻ ngồi cạnh nhau thường bấm cách nhau vài phần trăm giây, hai yêu cầu
-- ấy tới máy chủ gần như cùng lúc.
--
-- Khi đó cả hai cùng đọc ra `buzzes = []`, cùng tính ra `[chính mình]`, rồi cùng
-- ghi đè. Kết quả còn đúng MỘT lượt bấm - mà vòng thì cần hai. Vòng không bao
-- giờ chốt, và hai máy đứng im hiện chữ "đang chờ bạn" cho tới hết trận.
--
-- Khe hở này đã có từ trước nhưng vô hại: luật cũ chốt vòng ngay khi một người
-- bấm đúng, nên gần như không có lúc nào hai lượt bấm cùng nằm trong một ô.
-- Luật mới mở toang nó ra.
--
-- Cột này là một BỘ ĐẾM chỉ tăng. Mỗi lần ghi lượt bấm, máy chủ kèm điều kiện
-- "bộ đếm phải vẫn đúng bằng con số tôi vừa đọc". Ai ghi sau thì câu lệnh không
-- khớp dòng nào, biết là mình vừa thua cuộc đua, đọc lại rồi ghi tiếp - lúc này
-- danh sách đã có người kia trong đó, nên vòng chốt đúng như phải thế.
--
-- Đây là cách rẻ nhất để có một phép ghi nguyên vẹn mà không phải viết hàm
-- trong cơ sở dữ liệu: điều kiện nằm ngay trong mệnh đề WHERE của câu UPDATE,
-- nên chính Postgres là người phân xử, không phải mã ở tầng trên.
-- =============================================================================

alter table public.pvp_matches
  add column if not exists buzz_seq int not null default 0;
