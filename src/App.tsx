import React, { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import ConfigMissingPage from './pages/ConfigMissingPage';
import LoginPage from './pages/LoginPage';
import PlannerPage from './pages/PlannerPage';
import InvitesPage from './pages/InvitesPage';
import RegisterPage from './pages/RegisterPage';
import AboutPage from './pages/AboutPage';
import DonePage from './pages/DonePage';
import { getSupabase, isSupabaseConfigured } from './lib/supabaseClient';

/** Unblock UI if auth listener never fires (broken storage, etc.). */
const AUTH_READY_FALLBACK_MS = 8_000;

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
        let authReady = false;
        const supabase = getSupabase();

        const markReady = () => {
            if (!cancelled && !authReady) {
                authReady = true;
                setReady(true);
            }
        };

        const applySession = (nextSession: Session | null) => {
            if (!cancelled) setSession(nextSession);
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, nextSession) => {
                applySession(nextSession);
                markReady();
                if (nextSession?.user) {
                    void runEnsureWorkspace();
                } else {
                    setWorkspaceBootstrapError(null);
                }
            }
        );

        void supabase.auth.getSession().then(({ data: { session: initial }, error }) => {
            if (cancelled) return;
            if (error) {
                console.error('getSession:', error.message);
            }
            applySession(initial);
            markReady();
        });

        const fallbackTimer = window.setTimeout(markReady, AUTH_READY_FALLBACK_MS);

        return () => {
            cancelled = true;
            window.clearTimeout(fallbackTimer);
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
            <Route path="/about" element={<AboutPage />} />
            <Route path="/login" element={session ? <Navigate to="/" replace /> : <LoginPage />} />
            <Route path="/register" element={session ? <Navigate to="/" replace /> : <RegisterPage />} />
            <Route path="/invites" element={session ? <InvitesPage /> : <Navigate to="/login" replace />} />
            <Route path="/done" element={session ? <DonePage /> : <Navigate to="/login" replace />} />
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
