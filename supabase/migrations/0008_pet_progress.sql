-- =============================================================================
-- Thú, kinh nghiệm thú, bộ chiêu và tầng tháp đã hạ - bốn thứ TRƯỚC GIỜ KHÔNG
-- ĐƯỢC LƯU.
--
-- Đây là một lỗi có thật, và nó âm thầm: `StudentProgress` có sẵn các trường
-- `pets`, `petXp`, `loadout` từ lúc thêm hệ thống thú, giao diện đọc chúng bình
-- thường, `saveProgress` nhận chúng bình thường - nhưng bảng `student_progress`
-- không có cột nào để chứa, nên chúng rơi xuống đất ở đúng bước cuối cùng. Mọi
-- thứ vẫn chạy suốt cả buổi chơi vì tất cả nằm trong bộ nhớ; tắt app đi mở lại
-- thì đàn thú biến mất và mọi con lùi về cấp 1.
--
-- Không ai thấy vì không có gì báo lỗi cả. Trẻ chỉ thấy hôm nay con thú của mình
-- lại bé như cũ.
--
-- Bốn cột dưới đây đóng chỗ hở đó. Tất cả đều có giá trị mặc định nên hồ sơ cũ
-- vẫn đọc được: hồ sơ chưa từng bắt thú sẽ ra mảng rỗng, đúng như hiện trạng.
-- =============================================================================

alter table public.student_progress
  -- Id những con thú đã thu phục.
  add column if not exists pets          text[] not null default '{}',
  -- Kinh nghiệm từng con, theo id. Quyết định cấp và nấc tiến hoá.
  add column if not exists pet_xp        jsonb  not null default '{}'::jsonb,
  -- Bộ chiêu trẻ đã sắp để mang ra trận, theo thứ tự.
  add column if not exists loadout       text[] not null default '{}',
  -- Những tầng Tháp Trí Tuệ đã hạ, khoá dạng 'math.g2'.
  --
  -- Cố ý TÁCH khỏi `cleared_nodes`: tháp không phải một chặng trên bản đồ, và
  -- nhét chung vào đó thì thanh tiến độ của vùng đất tự nhảy lên một bậc.
  add column if not exists tower_cleared text[] not null default '{}';
