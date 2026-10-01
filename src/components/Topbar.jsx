import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';

export default function Topbar({ isMenuOpen, onMenuToggle }) {
    const { user, logout } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <header className="topbar">
            {/* Left: Hamburger + Logo */}
            <div className="brand-header" style={{ display: 'flex', alignItems: 'center', gap: 12, height: '56px', padding: 0 }}>
                {/* Hamburger — always visible */}
                <button
                    id="navHamburgerBtn"
                    className="hamburger-btn icon-btn"
                    onClick={onMenuToggle}
                    aria-label={isMenuOpen ? 'Close navigation' : 'Open navigation'}
                    aria-expanded={isMenuOpen}
                    aria-controls="primary-navigation"
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-secondary)',
                        transition: 'color 150ms ease',
                    }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: 24 }}>menu</span>
                </button>

                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.03em' }}>
                        <span style={{ color: 'var(--accent)' }}>FLASH</span>
                        <span style={{ color: 'var(--text-primary)' }}>LEARN</span>
                    </span>
                </div>
            </div>

            {/* Right side: User avatar toggling dropdown menu */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }} ref={dropdownRef}>
                <button
                    onClick={() => setShowDropdown((prev) => !prev)}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                    }}
                    aria-label="User account menu"
                    aria-expanded={showDropdown}
                >
                    {user?.avatar ? (
                        <img
                            src={user.avatar}
                            alt={user.displayName || 'User Profile'}
                            style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-subtle)' }}
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #7c6af5, #4b2bee)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 14,
                            fontWeight: 700,
                            color: '#fff',
                        }}>
                            {user?.displayName?.[0] || (
                                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>person</span>
                            )}
                        </div>
                    )}
                </button>

                {showDropdown && (
                    <div className="dropdown" style={{ minWidth: 230, position: 'absolute', right: 0, top: 'calc(100% + 8px)' }}>
                        {/* 1. User Profile Picture & Info */}
                        <div
                            onClick={() => { navigate('/profile'); setShowDropdown(false); }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '12px 14px',
                                cursor: 'pointer',
                                borderRadius: 'var(--radius-sm)',
                                transition: 'background 150ms ease',
                            }}
                            title="View Profile"
                        >
                            {user?.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.displayName || 'Profile'}
                                    style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <div style={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #7c6af5, #4b2bee)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 16,
                                    fontWeight: 700,
                                    color: '#fff',
                                    flexShrink: 0,
                                }}>
                                    {user?.displayName?.[0] || 'U'}
                                </div>
                            )}
                            <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {user?.displayName || 'User'}
                                </div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {user?.email || 'View Profile'}
                                </div>
                            </div>
                        </div>

                        <div className="dropdown-divider" />

                        {/* 2. Settings Option */}
                        <button
                            className="dropdown-item"
                            onClick={() => { navigate('/settings'); setShowDropdown(false); }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>settings</span>
                            Settings
                        </button>

                        <div className="dropdown-divider" />

                        {/* 3. Logout Option */}
                        <button
                            className="dropdown-item danger"
                            onClick={() => { logout(); setShowDropdown(false); }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}