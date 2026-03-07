import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    // Manage profile fields based on context
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [email, setEmail] = useState(user?.email || '');
    const [loading, setLoading] = useState(false);

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        // Simulate an API call delay
        setTimeout(() => {
            setLoading(false);
            toast.success('Profile updated successfully (Simulation)');
        }, 800);
    };

    return (
        <div className="page-enter" style={{ maxWidth: 600, margin: '0 auto', padding: '48px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ fontSize: 18, padding: '0 8px' }}>←</button>
                <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>My Profile</h1>
            </div>

            <div style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: 32,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
                    {user?.avatar ? (
                        <img
                            src={user.avatar}
                            alt="Profile"
                            style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }}
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <div style={{
                            width: 80, height: 80, borderRadius: '50%', background: 'var(--accent)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 32, fontWeight: 600, color: '#fff'
                        }}>
                            {user?.displayName?.[0] || 'U'}
                        </div>
                    )}
                    <div>
                        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 4 }}>
                            {user?.displayName || 'User'}
                        </h2>
                        <p style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
                    </div>
                </div>

                <form onSubmit={handleSave}>
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>
                            Display Name
                        </label>
                        <input
                            type="text"
                            className="input"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Your name"
                        />
                    </div>

                    <div style={{ marginBottom: 32 }}>
                        <label style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>
                            Email Address
                        </label>
                        <input
                            type="email"
                            className="input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your.email@example.com"
                            disabled
                            style={{ opacity: 0.7, cursor: 'not-allowed' }}
                            title="Email linked to authentication provider"
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 20, borderTop: '1px solid var(--border-subtle)' }}>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
