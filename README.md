# Sprint Planner

Web-based sprint planning and tasks for small teams. **V2** targets portfolio-grade polish, **Supabase Auth + Postgres + RLS**, multi-user workspaces, and **Vercel** deployment.

## Documentation map (start here)

| Doc | Purpose |
|-----|--------|
| **[docs/v2.md](./docs/v2.md)** | Full V2 spec: **progress tracker**, phases 0–5, entities, permission matrix, flows, out-of-scope, Supabase click-steps summary, time estimates |
| **[docs/rls.md](./docs/rls.md)** | RLS policy model, RPC patterns, testing checklist |
| **[AGENTS.md](./AGENTS.md)** | Agent rules, handoff habits, **Cursor bootstrap prompt** |

**Agents and contributors:** read [docs/v2.md](./docs/v2.md) first, then update its **Progress tracker** when you stop or ship work.

---

## Current app (main branch)

- **Stack:** React 18, TypeScript, **Create React App** (`react-scripts`), Framer Motion, Lucide, `@supabase/supabase-js` (not wired).
- **Persistence:** Browser `localStorage` for sprints, todos, and team members.
- **V2 target stack:** **Next.js** + Supabase — see [docs/v2.md](./docs/v2.md#current-repository-state-vs-v2-read-this-first).

---

## Features (today)

- Sprint CRUD and switcher; tasks with priority and assignee; team sidebar; stats strip; retro terminal styling.

---

## Project structure

```text
docs/
  ├── v2.md          # V2 spec + progress tracker + maintainer test plans
  └── rls.md         # RLS model (+ link to migration SQL)
supabase/
  └── migrations/
      └── 20250514130000_initial_schema_workspaces_rls.sql
public/
  └── index.html
src/
  ├── App.tsx
  ├── index.tsx
  ├── env.ts
  ├── styles.css
  ├── types.ts
  └── components/
      ├── AddTodoForm.tsx
      ├── TodoItem.tsx
      ├── TeamPanel.tsx
      ├── StatsPanel.tsx
      └── SprintManager.tsx
AGENTS.md
README.md
package.json
tsconfig.json
```

---

## Local setup (CRA — until Next migration)

```bash
git clone https://github.com/KekoFigueroa-dev/matrix-themed-sprint-planner.git
cd matrix-themed-sprint-planner
npm install
npm start
```

- Dev server: [http://localhost:3000](http://localhost:3000)  
- Production bundle: `npm run build` → output in `build/`

On Windows PowerShell, if execution policy blocks scripts:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

**Note:** If `git status` shows massive `node_modules` changes, this repo may have historically tracked `node_modules`. Run `git restore node_modules` before committing; long-term, remove `node_modules` from git in a dedicated PR. See [AGENTS.md](./AGENTS.md).

---

## Environment variables

### Next.js (V2 target — use after migration)

Create `.env.local` (never commit secrets):

| Variable | Where |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Same → `service_role` key — **server-only** (Route Handlers / server actions). **Never** expose to the browser. |

On **Vercel:** Project → Settings → Environment Variables — add the same names for Production / Preview as needed.

### Create React App (interim)

If Supabase is wired before Next migration, CRA expects:

- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`

Prefer migrating to Next and standardizing on `NEXT_PUBLIC_*` per [docs/v2.md](./docs/v2.md).

---

## Supabase dashboard (short checklist)

1. Create project → enable **Email** provider.  
2. **Authentication → URL configuration:** set Site URL and Redirect URLs for `http://localhost:3000` and `https://YOUR_VERCEL_DOMAIN` (and `/**` or `/auth/callback` as you implement).  
3. Run SQL migrations from the repo (`supabase/migrations/`). Open **`20250514130000_initial_schema_workspaces_rls.sql`**, copy into SQL Editor, run once.  
4. Confirm RLS is enabled on all tenant tables.

**After applying:** follow **Phase 1: Maintainer test plan** in [docs/v2.md](./docs/v2.md#phase-1-maintainer-test-plan-after-applying-sql).

Details and click-flow narrative: [docs/v2.md § Supabase dashboard](./docs/v2.md#supabase-dashboard--click-path-summary).

---

## Architecture (V2 target)

```text
Browser (Next.js) ──► Supabase Auth (JWT)
                   ──► Supabase PostgREST ──► Postgres + RLS
```

- **Auth:** Email/password; session available to the client via Supabase JS.  
- **Data:** Tables in [docs/v2.md](./docs/v2.md#table-sketches-postgres); access enforced by **RLS**.  
- **Bootstrap / invite edge cases:** Prefer **`SECURITY DEFINER` RPC** (e.g. `ensure_workspace_for_user`, `accept_workspace_invite`) so policies stay tight — see [docs/rls.md](./docs/rls.md).

**Schema summary:** `workspaces`, `workspace_members`, `invites`, `projects`, `sprints`, `tasks` — full field list and relationships in [docs/v2.md](./docs/v2.md#entities-and-relationships).

---

## Deployment (Vercel)

1. Connect the GitHub repo to Vercel; framework **Next.js** once the app is migrated.  
2. Set `NEXT_PUBLIC_SUPABASE_*` (and server-only `SUPABASE_SERVICE_ROLE_KEY` only if used).  
3. Match Supabase **redirect URLs** to the Vercel domain.  
4. Run through the **Definition of done** in [docs/v2.md](./docs/v2.md#phase-5--deployment--credibility-05-10-h) (sign up, workspace, invite, tasks, negative permission checks).

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | CRA dev server |
| `npm run build` | Production build |
| `npm test` | CRA test runner |

(Add `lint` / `typecheck` when Next.js and tooling land — tracked in Phase 5 of [docs/v2.md](./docs/v2.md).)

---

## License

See [LICENSE](./LICENSE) in the repository.
