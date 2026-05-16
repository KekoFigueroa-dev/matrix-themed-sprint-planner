import React, { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import ConfigMissingPage from './pages/ConfigMissingPage';
import LoginPage from './pages/LoginPage';
import PlannerPage from './pages/PlannerPage';
import InvitesPage from './pages/InvitesPage';
import RegisterPage from './pages/RegisterPage';
import { getSupabase, isSupabaseConfigured } from './lib/supabaseClient';

const SessionRoutes: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [ready, setReady] = useState(false);
    const [workspaceBootstrapError, setWorkspaceBootstrapError] = useState<string | null>(null);

    const runEnsureWorkspace = useCallback(async () => {
        const { error } = await getSupabase().rpc('ensure_workspace_for_user');
        if (error) {
            console.error('ensure_workspace_for_user:', error.message);
            setWorkspaceBootstrapError(error.message);
        } else {
            setWorkspaceBootstrapError(null);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        const supabase = getSupabase();

        const init = async () => {
            const { data: { session: initial } } = await supabase.auth.getSession();
            if (cancelled) return;
            setSession(initial);
            if (initial?.user) {
                await runEnsureWorkspace();
            }
            if (!cancelled) setReady(true);
        };

        void init();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, nextSession) => {
                setSession(nextSession);
                if (nextSession?.user) {
                    await runEnsureWorkspace();
                } else {
                    setWorkspaceBootstrapError(null);
                }
            }
        );

        return () => {
            cancelled = true;
            subscription.unsubscribe();
        };
    }, [runEnsureWorkspace]);

    if (!ready) {
        return (
            <div className="auth-page">
                <p className="auth-info">Loading session…</p>
            </div>
        );
    }

    return (
        <>
            {session && workspaceBootstrapError && (
                <div className="bootstrap-error-banner" role="alert">
                    <span>
                        <strong>Workspace bootstrap failed:</strong> {workspaceBootstrapError}
                        {' '}
                        Run SQL migration{' '}
                        <code className="auth-code">20250515120000_ensure_workspace_for_user.sql</code>
                        {' '}in this Supabase project (SQL Editor), then retry.
                    </span>
                    <button type="button" className="bootstrap-error-retry" onClick={() => runEnsureWorkspace()}>
                        Retry
                    </button>
                </div>
            )}
            <Routes>
            <Route path="/login" element={session ? <Navigate to="/" replace /> : <LoginPage />} />
            <Route path="/register" element={session ? <Navigate to="/" replace /> : <RegisterPage />} />
            <Route path="/invites" element={session ? <InvitesPage /> : <Navigate to="/login" replace />} />
            <Route path="/" element={session ? <PlannerPage /> : <Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
};

const App: React.FC = () => {
    if (!isSupabaseConfigured()) {
        return <ConfigMissingPage />;
    }

    return (
        <BrowserRouter>
            <SessionRoutes />
        </BrowserRouter>
    );
};

export default App;
