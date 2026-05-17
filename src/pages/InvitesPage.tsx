import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSupabase } from '../lib/supabaseClient';
import { errorMessageFromUnknown } from '../lib/supabaseErrors';
import { Badge, Button, Card, EmptyState, InlineAlert, Input, Select } from '../ui';
import type { Session } from '@supabase/supabase-js';

type InviteRole = 'admin' | 'member';

interface InviteRow {
    id: string;
    workspace_id: string;
    email: string;
    role: InviteRole;
    invited_by: string | null;
    created_at: string;
}

interface AdminWorkspaceOption {
    workspace_id: string;
    name: string;
}

function normalizeEmail(e: string): string {
    return e.trim().toLowerCase();
}

const InvitesPage: React.FC = () => {
    const supabase = useMemo(() => getSupabase(), []);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const [adminWorkspaces, setAdminWorkspaces] = useState<AdminWorkspaceOption[]>([]);
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');

    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<InviteRole>('member');

    const [invitesVisible, setInvitesVisible] = useState<InviteRow[]>([]);

    const signedInEmail = session?.user?.email ?? '';

    const loadAdminWorkspaces = useCallback(async (userId: string) => {
        const { data, error: qErr } = await supabase
            .from('workspace_members')
            .select(
                `
        workspace_id,
        workspaces (
          id,
          name
        )
      `
            )
            .eq('user_id', userId)
            .eq('role', 'admin');

        if (qErr) {
            console.error(qErr);
            return [];
        }

        const rows = (data ?? []) as unknown as Array<{
            workspace_id: string;
            workspaces: { id: string; name: string } | null;
        }>;

        return rows.map((r) => ({
            workspace_id: r.workspace_id,
            name: r.workspaces?.name ?? 'Workspace',
        }));
    }, [supabase]);

    const refreshInvites = useCallback(async () => {
        const { data: { session: s } } = await supabase.auth.getSession();
        setSession(s);
        if (!s?.user) {
            setInvitesVisible([]);
            setAdminWorkspaces([]);
            setLoading(false);
            return;
        }

        const admins = await loadAdminWorkspaces(s.user.id);
        setAdminWorkspaces(admins);

        const { data: inv, error: invErr } = await supabase
            .from('invites')
            .select('*')
            .order('created_at', { ascending: false });

        if (invErr) {
            setError(errorMessageFromUnknown(invErr));
            setInvitesVisible([]);
        } else {
            setError(null);
            setInvitesVisible((inv ?? []) as InviteRow[]);
        }
        setLoading(false);
    }, [supabase, loadAdminWorkspaces]);

    useEffect(() => {
        void refreshInvites();
    }, [refreshInvites]);

    useEffect(() => {
        if (adminWorkspaces.length === 0) {
            setSelectedWorkspaceId('');
            return;
        }
        setSelectedWorkspaceId((prev) => {
            if (prev && adminWorkspaces.some((w) => w.workspace_id === prev)) return prev;
            return adminWorkspaces[0].workspace_id;
        });
    }, [adminWorkspaces]);

    const adminWorkspaceIds = useMemo(
        () => new Set(adminWorkspaces.map((w) => w.workspace_id)),
        [adminWorkspaces]
    );

    const pendingForMe = useMemo(() => {
        const mine = session?.user?.email;
        if (!mine) return [];
        const n = normalizeEmail(mine);
        return invitesVisible.filter((i) => normalizeEmail(i.email) === n);
    }, [invitesVisible, session?.user?.email]);

    const invitesForSelectedAdminWs = useMemo(() => {
        if (!selectedWorkspaceId || !adminWorkspaceIds.has(selectedWorkspaceId)) return [];
        return invitesVisible.filter((i) => i.workspace_id === selectedWorkspaceId);
    }, [invitesVisible, selectedWorkspaceId, adminWorkspaceIds]);

    const workspaceOptions = useMemo(
        () => adminWorkspaces.map((w) => ({ value: w.workspace_id, label: w.name })),
        [adminWorkspaces]
    );

    const handleCreateInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const email = normalizeEmail(inviteEmail);
        if (!email || !selectedWorkspaceId || !session?.user) return;

        setActionLoading('create');
        try {
            const { error: insErr } = await supabase.from('invites').insert({
                workspace_id: selectedWorkspaceId,
                email,
                role: inviteRole,
                invited_by: session.user.id,
            });

            if (insErr) {
                setError(errorMessageFromUnknown(insErr));
                return;
            }
            setInviteEmail('');
            await refreshInvites();
        } finally {
            setActionLoading(null);
        }
    };

    const handleRevoke = async (id: string) => {
        setError(null);
        setActionLoading(`revoke-${id}`);
        try {
            const { error: delErr } = await supabase.from('invites').delete().eq('id', id);
            if (delErr) {
                setError(errorMessageFromUnknown(delErr));
                return;
            }
            await refreshInvites();
        } finally {
            setActionLoading(null);
        }
    };

    const handleAccept = async (id: string) => {
        setError(null);
        setActionLoading(`accept-${id}`);
        try {
            const { error: rpcErr } = await supabase.rpc('accept_workspace_invite', {
                p_invite_id: id,
            });
            if (rpcErr) {
                setError(errorMessageFromUnknown(rpcErr));
                return;
            }
            await refreshInvites();
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="invites-page">
                <div className="invites-page__inner">
                    <Card>
                        <p className="invites-empty">Loading invites…</p>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="invites-page">
            <div className="invites-page__inner">
                <header className="invites-page__header">
                    <Link to="/" className="invites-page__back">
                        ← Back to planner
                    </Link>
                    <h1 className="invites-page__title">Workspace invites</h1>
                </header>

                {error && <InlineAlert variant="error">{error}</InlineAlert>}

                {adminWorkspaces.length > 0 && invitesForSelectedAdminWs.length > 0 && (
                    <InlineAlert variant="info">
                        You have {invitesForSelectedAdminWs.length} outstanding invite
                        {invitesForSelectedAdminWs.length === 1 ? '' : 's'} for this workspace — scroll
                        down to the <span className="text-highlight">admin</span> section to manage them.
                    </InlineAlert>
                )}

                <Card>
                    <h2 className="invites-section-heading">
                        Pending for you
                        <span className="code-label">invitee</span>
                    </h2>
                    <InlineAlert variant="info">
                        This app does <strong>not</strong> send invite emails. Sign in with the{' '}
                        <span className="text-highlight">exact email</span> your admin invited, then
                        accept below.
                    </InlineAlert>
                    {signedInEmail && (
                        <p className="invites-empty" style={{ marginBottom: 'var(--space-4)' }}>
                            Signed in as <span className="code-label">{signedInEmail}</span>
                        </p>
                    )}
                    {pendingForMe.length === 0 ? (
                        <EmptyState
                            title="No pending invites"
                            description={
                                adminWorkspaces.length > 0
                                    ? 'Invites you created for others appear in the admin section below.'
                                    : 'You need an invite sent to the email you use to sign in.'
                            }
                        >
                            <ol className="invites-steps">
                                <li>Ask your workspace admin to invite your email.</li>
                                <li>
                                    <Link to="/register">Register</Link> or{' '}
                                    <Link to="/login">sign in</Link> with that same address.
                                </li>
                                <li>Return here and tap Accept.</li>
                            </ol>
                        </EmptyState>
                    ) : (
                        <ul className="invite-list">
                            {pendingForMe.map((inv) => (
                                <li key={inv.id} className="invite-list__item">
                                    <div className="invite-list__meta">
                                        <span className="invite-list__email">Workspace invite</span>
                                        <span className="invite-list__role">
                                            Role: <Badge role={inv.role} />
                                        </span>
                                    </div>
                                    <div className="invite-list__actions">
                                        <Button
                                            type="button"
                                            loading={actionLoading === `accept-${inv.id}`}
                                            onClick={() => handleAccept(inv.id)}
                                        >
                                            Accept
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>

                {adminWorkspaces.length > 0 ? (
                    <Card>
                        <h2 className="invites-section-heading">
                            Invite collaborators
                            <span className="code-label">admin</span>
                        </h2>
                        <InlineAlert variant="warning">
                            Tell your teammate to register with the email you enter — they will not
                            receive a message from this app.
                        </InlineAlert>
                        <form className="invites-form-grid" onSubmit={handleCreateInvite}>
                            <Select
                                label="Workspace"
                                options={workspaceOptions}
                                value={selectedWorkspaceId}
                                onChange={(ev) => setSelectedWorkspaceId(ev.target.value)}
                                disabled={actionLoading === 'create'}
                            />
                            <Input
                                label="Invitee email"
                                type="email"
                                required
                                value={inviteEmail}
                                onChange={(ev) => setInviteEmail(ev.target.value)}
                                placeholder="colleague@example.com"
                                hint="Must match the email they use to register or sign in."
                                disabled={actionLoading === 'create'}
                            />
                            <Select
                                label="Role"
                                options={[
                                    { value: 'member', label: 'Member — tasks only' },
                                    { value: 'admin', label: 'Admin — sprints & invites' },
                                ]}
                                value={inviteRole}
                                onChange={(ev) => setInviteRole(ev.target.value as InviteRole)}
                                disabled={actionLoading === 'create'}
                            />
                            <Button type="submit" loading={actionLoading === 'create'}>
                                Create invite
                            </Button>
                        </form>

                        <h3 className="invites-subheading">Outstanding invites</h3>
                        {invitesForSelectedAdminWs.length === 0 ? (
                            <p className="invites-empty">No open invites for this workspace.</p>
                        ) : (
                            <ul className="invite-list">
                                {invitesForSelectedAdminWs.map((inv) => (
                                    <li key={inv.id} className="invite-list__item">
                                        <div className="invite-list__meta">
                                            <span className="invite-list__email">{inv.email}</span>
                                            <span className="invite-list__role">
                                                <Badge role={inv.role} />
                                            </span>
                                        </div>
                                        <div className="invite-list__actions">
                                            <Button
                                                type="button"
                                                variant="danger"
                                                loading={actionLoading === `revoke-${inv.id}`}
                                                onClick={() => handleRevoke(inv.id)}
                                            >
                                                Revoke
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                ) : (
                    session?.user && (
                        <Card>
                            <p className="invites-empty">
                                Admin invite controls appear when you own or administer a workspace.
                                Members can still accept invites sent to their email above.
                            </p>
                        </Card>
                    )
                )}
            </div>
        </div>
    );
};

export default InvitesPage;
