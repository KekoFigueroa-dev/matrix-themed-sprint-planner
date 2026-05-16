# Sprint Planner

Web-based sprint planning and tasks for small teams. **V2** targets portfolio-grade polish, **Supabase Auth + Postgres + RLS**, multi-user workspaces, and **Vercel** deployment.

## Documentation map (start here)

| Doc | Purpose |
|-----|--------|
| **[docs/v2.md](./docs/v2.md)** | Full V2 spec: **progress tracker**, phases 0–5, entities, permission matrix, flows, maintainer test plans |
| **[docs/rls.md](./docs/rls.md)** | RLS policy model, RPC patterns, testing checklist |
| **[AGENTS.md](./AGENTS.md)** | Agent rules, handoff habits, **Cursor bootstrap prompt** |

**Agents and contributors:** read [docs/v2.md](./docs/v2.md) first, then update its **Progress tracker** when you ship work.

---

## Current app (`main`)

| Area | Status |
|------|--------|
| **Stack** | React 18, TypeScript, **CRA** (`react-scripts`), Framer Motion, Lucide, **React Router**, `@supabase/supabase-js` |
| **Auth** | `/login`, `/register`; protected `/`; session persists on refresh; **`ensure_workspace_for_user`** RPC |
| **Workspace** | Auto-created on first sign-in; rows in `workspaces` + `workspace_members` |
| **Invites** | `/invites` — admin invite/revoke; invitee signs in with **invited email** and **Accept** (no invite email sent by the app) |
| **Planner** | **Sprints + tasks** → Supabase (`sprints`, `tasks`, workspace-scoped). **Team panel** → `localStorage` only |
| **Permissions** | Role badge; members manage tasks only; admins manage sprints (Phase 4) |
| **Deploy** | `vercel.json` ready; see [Deployment (Vercel)](#deployment-vercel) |
| **Not in UI yet** | `projects` table; `doing` task status |
| **V2 framework target** | Next.js App Router — see [docs/v2.md](./docs/v2.md) |

---

## Features (today)

- Sprint CRUD and switcher (stored in **Supabase**)
- Tasks with priority, complete toggle, assignee tags (tasks in **Supabase**; assignee links to local team list)
- Team sidebar (local names/roles for display)
- Stats strip; retro terminal styling
- Multi-user workspace + email invites

---

## Local setup

```bash
git clone https://github.com/KekoFigueroa-dev/matrix-themed-sprint-planner.git
cd matrix-themed-sprint-planner
npm install
cp .env.example .env.local   # then fill in Supabase URL + key
npm start
```

- Dev server: [http://localhost:3000](http://localhost:3000) — use **one origin** consistently (`localhost` vs `127.0.0.1` have separate storage).
- Production bundle: `npm run build` → `build/`

On Windows PowerShell, if execution policy blocks scripts:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

**Repository hygiene:** Do not commit `node_modules`. If `git status` shows noise under `node_modules/`, run `git restore node_modules` before committing.

---

## Environment variables (CRA)

Create **`.env.local`** next to `package.json` (never commit secrets). Restart `npm start` after changes.

| Variable | Required |
|----------|----------|
| `REACT_APP_SUPABASE_URL` | Yes — Dashboard → Project Settings → API → Project URL |
| `REACT_APP_SUPABASE_ANON_KEY` | Yes — **or** `REACT_APP_SUPABASE_PUBLISHABLE_KEY` |

See [`.env.example`](./.env.example).

**Next.js (future):** `NEXT_PUBLIC_SUPABASE_*` — documented in [docs/v2.md](./docs/v2.md) when migration lands.

---

## Supabase migrations (apply in order)

Run each file once in **SQL Editor** (or `supabase db push` if CLI is linked):

| Order | File | Purpose |
|-------|------|---------|
| 1 | `supabase/migrations/20250514130000_initial_schema_workspaces_rls.sql` | Tables + RLS |
| 2 | `supabase/migrations/20250515120000_ensure_workspace_for_user.sql` | Bootstrap workspace RPC |
| 3 | `supabase/migrations/20250516180000_accept_workspace_invite.sql` | Accept invite RPC |
| 4 | `supabase/migrations/20250517120000_tasks_planner_fields.sql` | `priority`, `assignee_member_id` on `tasks` |

**Dashboard checklist**

1. Create project → **Authentication → Providers:** enable **Email**.
2. **Authentication → URL configuration:** Site URL `http://localhost:3000`; redirect `http://localhost:3000/**` (add production URL when deploying).
3. Run migrations above.
4. Confirm **RLS enabled** on all tables.

Maintainer test plans: [docs/v2.md](./docs/v2.md) (Phases 1–3, Planner slice).

---

## Quick smoke test (local)

1. Register or sign in → planner loads.
2. Hard refresh → still signed in, still on planner.
3. Create sprint + task → rows appear in Supabase **`sprints`** / **`tasks`**.
4. Optional: `/invites` flow with two accounts.

---

## Project structure

```text
docs/
  ├── v2.md
  └── rls.md
supabase/migrations/     # SQL — apply in order (see table above)
src/
  ├── App.tsx            # Auth gate + routes
  ├── lib/
  │   ├── supabaseClient.ts
  │   ├── workspace.ts   # Active workspace_id for current user
  │   └── plannerDb.ts   # Sprints/tasks CRUD
  ├── pages/
  │   ├── PlannerPage.tsx
  │   ├── LoginPage.tsx
  │   ├── RegisterPage.tsx
  │   ├── InvitesPage.tsx
  │   └── ConfigMissingPage.tsx
  └── components/        # SprintManager, TodoItem, TeamPanel, …
AGENTS.md
README.md
.env.example
```

---

## Architecture

```text
Browser (CRA + React Router) ──► Supabase Auth (JWT)
                              ──► PostgREST ──► Postgres + RLS
```

- **Privileged flows:** `ensure_workspace_for_user`, `accept_workspace_invite` (security definer RPCs).
- **RLS:** members CRUD **tasks**; admins manage **sprints**, **projects**, **invites**. Details: [docs/rls.md](./docs/rls.md).

---

## Deployment (Vercel)

**Live demo:** add your production URL here after deploy (e.g. `https://matrix-themed-sprint-planner.vercel.app`).

This repo includes [`vercel.json`](./vercel.json) (CRA build + SPA rewrites for React Router).

### 1. Import project (Vercel dashboard)

1. [vercel.com](https://vercel.com) → **Add New** → **Project** → import `matrix-themed-sprint-planner` from GitHub.
2. Framework preset: **Create React App** (or Other — settings below are set in `vercel.json`).
3. **Environment variables** (Production + Preview):

| Name | Value |
|------|--------|
| `REACT_APP_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `REACT_APP_SUPABASE_ANON_KEY` | Same → `anon` public key, **or** `REACT_APP_SUPABASE_PUBLISHABLE_KEY` |

4. **Deploy**. Copy the `*.vercel.app` URL.

### 2. Supabase Auth URLs (required)

Supabase → **Authentication** → **URL configuration**:

| Field | Value |
|-------|--------|
| **Site URL** | `https://YOUR_VERCEL_DOMAIN` |
| **Redirect URLs** | `https://YOUR_VERCEL_DOMAIN/**` |

Keep `http://localhost:3000` and `http://localhost:3000/**` for local dev.

### 3. Production smoke test

Sign up → planner → create sprint/task → hard refresh on `/invites` and `/login` (SPA routes). Optional: admin invites member (register with invited email → `/invites` → Accept).

Full checklist: [docs/v2.md § Phase 5 — Maintainer test plan](./docs/v2.md#phase-5--maintainer-test-plan).

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | CRA dev server |
| `npm run build` | Production build |
| `npm test` | CRA test runner |

---

## Git workflow (branches)

Use **`main`** as the integration branch. Start each slice from updated `main` (e.g. `feat/phase-4-permissions-ui`). Delete feature branches after merge. See [AGENTS.md](./AGENTS.md).

---

## License

See [LICENSE](./LICENSE) in the repository.
