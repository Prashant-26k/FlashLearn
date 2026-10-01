import { useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { getBackendBaseUrl } from '../utils/api';

export default function GoogleAuthRedirect() {
    const { login } = useAuth();
    const authConfigured = Boolean(getBackendBaseUrl());

    useEffect(() => {
        if (authConfigured) login();
    }, [authConfigured, login]);

    return (
        <main style={{ display: 'grid', minHeight: '100vh', placeItems: 'center', padding: 24 }}>
            <p role={!authConfigured ? 'alert' : undefined}>
                {authConfigured ? 'Redirecting to Google...' : 'Google sign-in is not configured for this deployment.'}
            </p>
        </main>
    );
}
