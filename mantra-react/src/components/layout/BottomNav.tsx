import { Link, useLocation } from 'react-router-dom';
import { Home, Trophy, BookOpen, User } from 'lucide-react';

export default function BottomNav() {
    const location = useLocation();
    const pathname = location.pathname;

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-[var(--background)] border-t border-[var(--border)] z-50 md:hidden">
            <div className="flex items-center justify-around py-2">
                <Link
                    to="/"
                    className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${isActive('/')
                            ? 'text-sky-600 dark:text-sky-400'
                            : 'text-[var(--foreground-secondary)]'
                        }`}
                >
                    <Home className="w-5 h-5" />
                    <span className="text-[10px] font-semibold">Home</span>
                </Link>
                <Link
                    to="/ranking"
                    className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${isActive('/ranking')
                            ? 'text-sky-600 dark:text-sky-400'
                            : 'text-[var(--foreground-secondary)]'
                        }`}
                >
                    <Trophy className="w-5 h-5" />
                    <span className="text-[10px] font-semibold">Rankings</span>
                </Link>
                <Link
                    to="/library"
                    className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${isActive('/library')
                            ? 'text-sky-600 dark:text-sky-400'
                            : 'text-[var(--foreground-secondary)]'
                        }`}
                >
                    <BookOpen className="w-5 h-5" />
                    <span className="text-[10px] font-semibold">Library</span>
                </Link>
                <Link
                    to="/profile"
                    className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${isActive('/profile')
                            ? 'text-sky-600 dark:text-sky-400'
                            : 'text-[var(--foreground-secondary)]'
                        }`}
                >
                    <User className="w-5 h-5" />
                    <span className="text-[10px] font-semibold">Profile</span>
                </Link>
            </div>
        </nav>
    );
}
