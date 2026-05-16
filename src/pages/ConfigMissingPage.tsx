import React from 'react';

/** Shown when Supabase env vars are not set — avoids crashing the whole app. */
const ConfigMissingPage: React.FC = () => (
    <div className="auth-page">
        <div className="auth-form">
            <h1 className="auth-title">Supabase not configured</h1>
            <p className="auth-info">
                Add a <code className="auth-code">.env.local</code> file in the project root with:
            </p>
            <pre className="auth-pre">
                {`REACT_APP_SUPABASE_URL=…
REACT_APP_SUPABASE_ANON_KEY=…
# or
REACT_APP_SUPABASE_PUBLISHABLE_KEY=…`}
            </pre>
            <p className="auth-info">Restart <code className="auth-code">npm start</code> after saving.</p>
        </div>
    </div>
);

export default ConfigMissingPage;
