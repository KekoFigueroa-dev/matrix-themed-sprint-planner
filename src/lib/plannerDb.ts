import type { Priority, Sprint, Todo } from '../types';
import { getSupabase } from './supabaseClient';

export interface TaskRow {
    id: string;
    workspace_id: string;
    sprint_id: string | null;
    title: string;
    status: 'todo' | 'doing' | 'done';
    priority: Priority;
    assignee_member_id: number | null;
}

export interface SprintRow {
    id: string;
    workspace_id: string;
    name: string;
}

function rowToTodo(row: TaskRow): Todo {
    return {
        id: row.id,
        text: row.title,
        completed: row.status === 'done',
        priority: row.priority,
        sprintId: row.sprint_id ?? '',
        assigneeId: row.assignee_member_id ?? undefined,
    };
}

function rowToSprint(row: SprintRow): Sprint {
    return { id: row.id, name: row.name };
}

export async function fetchSprints(workspaceId: string): Promise<Sprint[]> {
    const { data, error } = await getSupabase()
        .from('sprints')
        .select('id, workspace_id, name')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return (data as SprintRow[]).map(rowToSprint);
}

export async function fetchTasks(workspaceId: string): Promise<Todo[]> {
    const { data, error } = await getSupabase()
        .from('tasks')
        .select('id, workspace_id, sprint_id, title, status, priority, assignee_member_id')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data as TaskRow[]).map(rowToTodo);
}

export async function createSprint(workspaceId: string, name: string): Promise<Sprint> {
    const { data, error } = await getSupabase()
        .from('sprints')
        .insert({ workspace_id: workspaceId, name })
        .select('id, workspace_id, name')
        .single();

    if (error) throw new Error(error.message);
    return rowToSprint(data as SprintRow);
}

export async function updateSprintName(sprintId: string, name: string): Promise<void> {
    const { error } = await getSupabase()
        .from('sprints')
        .update({ name })
        .eq('id', sprintId);

    if (error) throw new Error(error.message);
}

export async function deleteSprintAndTasks(sprintId: string, workspaceId: string): Promise<void> {
    const supabase = getSupabase();
    const { error: tasksErr } = await supabase
        .from('tasks')
        .delete()
        .eq('workspace_id', workspaceId)
        .eq('sprint_id', sprintId);

    if (tasksErr) throw new Error(tasksErr.message);

    const { error: sprintErr } = await supabase
        .from('sprints')
        .delete()
        .eq('id', sprintId);

    if (sprintErr) throw new Error(sprintErr.message);
}

export async function createTask(
    workspaceId: string,
    sprintId: string,
    text: string,
    priority: Priority,
    assigneeId?: number
): Promise<Todo> {
    const { data: { user } } = await getSupabase().auth.getUser();
    const { data, error } = await getSupabase()
        .from('tasks')
        .insert({
            workspace_id: workspaceId,
            sprint_id: sprintId,
            title: text,
            status: 'todo',
            priority,
            assignee_member_id: assigneeId ?? null,
            created_by: user?.id ?? null,
        })
        .select('id, workspace_id, sprint_id, title, status, priority, assignee_member_id')
        .single();

    if (error) throw new Error(error.message);
    return rowToTodo(data as TaskRow);
}

export async function updateTaskStatus(taskId: string, completed: boolean): Promise<void> {
    const { error } = await getSupabase()
        .from('tasks')
        .update({ status: completed ? 'done' : 'todo' })
        .eq('id', taskId);

    if (error) throw new Error(error.message);
}

export async function deleteTask(taskId: string): Promise<void> {
    const { error } = await getSupabase()
        .from('tasks')
        .delete()
        .eq('id', taskId);

    if (error) throw new Error(error.message);
}

export async function clearAssigneeFromTasks(
    workspaceId: string,
    assigneeMemberId: number
): Promise<void> {
    const { error } = await getSupabase()
        .from('tasks')
        .update({ assignee_member_id: null })
        .eq('workspace_id', workspaceId)
        .eq('assignee_member_id', assigneeMemberId);

    if (error) throw new Error(error.message);
}
