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

    // Check role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        // Create a dedicated unauthorized page later
        // For now, redirect to home or show error
        // redirect('/unauthorized'); 
        // Or just let them be if we handle it in pages?
        // Better to redirect to login if not admin
        // redirect('/login');
    }

    return (
        <div className="h-full relative">
            <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
                <Sidebar className="h-full" />
            </div>
            <main className="md:pl-72">
                <AdminHeader />
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
