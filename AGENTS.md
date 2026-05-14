# Agent instructions — matrix-themed sprint planner

This file is for humans and coding agents working in this repository. It states **current goals**, the **step-by-step implementation plan**, and **constraints** so work stays aligned across pushes. Keeping **`AGENTS.md` at the repo root** matches the usual Cursor / open-source convention for agent-oriented guidance (alongside `README.md` for everyone else).

## Product direction (V2 target)

Portfolio-grade sprint planner: **Stripe.dev-level polish** (typography, spacing, hierarchy, restrained motion) plus **restrained** 90s terminal / cyberpunk / vaporwave accents (no neon soup).

Backend: **Supabase only** — no custom application server. **Row Level Security (RLS)** is the source of truth for permissions; the UI must not be the only enforcement.

## Current codebase (baseline)

- **Stack:** React 18, TypeScript, Create React App (`react-scripts`), Framer Motion, Lucide, `@supabase/supabase-js` (dependency present; **not wired yet**).
- **State:** React state in `App.tsx`; **persistence:** `localStorage` for sprints, todos, team members, current sprint.
- **Model:** `Sprint`, `Todo`, `TeamMember` — no workspace, project, or auth yet. `TeamMember.role` is display text, not RBAC.

## Goals for the **first push** (documentation milestone)

1. **Single source of truth for the plan** — `README.md` + this file describe vision, first milestones, and repo layout.
2. **Clear sequencing** — implementation order is fixed (UI foundation → auth → workspace → data + RLS → invites → deploy/docs).
3. **Explicit non-goals for V2** — not Jira; no custom backend; framework migration only if explicitly requested.

The first push may be **docs-only** or **docs + tiny hygiene** (for example README formatting, `npm run build` in `package.json`). Avoid bundling large refactors with the first push unless agreed.

## Step-by-step implementation plan (PR-sized)

Execute in this order. Each step should be a **small, reviewable PR** when possible.

### Phase 1 — UI foundation

- Add design **tokens** (CSS variables or `tokens.css`): type scale, spacing, neutrals, one primary accent, one terminal accent.
- Introduce an **AppShell** layout (header / main / side regions) and shared primitives (`Button`, `Input`, `Select`, `Panel`) under something like `src/ui/`.
- Migrate existing screens to tokens and shell; **restrain** motion (shorter durations, fewer competing animations).

### Phase 2 — Auth pages

- Add routing (for example `react-router-dom`): `/login`, `/register`, and protected app route(s).
- Configure Supabase client + env (`REACT_APP_*` for CRA); implement email + password sign-in and sign-up with polished UI matching tokens.

### Phase 3 — Workspace bootstrap

- **One workspace per user**, auto-created on first login; that user is **owner**.
- Idempotent “ensure workspace” behavior (client and/or DB constraints) so duplicates cannot appear.

### Phase 4 — Data model, RLS, CRUD

- Tables (conceptual): workspaces, workspace members (roles: `owner`, `admin`, `member`), projects, sprints, tasks (maps current todo fields; assignees tied to workspace identity as designed).
- **RLS intent:**
  - **Owner/admin:** manage projects, sprints, invites (where applicable).
  - **Member:** CRUD **tasks** only; **read** projects and sprints.
- Ship SQL migrations in-repo; document each policy’s intent in the migration or a short `docs/rls.md` if policies are long.

### Phase 5 — Invites

- Invite-by-email (no expiry required for V2); admin creates invite; accept-invite flow for the invited user once authenticated.

### Phase 6 — Deploy and polish

- Vercel deploy, `npm run build`, README env/deploy section, screenshots.

## Repository notes

- A **`.gitignore`** at the repo root ignores `build/`, local env files, and (by convention) `node_modules/`. If this clone still has `node_modules` **tracked in git** from an older layout, stop tracking it in a dedicated hygiene PR (`git rm -r --cached node_modules` then push); do not mix that with feature work.

## Working agreements

- Prefer **small commits** and **PR-sized** changes.
- If adding schema or RLS: include **exact SQL** in the PR and explain policy intent.
- **Do not** migrate framework (CRA → Vite/Next, etc.) unless the maintainer explicitly asks.
- Do not invent features beyond the agreed V2 list; extras go in README under “Optional follow-ups” only.

## Optional follow-ups (not required for V2)

- Realtime task updates, email templates for invites, audit log, project archival.

## Where to look in the tree

| Area        | Location                          |
|------------|-----------------------------------|
| App shell  | `src/App.tsx` (today: monolith)   |
| Types      | `src/types.ts`                    |
| Global CSS | `src/styles.css`                  |
| Components | `src/components/*`                |
| Entry      | `src/index.tsx`                   |

Update this file when phases complete or priorities change.
