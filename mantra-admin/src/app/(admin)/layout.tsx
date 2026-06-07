import { Sidebar } from '@/components/layout/AdminSidebar';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Check if user is in the admins table securely
    const { data: admin, error } = await supabase
        .from('admins')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

    if (!admin || error) {
        redirect('/login');
    }

    return (
        <div className="h-screen flex overflow-hidden">
            {/* Sidebar - desktop */}
            <div className="hidden md:flex md:flex-col md:fixed md:inset-y-0 z-[80]">
                <Sidebar className="h-full" />
            </div>
            {/* Main content */}
            <main className="flex-1 md:pl-72 flex flex-col min-h-screen">
                <AdminHeader />
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
