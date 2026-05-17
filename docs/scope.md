# Product scope — hierarchy

**Decision (V2.2):** **Option A** — Projects are a real, admin-managed grouping in the product (not a hidden table).

## Workspace → Projects → Sprints → Tasks

| Level | What it is | Who manages it |
|-------|------------|----------------|
| **Workspace** | Tenant boundary; one team shares data here. Created on first sign-in (`ensure_workspace_for_user`) or joined via invite. | Owner bootstrap; members via invites |
| **Project** | Named bucket of work inside a workspace (e.g. “Mobile app”, “Ops”). Sprints and tasks can reference a project. | **Admins** create/rename/delete; **members** read and select |
| **Sprint** | Time-boxed iteration under a workspace (optionally tied to a project). Task list is filtered by active sprint in the planner. | **Admins** CRUD; **members** switch sprint and work on tasks |
| **Task** | Unit of work: title, status (`todo` / `in_progress` / `blocked` / `done`), priority, assignee, started/due/finished dates, optional `archived`. Belongs to workspace + sprint. | **All members** CRUD tasks; RLS enforces workspace membership |

## UI roadmap (V2.2 polish sprint)

- **PR 1 (this slice):** Document hierarchy here; **About** page + links; README aligned with Option A.
- **PR 2:** Task tracker (statuses, dates, Done view) — migration + UI.
- **PR 3:** **ProjectManager** + project selector; filter sprints/tasks by project — in progress.
- **PR 4:** Visual refinement (matrix green text, grid/texture, IDE-style labels).
- **PR 5:** Polish sweep, docs, screenshots.

Executable plan: [v2.2.md](./v2.2.md).
