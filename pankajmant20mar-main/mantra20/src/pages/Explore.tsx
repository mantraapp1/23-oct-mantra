import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { GENRES, Novel } from '../types';
import NovelCard from '../components/NovelCard';
import { Search } from 'lucide-react';

export default function Explore() {
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Novel[]>([]);
  const location = useLocation();

  useEffect(() => {
    const fetchNovels = async () => {
      try {
        let query = supabase
          .from('Novels')
          .select('*')
          .order('views', { ascending: false })
          .limit(20);

        if (selectedGenre !== 'All') {
          query = query.contains('genre', [selectedGenre]);
        }

        const { data, error } = await query;

        if (error) throw error;
        setNovels(data as Novel[]);
        setSearchResults(data as Novel[]);
      } catch (error) {
        console.error('Error fetching novels:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNovels();
  }, [selectedGenre]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults(novels);
      return;
    }

    const filtered = novels.filter(novel => 
      novel.title.toLowerCase().includes(query.toLowerCase()) ||
      novel.author.toLowerCase().includes(query.toLowerCase()) ||
      novel.genre.some(g => g.toLowerCase().includes(query.toLowerCase()))
    );
    setSearchResults(filtered);
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-8">
      <h1 className="text-xl sm:text-3xl font-bold mb-4 sm:mb-8">Explore Novels</h1>

      {/* Search Bar */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search novels..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full px-4 py-2 pl-10 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
      </div>

      <div className="flex flex-wrap gap-1 sm:gap-2 mb-4 sm:mb-8">
        <button
          onClick={() => setSelectedGenre('All')}
          className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm transition-colors ${
            selectedGenre === 'All'
              ? 'bg-orange-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          All
        </button>
        {GENRES.map(genre => (
          <button
            key={genre}
            onClick={() => setSelectedGenre(genre)}
            className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm transition-colors ${
              selectedGenre === genre
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {genre}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
        </div>
      ) : searchResults.length > 0 ? (
        <div className="grid grid-cols-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
          {searchResults.map(novel => (
            <Link
              key={novel.novel_id}
              to={`/novel/${novel.novel_id}`}
              state={{ from: location.pathname }}
            >
              <NovelCard key={novel.novel_id} novel={novel} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600">No novels found matching your search.</p>
        </div>
      )}
    </div>
  );
}