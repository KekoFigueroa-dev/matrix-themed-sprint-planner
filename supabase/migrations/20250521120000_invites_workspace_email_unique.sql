-- One pending invite per email per workspace (case-insensitive).
create unique index if not exists invites_workspace_email_unique
  on public.invites (workspace_id, lower(email));
