import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
    children: React.ReactNode;
}

/**
 * Route guard component that redirects unauthenticated users to /login.
 * Preserves the intended destination so users can be redirected after login.
 */
export default function AuthGuard({ children }: AuthGuardProps) {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    // While checking auth status, show nothing (prevents flash)
    if (isLoading) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // If not authenticated, redirect to login with return URL
    if (!user) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    return <>{children}</>;
}
