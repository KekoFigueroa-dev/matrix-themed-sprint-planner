
export type Priority = 'High' | 'Medium' | 'Low';

export type WorkspaceRole = 'admin' | 'member';

export interface Sprint {
  id: string;
  name: string;
}

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
  sprintId: string;
  assigneeUserId?: string;
}
