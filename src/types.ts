
export type Priority = 'High' | 'Medium' | 'Low';

export type WorkspaceRole = 'admin' | 'member';

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';

export interface Project {
  id: string;
  name: string;
}

export interface Sprint {
  id: string;
  name: string;
  projectId: string | null;
}

export interface Todo {
  id: string;
  text: string;
  status: TaskStatus;
  priority: Priority;
  sprintId: string;
  assigneeUserId?: string;
  startedOn?: string | null;
  expectedDeliveryOn?: string | null;
  finishedOn?: string | null;
  blockedReason?: string | null;
  archived: boolean;
}

/** Active planner list: not done and not archived */
export function isActivePlannerTask(todo: Todo): boolean {
  return !todo.archived && todo.status !== 'done';
}

/** Done bucket: completed or archived */
export function isDoneBucketTask(todo: Todo): boolean {
  return todo.archived || todo.status === 'done';
}
