import { Outlet, useLocation } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';

export default function AppLayout() {
    const location = useLocation();
    // Hide header/footer on reader page usually, or login
    const isReader = location.pathname.includes('/chapter/');
    const isAuth = location.pathname === '/login' || location.pathname === '/signup';

    if (isReader) {
        return <Outlet />;
    }

    return (
        <div className="flex flex-col min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans antialiased">
            {!isAuth && <Header />}
            <main className="flex-1">
                <Outlet />
            </main>
            {!isAuth && <Footer />}
            {!isAuth && <BottomNav />}
        </div>
    );
}
