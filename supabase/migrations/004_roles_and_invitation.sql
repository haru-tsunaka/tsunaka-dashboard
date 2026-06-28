-- 招待制 + role拡張
-- Supabase SQL Editor で実行してください

-- ============================================================
-- 1. ヘルパー関数（RLSポリシー内で使い回す）
-- ============================================================
create or replace function public.get_my_role()
returns text
language sql security definer stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.get_my_status()
returns text
language sql security definer stable
as $$
  select status from public.profiles where id = auth.uid();
$$;

-- ============================================================
-- 2. profiles テーブル拡張
-- ============================================================
alter table public.profiles
  add column if not exists status text default 'pending';

alter table public.profiles
  add column if not exists email text;

-- 既存の owner を approved に + メールアドレスを埋める
update public.profiles p
  set status = 'approved',
      email = u.email
  from auth.users u
  where p.id = u.id and p.role = 'owner';

-- role のデフォルトは member のまま（ダイヤリー専用ユーザー）
-- ダッシュボードに招待する場合は owner が手動で staff 以上に変更する
-- alter table public.profiles alter column role set default 'member';

-- ============================================================
-- 3. profiles の RLS ポリシー書き換え
-- ============================================================
drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Only owner can update profiles" on public.profiles;

-- 自分のプロフィールは誰でも読める / owner は全件読める
create policy "profiles_select"
  on public.profiles for select
  using (
    auth.uid() = id
    or public.get_my_role() = 'owner'
  );

-- owner だけが他人のプロフィールを更新できる
create policy "profiles_update"
  on public.profiles for update
  using (public.get_my_role() = 'owner');

-- トリガーからの insert を許可（service_role 経由）
create policy "profiles_insert"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ============================================================
-- 4. cases の RLS ポリシー書き換え（チーム共有）
-- ============================================================
drop policy if exists "Users can manage their own cases" on public.cases;

create policy "cases_select"
  on public.cases for select
  using (public.get_my_status() = 'approved');

create policy "cases_insert"
  on public.cases for insert
  with check (public.get_my_status() = 'approved' and auth.uid() = user_id);

create policy "cases_update"
  on public.cases for update
  using (public.get_my_status() = 'approved');

create policy "cases_delete"
  on public.cases for delete
  using (public.get_my_status() = 'approved');

-- ============================================================
-- 5. progress_logs の RLS ポリシー書き換え
-- ============================================================
drop policy if exists "Users can manage logs for their own cases" on public.progress_logs;

create policy "logs_select"
  on public.progress_logs for select
  using (public.get_my_status() = 'approved');

create policy "logs_insert"
  on public.progress_logs for insert
  with check (public.get_my_status() = 'approved' and auth.uid() = user_id);

create policy "logs_update"
  on public.progress_logs for update
  using (public.get_my_status() = 'approved');

create policy "logs_delete"
  on public.progress_logs for delete
  using (public.get_my_status() = 'approved');

-- ============================================================
-- 6. case_contacts の RLS ポリシー書き換え（owner/manager のみ）
-- ============================================================
drop policy if exists "Users can manage contacts for their own cases" on public.case_contacts;

create policy "contacts_select"
  on public.case_contacts for select
  using (
    public.get_my_status() = 'approved'
    and public.get_my_role() in ('owner', 'manager')
  );

create policy "contacts_insert"
  on public.case_contacts for insert
  with check (
    public.get_my_status() = 'approved'
    and public.get_my_role() in ('owner', 'manager')
  );

create policy "contacts_update"
  on public.case_contacts for update
  using (
    public.get_my_status() = 'approved'
    and public.get_my_role() in ('owner', 'manager')
  );

create policy "contacts_delete"
  on public.case_contacts for delete
  using (
    public.get_my_status() = 'approved'
    and public.get_my_role() in ('owner', 'manager')
  );

-- ============================================================
-- 7. 新規ユーザー登録時に profile を自動作成するトリガー
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
as $$
begin
  insert into public.profiles (id, role, status, email)
  values (new.id, 'member', 'pending', new.email);
  return new;
end;
$$;

-- トリガーが既に存在する場合は削除してから作成
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
