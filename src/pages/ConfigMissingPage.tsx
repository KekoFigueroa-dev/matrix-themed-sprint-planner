import React from 'react';
import { Card, InlineAlert } from '../ui';

/** Shown when Supabase env vars are not set — avoids crashing the whole app. */
const ConfigMissingPage: React.FC = () => (
    <div className="auth-page">
        <Card title="Supabase not configured" className="auth-card">
            <InlineAlert variant="warning">
                Add environment variables before using the planner locally or on Vercel.
            </InlineAlert>
            <p className="auth-card__subtitle">
                Create <span className="code-label">.env.local</span> in the project root:
            </p>
            <pre className="auth-pre">
                {`REACT_APP_SUPABASE_URL=…
REACT_APP_SUPABASE_ANON_KEY=…
# or
REACT_APP_SUPABASE_PUBLISHABLE_KEY=…`}
            </pre>
            <p className="auth-card__subtitle">
                Restart <span className="text-highlight">npm start</span> after saving.
            </p>
        </Card>
    </div>
);

export default ConfigMissingPage;
