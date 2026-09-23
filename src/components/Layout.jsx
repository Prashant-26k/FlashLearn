import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileNav from './MobileNav';

export default function Layout() {
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => (
        localStorage.getItem('flashlearn_sidebar_collapsed') === 'true'
    ));

    const toggleSidebar = () => {
        setSidebarCollapsed((collapsed) => {
            const next = !collapsed;
            localStorage.setItem('flashlearn_sidebar_collapsed', String(next));
            return next;
        });
    };

    return (
        <div className={`app-layout route-${location.pathname.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            <Sidebar
                isOpen={sidebarOpen}
                collapsed={sidebarCollapsed}
                onClose={() => setSidebarOpen(false)}
                onToggleCollapse={toggleSidebar}
            />
            <Topbar onMenuToggle={() => setSidebarOpen(prev => !prev)} />
            <main className="main-content page-enter">
                <Outlet />
            </main>
            <MobileNav />
        </div>
    );
}