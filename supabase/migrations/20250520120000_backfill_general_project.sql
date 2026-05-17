-- V2.2 PR3: backfill a "General" project for sprints/tasks missing project_id.

insert into public.projects (workspace_id, name)
select w.id, 'General'
from public.workspaces w
where exists (
    select 1
    from public.sprints s
    where s.workspace_id = w.id
      and s.project_id is null
)
and not exists (
    select 1
    from public.projects p
    where p.workspace_id = w.id
      and p.name = 'General'
);

update public.sprints s
set project_id = p.id
from public.projects p
where s.project_id is null
  and s.workspace_id = p.workspace_id
  and p.name = 'General';

update public.tasks t
set project_id = p.id
from public.projects p
where t.project_id is null
  and t.workspace_id = p.workspace_id
  and p.name = 'General';
