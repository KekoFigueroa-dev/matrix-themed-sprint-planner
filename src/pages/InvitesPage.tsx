import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSupabase } from '../lib/supabaseClient';
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

    const [adminWorkspaces, setAdminWorkspaces] = useState<AdminWorkspaceOption[]>([]);
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');

    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<InviteRole>('member');

    const [invitesVisible, setInvitesVisible] = useState<InviteRow[]>([]);

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
            setError(invErr.message);
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

    const handleCreateInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const email = normalizeEmail(inviteEmail);
        if (!email || !selectedWorkspaceId || !session?.user) return;

        const { error: insErr } = await supabase.from('invites').insert({
            workspace_id: selectedWorkspaceId,
            email,
            role: inviteRole,
            invited_by: session.user.id,
        });

        if (insErr) {
            setError(insErr.message);
            return;
        }
        setInviteEmail('');
        await refreshInvites();
    };

    const handleRevoke = async (id: string) => {
        setError(null);
        const { error: delErr } = await supabase.from('invites').delete().eq('id', id);
        if (delErr) {
            setError(delErr.message);
            return;
        }
        await refreshInvites();
    };

    const handleAccept = async (id: string) => {
        setError(null);
        const { error: rpcErr } = await supabase.rpc('accept_workspace_invite', {
            p_invite_id: id,
        });
        if (rpcErr) {
            setError(rpcErr.message);
            return;
        }
        await refreshInvites();
    };

    if (loading) {
        return (
            <div className="invites-shell">
                <p className="auth-info">Loading invites…</p>
            </div>
        );
    }

    return (
        <div className="invites-shell">
            <header className="invites-header">
                <Link to="/" className="invites-back">
                    ← Planner
                </Link>
                <h1 className="invites-title">Invites</h1>
            </header>

            {error && (
                <p className="auth-error" role="alert">
                    {error}
                </p>
            )}

            <section className="invites-section">
                <h2 className="invites-section-title">Pending for you</h2>
                {pendingForMe.length === 0 ? (
                    <p className="auth-info">No pending invites for this account.</p>
                ) : (
                    <ul className="invite-list">
                        {pendingForMe.map((inv) => (
                            <li key={inv.id} className="invite-row">
                                <span className="invite-meta">
                                    Workspace invite · role <strong>{inv.role}</strong>
                                </span>
                                <button type="button" className="auth-submit invite-accept" onClick={() => handleAccept(inv.id)}>
                                    Accept
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {adminWorkspaces.length > 0 && (
                <section className="invites-section">
                    <h2 className="invites-section-title">Invite collaborators (admin)</h2>
                    <label className="auth-label">
                        Workspace
                        <select
                            className="auth-input"
                            value={selectedWorkspaceId}
                            onChange={(ev) => setSelectedWorkspaceId(ev.target.value)}
                        >
                            {adminWorkspaces.map((w) => (
                                <option key={w.workspace_id} value={w.workspace_id}>
                                    {w.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <form className="invite-create-form" onSubmit={handleCreateInvite}>
                        <label className="auth-label">
                            Email
                            <input
                                className="auth-input"
                                type="email"
                                required
                                value={inviteEmail}
                                onChange={(ev) => setInviteEmail(ev.target.value)}
                                placeholder="colleague@example.com"
                            />
                        </label>
                        <label className="auth-label">
                            Role
                            <select
                                className="auth-input"
                                value={inviteRole}
                                onChange={(ev) => setInviteRole(ev.target.value as InviteRole)}
                            >
                                <option value="member">member</option>
                                <option value="admin">admin</option>
                            </select>
                        </label>
                        <button type="submit" className="auth-submit">
                            Send invite
                        </button>
                    </form>

                    <h3 className="invites-subtitle">Outstanding invites</h3>
                    {invitesForSelectedAdminWs.length === 0 ? (
                        <p className="auth-info">None for this workspace.</p>
                    ) : (
                        <ul className="invite-list">
                            {invitesForSelectedAdminWs.map((inv) => (
                                <li key={inv.id} className="invite-row">
                                    <span className="invite-meta">
                                        {inv.email} · {inv.role}
                                    </span>
                                    <button
                                        type="button"
                                        className="sign-out-button invite-revoke"
                                        onClick={() => handleRevoke(inv.id)}
                                    >
                                        Revoke
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            )}

            {adminWorkspaces.length === 0 && session?.user && (
                <p className="auth-info subtle-hint">
                    If you expected admin controls here, reload or check the browser console — workspace lookup uses your membership rows.
                </p>
            )}
        </div>
    );
};

export default InvitesPage;
