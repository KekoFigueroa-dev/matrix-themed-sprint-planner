
export type Priority = 'High' | 'Medium' | 'Low';

export interface Sprint {
  id: number;
  name: string;
}

export interface Todo {
  id: number;
  text: string;
  completed: boolean;
  priority: Priority;
  sprintId: number;
  assigneeId?: number;
}

export interface TeamMember {
  id: number;
  name: string;
  role: string;
}
