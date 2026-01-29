import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Novel } from '../types';
import NovelCard from '../components/NovelCard';
import GenreCarousel from '../components/GenreCarousel';
import { AlertCircle, ChevronRight, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNovels } from '../hooks/useNovels';
import Footer from '../components/Footer';

export default function Home() {
  const { userProfile } = useAuth();
  const [selectedGenre, setSelectedGenre] = useState('All');
  const location = useLocation();
  const { data: popularNovels, isLoading: isLoadingPopular, isError: isPopularError } = useNovels({
    limit: 10,
    orderBy: 'views',
    genre: selectedGenre !== 'All' ? selectedGenre : undefined
  });

  const { data: newArrivals, isLoading: isLoadingNew, isError: isNewError } = useNovels({
    limit: 10,
    orderBy: 'created_at'
  });

  const handleGenreSelect = (genre: string) => {
    setSelectedGenre(genre);
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-8">
        {/* Hero Section */}
        <div className="relative h-[200px] sm:h-[400px] rounded-xl overflow-hidden mb-4 sm:mb-12">
          <img
            src="https://images.unsplash.com/photo-1457369804613-52c61a468e7d"
            alt="Library"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center">
            <div className="text-white ml-4 sm:ml-8 md:ml-16 max-w-lg">
              <h1 className="text-xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4">
                Discover Amazing Stories
              </h1>
              <p className="text-sm sm:text-lg md:text-xl mb-4 sm:mb-8">
                Explore thousands of web novels across multiple genres
              </p>
              <Link 
                to="/explore"
                className="inline-block bg-orange-500 text-white px-4 sm:px-6 md:px-8 py-2 sm:py-3 rounded-full font-semibold hover:bg-orange-600 transition-colors text-xs sm:text-base"
              >
                Start Reading
              </Link>
            </div>
          </div>
        </div>

        {/* Genre Carousel */}
        <div className="mb-4 sm:mb-12">
          <GenreCarousel
            selectedGenre={selectedGenre}
            onGenreSelect={handleGenreSelect}
          />
        </div>

        {/* Popular Novels */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-2xl font-bold">
              Popular Novels
            </h2>
            <Link 
              to="/explore" 
              state={{ from: location.pathname }}
              className="text-orange-500 hover:text-orange-600 flex items-center gap-1"
            >
              See All
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {isLoadingPopular ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
            </div>
          ) : isPopularError ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-gray-600">Failed to load novels</p>
            </div>
          ) : popularNovels?.novels && popularNovels.novels.length > 0 ? (
            <div className="grid grid-cols-4 md:grid-cols-5 gap-2 sm:gap-4">
              {popularNovels.novels.map((novel: Novel) => (
                <Link
                  key={novel.novel_id}
                  to={`/novel/${novel.novel_id}`}
                  state={{ from: location.pathname }}
                >
                  <NovelCard novel={novel} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No novels available.</p>
            </div>
          )}
        </div>

        {/* New Arrivals */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-2xl font-bold">
              New Arrivals
            </h2>
            <Link 
              to="/new-arrivals" 
              state={{ from: location.pathname }}
              className="text-orange-500 hover:text-orange-600 flex items-center gap-1"
            >
              See All
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {isLoadingNew ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
            </div>
          ) : isNewError ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-gray-600">Failed to load new arrivals</p>
            </div>
          ) : newArrivals?.novels && newArrivals.novels.length > 0 ? (
            <div className="space-y-4">
              {newArrivals.novels.map((novel: Novel) => (
                <Link
                  key={novel.novel_id}
                  to={`/novel/${novel.novel_id}`}
                  state={{ from: location.pathname }}
                  className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4"
                >
                  <div className="flex gap-4">
                    <div className="w-32 h-48 rounded-lg bg-gray-200 flex-shrink-0 relative">
                      {novel.novel_coverpage ? (
                        <img
                          src={novel.novel_coverpage}
                          alt={novel.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 flex flex-col justify-center items-center p-4 text-white">
                          <h3 className="text-base font-bold text-center mb-2 line-clamp-3">{novel.title}</h3>
                          <p className="text-sm opacity-90 text-center">by {novel.author}</p>
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
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No new arrivals available.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}