import type { Project } from '../types';
import { getSupabase } from './supabaseClient';

interface ProjectRow {
    id: string;
    workspace_id: string;
    name: string;
}

function rowToProject(row: ProjectRow): Project {
    return { id: row.id, name: row.name };
}

export async function fetchProjects(workspaceId: string): Promise<Project[]> {
    const { data, error } = await getSupabase()
        .from('projects')
        .select('id, workspace_id, name')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return (data as ProjectRow[]).map(rowToProject);
}

export async function createProject(workspaceId: string, name: string): Promise<Project> {
    const { data, error } = await getSupabase()
        .from('projects')
        .insert({ workspace_id: workspaceId, name: name.trim() })
        .select('id, workspace_id, name')
        .single();

    if (error) throw new Error(error.message);
    return rowToProject(data as ProjectRow);
}

export async function updateProjectName(projectId: string, name: string): Promise<void> {
    const { error } = await getSupabase()
        .from('projects')
        .update({ name: name.trim() })
        .eq('id', projectId);

    if (error) throw new Error(error.message);
}

export async function deleteProject(projectId: string): Promise<void> {
    const supabase = getSupabase();

    const { count, error: countErr } = await supabase
        .from('sprints')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId);

    if (countErr) throw new Error(countErr.message);
    if ((count ?? 0) > 0) {
        throw new Error('Remove or reassign sprints before deleting this project.');
    }

    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (error) throw new Error(error.message);
}

/** Attach workspace sprints/tasks with no project to the given project. */
export async function assignOrphanSprintsToProject(
    workspaceId: string,
    projectId: string
): Promise<void> {
    const supabase = getSupabase();

    const { error: sprintErr } = await supabase
        .from('sprints')
        .update({ project_id: projectId })
        .eq('workspace_id', workspaceId)
        .is('project_id', null);

    if (sprintErr) throw new Error(sprintErr.message);

    const { error: taskErr } = await supabase
        .from('tasks')
        .update({ project_id: projectId })
        .eq('workspace_id', workspaceId)
        .is('project_id', null);

    if (taskErr) throw new Error(taskErr.message);
}
