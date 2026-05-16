import { getSupabase } from './supabaseClient';

/** First workspace the signed-in user belongs to (V2 single-workspace flow). */
export async function fetchActiveWorkspaceId(): Promise<string | null> {
    const supabase = getSupabase();
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) return null;

    const { data, error } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1);

    if (error) {
        console.error('fetchActiveWorkspaceId:', error.message);
        return null;
    }

    return data?.[0]?.workspace_id ?? null;
}
