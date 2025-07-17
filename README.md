Sprint Planner
A web-based Sprint Planner and TODO application, built with React and TypeScript, designed for developer teams working in agile environments.
Features
🏁 Sprint Tracking:
Create, edit, and manage multiple sprints. Switch between active sprints and see each sprint’s tasks.
✅ TODO & Task Management:
Add, edit, mark complete, and delete tasks.
Assign priority tags (High, Medium, Low) to each task.
Assign tasks to specific team members.
👥 Team Panel:
Add, edit, or remove team members.
Assign roles and see all team members in a sidebar panel.
📊 Status/Stats Panel:
See at-a-glance task breakdown (in progress, completed, left) for the current sprint.
🖥️ Retro Terminal UI:
Classic dark console-style with green text.
Monospace font and minimalist, readable layout.

Project Structure
/public
  └── index.html
/src
  ├── App.tsx
  ├── index.tsx
  ├── env.ts
  ├── styles.css
  ├── types.ts
  └── /components
      ├── AddTodoForm.tsx
      ├── TodoItem.tsx
      ├── TeamPanel.tsx
      ├── StatsPanel.tsx
      └── SprintManager.tsx
tsconfig.json
package.json
README.md

Getting Started
Clone this repository:
git clone [your-repo-url]
cd [your-project-folder]

​
Install dependencies:
npm install

​
Run the app locally:
npm start

​
The app will open at http://localhost:3000.
Tech Stack
React 18
TypeScript
react-scripts (Create React App)
Framer Motion (for animations)
Supabase (optional, for backend)
CSS (retro terminal theme)