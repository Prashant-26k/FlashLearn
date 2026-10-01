import { useState, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileNav from './MobileNav';

export default function Layout() {
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleClose = useCallback(() => {
        setSidebarOpen(false);
    }, []);

    const handleToggle = useCallback(() => {
        setSidebarOpen(prev => !prev);
    }, []);

    return (
        <div className={`app-layout route-${location.pathname.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}`}>
            <Topbar
                isMenuOpen={sidebarOpen}
                onMenuToggle={handleToggle}
            />
            <Sidebar
                isOpen={sidebarOpen}
                onClose={handleClose}
            />
            <main className="main-content page-enter">
                <Outlet />
            </main>
            <MobileNav />
        </div>
    );
}