import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSupabase } from '../lib/supabaseClient';
import { formatAuthError } from '../lib/supabaseErrors';
import { useSingleFlight } from '../lib/submitGuard';
import { Button, Card, InlineAlert, Input } from '../ui';

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { tryBegin, end } = useSingleFlight();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tryBegin()) return;
        setError(null);
        setInfo(null);
        setLoading(true);
        try {
            const { data, error: signErr } = await getSupabase().auth.signUp({
                email: email.trim(),
                password,
            });
            if (signErr) {
                setError(formatAuthError(signErr));
                return;
            }
            if (data.session) {
                navigate('/', { replace: true });
                return;
            }
            setInfo('Check your email to confirm your account (if confirmations are enabled), then sign in.');
        } finally {
            end();
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <Card title="Create account" className="auth-card">
                <p className="auth-card__subtitle">Your workspace is created on first sign-in</p>
                <div className="auth-card__chip-row">
                    <span className="code-label">Email + password</span>
                </div>
                {error && <InlineAlert variant="error">{error}</InlineAlert>}
                {info && <InlineAlert variant="info">{info}</InlineAlert>}
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
                        autoComplete="new-password"
                        minLength={6}
                        hint="At least 6 characters"
                        value={password}
                        onChange={(ev) => setPassword(ev.target.value)}
                        required
                        disabled={loading}
                    />
                    <Button type="submit" variant="cta" fullWidth loading={loading}>
                        {loading ? 'Creating account…' : 'Create account'}
                    </Button>
                </form>
                <p className="auth-footer">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </Card>
        </div>
    );
};

export default RegisterPage;
