
export type Priority = 'High' | 'Medium' | 'Low';

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
  assigneeId?: number;
}

export interface TeamMember {
  id: number;
  name: string;
  role: string;
}
