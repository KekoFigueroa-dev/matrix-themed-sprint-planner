const ADMIN_ONLY_HINT =
    'Only workspace admins can manage sprints, projects, or invites. You can still work on tasks.';

const NETWORK_HINT =
    'Network error — check your connection, then try again. If this persists, verify Supabase URL and API keys in Vercel.';

const SESSION_HINT = 'Your session may have expired. Sign out, sign in again, and retry.';

const RATE_LIMIT_HINT =
    'Rate limited. Wait about 30–60 seconds, then try again once. Avoid double-clicking submit.';

/** Map PostgREST / RLS / Auth failures to copy suitable for the UI. */
export function formatSupabaseError(message: string, status?: number): string {
    const lower = message.toLowerCase();
    const trimmed = message.trim();

    if (!trimmed && status === 429) {
        return RATE_LIMIT_HINT;
    }

    if (!trimmed) {
        return 'Something went wrong. Try again in a moment.';
    }

    if (
        status === 429 ||
        lower.includes('rate limit') ||
        lower.includes('too many requests') ||
        lower.includes('over_email_send_rate_limit') ||
        lower.includes('over_request_rate_limit') ||
        lower.includes('email rate limit')
    ) {
        return RATE_LIMIT_HINT;
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
        if (lower.includes('invites_workspace_email')) {
            return 'An invite for that email already exists in this workspace.';
        }
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

function statusFromUnknown(e: unknown): number | undefined {
    if (e && typeof e === 'object' && 'status' in e) {
        const status = (e as { status?: unknown }).status;
        if (typeof status === 'number') return status;
    }
    return undefined;
}

export function errorMessageFromUnknown(e: unknown): string {
    const raw = e instanceof Error ? e.message : String(e);
    return formatSupabaseError(raw, statusFromUnknown(e));
}

/** Auth API errors (signUp, signInWithPassword). */
export function formatAuthError(error: { message: string; status?: number }): string {
    return formatSupabaseError(error.message, error.status);
}

/** Prefix a mutation label only when the formatted message is not already prefixed. */
export function formatMutationError(label: string, e: unknown): string {
    const detail = errorMessageFromUnknown(e);
    if (detail.toLowerCase().startsWith(label.toLowerCase())) {
        return detail;
    }
    return `${label}: ${detail}`;
}
