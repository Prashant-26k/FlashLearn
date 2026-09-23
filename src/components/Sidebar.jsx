import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

const navLinks = [
    { to: '/dashboard', label: 'Home', icon: 'home' },
    { to: '/decks', label: 'Decks', icon: 'layers' },
    { to: '/collections', label: 'Collections', icon: 'folder' },
    { to: '/quiz', label: 'Quiz', icon: 'school' },
    { to: '/settings', label: 'Settings', icon: 'settings' },
];

export default function Sidebar({ isOpen, collapsed, onClose, onToggleCollapse }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Close sidebar on route change (mobile)
    useEffect(() => {
        onClose();
    }, [location.pathname, onClose]);

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

            <aside className={`sidebar ${isOpen ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
                {/* Collapse toggle */}
                <button
                    className="sidebar-collapse-btn"
                    onClick={onToggleCollapse}
                    aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
                    title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                        {collapsed ? 'chevron_right' : 'chevron_left'}
                    </span>
                </button>

                {/* New Deck Button */}
                <button
                    className="btn btn-primary btn-full sidebar-new-deck"
                    onClick={() => { navigate('/create'); onClose(); }}
                    title="New Deck"
                >
                    <span className="material-symbols-outlined sidebar-item-icon" style={{ fontSize: 18 }}>add</span>
                    <span className="sidebar-label">New Deck</span>
                </button>

                {/* Nav Links */}
                <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {navLinks.map(link => {
                        const isActive = link.to === '/dashboard'
                            ? location.pathname === '/dashboard'
                            : location.pathname.startsWith(link.to);
                        return (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                end={link.to === '/dashboard'}
                                className={({ isActive: navActive }) => `nav-item ${navActive ? 'active' : ''}`}
                                title={collapsed ? link.label : undefined}
                            >
                                <span
                                    className={`material-symbols-outlined nav-icon ${isActive ? 'icon-filled' : ''}`}
                                    style={{ fontSize: 20 }}
                                >
                                    {link.icon}
                                </span>
                                <span className="sidebar-label">{link.label}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Spacer */}
                <div style={{ marginTop: 'auto' }} />

                {/* User Row */}
                <div
                    onClick={() => { navigate('/settings'); onClose(); }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '12px',
                        borderTop: '1px solid var(--border-subtle)', marginTop: 8,
                        cursor: 'pointer', transition: 'background 150ms ease', borderRadius: 'var(--radius-sm)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    title="Open Settings"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && navigate('/settings')}
                    aria-label="Open Settings"
                >
                    {user?.avatar ? (
                        <img
                            src={user.avatar}
                            alt={user.displayName}
                            style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }}
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <div style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #7c6af5, #4b2bee)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
                        }}>
                            {user?.displayName?.[0] || 'U'}
                        </div>
                    )}
                    <span className="sidebar-label" style={{
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