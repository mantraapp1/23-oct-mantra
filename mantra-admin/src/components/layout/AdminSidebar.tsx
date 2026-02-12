'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    BookOpen,
    FileText,
    DollarSign,
    Settings,
    ShieldAlert,
    Menu,
    MessageSquare,
    Gift
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

const routes = [
    {
        label: 'Dashboard',
        icon: LayoutDashboard,
        href: '/',
        color: 'text-sky-500',
    },
    {
        label: 'Users',
        icon: Users,
        href: '/users',
        color: 'text-violet-500',
    },
    {
        label: 'Novels',
        icon: BookOpen,
        href: '/novels',
        color: 'text-pink-700',
    },
    {
        label: 'Reports',
        icon: ShieldAlert,
        href: '/reports',
        color: 'text-orange-700',
    },
    {
        label: 'Financials',
        icon: DollarSign,
        href: '/financials',
        color: 'text-emerald-500',
    },
    {
        label: 'CMS',
        icon: FileText,
        href: '/cms',
        color: 'text-green-700',
    },
    {
        label: 'Communication',
        icon: MessageSquare,
        href: '/communication',
        color: 'text-blue-700',
    },
    {
        label: 'Settings',
        icon: Settings,
        href: '/settings',
    },
];

interface SidebarProps {
    className?: string;
}

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();

    return (
        <div className={cn("space-y-4 py-4 flex flex-col h-full bg-[#111827] text-white", className)}>
            <div className="px-3 py-2 flex-1">
                <Link href="/" className="flex items-center pl-3 mb-14">
                    <div className="relative w-8 h-8 mr-4">
                        {/* Logo Placeholder */}
                        <div className="absolute bg-gradient-to-tr from-pink-500 to-violet-500 rounded-full w-full h-full animate-pulse" />
                    </div>
                    <h1 className="text-2xl font-bold">
                        Mantra Admin
                    </h1>
                </Link>
                <div className="space-y-1">
                    {routes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                                'text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition',
                                pathname === route.href ? 'text-white bg-white/10' : 'text-zinc-400'
                            )}
                        >
                            <div className="flex items-center flex-1">
                                <route.icon className={cn('h-5 w-5 mr-3', route.color)} />
                                {route.label}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function MobileSidebar() {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-[#111827]">
                <Sidebar />
            </SheetContent>
        </Sheet>
    )
}
