const ADMIN_ONLY_HINT =
    'Only workspace admins can manage sprints, projects, or invites. You can still work on tasks.';

/** Map PostgREST / RLS failures to copy suitable for the UI. */
export function formatSupabaseError(message: string): string {
    const lower = message.toLowerCase();
    if (
        lower.includes('row-level security') ||
        lower.includes('42501') ||
        lower.includes('permission denied') ||
        lower.includes('violates row-level security')
    ) {
        return ADMIN_ONLY_HINT;
    }
    return message;
}

export function errorMessageFromUnknown(e: unknown): string {
    const raw = e instanceof Error ? e.message : String(e);
    return formatSupabaseError(raw);
}
