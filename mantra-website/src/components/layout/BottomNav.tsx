'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, BookOpen, User } from 'lucide-react';

export default function BottomNav() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-50 md:hidden">
            <div className="flex items-center justify-around py-2">
                <Link
                    href="/"
                    className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${isActive('/') ? 'text-sky-600' : 'text-slate-600'}`}
                >
                    <Home className="w-5 h-5" />
                    <span className="text-[10px] font-semibold">Home</span>
                </Link>
                <Link
                    href="/ranking"
                    className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${isActive('/ranking') ? 'text-sky-600' : 'text-slate-600'}`}
                >
                    <Trophy className="w-5 h-5" />
                    <span className="text-[10px] font-semibold">Rankings</span>
                </Link>
                <Link
                    href="/library"
                    className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${isActive('/library') ? 'text-sky-600' : 'text-slate-600'}`}
                >
                    <BookOpen className="w-5 h-5" />
                    <span className="text-[10px] font-semibold">Library</span>
                </Link>
                <Link
                    href="/profile"
                    className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${isActive('/profile') ? 'text-sky-600' : 'text-slate-600'}`}
                >
                    <User className="w-5 h-5" />
                    <span className="text-[10px] font-semibold">Profile</span>
                </Link>
            </div>
        </nav>
    );
}
