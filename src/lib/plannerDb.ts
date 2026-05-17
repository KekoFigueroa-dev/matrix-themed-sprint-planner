import type { Priority, Sprint, TaskStatus, Todo } from '../types';
import { getSupabase } from './supabaseClient';

const TASK_COLUMNS =
    'id, workspace_id, sprint_id, title, status, priority, assignee_user_id, started_on, expected_delivery_on, finished_on, blocked_reason, archived';

export interface TaskRow {
    id: string;
    workspace_id: string;
    sprint_id: string | null;
    title: string;
    status: TaskStatus;
    priority: Priority;
    assignee_user_id: string | null;
    started_on: string | null;
    expected_delivery_on: string | null;
    finished_on: string | null;
    blocked_reason: string | null;
    archived: boolean;
}

export interface SprintRow {
    id: string;
    workspace_id: string;
    name: string;
}

export interface TaskUpdatePatch {
    status?: TaskStatus;
    blockedReason?: string | null;
    expectedDeliveryOn?: string | null;
    startedOn?: string | null;
    finishedOn?: string | null;
    archived?: boolean;
}

function todayDateString(): string {
    return new Date().toISOString().slice(0, 10);
}

function rowToTodo(row: TaskRow): Todo {
    return {
        id: row.id,
        text: row.title,
        status: row.status,
        priority: row.priority,
        sprintId: row.sprint_id ?? '',
        assigneeUserId: row.assignee_user_id ?? undefined,
        startedOn: row.started_on,
        expectedDeliveryOn: row.expected_delivery_on,
        finishedOn: row.finished_on,
        blockedReason: row.blocked_reason,
        archived: row.archived,
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
        .select(TASK_COLUMNS)
        .eq('workspace_id', workspaceId)
        .eq('archived', false)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data as TaskRow[]).map(rowToTodo);
}

export async function fetchDoneTasks(workspaceId: string): Promise<Todo[]> {
    const { data, error } = await getSupabase()
        .from('tasks')
        .select(TASK_COLUMNS)
        .eq('workspace_id', workspaceId)
        .or('archived.eq.true,status.eq.done')
        .order('finished_on', { ascending: false, nullsFirst: false });

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
    assigneeUserId?: string,
    expectedDeliveryOn?: string | null
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
            assignee_user_id: assigneeUserId ?? null,
            expected_delivery_on: expectedDeliveryOn ?? null,
            created_by: user?.id ?? null,
        })
        .select(TASK_COLUMNS)
        .single();

    if (error) throw new Error(error.message);
    return rowToTodo(data as TaskRow);
}

function buildTaskUpdatePayload(
    current: TaskRow,
    patch: TaskUpdatePatch
): Record<string, unknown> {
    const payload: Record<string, unknown> = {};

    if (patch.status !== undefined) {
        payload.status = patch.status;
        if (patch.status === 'in_progress' && !current.started_on && patch.startedOn === undefined) {
            payload.started_on = todayDateString();
        }
        if (patch.status === 'done' && !current.finished_on && patch.finishedOn === undefined) {
            payload.finished_on = todayDateString();
        }
        if (patch.status !== 'blocked' && patch.blockedReason === undefined) {
            payload.blocked_reason = null;
        }
    }

    if (patch.blockedReason !== undefined) payload.blocked_reason = patch.blockedReason;
    if (patch.expectedDeliveryOn !== undefined) {
        payload.expected_delivery_on = patch.expectedDeliveryOn;
    }
    if (patch.startedOn !== undefined) payload.started_on = patch.startedOn;
    if (patch.finishedOn !== undefined) payload.finished_on = patch.finishedOn;
    if (patch.archived !== undefined) payload.archived = patch.archived;

    return payload;
}

export async function updateTask(taskId: string, patch: TaskUpdatePatch): Promise<Todo> {
    const supabase = getSupabase();
    const { data: current, error: fetchErr } = await supabase
        .from('tasks')
        .select(TASK_COLUMNS)
        .eq('id', taskId)
        .single();

    if (fetchErr) throw new Error(fetchErr.message);

    const payload = buildTaskUpdatePayload(current as TaskRow, patch);
    if (Object.keys(payload).length === 0) {
        return rowToTodo(current as TaskRow);
    }

    const { data, error } = await supabase
        .from('tasks')
        .update(payload)
        .eq('id', taskId)
        .select(TASK_COLUMNS)
        .single();

    if (error) throw new Error(error.message);
    return rowToTodo(data as TaskRow);
}

export async function archiveDoneTasksForSprint(
    sprintId: string,
    workspaceId: string
): Promise<number> {
    const { data, error } = await getSupabase()
        .from('tasks')
        .update({ archived: true })
        .eq('workspace_id', workspaceId)
        .eq('sprint_id', sprintId)
        .eq('status', 'done')
        .eq('archived', false)
        .select('id');

    if (error) throw new Error(error.message);
    return data?.length ?? 0;
}

/** Mark all completed (non-archived) tasks in the workspace as archived. */
export async function archiveAllDoneTasks(workspaceId: string): Promise<number> {
    const { data, error } = await getSupabase()
        .from('tasks')
        .update({ archived: true })
        .eq('workspace_id', workspaceId)
        .eq('status', 'done')
        .eq('archived', false)
        .select('id');

    if (error) throw new Error(error.message);
    return data?.length ?? 0;
}

export async function restoreTask(taskId: string): Promise<Todo> {
    return updateTask(taskId, { archived: false, status: 'todo' });
}

export async function deleteTask(taskId: string): Promise<void> {
    const { error } = await getSupabase()
        .from('tasks')
        .delete()
        .eq('id', taskId);

    if (error) throw new Error(error.message);
}
