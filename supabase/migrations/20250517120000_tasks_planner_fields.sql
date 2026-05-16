-- Planner UX fields on tasks (priority + local team assignee id).
-- Team panel remains localStorage; assignee_member_id is an app-local reference.

alter table public.tasks
  add column if not exists priority text not null default 'Medium'
    check (priority in ('High', 'Medium', 'Low'));

alter table public.tasks
  add column if not exists assignee_member_id bigint;
