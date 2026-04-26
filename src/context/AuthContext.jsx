import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for token in URL (OAuth callback)
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        if (token) {
            localStorage.setItem('flashlearn_token', token);
            window.history.replaceState({}, '', '/');
        }

        // Load user from stored token
        const storedToken = localStorage.getItem('flashlearn_token');
        if (storedToken) {
            try {
                const payload = JSON.parse(atob(storedToken.split('.')[1]));
                setUser({
                    userId: payload.userId,
                    displayName: payload.displayName,
                    email: payload.email,
                    avatar: payload.avatar,
                });
            } catch {
                localStorage.removeItem('flashlearn_token');
            }
        }
        setLoading(false);
    }, []);

    const login = () => {
        window.location.href = 'https://flashlearn-7ayp.onrender.com/auth/google';
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch {
            // ignore
        }
        localStorage.removeItem('flashlearn_token');
        setUser(null);
        window.location.href = '/';
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

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
