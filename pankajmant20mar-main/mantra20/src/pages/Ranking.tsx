import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { GENRES } from '../types';
import { Trophy, TrendingUp } from 'lucide-react';
import RankingFilters from '../components/RankingFilters';
import { format, subDays, subMonths, subYears, startOfDay } from 'date-fns';

export default function Ranking() {
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [novels, setNovels] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [sortBy, setSortBy] = useState<'votes' | 'views'>('votes');
  const [timeRange, setTimeRange] = useState<'all' | 'yearly' | 'monthly' | 'weekly' | 'daily'>('all');

  useEffect(() => {
    fetchRankings();
  }, [selectedGenre, sortBy, timeRange]);

  const getTimeRangeDate = () => {
    const now = new Date();
    switch (timeRange) {
      case 'yearly':
        return subYears(now, 1);
      case 'monthly':
        return subMonths(now, 1);
      case 'weekly':
        return subDays(now, 7);
      case 'daily':
        return startOfDay(now);
      default:
        return null;
    }
  };

  const fetchRankings = async () => {
    try {
      setLoading(true);
      const timeRangeDate = getTimeRangeDate();
      
      let query = supabase
        .from('Novels')
        .select(`
          *,
          Votes (
            vote_type
          )
        `);

      if (selectedGenre !== 'All') {
        query = query.contains('genre', [selectedGenre]);
      }

      if (timeRangeDate) {
        query = query.gte('created_at', timeRangeDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      // Process the data to calculate vote scores
      const processedData = data.map(novel => ({
        ...novel,
        voteScore: novel.Votes.reduce((acc, vote) => 
          acc + (vote.vote_type === 'up' ? 1 : -1), 0
        )
      }));

      // Sort based on selected criteria
      const sortedData = processedData.sort((a, b) => {
        if (sortBy === 'votes') {
          return b.voteScore - a.voteScore;
        }
        return b.views - a.views;
      });

      setNovels(sortedData);
    } catch (error) {
      console.error('Error fetching rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Novel Rankings</h1>

      <RankingFilters
        sortBy={sortBy}
        timeRange={timeRange}
        onSortByChange={setSortBy}
        onTimeRangeChange={setTimeRange}
      />

      <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
        <button
          onClick={() => setSelectedGenre('All')}
          className={`genre-button ${selectedGenre === 'All' ? 'active' : 'bg-white'}`}
        >
          All
        </button>
        {GENRES.map(genre => (
          <button
            key={genre}
            onClick={() => setSelectedGenre(genre)}
            className={`genre-button ${selectedGenre === genre ? 'active' : 'bg-white'}`}
          >
            {genre}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {novels.map((novel, index) => (
            <Link
              key={novel.novel_id}
              to={`/novel/${novel.novel_id}`}
              state={{ from: location.pathname }}
              className="block bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 sm:gap-6">
                <div className="flex-shrink-0 w-8 sm:w-12 h-8 sm:h-12 flex items-center justify-center">
                  {index < 3 ? (
                    <Trophy className={`h-6 w-6 sm:h-8 sm:w-8 ${
                      index === 0 ? 'text-yellow-500' :
                      index === 1 ? 'text-gray-400' :
                      'text-orange-600'
                    }`} />
                  ) : (
                    <span className="text-lg sm:text-2xl font-bold text-gray-400">#{index + 1}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-xl font-bold mb-1 truncate">{novel.title}</h3>
                  <p className="text-sm sm:text-base text-gray-600 truncate">by {novel.author}</p>
                </div>

                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-8">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                    <span className="text-sm sm:text-lg font-semibold">
                      {sortBy === 'votes' ? novel.voteScore : novel.views}
                    </span>
                  </div>
                  <div className="hidden sm:flex gap-2">
                    {novel.genre.slice(0, 2).map(g => (
                      <span
                        key={g}
                        className="px-2 sm:px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs sm:text-sm"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}