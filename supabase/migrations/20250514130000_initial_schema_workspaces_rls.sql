-- Phase 1: core tenant tables + RLS helpers + policies.
-- Apply in Supabase: SQL Editor (paste) or `supabase db push` when CLI is linked.
-- Intent: members collaborate on tasks; only admins manage structure + invites.
-- Bootstrap: authenticated user inserts workspace with owner_id = auth.uid(),
--            then inserts self as admin in workspace_members (policy allows owner row).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- One owned workspace per user (V2 “one workspace per user” bootstrap).
create unique index if not exists workspaces_one_owner
  on public.workspaces (owner_id);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index if not exists workspace_members_user_id_idx
  on public.workspace_members (user_id);

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists invites_workspace_id_idx on public.invites (workspace_id);
create index if not exists invites_email_lower_idx on public.invites (lower(email));

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists projects_workspace_id_idx on public.projects (workspace_id);

create table if not exists public.sprints (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  name text not null,
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);

create index if not exists sprints_workspace_id_idx on public.sprints (workspace_id);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  sprint_id uuid references public.sprints (id) on delete set null,
  title text not null,
  status text not null check (status in ('todo', 'doing', 'done')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_workspace_id_idx on public.tasks (workspace_id);

-- ---------------------------------------------------------------------------
-- updated_at maintenance (tasks)
-- ---------------------------------------------------------------------------

create or replace function public.set_tasks_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row
  execute procedure public.set_tasks_updated_at();

-- ---------------------------------------------------------------------------
-- RLS helpers (SECURITY DEFINER avoids recursive policy evaluation on members)
-- ---------------------------------------------------------------------------

create or replace function public.is_workspace_member(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members m
    where m.workspace_id = p_workspace_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.workspace_role(p_workspace_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select m.role
  from public.workspace_members m
  where m.workspace_id = p_workspace_id
    and m.user_id = auth.uid()
  limit 1;
$$;

grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.workspace_role(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.invites enable row level security;
alter table public.projects enable row level security;
alter table public.sprints enable row level security;
alter table public.tasks enable row level security;

-- workspaces
create policy workspaces_select_member
  on public.workspaces for select
  using (public.is_workspace_member(id) or owner_id = auth.uid());

create policy workspaces_insert_owner
  on public.workspaces for insert
  with check (auth.uid() is not null and owner_id = auth.uid());

create policy workspaces_update_admin
  on public.workspaces for update
  using (public.workspace_role(id) = 'admin')
  with check (public.workspace_role(id) = 'admin');

create policy workspaces_delete_admin
  on public.workspaces for delete
  using (public.workspace_role(id) = 'admin');

-- workspace_members
create policy workspace_members_select_member
  on public.workspace_members for select
  using (public.is_workspace_member(workspace_id));

-- Owner bootstraps their admin membership row after creating the workspace.
create policy workspace_members_insert_owner_bootstrap
  on public.workspace_members for insert
  with check (
    user_id = auth.uid()
    and role = 'admin'
    and exists (
      select 1 from public.workspaces w
      where w.id = workspace_id
        and w.owner_id = auth.uid()
    )
  );

create policy workspace_members_insert_admin
  on public.workspace_members for insert
  with check (public.workspace_role(workspace_id) = 'admin');

create policy workspace_members_update_admin
  on public.workspace_members for update
  using (public.workspace_role(workspace_id) = 'admin')
  with check (public.workspace_role(workspace_id) = 'admin');

create policy workspace_members_delete_admin
  on public.workspace_members for delete
  using (public.workspace_role(workspace_id) = 'admin');

-- invites
create policy invites_select_admin_or_invitee
  on public.invites for select
  using (
    public.workspace_role(workspace_id) = 'admin'
    or (
      auth.jwt()->>'email' is not null
      and lower(email) = lower(auth.jwt()->>'email')
    )
  );

create policy invites_insert_admin
  on public.invites for insert
  with check (public.workspace_role(workspace_id) = 'admin');

create policy invites_delete_admin
  on public.invites for delete
  using (public.workspace_role(workspace_id) = 'admin');

-- projects
create policy projects_select_member
  on public.projects for select
  using (public.is_workspace_member(workspace_id));

create policy projects_write_admin
  on public.projects for insert
  with check (public.workspace_role(workspace_id) = 'admin');

create policy projects_update_admin
  on public.projects for update
  using (public.workspace_role(workspace_id) = 'admin')
  with check (public.workspace_role(workspace_id) = 'admin');

create policy projects_delete_admin
  on public.projects for delete
  using (public.workspace_role(workspace_id) = 'admin');

-- sprints
create policy sprints_select_member
  on public.sprints for select
  using (public.is_workspace_member(workspace_id));

create policy sprints_write_admin
  on public.sprints for insert
  with check (public.workspace_role(workspace_id) = 'admin');

create policy sprints_update_admin
  on public.sprints for update
  using (public.workspace_role(workspace_id) = 'admin')
  with check (public.workspace_role(workspace_id) = 'admin');

create policy sprints_delete_admin
  on public.sprints for delete
  using (public.workspace_role(workspace_id) = 'admin');

-- tasks (members + admins)
create policy tasks_select_member
  on public.tasks for select
  using (public.is_workspace_member(workspace_id));

create policy tasks_insert_member
  on public.tasks for insert
  with check (public.is_workspace_member(workspace_id));

create policy tasks_update_member
  on public.tasks for update
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy tasks_delete_member
  on public.tasks for delete
  using (public.is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------------
-- API access (Supabase PostgREST uses authenticated role)
-- ---------------------------------------------------------------------------

grant select, insert, update, delete on public.workspaces to authenticated;
grant select, insert, update, delete on public.workspace_members to authenticated;
grant select, insert, update, delete on public.invites to authenticated;
grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.sprints to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
