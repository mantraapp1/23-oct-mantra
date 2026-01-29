import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import NovelCard from '../components/NovelCard';
import { Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

type TabType = 'library' | 'history';

interface NovelWithProgress {
  novel_id: string;
  title: string;
  novel_coverpage: string | null;
  total_chapters: number;
  read_chapters: number;
  last_read_chapter?: {
    chapter_id: string;
    chapter_number: number;
  };
  has_new_chapters: boolean;
}

export default function Library() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>('library');
  const [novels, setNovels] = useState<NovelWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userProfile) {
      navigate('/auth');
      return;
    }

    fetchLibraryData();
  }, [userProfile, activeTab]);

  const fetchLibraryData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === 'library') {
        const { data: libraryData, error: libraryError } = await supabase
          .from('Library')
          .select(`
            novel_id,
            Novels (
              novel_id,
              title,
              novel_coverpage
            )
          `)
          .eq('user_id', userProfile.user_id);

        if (libraryError) throw libraryError;

        if (!libraryData) {
          throw new Error('No library data found');
        }

        // Get total chapters for each novel
        const novelsWithProgress = await Promise.all(
          libraryData.map(async (item) => {
            try {
              const { data: chaptersData, error: chaptersError } = await supabase
                .from('Chapters')
                .select('chapter_id, chapter_number')
                .eq('novel_id', item.novel_id)
                .order('chapter_number', { ascending: true });

              if (chaptersError) throw chaptersError;

              const { data: readingProgress, error: progressError } = await supabase
                .from('Reading_Progress')
                .select('chapter_id, chapter_number')
                .eq('novel_id', item.novel_id)
                .eq('user_id', userProfile.user_id)
                .order('chapter_number', { ascending: false })
                .limit(1);

              if (progressError) throw progressError;

              const totalChapters = chaptersData?.length || 0;
              const readChapters = readingProgress?.[0]?.chapter_number || 0;
              const lastReadChapter = readingProgress?.[0];

              return {
                ...item.Novels,
                total_chapters: totalChapters,
                read_chapters: readChapters,
                last_read_chapter: lastReadChapter,
                has_new_chapters: totalChapters > readChapters
              };
            } catch (error) {
              console.error('Error processing novel data:', error);
              return null;
            }
          })
        );

        setNovels(novelsWithProgress.filter(Boolean));
      } else {
        // Fetch history data
        const { data: historyData, error: historyError } = await supabase
          .from('Reading_Progress')
          .select(`
            novel_id,
            chapter_id,
            chapter_number,
            lastread_at,
            Novels (
              novel_id,
              title,
              novel_coverpage
            )
          `)
          .eq('user_id', userProfile.user_id)
          .order('lastread_at', { ascending: false });

        if (historyError) throw historyError;

        if (!historyData) {
          throw new Error('No history data found');
        }

        const uniqueNovels = historyData.reduce((acc, curr) => {
          if (!acc.some(item => item.novel_id === curr.novel_id)) {
            acc.push({
              ...curr.Novels,
              total_chapters: 0,
              read_chapters: curr.chapter_number,
              last_read_chapter: {
                chapter_id: curr.chapter_id,
                chapter_number: curr.chapter_number
              }
            });
          }
          return acc;
        }, [] as NovelWithProgress[]);

        const novelsWithTotalChapters = await Promise.all(
          uniqueNovels.map(async (novel) => {
            try {
              const { data: chaptersData, error: chaptersError } = await supabase
                .from('Chapters')
                .select('chapter_id')
                .eq('novel_id', novel.novel_id);

              if (chaptersError) throw chaptersError;

              return {
                ...novel,
                total_chapters: chaptersData?.length || 0,
                has_new_chapters: (chaptersData?.length || 0) > novel.read_chapters
              };
            } catch (error) {
              console.error('Error getting total chapters:', error);
              return novel;
            }
          })
        );

        setNovels(novelsWithTotalChapters);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(error.message || 'An unexpected error occurred');
      toast.error(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!confirm('Are you sure you want to clear your reading history?')) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('Reading_Progress')
        .delete()
        .eq('user_id', userProfile.user_id);

      if (error) throw error;

      setNovels([]);
      toast.success('Reading history cleared');
    } catch (error: any) {
      console.error('Error clearing history:', error);
      toast.error('Failed to clear history');
    } finally {
      setLoading(false);
    }
  };

  if (!userProfile) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-center">Please login to view your library.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {activeTab === 'library' ? 'My Library' : 'Reading History'}
      </h1>

      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4 border-b">
          <button
            onClick={() => setActiveTab('library')}
            className={`pb-2 px-4 ${
              activeTab === 'library'
                ? 'border-b-2 border-orange-500 text-orange-500'
                : 'text-gray-600'
            }`}
          >
            Library
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2 px-4 ${
              activeTab === 'history'
                ? 'border-b-2 border-orange-500 text-orange-500'
                : 'text-gray-600'
            }`}
          >
            History
          </button>
        </div>
        {activeTab === 'history' && novels.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-2 text-red-500 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
            Clear History
          </button>
        )}
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
        </div>
      ) : novels.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">
            {activeTab === 'library' ? 'Your library is empty' : 'No reading history'}
          </p>
          <Link
            to="/explore"
            className="inline-block bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
          >
            Explore Novels
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {novels.map(novel => (
            <div key={novel.novel_id} className="relative">
              <Link
                to={
                  novel.last_read_chapter
                    ? `/novel/${novel.novel_id}/chapter/${novel.last_read_chapter.chapter_id}`
                    : `/novel/${novel.novel_id}`
                }
                state={{ from: location.pathname }}
                className="block group"
              >
                <div className="relative">
                  <NovelCard
                    novel={novel}
                    showViews={false}
                  />
                  {novel.has_new_chapters && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                  )}
                </div>
                {activeTab === 'library' && (
                  <div className="mt-1 text-sm text-gray-600 text-center">
                    Progress {novel.read_chapters}/{novel.total_chapters}
                  </div>
                )}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}