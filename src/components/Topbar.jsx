import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Topbar({ onMenuToggle }) {
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
            {/* Left: Hamburger (mobile) + Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Hamburger — shown via CSS on mobile only */}
                <button
                    className="hamburger-btn"
                    onClick={onMenuToggle}
                    aria-label="Toggle navigation"
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '6px',
                        display: 'none',       // shown via CSS on mobile
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
                    <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 17, letterSpacing: '-0.03em' }}>Flash</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 17, letterSpacing: '-0.03em' }}>Learn</span>
                </div>
            </div>

            {/* Right side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }} ref={dropdownRef}>
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                        display: 'flex', alignItems: 'center',
                    }}
                    aria-label="User menu"
                >
                    {user?.avatar ? (
                        <img
                            src={user.avatar}
                            alt={user.displayName}
                            style={{
                                width: 34, height: 34, borderRadius: '50%',
                                ring: '2px', ringColor: 'rgba(75,43,238,0.3)',
                                boxShadow: '0 0 0 2px rgba(75,43,238,0.25)',
                            }}
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <div style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #7c6af5, #4b2bee)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 'var(--text-sm)', fontWeight: 700, color: '#fff',
                            boxShadow: '0 0 0 2px rgba(75,43,238,0.25)',
                        }}>
                            {user?.displayName?.[0] || 'U'}
                        </div>
                    )}
                </button>

                {showDropdown && (
                    <div className="dropdown" style={{ minWidth: 220 }}>
                        <div style={{ padding: '10px 14px' }}>
                            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {user?.displayName || 'User'}
                            </div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
                                {user?.email || ''}
                            </div>
                        </div>
                        <div className="dropdown-divider" />
                        <button
                            className="dropdown-item"
                            onClick={() => { navigate('/settings'); setShowDropdown(false); }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>settings</span>
                            Settings
                        </button>
                        <div className="dropdown-divider" />
                        <button
                            className="dropdown-item danger"
                            onClick={() => { logout(); setShowDropdown(false); }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>logout</span>
                            Sign Out
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}