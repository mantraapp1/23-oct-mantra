'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    BookOpen,
    ShieldAlert,
    DollarSign,
    FileText,
    MessageSquare,
    Settings,
    Menu,
    ChevronLeft,
    BookMarked,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';
import { Separator } from '@/components/ui/separator';

const routes = [
    {
        label: 'Dashboard',
        icon: LayoutDashboard,
        href: '/',
        color: 'text-sky-400',
    },
    {
        label: 'Users',
        icon: Users,
        href: '/users',
        color: 'text-violet-400',
    },
    {
        label: 'Novels',
        icon: BookOpen,
        href: '/novels',
        color: 'text-pink-400',
    },
    {
        label: 'Reports',
        icon: ShieldAlert,
        href: '/reports',
        color: 'text-orange-400',
    },
    {
        label: 'Financials',
        icon: DollarSign,
        href: '/financials',
        color: 'text-emerald-400',
    },
    {
        label: 'CMS',
        icon: FileText,
        href: '/cms',
        color: 'text-teal-400',
    },
    {
        label: 'Communication',
        icon: MessageSquare,
        href: '/communication',
        color: 'text-blue-400',
    },
    {
        label: 'Settings',
        icon: Settings,
        href: '/settings',
        color: 'text-zinc-400',
    },
];

interface SidebarProps {
    className?: string;
}

function SidebarContent({ collapsed = false }: { collapsed?: boolean }) {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    };

    return (
        <div className={cn("flex flex-col h-full bg-sidebar text-sidebar-foreground")}>
            {/* Logo */}
            <div className={cn("flex items-center h-16 px-4 border-b border-sidebar-border", collapsed && "justify-center")}>
                <Link href="/" className="flex items-center gap-3">
                    <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                        <BookMarked className="h-5 w-5 text-white" />
                    </div>
                    {!collapsed && (
                        <div>
                            <h1 className="text-lg font-bold tracking-tight gradient-text">Mantra</h1>
                            <p className="text-[10px] text-muted-foreground -mt-1 tracking-widest uppercase">Admin Panel</p>
                        </div>
                    )}
                </Link>
            </div>

            {/* Navigation */}
            <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {routes.map((route) => (
                    <Link
                        key={route.href}
                        href={route.href}
                        className={cn(
                            'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                            collapsed && 'justify-center px-2',
                            isActive(route.href)
                                ? 'bg-primary/10 text-primary shadow-sm'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        )}
                        title={collapsed ? route.label : undefined}
                    >
                        <route.icon className={cn(
                            'h-5 w-5 shrink-0 transition-colors',
                            isActive(route.href) ? route.color : 'text-muted-foreground group-hover:text-foreground'
                        )} />
                        {!collapsed && <span>{route.label}</span>}
                        {!collapsed && route.label === 'Reports' && (
                            <span className="ml-auto h-5 w-5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold flex items-center justify-center">
                                !
                            </span>
                        )}
                    </Link>
                ))}
            </div>

            {/* Footer */}
            <Separator />
            <div className={cn("px-3 py-4", collapsed && "px-2")}>
                <div className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg bg-accent/50",
                    collapsed && "justify-center px-2"
                )}>
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        A
                    </div>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">Admin</p>
                            <p className="text-[10px] text-muted-foreground truncate">mantranovels.com</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export function Sidebar({ className }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className={cn(
            "relative transition-all duration-300",
            collapsed ? "w-[68px]" : "w-72",
            className
        )}>
            <SidebarContent collapsed={collapsed} />
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-20 z-50 h-6 w-6 rounded-full border bg-background shadow-md flex items-center justify-center hover:bg-accent transition-colors"
            >
                <ChevronLeft className={cn("h-3 w-3 transition-transform", collapsed && "rotate-180")} />
            </button>
        </div>
    );
}

export function MobileSidebar() {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
                <SidebarContent />
            </SheetContent>
        </Sheet>
    );
}
