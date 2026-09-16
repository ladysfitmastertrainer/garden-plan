-- =============================================================================
-- Học Viện Trí Tuệ - lược đồ ban đầu
--
-- Nguyên tắc bảo vệ dữ liệu trẻ em (Nghị định 13/2023):
--  - Trẻ em KHÔNG có email, KHÔNG có mật khẩu, KHÔNG có bảng auth.users riêng
--    do các em tự tạo. Chỉ phụ huynh và giáo viên mới đăng ký tài khoản.
--  - Dữ liệu duy nhất thu thập về trẻ: tên hiển thị, ảnh đại diện (emoji), lớp
--    và kết quả học tập. Không ngày sinh, không ảnh thật, không liên lạc.
--  - Trẻ vào máy dùng chung (máy tính bảng ở lớp) qua mã lớp + mã PIN, được cấp
--    một phiên ẩn danh chỉ đọc/ghi đúng hồ sơ của mình.
-- =============================================================================

create extension if not exists pgcrypto;

-- --- Bảng ---------------------------------------------------------------------

-- Hồ sơ người lớn. 1-1 với auth.users.
create table if not exists public.profiles (
  id           uuid primary key references auth.users on delete cascade,
  role         text not null check (role in ('parent', 'teacher')),
  display_name text not null,
  created_at   timestamptz not null default now()
);

create table if not exists public.classes (
  id         uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  name       text not null,
  -- Mã lớp để trẻ vào máy dùng chung. Coi như thông tin nhạy cảm: ai có mã này
  -- sẽ xem được danh sách tên + ảnh đại diện của lớp (nhưng không xem được kết
  -- quả học tập, và vẫn phải có mã PIN mới vào được hồ sơ).
  join_code  text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null references public.profiles(id) on delete cascade,
  name              text not null,
  avatar            text not null,
  grade             int  not null check (grade between 1 and 5),
  total_xp          int  not null default 0 check (total_xp >= 0),
  gold              int  not null default 0 check (gold >= 0),
  equipped_item_ids text[] not null default '{}',
  -- Băm bằng bcrypt (pgcrypto). Không bao giờ lưu mã PIN dạng thô.
  --
  -- CỐ Ý để trống lúc tạo hồ sơ, KHÔNG đặt mã mặc định kiểu '0000'. Mã mặc định
  -- mà không ai đổi còn tệ hơn không có mã. Chưa đặt mã thì trẻ chưa vào được
  -- máy dùng chung - trên máy gia đình thì phụ huynh đã đăng nhập rồi nên không
  -- cần mã PIN.
  pin_hash          text,
  created_at        timestamptz not null default now(),
  last_played_at    timestamptz not null default now()
);

create index if not exists students_owner_idx on public.students(owner_id);

create table if not exists public.class_members (
  class_id   uuid references public.classes(id)  on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  primary key (class_id, student_id)
);

create index if not exists class_members_student_idx on public.class_members(student_id);

-- Phiên của trẻ trên máy dùng chung: nối một auth.users ẩn danh với một học sinh.
create table if not exists public.student_sessions (
  user_id    uuid primary key references auth.users on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.skill_mastery (
  student_id   uuid references public.students(id) on delete cascade,
  skill_id     text not null,
  mastery      int  not null default 0 check (mastery between 0 and 100),
  box          int  not null default 1 check (box between 1 and 5),
  due_at       timestamptz not null default now(),
  attempts     int  not null default 0,
  correct      int  not null default 0,
  streak       int  not null default 0,
  last_seen_at timestamptz not null default now(),
  primary key (student_id, skill_id)
);

-- Nhật ký từng câu trả lời - nguồn dữ liệu cho màn hình phụ huynh và giáo viên.
create table if not exists public.attempts (
  id          bigint generated always as identity primary key,
  student_id  uuid not null references public.students(id) on delete cascade,
  question_id text not null,
  skill_id    text not null,
  subject     text not null,
  difficulty  int  not null,
  correct     boolean not null,
  quality     text,
  duration_ms int  not null,
  used_hint   boolean not null default false,
  answered_at timestamptz not null,
  -- Chặn ghi trùng khi hàng đợi offline gửi lại: cùng học sinh, cùng câu, cùng
  -- thời điểm trả lời thì chỉ tính một lần.
  unique (student_id, question_id, answered_at)
);

create index if not exists attempts_student_time_idx
  on public.attempts(student_id, answered_at desc);

create table if not exists public.inventory (
  id          bigint generated always as identity primary key,
  student_id  uuid not null references public.students(id) on delete cascade,
  item_id     text not null,
  acquired_at timestamptz not null default now()
);

create index if not exists inventory_student_idx on public.inventory(student_id);

create table if not exists public.virtues (
  student_id uuid references public.students(id) on delete cascade,
  virtue     text not null,
  count      int  not null default 0 check (count >= 0),
  primary key (student_id, virtue)
);

-- Phần tiến độ không tách thành bảng riêng được (tiến độ bản đồ, số trận).
create table if not exists public.student_progress (
  student_id    uuid primary key references public.students(id) on delete cascade,
  cleared_nodes jsonb not null default '{}'::jsonb,
  battles_played int  not null default 0,
  battles_won    int  not null default 0,
  updated_at    timestamptz not null default now()
);

-- --- Hàm hỗ trợ phân quyền ------------------------------------------------------
-- Dùng SECURITY DEFINER để policy không tự gọi lại chính bảng đang kiểm tra
-- (tránh đệ quy vô hạn trong RLS).

-- Học sinh gắn với phiên hiện tại, nếu người dùng đang đăng nhập là một đứa trẻ.
create or replace function public.current_student_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select student_id from public.student_sessions where user_id = auth.uid()
$$;

-- Giáo viên hiện tại có dạy học sinh này không?
create or replace function public.teaches_student(target uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.class_members cm
    join public.classes c on c.id = cm.class_id
    where cm.student_id = target and c.teacher_id = auth.uid()
  )
$$;

-- Được ĐỌC dữ liệu của học sinh này không? Chủ hồ sơ, giáo viên dạy lớp có em
-- đó, hoặc chính em đó.
create or replace function public.can_read_student(target uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select
    exists (select 1 from public.students s where s.id = target and s.owner_id = auth.uid())
    or public.teaches_student(target)
    or target = public.current_student_id()
$$;

-- Được GHI dữ liệu học tập của học sinh này không?
-- Giáo viên CỐ Ý bị loại: thầy cô xem được tiến độ nhưng không sửa được vàng,
-- kinh nghiệm hay mức thạo của học sinh.
create or replace function public.can_write_student(target uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select
    exists (select 1 from public.students s where s.id = target and s.owner_id = auth.uid())
    or target = public.current_student_id()
$$;

-- --- Bật RLS trên tất cả các bảng -------------------------------------------------

alter table public.profiles         enable row level security;
alter table public.classes          enable row level security;
alter table public.students         enable row level security;
alter table public.class_members    enable row level security;
alter table public.student_sessions enable row level security;
alter table public.skill_mastery    enable row level security;
alter table public.attempts         enable row level security;
alter table public.inventory        enable row level security;
alter table public.virtues          enable row level security;
alter table public.student_progress enable row level security;

-- --- Policy ------------------------------------------------------------------------

-- profiles: chỉ tự đọc và tự sửa hồ sơ của mình.
drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- classes: giáo viên toàn quyền với lớp mình.
drop policy if exists classes_own on public.classes;
create policy classes_own on public.classes
  for all using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

-- students
--
-- Điều kiện của chủ hồ sơ và của chính đứa trẻ được viết THẲNG trên cột của
-- hàng, không gói vào hàm. Lý do: hàm `stable` dùng ảnh chụp dữ liệu tại thời
-- điểm bắt đầu câu lệnh nên KHÔNG nhìn thấy hàng vừa được chèn. Mà Postgres lại
-- áp policy SELECT cho cả `insert ... returning`, đúng dạng câu lệnh client
-- dùng khi tạo hồ sơ học sinh - gói vào hàm là hỏng ngay ở bước tạo hồ sơ.
drop policy if exists students_read on public.students;
create policy students_read on public.students
  for select using (
    owner_id = auth.uid()
    or id = public.current_student_id()
    or public.teaches_student(id)
  );

drop policy if exists students_insert on public.students;
create policy students_insert on public.students
  for insert with check (owner_id = auth.uid());

drop policy if exists students_update on public.students;
create policy students_update on public.students
  for update
  using (owner_id = auth.uid() or id = public.current_student_id())
  with check (owner_id = auth.uid() or id = public.current_student_id());

-- Chỉ chủ hồ sơ mới xoá được học sinh - trẻ không tự xoá hồ sơ của mình được.
drop policy if exists students_delete on public.students;
create policy students_delete on public.students
  for delete using (owner_id = auth.uid());

-- class_members: giáo viên quản lý lớp mình; ai đọc được học sinh thì đọc được.
drop policy if exists class_members_read on public.class_members;
create policy class_members_read on public.class_members
  for select using (
    public.can_read_student(student_id)
    or exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid())
  );

drop policy if exists class_members_write on public.class_members;
create policy class_members_write on public.class_members
  for all using (
    exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid())
  ) with check (
    exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid())
  );

-- student_sessions: chỉ tự xem phiên của chính mình. Việc TẠO phiên đi qua hàm
-- claim_student() chứ không cho ghi trực tiếp - nếu không, bất kỳ ai cũng tự
-- gán mình vào hồ sơ bất kỳ.
drop policy if exists student_sessions_self on public.student_sessions;
create policy student_sessions_self on public.student_sessions
  for select using (user_id = auth.uid());

-- Các bảng dữ liệu học tập: đọc theo can_read_student, ghi theo can_write_student.
drop policy if exists skill_mastery_read on public.skill_mastery;
create policy skill_mastery_read on public.skill_mastery
  for select using (public.can_read_student(student_id));
drop policy if exists skill_mastery_write on public.skill_mastery;
create policy skill_mastery_write on public.skill_mastery
  for all using (public.can_write_student(student_id))
  with check (public.can_write_student(student_id));

drop policy if exists attempts_read on public.attempts;
create policy attempts_read on public.attempts
  for select using (public.can_read_student(student_id));
-- Nhật ký chỉ được THÊM, không sửa không xoá: đó là bằng chứng học tập.
drop policy if exists attempts_insert on public.attempts;
create policy attempts_insert on public.attempts
  for insert with check (public.can_write_student(student_id));

-- Không có policy cho update/delete nghĩa là "không hàng nào khớp" - thao tác
-- vẫn chạy nhưng không đổi gì. Thu hồi hẳn quyền để nó báo lỗi rõ ràng, đúng
-- với ý định "bảng này chỉ thêm".
revoke update, delete on public.attempts from authenticated, anon;

drop policy if exists inventory_read on public.inventory;
create policy inventory_read on public.inventory
  for select using (public.can_read_student(student_id));
drop policy if exists inventory_write on public.inventory;
create policy inventory_write on public.inventory
  for all using (public.can_write_student(student_id))
  with check (public.can_write_student(student_id));

drop policy if exists virtues_read on public.virtues;
create policy virtues_read on public.virtues
  for select using (public.can_read_student(student_id));
drop policy if exists virtues_write on public.virtues;
create policy virtues_write on public.virtues
  for all using (public.can_write_student(student_id))
  with check (public.can_write_student(student_id));

drop policy if exists student_progress_read on public.student_progress;
create policy student_progress_read on public.student_progress
  for select using (public.can_read_student(student_id));
drop policy if exists student_progress_write on public.student_progress;
create policy student_progress_write on public.student_progress
  for all using (public.can_write_student(student_id))
  with check (public.can_write_student(student_id));

-- --- Hàm nghiệp vụ ------------------------------------------------------------------

-- Tạo hồ sơ người lớn ngay khi đăng ký. Chạy tự động qua trigger để client không
-- phải nhớ gọi.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  -- Người dùng ẩn danh (trẻ trên máy dùng chung) không có hồ sơ người lớn.
  if new.email is null then
    return new;
  end if;

  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'parent'),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Đặt mã PIN cho một học sinh. Chỉ chủ hồ sơ hoặc giáo viên của lớp có em đó.
create or replace function public.set_student_pin(p_student_id uuid, p_pin text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if p_pin !~ '^\d{4}$' then
    raise exception 'Mã PIN phải gồm đúng 4 chữ số';
  end if;

  if not exists (select 1 from public.students s where s.id = p_student_id and s.owner_id = auth.uid())
     and not exists (
       select 1 from public.class_members cm
       join public.classes c on c.id = cm.class_id
       where cm.student_id = p_student_id and c.teacher_id = auth.uid()
     ) then
    raise exception 'Không có quyền đặt mã PIN cho học sinh này';
  end if;

  update public.students
     set pin_hash = crypt(p_pin, gen_salt('bf'))
   where id = p_student_id;
end $$;

-- Danh sách học sinh của một lớp, để trẻ chọn ảnh đại diện của mình trên máy
-- dùng chung. CỐ Ý chỉ trả về tên và ảnh đại diện - không kèm bất kỳ kết quả
-- học tập nào, vì hàm này chạy trước khi trẻ nhập mã PIN.
create or replace function public.list_class_roster(p_join_code text)
returns table (student_id uuid, name text, avatar text, grade int)
language sql stable security definer set search_path = public
as $$
  select s.id, s.name, s.avatar, s.grade
    from public.students s
    join public.class_members cm on cm.student_id = s.id
    join public.classes c on c.id = cm.class_id
   where c.join_code = upper(btrim(p_join_code))
   order by s.name
$$;

-- Trẻ nhận hồ sơ của mình trên máy dùng chung: đã đăng nhập ẩn danh, nhập đúng
-- mã PIN thì được gán phiên vào hồ sơ đó.
create or replace function public.claim_student(p_student_id uuid, p_pin text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_ok boolean;
  v_has_pin boolean;
begin
  if auth.uid() is null then
    raise exception 'Chưa đăng nhập';
  end if;

  select s.pin_hash is not null, (s.pin_hash = crypt(p_pin, s.pin_hash))
    into v_has_pin, v_ok
    from public.students s
   where s.id = p_student_id;

  -- Phân biệt rõ "chưa đặt mã" với "mã sai": thầy cô cần biết mình quên đặt mã,
  -- còn trẻ nhập sai thì chỉ nhận thông báo chung.
  if v_has_pin is false then
    raise exception 'Hồ sơ này chưa được đặt mã PIN. Thầy cô hoặc bố mẹ cần đặt mã trước.';
  end if;

  if v_ok is not true then
    -- Thông báo chung, không tiết lộ hồ sơ có tồn tại hay không.
    raise exception 'Mã PIN không đúng';
  end if;

  insert into public.student_sessions (user_id, student_id)
  values (auth.uid(), p_student_id)
  on conflict (user_id) do update set student_id = excluded.student_id;

  return p_student_id;
end $$;

-- Mã lớp ngẫu nhiên, bỏ các ký tự dễ đọc nhầm (0/O, 1/I).
create or replace function public.generate_join_code()
returns text
language sql volatile
as $$
  select string_agg(
    substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 32)::int + 1, 1),
    ''
  )
  from generate_series(1, 6)
$$;

alter table public.classes alter column join_code set default public.generate_join_code();

-- Quyền gọi hàm: chỉ người đã đăng nhập (kể cả ẩn danh) mới gọi được.
revoke all on function public.claim_student(uuid, text)      from public, anon;
revoke all on function public.list_class_roster(text)        from public, anon;
revoke all on function public.set_student_pin(uuid, text)    from public, anon;
grant execute on function public.claim_student(uuid, text)   to authenticated;
grant execute on function public.list_class_roster(text)     to authenticated;
grant execute on function public.set_student_pin(uuid, text) to authenticated;
grant execute on function public.teaches_student(uuid)     to authenticated;
