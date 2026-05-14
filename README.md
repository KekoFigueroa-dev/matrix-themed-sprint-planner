# Sprint Planner

A web-based sprint planner and task board built with **React** and **TypeScript** for small agile-style teams.

## Features

- **Sprint tracking:** Create, rename, and delete sprints; switch the active sprint and view its tasks.
- **Tasks:** Add, complete, and delete tasks with **High / Medium / Low** priority and optional assignee.
- **Team panel:** Add, edit, and remove team members (name + role label for display).
- **Stats:** Counts for in progress, completed, and total tasks in the current sprint.
- **UI:** Retro terminal look — dark background, monospace type, green accent styling.

## Project structure

```text
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
tsconfig.json
package.json
README.md
AGENTS.md
.gitignore
```

## Getting started

Clone the repository:

```bash
git clone https://github.com/KekoFigueroa-dev/matrix-themed-sprint-planner.git
cd matrix-themed-sprint-planner
```

On Windows PowerShell, if scripts are blocked for the session:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Install and run:

```bash
npm install
npm start
```

The dev server runs at [http://localhost:3000](http://localhost:3000).

Production build (used by Vercel and static hosting):

```bash
npm run build
```

Output is written to `build/`.

## Tech stack

- React 18  
- TypeScript  
- Create React App (`react-scripts`)  
- Framer Motion  
- Lucide React  
- `@supabase/supabase-js` (planned for auth and data; not fully integrated yet)  
- Global CSS (`src/styles.css`)

## Roadmap and implementation plan

**Vision (V2):** Portfolio-grade polish (clear hierarchy and spacing, restrained motion) plus subtle terminal / cyberpunk accents — backed by **Supabase Auth**, **shared workspaces**, **RLS-based permissions**, and **Vercel** deployment. No custom backend server.

**Agent and step-by-step plan:** See **[AGENTS.md](./AGENTS.md)** for phased PR order, RLS expectations, and constraints for coding agents.

### Goals for the first push

1. Land **documentation** so contributors and agents share the same plan (`README.md` + `AGENTS.md`).
2. Keep the first push **small**: docs (and optional README/scripty hygiene only — no large refactors unless agreed).
3. Align on **implementation order** after docs: UI foundation → auth → workspace bootstrap → schema/RLS/CRUD → invites → deploy and README polish.

Optional follow-ups (not committed as V2 scope) are listed at the bottom of `AGENTS.md`.

## License / contributing

Add a `LICENSE` and contribution notes when you are ready for external contributors.
