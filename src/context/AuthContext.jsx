import { createContext, useContext, useState } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

function readStoredUser() {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const token = params.get('token');
    if (token) {
        localStorage.setItem('flashlearn_token', token);
        window.history.replaceState({}, '', window.location.pathname);
    }

    const storedToken = localStorage.getItem('flashlearn_token');
    if (!storedToken) return null;

    try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
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
    const loading = false;

    const login = () => {
        const authBaseUrl = (import.meta.env.VITE_AUTH_BASE_URL || '').replace(/\/$/, '');
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

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
