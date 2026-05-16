# Row Level Security (RLS) — policy model

This document explains **why** the database enforces access the way it does. **RLS must hold even if the UI is wrong or bypassed.** UI checks are for clarity only.

Companion: [V2 spec](./v2.md) (entities, flows, phases).

**Executable policies:** [../supabase/migrations/20250514130000_initial_schema_workspaces_rls.sql](../supabase/migrations/20250514130000_initial_schema_workspaces_rls.sql) — treat as source of truth; this doc explains intent. When policies change, update both the migration (new file) and this narrative.

---

## Principles

1. **Every table** that holds tenant data has **RLS enabled**.
2. **No broad “public insert”** on `workspace_members` or `invites` that would let arbitrary users attach to a workspace.
3. **Privileged transitions** (first workspace, accepting an invite) go through **`SECURITY DEFINER` functions** owned by a locked-down role, where the function body checks `auth.uid()`, email, and row contents, then writes minimal rows. The anon/authenticated role only has **`EXECUTE`** on those functions — not blanket table write access.
4. **Helper functions** (stable, `STABLE` or `IMMUTABLE` as appropriate) reduce duplicated policy logic:
   - `is_workspace_member(workspace_id uuid) returns boolean` — true if `auth.uid()` has a row in `workspace_members` for that workspace.
   - `workspace_role(workspace_id uuid) returns text` — `'admin'`, `'member'`, or `NULL` if not a member.

Implementations live in SQL migrations; names may be prefixed (e.g. `public.is_workspace_member`) per project convention.

---

## Table-by-table intent

### `workspaces`

- **SELECT:** user may read a workspace if they are a **member** of that workspace (or if `owner_id = auth.uid()` and membership row always exists — prefer single rule: member check covers owner once owner has membership).
- **INSERT:** either **disallowed** for clients entirely (workspace only created via RPC), or narrowly allowed only when `owner_id = auth.uid()` **and** paired membership insert is guaranteed in same transaction (RPC is simpler).
- **UPDATE / DELETE:** **admins** only (or owner-only for rename; keep minimal for V2).

### `workspace_members`

- **SELECT:** any member of the workspace may read rows for **that** workspace (needed for role UI and collaboration).
- **INSERT / UPDATE / DELETE:** **admins** only, **except** (a) **owner bootstrap:** owner may insert their own `workspace_members` row as `admin` for a workspace they own (see migration), and (b) future **invite acceptance RPC** (security definer, Phase 3).

### `invites`

- **SELECT:** **admins** of that workspace (list/manage). Optionally, allow **authenticated user** to `SELECT` rows where `lower(email) = lower(auth.jwt() ->> 'email')` so the invitee can see their pending invites — tune to your JWT claims shape.
- **INSERT / DELETE:** **admins** only.

### `projects` / `sprints`

- **SELECT:** any **member** of the workspace (`workspace_id` matches membership).
- **INSERT / UPDATE / DELETE:** **`workspace_role(workspace_id) = 'admin'`** only.

### `tasks`

- **SELECT / INSERT / UPDATE / DELETE:** any **member** (admin or member) of the workspace for `tasks.workspace_id`.

### Non-members

Policies should evaluate so **no rows** are visible for workspaces the user does not belong to.

---

## RPC patterns (recommended)

| Function | Purpose |
|----------|---------|
| `ensure_workspace_for_user()` | Idempotent: owned workspace + admin membership for `auth.uid()`; client calls after sign-in (Phase 2). Implemented in SQL migration; runs as **security definer**. |
| `accept_workspace_invite(invite_id uuid)` | Verify invite email matches authenticated user email; insert `workspace_members`; delete or update invite; return workspace id. |

`ensure_workspace_for_user` runs as **security definer** (see migration). **`accept_workspace_invite`** will follow the same pattern in Phase 3.

---

## Testing checklist (run in Supabase SQL or app)

- [ ] User **not** in workspace: **zero** rows from `tasks`, `projects`, `sprints`, `invites` for that workspace.
- [ ] **Member:** can CRUD **tasks**; **cannot** insert/update/delete `projects`, `sprints`, `invites`.
- [ ] **Admin:** full structure + invites.
- [ ] **Invite accept:** only matching email succeeds; other users get error / no-op.

---

## Service role key

If server-side Next.js code uses **`SUPABASE_SERVICE_ROLE_KEY`**, it **bypasses RLS** — use only on the server, never in `NEXT_PUBLIC_*` or client bundles. Prefer RLS + RPC for V2 scope.
