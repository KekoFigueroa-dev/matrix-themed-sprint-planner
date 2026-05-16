-- V2.1 slice 5: shared workspace roster (display names) + stable task assignees.

-- ---------------------------------------------------------------------------
-- workspace_profiles
-- ---------------------------------------------------------------------------

create table if not exists public.workspace_profiles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create index if not exists workspace_profiles_workspace_id_idx
  on public.workspace_profiles (workspace_id);

-- ---------------------------------------------------------------------------
-- tasks.assignee_user_id (replaces app-local assignee_member_id in UI)
-- ---------------------------------------------------------------------------

alter table public.tasks
  add column if not exists assignee_user_id uuid references auth.users (id) on delete set null;

create index if not exists tasks_assignee_user_id_idx on public.tasks (assignee_user_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.workspace_profiles enable row level security;

create policy workspace_profiles_select_member
  on public.workspace_profiles for select
  using (public.is_workspace_member(workspace_id));

create policy workspace_profiles_insert_self
  on public.workspace_profiles for insert
  with check (
    user_id = auth.uid()
    and public.is_workspace_member(workspace_id)
  );

create policy workspace_profiles_update_self
  on public.workspace_profiles for update
  using (
    user_id = auth.uid()
    and public.is_workspace_member(workspace_id)
  )
  with check (
    user_id = auth.uid()
    and public.is_workspace_member(workspace_id)
  );

create policy workspace_profiles_update_admin
  on public.workspace_profiles for update
  using (public.workspace_role(workspace_id) = 'admin')
  with check (public.workspace_role(workspace_id) = 'admin');

grant select, insert, update on table public.workspace_profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Backfill + ensure profiles for all members in a workspace
-- ---------------------------------------------------------------------------

create or replace function public.ensure_workspace_profiles(p_workspace_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_workspace_member(p_workspace_id) then
    raise exception 'Not a member of this workspace';
  end if;

  insert into public.workspace_profiles (workspace_id, user_id, display_name)
  select
    wm.workspace_id,
    wm.user_id,
    coalesce(nullif(split_part(u.email::text, '@', 1), ''), 'member')
  from public.workspace_members wm
  join auth.users u on u.id = wm.user_id
  where wm.workspace_id = p_workspace_id
  on conflict (workspace_id, user_id) do nothing;
end;
$$;

comment on function public.ensure_workspace_profiles(uuid) is
  'Idempotent: creates workspace_profiles rows for all members; caller must be a member.';

revoke all on function public.ensure_workspace_profiles(uuid) from public;
grant execute on function public.ensure_workspace_profiles(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Bootstrap: also create profile when ensuring owned workspace
-- ---------------------------------------------------------------------------

create or replace function public.ensure_workspace_for_user()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_ws_id uuid;
  v_email text;
  v_display text;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select u.email into v_email from auth.users u where u.id = v_uid;
  v_display := coalesce(nullif(split_part(coalesce(v_email, ''), '@', 1), ''), 'member');

  select id into v_ws_id
  from public.workspaces
  where owner_id = v_uid
  limit 1;

  if v_ws_id is not null then
    insert into public.workspace_members (workspace_id, user_id, role)
    values (v_ws_id, v_uid, 'admin')
    on conflict (workspace_id, user_id) do nothing;

    insert into public.workspace_profiles (workspace_id, user_id, display_name)
    values (v_ws_id, v_uid, v_display)
    on conflict (workspace_id, user_id) do nothing;

    return v_ws_id;
  end if;

  insert into public.workspaces (owner_id, name)
  values (v_uid, 'My workspace')
  returning id into v_ws_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_ws_id, v_uid, 'admin');

  insert into public.workspace_profiles (workspace_id, user_id, display_name)
  values (v_ws_id, v_uid, v_display);

  return v_ws_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Invite accept: membership + profile row
-- ---------------------------------------------------------------------------

create or replace function public.accept_workspace_invite(p_invite_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_display text;
  inv public.invites%rowtype;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select u.email into v_email
  from auth.users u
  where u.id = v_uid;

  if v_email is null or length(trim(v_email)) = 0 then
    raise exception 'Authenticated user has no email';
  end if;

  v_display := coalesce(nullif(split_part(v_email, '@', 1), ''), 'member');

  select * into strict inv
  from public.invites
  where id = p_invite_id;

  if lower(trim(inv.email)) <> lower(trim(v_email)) then
    raise exception 'This invite does not belong to your email address';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (inv.workspace_id, v_uid, inv.role)
  on conflict (workspace_id, user_id) do update
    set role = excluded.role;

  insert into public.workspace_profiles (workspace_id, user_id, display_name)
  values (inv.workspace_id, v_uid, v_display)
  on conflict (workspace_id, user_id) do nothing;

  delete from public.invites where id = p_invite_id;

  return inv.workspace_id;
end;
$$;
