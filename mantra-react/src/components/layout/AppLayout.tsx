import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import { useAuth } from '../../contexts/AuthContext';
import { FullScreenLoader } from '@/components/ui/LoadingSpinner';

export default function AppLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, profile, isLoading } = useAuth();

    // Pages that should take up the full screen (no header/footer/nav)
    const isImmersive =
        location.pathname.includes('/chapter/') ||
        location.pathname.includes('/create-chapter') ||
        location.pathname.includes('/novel/') ||
        location.pathname.includes('/dashboard') ||
        location.pathname.includes('/wallet') ||
        location.pathname.includes('/settings') ||
        location.pathname.includes('/profile/edit') ||
        location.pathname.includes('/faq') ||
        location.pathname.includes('/report') ||
        location.pathname.includes('/contact') ||
        location.pathname.includes('/user/');

    // Auth pages (no header/footer)
    const isAuth =
        location.pathname === '/login' ||
        location.pathname === '/signup' ||
        location.pathname === '/onboarding' ||
        location.pathname === '/verify-email' ||
        location.pathname === '/reset-password' ||
        location.pathname === '/update-password';

    // Only show BottomNav on main tab pages
    const mainTabs = ['/', '/library', '/ranking', '/profile', '/notifications'];
    const showBottomNav = mainTabs.includes(location.pathname);

    // Onboarding Persistence Check
    useEffect(() => {
        if (!isLoading && user && profile) {
            // If user is logged in but hasn't completed onboarding
            if (profile.onboarding_completed === false) {
                // Allow access to onboarding and verify-email
                if (location.pathname !== '/onboarding' && location.pathname !== '/verify-email') {
                    console.log('[AppLayout] Redirecting to onboarding (incomplete profile)');
                    navigate('/onboarding', { replace: true });
                }
            }
        }
    }, [user, profile, isLoading, location.pathname, navigate]);

    if (isLoading) {
        return <FullScreenLoader />;
    }

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
