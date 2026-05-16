-- Phase 3: invite acceptance via SECURITY DEFINER (email must match auth.users).
-- Client: supabase.rpc('accept_workspace_invite', { p_invite_id: '<uuid>' })

create or replace function public.accept_workspace_invite(p_invite_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
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

  delete from public.invites where id = p_invite_id;

  return inv.workspace_id;
end;
$$;

comment on function public.accept_workspace_invite(uuid) is
  'Adds membership from invite row when invite.email matches auth.users email; deletes invite; security definer.';

revoke all on function public.accept_workspace_invite(uuid) from public;
grant execute on function public.accept_workspace_invite(uuid) to authenticated;
