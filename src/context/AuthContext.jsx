import { useState, useEffect } from 'react';
import api, { getBackendBaseUrl } from '../utils/api';
import AuthContext from './authContextValue';

function readStoredUser() {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const token = params.get('token');
    if (token) {
        localStorage.setItem('flashlearn_token', token);
        window.history.replaceState({}, '', window.location.pathname);
    }

    const storedToken = localStorage.getItem('flashlearn_token');
    if (!storedToken) return null;

    try {
        const payloadSegment = storedToken.split('.')[1];
        if (!payloadSegment) throw new Error('Invalid token');
        const payload = JSON.parse(atob(payloadSegment.replace(/-/g, '+').replace(/_/g, '/')));
        return {
            userId: payload.userId,
            displayName: payload.displayName,
            email: payload.email,
            avatar: payload.avatar,
        };
    } catch {
        localStorage.removeItem('flashlearn_token');
        return null;
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(readStoredUser);
    const [loading, setLoading] = useState(() => {
        if (typeof window === 'undefined') return false;
        return Boolean(localStorage.getItem('flashlearn_token'));
    });

    // Verify session with server on initial mount only when a stored token exists
    useEffect(() => {
        let mounted = true;
        const storedToken = typeof window !== 'undefined' ? localStorage.getItem('flashlearn_token') : null;

        if (!storedToken) {
            return;
        }

        api.get('/auth/me', { skipAuthRedirect: true })
            .then(res => {
                if (mounted && res.data?.user) {
                    setUser(res.data.user);
                }
            })
            .catch((err) => {
                if (err.response?.status === 401 || err.response?.status === 403) {
                    localStorage.removeItem('flashlearn_token');
                    if (mounted) setUser(null);
                }
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => { mounted = false; };
    }, []);

    const login = () => {
        const authBaseUrl = getBackendBaseUrl();
        if (!authBaseUrl) {
            throw new Error('Google sign-in is not configured for this deployment.');
        }
        window.location.href = `${authBaseUrl}/auth/google`;
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch {
            // ignore
        }
        localStorage.removeItem('flashlearn_token');
        setUser(null);
        window.location.replace('/');
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            loading,
            login,
            logout,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export { useAuth } from './useAuth';
