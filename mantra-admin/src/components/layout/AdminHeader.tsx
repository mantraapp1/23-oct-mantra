'use client';

import { UserButton } from '@/components/common/UserButton';
import { MobileSidebar } from '@/components/layout/AdminSidebar';

export function AdminHeader() {
    return (
        <div className="flex items-center p-4">
            <MobileSidebar />
            <div className="flex w-full justify-end">
                <UserButton />
            </div>
        </div>
    );
}
