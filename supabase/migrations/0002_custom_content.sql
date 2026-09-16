-- =============================================================================
-- Nội dung tự soạn, đồng bộ qua nhiều máy.
--
-- Khác hẳn mọi bảng ở 0001: các bảng kia thuộc về MỘT ĐỨA TRẺ, bảng này thuộc về
-- MỘT NGƯỜI LỚN. Trẻ không bao giờ soạn nội dung - các em chỉ đọc phần mà bố mẹ
-- hoặc thầy cô của mình đã soạn.
--
-- Vì sao chia thành từng DÒNG chứ không phải một khối JSON cho cả bộ:
--
--   Cô giáo soạn mười câu trên laptop buổi tối, sáng hôm sau sửa thêm hai câu
--   trên máy tính bảng ở lớp. Nếu cả bộ là một khối thì máy nào gửi sau sẽ ghi
--   đè máy kia - mất trắng một buổi tối làm việc mà không ai được báo. Chia
--   thành dòng thì hai máy hợp nhất được, vì chúng đụng vào những dòng khác
--   nhau.
--
-- Xoá thì đánh dấu `deleted_at` chứ không xoá hẳn: xoá hẳn thì lần đồng bộ sau
-- từ máy kia lại đẩy câu đó quay về, và người dùng xoá đi xoá lại mãi không
-- được. Dòng đã đánh dấu được dọn sau 90 ngày.
-- =============================================================================

-- --- Bảng ---------------------------------------------------------------------

-- Câu hỏi tự soạn. `id` do máy đặt (uuid) để hai máy offline không đụng nhau.
create table if not exists public.custom_questions (
  id         uuid primary key,
  owner_id   uuid not null references public.profiles(id) on delete cascade,
  skill_id   text not null,
  -- Cả câu hỏi dưới dạng `BankEntry`. Cấu trúc do client kiểm tra ở
  -- `content/custom.ts`; ở đây chỉ chặn những gì chắc chắn hỏng.
  entry      jsonb not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint custom_questions_entry_shape check (
    jsonb_typeof(entry) = 'object'
    and entry ? 'kind'
    and entry ? 'prompt'
    and length(entry ->> 'prompt') between 1 and 400
  )
);

create index if not exists custom_questions_owner_idx
  on public.custom_questions(owner_id, skill_id);

-- Câu gốc trong mã bị ẩn đi. Khoá là ĐỀ BÀI, không phải số thứ tự - xem lý do ở
-- `content/custom.ts`.
create table if not exists public.custom_hidden (
  owner_id   uuid not null references public.profiles(id) on delete cascade,
  skill_id   text not null,
  prompt     text not null check (length(prompt) between 1 and 400),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (owner_id, skill_id, prompt)
);

-- Tên kỹ năng đặt lại cho hợp cách gọi của lớp.
create table if not exists public.custom_skill_names (
  owner_id   uuid not null references public.profiles(id) on delete cascade,
  skill_id   text not null,
  name       text not null check (length(name) between 1 and 80),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (owner_id, skill_id)
);

-- --- Ai đọc được nội dung của ai ------------------------------------------------

-- Nội dung của `owner` có tới được người đang đăng nhập không?
--
-- Ba đường:
--   1. Chính người soạn, trên máy khác của mình.
--   2. Trẻ thuộc hồ sơ do người đó tạo - con đọc nội dung bố mẹ soạn.
--   3. Trẻ trong lớp do người đó dạy - học sinh đọc nội dung cô soạn.
--
-- Người lớn KHÔNG đọc được nội dung của người lớn khác, kể cả cô giáo dạy con
-- họ. Nội dung soạn cho lớp là để cho HỌC SINH dùng, không phải để phụ huynh
-- khác chép về.
create or replace function public.can_read_content(owner uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select
    owner = auth.uid()
    or exists (
      select 1 from public.students s
       where s.id = public.current_student_id() and s.owner_id = owner
    )
    or exists (
      select 1
        from public.class_members cm
        join public.classes c on c.id = cm.class_id
       where cm.student_id = public.current_student_id() and c.teacher_id = owner
    )
$$;

-- --- RLS ------------------------------------------------------------------------

alter table public.custom_questions   enable row level security;
alter table public.custom_hidden      enable row level security;
alter table public.custom_skill_names enable row level security;

-- Đọc: theo can_read_content. Ghi: CHỈ chính người soạn.
--
-- Điều kiện ghi viết thẳng `owner_id = auth.uid()` chứ không gói vào hàm, cùng
-- lý do đã ghi ở policy `students` trong 0001: hàm `stable` không nhìn thấy
-- hàng vừa chèn, mà Postgres áp policy SELECT cho cả `insert ... returning`.

drop policy if exists custom_questions_read on public.custom_questions;
create policy custom_questions_read on public.custom_questions
  for select using (owner_id = auth.uid() or public.can_read_content(owner_id));

drop policy if exists custom_questions_insert on public.custom_questions;
create policy custom_questions_insert on public.custom_questions
  for insert with check (owner_id = auth.uid());

drop policy if exists custom_questions_update on public.custom_questions;
create policy custom_questions_update on public.custom_questions
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists custom_questions_delete on public.custom_questions;
create policy custom_questions_delete on public.custom_questions
  for delete using (owner_id = auth.uid());

drop policy if exists custom_hidden_read on public.custom_hidden;
create policy custom_hidden_read on public.custom_hidden
  for select using (owner_id = auth.uid() or public.can_read_content(owner_id));

drop policy if exists custom_hidden_insert on public.custom_hidden;
create policy custom_hidden_insert on public.custom_hidden
  for insert with check (owner_id = auth.uid());

drop policy if exists custom_hidden_update on public.custom_hidden;
create policy custom_hidden_update on public.custom_hidden
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists custom_hidden_delete on public.custom_hidden;
create policy custom_hidden_delete on public.custom_hidden
  for delete using (owner_id = auth.uid());

drop policy if exists custom_skill_names_read on public.custom_skill_names;
create policy custom_skill_names_read on public.custom_skill_names
  for select using (owner_id = auth.uid() or public.can_read_content(owner_id));

drop policy if exists custom_skill_names_insert on public.custom_skill_names;
create policy custom_skill_names_insert on public.custom_skill_names
  for insert with check (owner_id = auth.uid());

drop policy if exists custom_skill_names_update on public.custom_skill_names;
create policy custom_skill_names_update on public.custom_skill_names
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists custom_skill_names_delete on public.custom_skill_names;
create policy custom_skill_names_delete on public.custom_skill_names
  for delete using (owner_id = auth.uid());

-- --- Dọn bia mộ --------------------------------------------------------------------

-- Dòng đã xoá chỉ cần sống đủ lâu để mọi máy kịp nhận tin. 90 ngày là rộng rãi
-- cho một chiếc máy tính bảng bỏ trong tủ suốt kỳ nghỉ hè.
create or replace function public.purge_custom_tombstones()
returns void
language sql volatile security definer set search_path = public
as $$
  delete from public.custom_questions   where deleted_at < now() - interval '90 days';
  delete from public.custom_hidden      where deleted_at < now() - interval '90 days';
  delete from public.custom_skill_names where deleted_at < now() - interval '90 days';
$$;

revoke all on function public.purge_custom_tombstones() from public, anon, authenticated;
grant execute on function public.can_read_content(uuid) to authenticated;
