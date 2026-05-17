# Production screenshots

PNG captures from **https://matrix-themed-sprint-planner.vercel.app** (embedded in the root [README](../../README.md#app-walkthrough-production)).

| File | Route | What it shows |
|------|-------|----------------|
| `login.png` | `/login` | Sign-in card: Supabase Auth + Workspace RLS chips, magenta Sign in, red Register link |
| `planner.png` | `/` | Full planner: team sidebar, project/sprint selectors, add-task form, tasks with status/priority/dates/assignee, stats |
| `done.png` | `/done` | Done & archived for active project: Show archived toggle, Archive completed, restore/delete |
| `invites.png` | `/invites` | Admin invite form (workspace, email, role); note that no email is sent by the app |
| `supaDB.png` | Supabase Dashboard | Postgres schema: workspaces → projects → sprints → tasks, members, profiles, invites |

## Replacing screenshots

1. Capture at ~1280px+ width on production (or preview after merge).
2. Overwrite the PNG in this folder (keep filenames).
3. Update captions in README if the UI changed materially.
4. Commit: `git add docs/images/*.png README.md && git commit -m "docs: refresh screenshots"`
