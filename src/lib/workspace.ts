import { getSupabase } from './supabaseClient';

export type WorkspaceRole = 'admin' | 'member';

export interface ActiveWorkspaceContext {
    workspaceId: string;
    role: WorkspaceRole;
}

/** First workspace membership for the signed-in user (V2 single-workspace flow). */
export async function fetchActiveWorkspaceContext(): Promise<ActiveWorkspaceContext | null> {
    const supabase = getSupabase();
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) return null;

    const { data, error } = await supabase
        .from('workspace_members')
        .select('workspace_id, role')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1);

    if (error) {
        console.error('fetchActiveWorkspaceContext:', error.message);
        return null;
    }

    const row = data?.[0];
    if (!row?.workspace_id || (row.role !== 'admin' && row.role !== 'member')) {
        return null;
    }

    return {
        workspaceId: row.workspace_id,
        role: row.role as WorkspaceRole,
    };
}

/** @deprecated Prefer fetchActiveWorkspaceContext for role-aware UI. */
export async function fetchActiveWorkspaceId(): Promise<string | null> {
    const ctx = await fetchActiveWorkspaceContext();
    return ctx?.workspaceId ?? null;
}
