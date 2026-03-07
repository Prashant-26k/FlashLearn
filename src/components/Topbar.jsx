import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Topbar() {
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
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 18 }}>Flash</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 18 }}>Learn</span>
            </div>

            {/* Right side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }} ref={dropdownRef}>
                {/* Avatar */}
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                        display: 'flex', alignItems: 'center',
                    }}
                >
                    {user?.avatar ? (
                        <img
                            src={user.avatar}
                            alt={user.displayName}
                            style={{ width: 32, height: 32, borderRadius: '50%' }}
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <div style={{
                            width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 'var(--text-sm)', fontWeight: 600, color: '#fff',
                        }}>
                            {user?.displayName?.[0] || 'U'}
                        </div>
                    )}
                </button>

                {/* Dropdown */}
                {showDropdown && (
                    <div className="dropdown">
                        <div style={{ padding: '8px 12px' }}>
                            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
                                {user?.displayName || 'User'}
                            </div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
                                {user?.email || ''}
                            </div>
                        </div>
                        <div className="dropdown-divider" />
                        <button className="dropdown-item" onClick={() => navigate('/profile')} style={{ paddingLeft: '32px', position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '12px', fontSize: '14px' }}>👤</span>
                            My Profile
                        </button>
                        <button className="dropdown-item danger" onClick={logout} style={{ paddingLeft: '32px', position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '12px', fontSize: '14px' }}>⏻</span>
                            Sign Out
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}
