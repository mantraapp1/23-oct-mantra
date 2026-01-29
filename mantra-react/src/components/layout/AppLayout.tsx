import { Outlet, useLocation } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';

export default function AppLayout() {
    const location = useLocation();

    // Pages that should take up the full screen (no header/footer/nav)
    // Includes: Reader, Create/Edit Chapter, Create/Edit/Manage Novel
    const isImmersive =
        location.pathname.includes('/chapter/') || // Reader & Edit Chapter
        location.pathname.includes('/create-chapter') || // Create Chapter
        location.pathname.includes('/novel/') || // All novel pages (Details, Create, Edit, Manage)
        location.pathname.includes('/dashboard') ||
        location.pathname.includes('/wallet') ||
        location.pathname.includes('/settings') ||
        location.pathname.includes('/profile/edit') ||
        location.pathname.includes('/faq') ||
        location.pathname.includes('/report') ||
        location.pathname.includes('/contact') ||
        location.pathname.includes('/user/');

    const isAuth = location.pathname === '/login' || location.pathname === '/signup';

    // Only show BottomNav on main tab pages
    const mainTabs = ['/', '/library', '/ranking', '/profile', '/notifications'];
    const showBottomNav = mainTabs.includes(location.pathname);

    if (isImmersive) {
        return <Outlet />;
    }

    return (
        <div className="flex flex-col min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans antialiased">
            {!isAuth && !isImmersive && <Header />}
            <main className="flex-1">
                <Outlet />
            </main>
            {!isAuth && <Footer />}
            {!isAuth && showBottomNav && <BottomNav />}
        </div>
    );
}
