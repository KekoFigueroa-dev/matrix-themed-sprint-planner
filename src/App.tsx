import React, { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import ConfigMissingPage from './pages/ConfigMissingPage';
import LoginPage from './pages/LoginPage';
import PlannerPage from './pages/PlannerPage';
import RegisterPage from './pages/RegisterPage';
import { getSupabase, isSupabaseConfigured } from './lib/supabaseClient';

async function ensureWorkspace(): Promise<void> {
    const { error } = await getSupabase().rpc('ensure_workspace_for_user');
    if (error) {
        console.error('ensure_workspace_for_user:', error.message);
    }
}

const SessionRoutes: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const supabase = getSupabase();

        const init = async () => {
            const { data: { session: initial } } = await supabase.auth.getSession();
            if (cancelled) return;
            setSession(initial);
            if (initial?.user) {
                await ensureWorkspace();
            }
            if (!cancelled) setReady(true);
        };

        void init();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, nextSession) => {
                setSession(nextSession);
                if (nextSession?.user) {
                    await ensureWorkspace();
                }
            }
        );

        return () => {
            cancelled = true;
            subscription.unsubscribe();
        };
    }, []);

    if (!ready) {
        return (
            <div className="auth-page">
                <p className="auth-info">Loading session…</p>
            </div>
        );
    }

    return (
        <Routes>
            <Route path="/login" element={session ? <Navigate to="/" replace /> : <LoginPage />} />
            <Route path="/register" element={session ? <Navigate to="/" replace /> : <RegisterPage />} />
            <Route path="/" element={session ? <PlannerPage /> : <Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
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
