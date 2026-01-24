import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Settings } from 'lucide-react';
import { getProfilePicture, getUserDisplayName } from '@/lib/utils/profileUtils';
import { ProfileSkeleton } from '@/components/ui/Skeleton';

export default function ProfilePage() {
    const { user, profile, isLoading, signOut } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Redirect to login if not authenticated (after loading completes)
        if (!isLoading && !user) {
            navigate('/login');
        }
    }, [isLoading, user, navigate]);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <ProfileSkeleton />
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect via useEffect
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-sky-400 to-indigo-500"></div>
                <div className="px-8 pb-8">
                    <div className="relative -mt-16 mb-6 flex justify-between items-end">
                        <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-slate-100 shadow-md">
                            <img
                                src={getProfilePicture(profile?.profile_picture_url, getUserDisplayName(profile))}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2">
                            <Settings className="w-4 h-4" /> Edit Profile
                        </button>
                    </div>

                    <h1 className="text-2xl font-bold text-slate-900">{getUserDisplayName(profile)}</h1>
                    <p className="text-slate-500">@{profile?.username}</p>

                    <div className="mt-8 pt-8 border-t border-slate-100">
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
                        >
                            <LogOut className="w-5 h-5" /> Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
