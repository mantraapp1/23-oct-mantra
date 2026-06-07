'use client';

import { UserButton } from '@/components/common/UserButton';
import { MobileSidebar } from '@/components/layout/AdminSidebar';
import { usePathname } from 'next/navigation';
import { Separator } from '@/components/ui/separator';

const pageTitles: Record<string, string> = {
    '/': 'Dashboard',
    '/users': 'User Management',
    '/novels': 'Novel Management',
    '/reports': 'Reports & Moderation',
    '/financials': 'Financials',
    '/cms': 'Content Management',
    '/communication': 'Communication',
    '/settings': 'Settings',
};

function getBreadcrumb(pathname: string) {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return [{ label: 'Dashboard', href: '/' }];

    const crumbs = [{ label: 'Dashboard', href: '/' }];
    let currentPath = '';
    for (const segment of segments) {
        currentPath += `/${segment}`;
        const label = pageTitles[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);
        crumbs.push({ label, href: currentPath });
    }
    return crumbs;
}

export function AdminHeader() {
    const pathname = usePathname();
    const breadcrumbs = getBreadcrumb(pathname);

    return (
        <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
            <div className="flex items-center justify-between h-16 px-4 md:px-8">
                <div className="flex items-center gap-4">
                    <MobileSidebar />
                    <div className="hidden md:flex items-center gap-2 text-sm">
                        {breadcrumbs.map((crumb, index) => (
                            <span key={crumb.href} className="flex items-center gap-2">
                                {index > 0 && <span className="text-muted-foreground">/</span>}
                                <span className={index === breadcrumbs.length - 1 ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                                    {crumb.label}
                                </span>
                            </span>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <UserButton />
                </div>
            </div>
        </div>
    );
}
