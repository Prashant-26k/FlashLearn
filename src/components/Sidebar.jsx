import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';

const primaryNavLinks = [
    { to: '/dashboard', label: 'Home', icon: 'home' },
    { to: '/decks', label: 'Decks', icon: 'layers' },
    { to: '/collections', label: 'Collections', icon: 'folder' },
    { to: '/quiz', label: 'Quiz', icon: 'school' },
    { to: '/history', label: 'History', icon: 'history' },
    { to: '/favorites', label: 'Favourites', icon: 'star' },
];

export default function Sidebar({ isOpen, onClose }) {
    const navigate = useNavigate();
    const location = useLocation();
    const prevPathRef = useRef(location.pathname);

    // Close sidebar on route change only
    useEffect(() => {
        if (prevPathRef.current !== location.pathname) {
            prevPathRef.current = location.pathname;
            onClose();
        }
    }, [location.pathname, onClose]);

    // Prevent body scroll when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Keyboard accessibility: Escape key closes drawer
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    return (
        <>
            {/* 1. Backdrop Overlay */}
            <div
                id="drawerOverlay"
                className={`drawer-overlay ${isOpen ? 'active' : ''}`}
                onClick={onClose}
                aria-hidden={!isOpen}
            />

            {/* 2. Mini Sidebar (Collapsed Default State) */}
            <aside className="mini-sidebar" aria-label="Mini navigation">
                <button
                    className="mini-nav-item mini-new-deck"
                    onClick={() => navigate('/create')}
                    title="New Deck"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: 22 }}>add</span>
                    <span>New</span>
                </button>

                {primaryNavLinks.map(link => {
                    const isActive = link.to === '/dashboard'
                        ? location.pathname === '/dashboard'
                        : location.pathname.startsWith(link.to);
                    return (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            end={link.to === '/dashboard'}
                            className={({ isActive: navActive }) => `mini-nav-item ${navActive ? 'active' : ''}`}
                            title={link.label}
                        >
                            <span
                                className={`material-symbols-outlined ${isActive ? 'icon-filled' : ''}`}
                                style={{ fontSize: 22 }}
                            >
                                {link.icon}
                            </span>
                            <span>{link.label}</span>
                        </NavLink>
                    );
                })}

                {/* Profile Icon in Mini Sidebar: simple person icon navigating directly to /profile */}
                <button
                    className={`mini-nav-item ${location.pathname === '/profile' ? 'active' : ''}`}
                    onClick={() => navigate('/profile')}
                    title="You (Profile Dashboard)"
                    aria-label="Profile Dashboard"
                    style={{ marginTop: 'auto', marginBottom: 8 }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: 24 }}>person</span>
                </button>
            </aside>

            {/* 3. Expanded Slide-In Drawer (Overlay) */}
            <aside
                id="expandedSidebar"
                className={`expanded-sidebar ${isOpen ? 'open' : ''}`}
                aria-label="Primary navigation"
                aria-hidden={!isOpen}
            >
                {/* Header with identical hamburger + logo: Creates the seamless 'Combine' effect */}
                <div className="drawer-header brand-header">
                    <button
                        id="drawerHamburgerBtn"
                        className="hamburger-btn icon-btn"
                        onClick={onClose}
                        aria-label="Close navigation"
                        title="Guide"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 24 }}>menu</span>
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: '0.05em', lineHeight: 1 }}>
                            <span style={{ color: 'var(--text-link)' }}>Flash</span>
                            <span style={{ color: 'var(--text-primary)' }}>Learn</span>
                        </div>
                    </div>
                </div>

                {/* Drawer Scrollable Content */}
                <div className="drawer-content">
                    {/* New Deck Button */}
                    <button
                        className="btn btn-primary btn-full sidebar-new-deck"
                        onClick={() => { navigate('/create'); onClose(); }}
                        title="New Deck"
                    >
                        <span className="material-symbols-outlined sidebar-item-icon" style={{ fontSize: 18 }}>add</span>
                        <span className="sidebar-label">New Deck</span>
                    </button>

                    {/* Primary Links: Dedicated links for Home, Decks, Collections, Quiz, History, Favourites */}
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {primaryNavLinks.map(link => {
                            const isActive = link.to === '/dashboard'
                                ? location.pathname === '/dashboard'
                                : location.pathname.startsWith(link.to);
                            return (
                                <NavLink
                                    key={link.to}
                                    to={link.to}
                                    end={link.to === '/dashboard'}
                                    className={({ isActive: navActive }) => `drawer-nav-item ${navActive ? 'active' : ''}`}
                                    onClick={onClose}
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

                    {/* Section Divider */}
                    <div className="drawer-divider" />

                    {/* Account Section: Simple Person Icon navigating to Profile (/profile) */}
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <NavLink
                            to="/profile"
                            className={({ isActive }) => `drawer-nav-item ${isActive ? 'active' : ''}`}
                            onClick={onClose}
                            title="Profile"
                        >
                            <span className="material-symbols-outlined nav-icon" style={{ fontSize: 20 }}>
                                person
                            </span>
                            <span className="sidebar-label">Profile</span>
                        </NavLink>

                        {/* Settings */}
                        <NavLink
                            to="/settings"
                            className={({ isActive }) => `drawer-nav-item ${isActive ? 'active' : ''}`}
                            onClick={onClose}
                            title="Settings"
                        >
                            <span className="material-symbols-outlined nav-icon" style={{ fontSize: 20 }}>
                                settings
                            </span>
                            <span className="sidebar-label">Settings</span>
                        </NavLink>
                    </nav>
                </div>
            </aside>
        </>
    );
}