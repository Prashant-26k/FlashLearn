import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '100vh', background: 'var(--bg-base)'
            }}>
                <div className="skeleton" style={{ width: 200, height: 20 }} />
            </div>
        );
    }

    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return children;
}

export function PublicRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) return null;
    if (isAuthenticated) return <Navigate to="/" replace />;
    return children;
}
