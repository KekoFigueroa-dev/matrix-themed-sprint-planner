-- Phase 2: idempotent workspace bootstrap for the signed-in user.
-- Call from the app after login: supabase.rpc('ensure_workspace_for_user').
-- SECURITY DEFINER: performs inserts regardless of RLS; body is restricted to auth.uid() only.

create or replace function public.ensure_workspace_for_user()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_ws_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select id into v_ws_id
  from public.workspaces
  where owner_id = v_uid
  limit 1;

  if v_ws_id is not null then
    insert into public.workspace_members (workspace_id, user_id, role)
    values (v_ws_id, v_uid, 'admin')
    on conflict (workspace_id, user_id) do nothing;
    return v_ws_id;
  end if;

  insert into public.workspaces (owner_id, name)
  values (v_uid, 'My workspace')
  returning id into v_ws_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_ws_id, v_uid, 'admin');

  return v_ws_id;
end;
$$;

comment on function public.ensure_workspace_for_user() is
  'Creates owned workspace + admin membership once per auth user; returns workspace id; idempotent.';

revoke all on function public.ensure_workspace_for_user() from public;
grant execute on function public.ensure_workspace_for_user() to authenticated;
