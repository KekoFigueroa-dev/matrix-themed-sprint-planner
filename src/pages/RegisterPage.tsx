import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSupabase } from '../lib/supabaseClient';

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setInfo(null);
        setLoading(true);
        try {
            const { data, error: signErr } = await getSupabase().auth.signUp({
                email: email.trim(),
                password,
            });
            if (signErr) {
                setError(signErr.message);
                return;
            }
            if (data.session) {
                navigate('/', { replace: true });
                return;
            }
            setInfo('Check your email to confirm your account (if confirmations are enabled), then sign in.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <form className="auth-form" onSubmit={handleSubmit}>
                <h1 className="auth-title">Register</h1>
                {error && <p className="auth-error" role="alert">{error}</p>}
                {info && <p className="auth-info" role="status">{info}</p>}
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
                        autoComplete="new-password"
                        minLength={6}
                        value={password}
                        onChange={(ev) => setPassword(ev.target.value)}
                        required
                    />
                </label>
                <button type="submit" className="auth-submit" disabled={loading}>
                    {loading ? 'Creating account…' : 'Create account'}
                </button>
                <p className="auth-footer">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </form>
        </div>
    );
};

export default RegisterPage;
