-- V2.2 PR2: task tracker — expanded statuses, dates, archive flag.

-- ---------------------------------------------------------------------------
-- Expand status enum (todo | doing | done) -> todo | in_progress | blocked | done
-- ---------------------------------------------------------------------------

alter table public.tasks drop constraint if exists tasks_status_check;

update public.tasks
set status = 'in_progress'
where status = 'doing';

alter table public.tasks
  add constraint tasks_status_check
  check (status in ('todo', 'in_progress', 'blocked', 'done'));

-- ---------------------------------------------------------------------------
-- Lifecycle columns
-- ---------------------------------------------------------------------------

alter table public.tasks
  add column if not exists started_on date,
  add column if not exists expected_delivery_on date,
  add column if not exists finished_on date,
  add column if not exists blocked_reason text,
  add column if not exists archived boolean not null default false;

create index if not exists tasks_archived_idx on public.tasks (archived);
create index if not exists tasks_status_idx on public.tasks (status);
