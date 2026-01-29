import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Novel } from '../types';
import { supabase } from '../lib/supabase';
import { Eye, ArrowLeft } from 'lucide-react';
import Footer from '../components/Footer';

export default function NewArrivals() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const location = useLocation();

  React.useEffect(() => {
    fetchNovels();
  }, [page]);

  const fetchNovels = async () => {
    try {
      const { data, error, count } = await supabase
        .from('Novels')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * 20, page * 20 - 1);

      if (error) throw error;

      setNovels(prev => page === 1 ? data : [...prev, ...data]);
      setHasMore(count ? count > page * 20 : false);
    } catch (error) {
      console.error('Error fetching novels:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-600 hover:text-orange-500"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </Link>
          <h1 className="text-2xl font-bold">New Arrivals</h1>
        </div>

        {loading && novels.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {novels.map(novel => (
              <Link
                key={novel.novel_id}
                to={`/novel/${novel.novel_id}`}
                state={{ from: location.pathname }}
                className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4"
              >
                <div className="flex gap-4">
                  <div className="w-32 h-48 flex-shrink-0">
                    {novel.novel_coverpage ? (
                      <img
                        src={novel.novel_coverpage}
                        alt={novel.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 flex flex-col items-center justify-center p-4 text-white">
                        <h3 className="text-sm font-bold text-center mb-2">{novel.title}</h3>
                        <p className="text-xs opacity-90">by {novel.author}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{novel.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">by {novel.author}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{novel.views} views</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {novel.genre.slice(0, 3).map(genre => (
                        <span
                          key={genre}
                          className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-700 mt-2 line-clamp-2">{novel.story}</p>
                  </div>
                </div>
              </Link>
            ))}

            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setPage(p => p + 1)}
                  className="px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600"
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}