import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Edit } from 'lucide-react';
import EditProfileModal from '../components/EditProfileModal';
import type { Novel } from '../types';

export default function Profile() {
  const { userProfile, logout } = useAuth();
  const [readingStats, setReadingStats] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [readHistory, setReadHistory] = useState<Novel[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userProfile) return;

      try {
        // Fetch reading stats for last 7 days
        const now = new Date();
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          return date.toISOString().split('T')[0];
        }).reverse();

        const { data: readingsData } = await supabase
          .from('Reading_Progress')
          .select('*')
          .eq('user_id', userProfile.user_id)
          .gte('lastread_at', last7Days[0]);

        const stats = last7Days.map(date => ({
          name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          reads: readingsData?.filter(r => 
            new Date(r.lastread_at).toISOString().split('T')[0] === date
          ).length || 0
        }));

        setReadingStats(stats);

        // Fetch reading history
        const { data: historyData } = await supabase
          .from('Reading_Progress')
          .select(`
            novel_id,
            Novels (*)
          `)
          .eq('user_id', userProfile.user_id)
          .order('lastread_at', { ascending: false });

        if (historyData) {
          const uniqueNovels = Array.from(
            new Map(historyData.map(item => [item.novel_id, item.Novels])).values()
          );
          setReadHistory(uniqueNovels);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userProfile]);

  if (!userProfile) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-center">Please login to view your profile.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header/Banner */}
        <div className="h-32 sm:h-48 bg-gradient-to-r from-orange-400 to-pink-500"></div>
        
        {/* Profile Info */}
        <div className="px-4 sm:px-8 py-6 -mt-20">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 sm:gap-0">
            <div className="flex items-center gap-4">
              {userProfile.profile_picture ? (
                <img 
                  src={userProfile.profile_picture}
                  alt={userProfile.username}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-orange-100 flex items-center justify-center border-4 border-white shadow-lg">
                  <span className="text-2xl sm:text-3xl font-bold text-orange-500">
                    {userProfile.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">{userProfile.username}</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">
                  Member since {new Date(userProfile.created_at).toLocaleDateString()}
                </p>
                {userProfile.bio && (
                  <p className="text-sm sm:text-base text-gray-700 mt-2">{userProfile.bio}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 sm:gap-4 mt-4 sm:mt-0">
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-1 px-3 sm:px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm sm:text-base"
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </button>
              <button
                onClick={logout}
                className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm sm:text-base"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 p-4 sm:p-8">
          {/* Reading Stats */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Reading Stats</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={readingStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="reads" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Reading History */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Reading History</h2>
            <div className="space-y-4">
              {readHistory.map((novel) => (
                <div key={novel.novel_id} className="flex gap-4 p-2 hover:bg-gray-50 rounded-lg">
                  {novel.novel_coverpage ? (
                    <img
                      src={novel.novel_coverpage}
                      alt={novel.title}
                      className="w-16 h-24 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-24 bg-gradient-to-br from-orange-400 to-pink-500 rounded" />
                  )}
                  <div>
                    <h3 className="font-medium">{novel.title}</h3>
                    <p className="text-sm text-gray-600">by {novel.author}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditProfileModal
          userProfile={userProfile}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onUpdate={() => {
            setShowEditModal(false);
          }}
        />
      )}
    </div>
  );
}