import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSupabase } from '../lib/supabaseClient';

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
            <form className="auth-form" onSubmit={handleSubmit}>
                <h1 className="auth-title">Sign in</h1>
                {error && <p className="auth-error" role="alert">{error}</p>}
                <label className="auth-label">
                    Email
                    <input
                        className="auth-input"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(ev) => setEmail(ev.target.value)}
                        required
                    />
                </label>
                <label className="auth-label">
                    Password
                    <input
                        className="auth-input"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(ev) => setPassword(ev.target.value)}
                        required
                    />
                </label>
                <button type="submit" className="auth-submit" disabled={loading}>
                    {loading ? 'Signing in…' : 'Sign in'}
                </button>
                <p className="auth-footer">
                    No account? <Link to="/register">Register</Link>
                </p>
            </form>
        </div>
    );
};

export default LoginPage;
