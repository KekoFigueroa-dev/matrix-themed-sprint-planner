import type { WorkspaceRole } from './workspace';
import { getSupabase } from './supabaseClient';

export interface WorkspaceProfile {
    userId: string;
    displayName: string;
    role: WorkspaceRole;
}

interface ProfileRow {
    user_id: string;
    display_name: string;
}

interface MemberRow {
    user_id: string;
    role: WorkspaceRole;
}

export async function ensureWorkspaceProfiles(workspaceId: string): Promise<void> {
    const { error } = await getSupabase().rpc('ensure_workspace_profiles', {
        p_workspace_id: workspaceId,
    });
    if (error) throw new Error(error.message);
}

export async function fetchWorkspaceProfiles(workspaceId: string): Promise<WorkspaceProfile[]> {
    const supabase = getSupabase();

    const { data: members, error: membersErr } = await supabase
        .from('workspace_members')
        .select('user_id, role')
        .eq('workspace_id', workspaceId);

    if (membersErr) throw new Error(membersErr.message);

    const { data: profiles, error: profilesErr } = await supabase
        .from('workspace_profiles')
        .select('user_id, display_name')
        .eq('workspace_id', workspaceId);

    if (profilesErr) throw new Error(profilesErr.message);

    const nameByUser = new Map(
        (profiles as ProfileRow[]).map((p) => [p.user_id, p.display_name])
    );

    return (members as MemberRow[]).map((m) => ({
        userId: m.user_id,
        displayName: nameByUser.get(m.user_id)?.trim() || 'Member',
        role: m.role,
    }));
}

export async function updateWorkspaceDisplayName(
    workspaceId: string,
    userId: string,
    displayName: string
): Promise<void> {
    const trimmed = displayName.trim();
    if (!trimmed) throw new Error('Display name cannot be empty');

    const { error } = await getSupabase()
        .from('workspace_profiles')
        .update({ display_name: trimmed })
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId);

    if (error) throw new Error(error.message);
}
