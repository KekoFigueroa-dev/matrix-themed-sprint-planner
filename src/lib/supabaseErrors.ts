const ADMIN_ONLY_HINT =
    'Only workspace admins can manage sprints, projects, or invites. You can still work on tasks.';

const NETWORK_HINT =
    'Network error — check your connection, then try again. If this persists, verify Supabase URL and API keys in Vercel.';

const SESSION_HINT = 'Your session may have expired. Sign out, sign in again, and retry.';

/** Map PostgREST / RLS failures to copy suitable for the UI. */
export function formatSupabaseError(message: string): string {
    const lower = message.toLowerCase();
    const trimmed = message.trim();

    if (!trimmed) {
        return 'Something went wrong. Try again in a moment.';
    }

    if (
        lower.includes('failed to fetch') ||
        lower.includes('networkerror') ||
        lower.includes('load failed')
    ) {
        return NETWORK_HINT;
    }

    if (
        lower.includes('jwt') ||
        lower.includes('not authenticated') ||
        lower.includes('invalid claim')
    ) {
        return SESSION_HINT;
    }

    if (
        lower.includes('row-level security') ||
        lower.includes('42501') ||
        lower.includes('permission denied') ||
        lower.includes('violates row-level security')
    ) {
        return ADMIN_ONLY_HINT;
    }

    if (lower.includes('duplicate') || lower.includes('unique constraint')) {
        return 'That name or record already exists. Try something different.';
    }

    if (lower.includes('remove or reassign sprints')) {
        return message;
    }

    if (lower.includes('display name cannot be empty')) {
        return 'Display name cannot be empty.';
    }

    if (lower.includes('pgrst116') || lower.includes('0 rows')) {
        return 'That record was not found — refresh the page and try again.';
    }

    return message;
}

export function errorMessageFromUnknown(e: unknown): string {
    const raw = e instanceof Error ? e.message : String(e);
    return formatSupabaseError(raw);
}

/** Prefix a mutation label only when the formatted message is not already prefixed. */
export function formatMutationError(label: string, e: unknown): string {
    const detail = errorMessageFromUnknown(e);
    if (detail.toLowerCase().startsWith(label.toLowerCase())) {
        return detail;
    }
    return `${label}: ${detail}`;
}
