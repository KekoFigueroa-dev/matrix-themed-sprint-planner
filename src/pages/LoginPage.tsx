import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSupabase } from '../lib/supabaseClient';
import { Button, Card, InlineAlert, Input } from '../ui';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const { error: signErr } = await getSupabase().auth.signInWithPassword({
                email: email.trim(),
                password,
            });
            if (signErr) {
                setError(signErr.message);
                return;
            }
            navigate('/', { replace: true });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <Card title="Sign in" className="auth-card">
                <p className="auth-card__subtitle">Sprint planning for small teams</p>
                <div className="auth-card__chip-row">
                    <span className="code-label">Supabase Auth</span>
                    <span className="code-label">Workspace RLS</span>
                </div>
                {error && <InlineAlert variant="error">{error}</InlineAlert>}
                <form onSubmit={handleSubmit}>
                    <Input
                        label="Email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(ev) => setEmail(ev.target.value)}
                        required
                        disabled={loading}
                    />
                    <Input
                        label="Password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(ev) => setPassword(ev.target.value)}
                        required
                        disabled={loading}
                    />
                    <Button type="submit" fullWidth loading={loading}>
                        {loading ? 'Signing in…' : 'Sign in'}
                    </Button>
                </form>
                <p className="auth-footer">
                    No account?{' '}
                    <Link to="/register" className="auth-cta-link">
                        Register
                    </Link>
                </p>
                <p className="auth-footer auth-footer--about">
                    <Link to="/about" className="app-footer-link">
                        About this project
                    </Link>
                </p>
            </Card>
        </div>
    );
};

export default LoginPage;
