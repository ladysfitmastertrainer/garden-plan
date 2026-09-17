-- =============================================================================
-- Đấu trường lớp học: bản đồ chung và trận PVP giữa hai bạn cùng lớp.
--
-- HAI BẢNG, HAI VIỆC KHÁC HẲN NHAU:
--
--   class_presence  - "bạn nào đang đứng ở đảo nào", một dòng cho mỗi học sinh,
--                     ghi đè liên tục. Đây là dữ liệu SỐNG, hết hạn sau vài chục
--                     giây, không có giá trị lịch sử. Không bao giờ lớn lên.
--
--   pvp_matches     - một trận đấu. Máy chủ là TRỌNG TÀI: ai bấm trước, ai gây
--                     bao nhiêu sát thương, ai thắng - đều do đây quyết, không
--                     do máy của trẻ tự khai.
--
-- VÌ SAO MÁY CHỦ PHẢI LÀ TRỌNG TÀI. Cả trò chơi này xoay quanh câu "ai nhanh tay
-- hơn". Nếu mỗi máy tự đo đồng hồ của mình rồi gửi lên "em bấm mất 1,2 giây" thì
-- bên nào có máy chạy chậm hơn sẽ luôn thua, mà bên nào biết sửa số sẽ luôn
-- thắng. Máy chủ xếp thứ tự theo THỜI ĐIỂM YÊU CẦU TỚI NƠI, một đồng hồ duy nhất
-- cho cả hai bên.
--
-- Bảo vệ dữ liệu trẻ em: không thêm một trường thông tin cá nhân nào. Một trận
-- đấu chỉ biết hai id học sinh, một môn, một lớp và mấy con số máu.
-- =============================================================================

-- --- Bạn nào đang ở đâu --------------------------------------------------------

create table if not exists public.class_presence (
  student_id uuid primary key references public.students(id) on delete cascade,
  class_id   uuid not null references public.classes(id)  on delete cascade,
  -- Đảo đang đứng. NULL nghĩa là đang ở bản đồ thế giới, chưa vào vùng nào -
  -- lúc đó bạn bè thấy em "đang ở sảnh" chứ không thách đấu được.
  subject    text check (subject in ('math', 'vietnamese', 'music', 'ethics')),
  grade      int  check (grade between 1 and 5),
  seen_at    timestamptz not null default now()
);

create index if not exists class_presence_class_idx on public.class_presence(class_id, seen_at desc);

-- --- Trận đấu ------------------------------------------------------------------

create table if not exists public.pvp_matches (
  id            uuid primary key default gen_random_uuid(),
  class_id      uuid not null references public.classes(id)  on delete cascade,
  challenger_id uuid not null references public.students(id) on delete cascade,
  opponent_id   uuid not null references public.students(id) on delete cascade,

  -- Đảo nơi trận đấu diễn ra. Quyết định môn của cả bộ câu hỏi.
  subject text not null check (subject in ('math', 'vietnamese', 'music', 'ethics')),
  grade   int  not null check (grade between 1 and 5),

  --   pending  : đã thách, chờ bạn kia nhận
  --   active   : đang đánh
  --   finished : xong, có người thắng
  --   declined : bạn kia từ chối
  --   abandoned: một bên bỏ đi giữa chừng
  status text not null default 'pending'
    check (status in ('pending', 'active', 'finished', 'declined', 'abandoned')),

  -- Bộ câu hỏi CHUNG cho cả hai bên, chốt ngay lúc thách đấu.
  --
  -- Phải là một bộ duy nhất lưu ở đây chứ không phải mỗi máy tự bốc: hai bộ khác
  -- nhau thì "cùng một câu hỏi, ai nhanh hơn" không còn nghĩa gì. Bộ này do máy
  -- của người thách đấu soạn - nó không lộ thêm gì cả, vì toàn bộ ngân hàng câu
  -- hỏi vốn đã nằm sẵn trong gói tải về của mọi máy.
  questions jsonb not null,

  -- Vòng đang đánh, đếm từ 0. Cũng chính là chỉ số câu hỏi hiện tại.
  round int not null default 0,
  -- Lúc vòng hiện tại bắt đầu, theo đồng hồ của MÁY CHỦ.
  --
  -- Tách khỏi `updated_at` vì `updated_at` nhúc nhích mỗi lần có người bấm, còn
  -- cái mốc để đo "bấm nhanh hay chậm" thì phải đứng yên suốt cả vòng. Dùng
  -- chung một cột thì người bấm sau luôn được đo từ lúc người bấm trước vừa
  -- xong, tức là luôn có vẻ nhanh hơn thực tế.
  round_started_at timestamptz not null default now(),

  challenger_hp    int not null,
  opponent_hp      int not null,
  challenger_max   int not null,
  opponent_max     int not null,
  -- Sức đánh, lấy từ đội thú của mỗi bên. Nuôi thú chăm hơn thì đánh đau hơn.
  challenger_power numeric not null default 1,
  opponent_power   numeric not null default 1,

  -- Các lượt bấm của VÒNG HIỆN TẠI, theo đúng thứ tự tới nơi. Dọn sạch mỗi khi
  -- sang vòng mới.
  buzzes jsonb not null default '[]'::jsonb,
  -- Diễn biến, để hai máy cùng kể một câu chuyện giống nhau.
  events jsonb not null default '[]'::jsonb,

  winner_id  uuid references public.students(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Một học sinh chỉ có vài trận, nhưng tra theo học sinh là việc làm liên tục
-- (mỗi lần máy hỏi "em có trận nào đang chờ không") nên phải có chỉ mục.
create index if not exists pvp_matches_challenger_idx
  on public.pvp_matches(challenger_id, status);
create index if not exists pvp_matches_opponent_idx
  on public.pvp_matches(opponent_id, status);
create index if not exists pvp_matches_class_idx
  on public.pvp_matches(class_id, created_at desc);

-- Không cho ai tự thách đấu chính mình - một trận như thế sẽ treo vĩnh viễn ở
-- trạng thái chờ, vì người phải bấm "nhận" cũng là người đang chờ.
alter table public.pvp_matches drop constraint if exists pvp_matches_two_sides;
alter table public.pvp_matches add constraint pvp_matches_two_sides
  check (challenger_id <> opponent_id);

-- --- Row Level Security --------------------------------------------------------
--
-- Giống mọi bảng khác kể từ bản chuyển sang Next.js: luật thật nằm trong
-- `src/server/pvp.ts` và `src/server/guard.ts`, viết bằng TypeScript. RLS ở đây
-- là LỚP THỨ HAI, phòng khi khoá `anon` lọt ra ngoài. Khoá `service_role` mà máy
-- chủ dùng bỏ qua toàn bộ phần này.

alter table public.class_presence enable row level security;
alter table public.pvp_matches    enable row level security;

-- Không cấp policy nào cho `anon`: trình duyệt không nói chuyện thẳng với
-- Supabase nữa, nên không có đường nào cần mở.
