# Agent instructions — matrix-themed sprint planner

This file tells **humans and coding agents** how to work in this repo: **non-negotiables**, **where the plan lives**, **how to report progress**, and a **bootstrap prompt** for new Cursor sessions.

**Canonical V2 plan (phases, DoD, entities, flows, hours):** [docs/v2.md](./docs/v2.md) — **update the progress table there** when you finish a phase or meaningful slice.

**RLS narrative (security model):** [docs/rls.md](./docs/rls.md)

**Human-facing setup / deploy / env:** [README.md](./README.md)

---

## Non-negotiable rules

1. **Read the repo first** before proposing code changes. Scan routing, data layer, styling, and any Supabase usage. Summarize gaps vs [docs/v2.md](./docs/v2.md).
2. **No custom backend application server** in V2. Use **Supabase Auth + Postgres + RLS** (and **RPC / security definer** where needed). Do not add Express/Fastify/etc. as an app server.
3. **Design is a deliverable:** stripe.dev-level polish + restrained retro cyberpunk/vaporwave — tokens, spacing, typography, accessible contrast, strong empty/loading/error states.
4. **Security is a deliverable:** **RLS enforces permissions.** UI hiding buttons is not sufficient.
5. **V2 stack assumption:** **Next.js + TypeScript** per [docs/v2.md](./docs/v2.md). The repo may still be on **CRA** until migration — if you migrate, do it as an explicit PR and then update the “Current repository state” section in `docs/v2.md`.

---

## Progress and handoff (required habit)

- After completing work, set the **Phase** row in [docs/v2.md § Progress tracker](./docs/v2.md#progress-tracker-update-when-work-lands) to `Done` or `In progress` and add **Notes / PR**.
- If you stop mid-phase, leave status `In progress` and add a short **Notes / PR** bullet: what merged, what is next file-wise.

This lets anyone (including you later) **resume from the last documented state**.

---

## Implementation rhythm (agent + maintainer)

- **One focused deliverable per step** (one PR-sized slice): code or docs, not a bundle of unrelated features.
- The agent **implements** the slice, **updates relevant docs** (e.g. `docs/v2.md` progress table, `docs/rls.md` if policies change, README env/architecture when wiring changes), and **writes a clear test plan** (manual steps or commands) in the PR description or in `docs/v2.md` under the phase notes.
- **Testing is deferred to the maintainer:** the agent does not substitute for you running Supabase checks, browser flows, or Vercel smoke tests unless you explicitly ask.
- **You choose the next slice:** say which phase or file area to tackle next; the agent should not assume priority beyond what you stated.

## Working agreements

- Prefer **small commits** and **PR-sized** diffs.
- Ship **SQL migrations** in-repo with PRs that touch schema; explain policy **intent** (comments or PR description). Link or duplicate rationale in [docs/rls.md](./docs/rls.md) when behavior changes.
- Do not expand scope into a Jira-like product; out-of-scope list is in [docs/v2.md](./docs/v2.md#out-of-scope-guardrails--do-not-creep).
- **Repository hygiene:** `node_modules` must not be committed going forward — see [README](./README.md). If history still tracks `node_modules`, use a dedicated PR to remove it from the index.

---

## Where to look in the tree (today)

| Area        | Location |
|------------|----------|
| App / state | `src/App.tsx` (CRA monolith + `localStorage`) |
| Types      | `src/types.ts` |
| Styles     | `src/styles.css` |
| Components | `src/components/*` |
| Entry      | `src/index.tsx` |
| V2 docs    | `docs/v2.md`, `docs/rls.md` |

After Next.js migration, prefer `app/`, `lib/supabase/`, `supabase/migrations/` — document new paths in `docs/v2.md` when they exist.

---

## Cursor bootstrap prompt

Copy everything inside the block into a new Cursor chat when starting V2 implementation work:

```text
You are the senior engineer + product-minded designer implementing V2 for this repo:
https://github.com/KekoFigueroa-dev/matrix-themed-sprint-planner

NON-NEGOTIABLE RULES:
1) READ THE REPO FIRST.
   Before proposing changes, scan the codebase and write a short summary:
   - tech stack, routing (CRA vs Next if mixed)
   - existing data model and persistence
   - any existing Supabase integration
   - state management and styling system
   - gaps vs docs/v2.md
2) NO CUSTOM BACKEND SERVER IN V2.
   Use Supabase Auth + Postgres + RLS. Do NOT introduce an extra application server.
3) DESIGN IS A DELIVERABLE.
   Target: stripe.dev-level polish + restrained retro cyberpunk/vaporwave.
   Requirements: typography scale, spacing rhythm, accessible contrast, empty/loading/error states,
   token layer + reusable UI primitives.
4) SECURITY IS A DELIVERABLE.
   RLS must enforce permissions. UI gating is not sufficient.

V2 REQUIREMENTS (see docs/v2.md for detail):
- Real email/password auth
- One workspace per user flow; auto-create on first login; user is owner/admin
- Admin invites collaborators (no invite expiry)
- Members CRUD tasks; admins manage projects/sprints/invites
- Deploy to Vercel

WORK PLAN (implement in order — update progress table in docs/v2.md when done):
Phase 0: repo read + docs aligned
Phase 1: schema + migrations + RLS (+ docs/rls.md if policies change)
Phase 2: auth + ensure_workspace RPC
Phase 3: invites + accept RPC + UI
Phase 4: role-based UI + collaboration polish + design system
Phase 5: Vercel + README + optional smoke test

OUTPUT:
- List exact files to create/modify and why.
- Keep changes small and reviewable.
- If uncertain, ask one targeted question instead of guessing.
```

---

## Optional follow-ups (not V2)

See [docs/v2.md § Optional follow-ups](./docs/v2.md#optional-follow-ups-not-v2).
