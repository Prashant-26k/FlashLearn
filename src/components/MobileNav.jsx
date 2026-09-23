import { NavLink, useLocation } from 'react-router-dom';

const navItems = [
    { to: '/dashboard', label: 'Home', icon: 'home' },
    { to: '/decks', label: 'Decks', icon: 'layers' },
    { to: '/collections', label: 'Collections', icon: 'folder' },
    { to: '/quiz', label: 'Quiz', icon: 'school' },
    { to: '/settings', label: 'Settings', icon: 'settings' },
];

export default function MobileNav() {
    const location = useLocation();

    return (
        <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
            {navItems.map(item => {
                const isActive = item.to === '/dashboard'
                    ? location.pathname === '/dashboard'
                    : location.pathname.startsWith(item.to);
                return (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/dashboard'}
                        className={({ isActive: navActive }) =>
                            `mobile-nav-item${navActive ? ' active' : ''}`
                        }
                        aria-label={item.label}
                    >
                        <span
                            className="material-symbols-outlined"
                            style={{
                                fontVariationSettings: isActive
                                    ? "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24"
                                    : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                                fontSize: 24,
                            }}
                        >
                            {item.icon}
                        </span>
                        <span>{item.label}</span>
                    </NavLink>
                );
            })}
        </nav>
    );
}
