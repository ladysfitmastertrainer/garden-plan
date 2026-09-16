-- =============================================================================
-- Bản đồ lục địa tự vẽ.
--
-- Trình vẽ bản đồ ở trang quản trị xưa nay KHÔNG lưu gì: nó xuất ra một khối
-- TypeScript để ai đó dán vào `src/features/world/continent.ts` rồi dựng lại
-- app. Người biết lớp mình cần bản đồ thế nào lại đúng là người không làm nổi
-- việc đó - y hệt chuyện câu hỏi tự soạn trước khi có 0002.
--
-- Nên bảng này đi theo đúng khuôn 0002: mã nguồn vẫn là bản gốc không ai sửa
-- được từ trình duyệt, bảng này chỉ CHỒNG LÊN. Xoá dòng ở đây là mọi thứ về như
-- cũ, nên vẽ hỏng cũng không mất gì.
--
-- MỘT DÒNG CHO MỖI (người soạn, lớp), giống `custom_skill_names` chứ không giống
-- `custom_questions`: hai máy cùng sửa bản đồ lớp 3 phải đụng vào CÙNG một dòng
-- để bản mới hơn thắng. Nếu mỗi máy sinh một uuid riêng thì hợp nhất ra hai bản
-- đồ cho một lớp, và không ai nói được bản nào đang có hiệu lực.
-- =============================================================================

create table if not exists public.custom_continents (
  owner_id   uuid not null references public.profiles(id) on delete cascade,
  grade      int  not null check (grade between 1 and 5),
  -- 12 dòng ký tự, đúng lưới `GRID` bên client. Kiểm hình dạng ở đây chỉ chặn
  -- những gì chắc chắn hỏng; luật thật (đủ bốn môn, lâu đài, liền mạch) do
  -- `validateContinent` lo, và nó cần biết ngữ nghĩa nên không thuộc về SQL.
  rows       jsonb not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (owner_id, grade),
  constraint custom_continents_rows_shape check (
    jsonb_typeof(rows) = 'array' and jsonb_array_length(rows) = 12
  )
);

alter table public.custom_continents enable row level security;

-- Đọc: theo `can_read_content` của 0002 - trẻ đọc được bản đồ của bố mẹ và của
-- cô giáo mình, người lớn không đọc được của người lớn khác.
--
-- Ghi: CHỈ chính người soạn, và viết thẳng `owner_id = auth.uid()` chứ không gói
-- vào hàm, cùng lý do đã ghi ở 0002.

drop policy if exists custom_continents_read on public.custom_continents;
create policy custom_continents_read on public.custom_continents
  for select using (owner_id = auth.uid() or public.can_read_content(owner_id));

drop policy if exists custom_continents_insert on public.custom_continents;
create policy custom_continents_insert on public.custom_continents
  for insert with check (owner_id = auth.uid());

drop policy if exists custom_continents_update on public.custom_continents;
create policy custom_continents_update on public.custom_continents
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists custom_continents_delete on public.custom_continents;
create policy custom_continents_delete on public.custom_continents
  for delete using (owner_id = auth.uid());

-- Dọn bia mộ cùng nhịp với các bảng 0002.
create or replace function public.purge_custom_tombstones()
returns void
language sql volatile security definer set search_path = public
as $$
  delete from public.custom_questions   where deleted_at < now() - interval '90 days';
  delete from public.custom_hidden      where deleted_at < now() - interval '90 days';
  delete from public.custom_skill_names where deleted_at < now() - interval '90 days';
  delete from public.custom_continents  where deleted_at < now() - interval '90 days';
$$;

revoke all on function public.purge_custom_tombstones() from public, anon, authenticated;
