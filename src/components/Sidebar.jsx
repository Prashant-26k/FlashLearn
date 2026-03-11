import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: '⊞' },
    { to: '/decks', label: 'My Decks', icon: '▤' },
    { to: '/collections', label: 'Collections', icon: '◫' },
    { to: '/quiz', label: 'Quiz Mode', icon: '◈' },
    { to: '/settings', label: 'Settings', icon: '⚙' },
];

export default function Sidebar({ isOpen, onClose }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Close sidebar on route change (mobile)
    useEffect(() => {
        onClose();
    }, [location.pathname]);

    // Prevent body scroll when sidebar is open on mobile
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        zIndex: 99,
                        display: 'none',
                    }}
                    className="sidebar-overlay"
                />
            )}

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                {/* New Deck Button */}
                <button
                    className="btn btn-primary btn-full"
                    onClick={() => { navigate('/create'); onClose(); }}
                    style={{ marginBottom: 20, height: 36, borderRadius: 'var(--radius-sm)' }}
                >
                    + New Deck
                </button>

                {/* Nav Links */}
                <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {navLinks.map(link => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            end={link.to === '/dashboard'}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        >
                            <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{link.icon}</span>
                            {link.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Spacer */}
                <div style={{ marginTop: 'auto' }} />

                {/* User Row */}
                <div
                    onClick={() => { navigate('/settings'); onClose(); }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '12px',
                        borderTop: '1px solid var(--border-subtle)', marginTop: 8,
                        cursor: 'pointer', transition: 'background 150ms ease', borderRadius: 'var(--radius-sm)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    title="Open Settings"
                >
                    {user?.avatar ? (
                        <img
                            src={user.avatar}
                            alt={user.displayName}
                            style={{ width: 24, height: 24, borderRadius: '50%' }}
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <div style={{
                            width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 'var(--text-xs)', fontWeight: 600, color: '#fff'
                        }}>
                            {user?.displayName?.[0] || 'U'}
                        </div>
                    )}
                    <span style={{
                        fontSize: 'var(--text-sm)', color: 'var(--text-primary)',
                        flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                        {user?.displayName || 'User'}
                    </span>
                </div>
            </aside>
        </>
    );
}