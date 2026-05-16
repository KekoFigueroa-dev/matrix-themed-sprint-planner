import { getSupabase } from './supabaseClient';

export type WorkspaceRole = 'admin' | 'member';

export interface ActiveWorkspaceContext {
    workspaceId: string;
    role: WorkspaceRole;
}

type MembershipRow = {
    workspace_id: string;
    role: string;
    workspaces: { owner_id: string } | { owner_id: string }[] | null;
};

function workspaceOwnerId(row: MembershipRow): string | null {
    const w = row.workspaces;
    if (!w) return null;
    if (Array.isArray(w)) return w[0]?.owner_id ?? null;
    return w.owner_id;
}

/**
 * Active workspace for the planner.
 * If the user belongs to multiple workspaces (own + invited), prefer the
 * collaborative one (membership where they are not workspace owner) so
 * invitees see member UI instead of their solo "My workspace" admin shell.
 */
export async function fetchActiveWorkspaceContext(): Promise<ActiveWorkspaceContext | null> {
    const supabase = getSupabase();
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) return null;

    const { data, error } = await supabase
        .from('workspace_members')
        .select(
            `
            workspace_id,
            role,
            workspaces (
                owner_id
            )
        `
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('fetchActiveWorkspaceContext:', error.message);
        return null;
    }

    const rows = (data ?? []) as MembershipRow[];
    const valid = rows.filter(
        (r) =>
            r.workspace_id &&
            (r.role === 'admin' || r.role === 'member')
    );

    if (valid.length === 0) return null;

    const collaborative = valid.find((r) => {
        const ownerId = workspaceOwnerId(r);
        return ownerId != null && ownerId !== user.id;
    });

    const pick = collaborative ?? valid[0];

    return {
        workspaceId: pick.workspace_id,
        role: pick.role as WorkspaceRole,
    };
}

/** @deprecated Prefer fetchActiveWorkspaceContext for role-aware UI. */
export async function fetchActiveWorkspaceId(): Promise<string | null> {
    const ctx = await fetchActiveWorkspaceContext();
    return ctx?.workspaceId ?? null;
}
