import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, BookOpen, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Novel } from '../types';
import SearchResults from '../components/SearchResults';

export default function Navbar() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Novel[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const handleSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('Novels')
          .select('*')
          .or(`title.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%`)
          .limit(10);

        if (error) throw error;
        setSearchResults(data || []);
        setShowResults(true);
      } catch (error) {
        console.error('Error searching:', error);
      }
    };

    const timeoutId = setTimeout(handleSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleResultClick = () => {
    setShowResults(false);
    setSearchQuery('');
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-orange-500"
            aria-label="Menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Logo - Always visible */}
          <Link to="/" className="flex items-center">
            <BookOpen className="h-8 w-8 text-orange-500" />
            <span className="ml-2 text-xl md:text-2xl font-bold text-orange-500">Mantra Novels</span>
          </Link>

          {/* Desktop Search Bar */}
          <div className="hidden md:block flex-1 max-w-xl mx-8 relative">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search novels..."
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg">
                <SearchResults results={searchResults} onResultClick={handleResultClick} />
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/explore" className="nav-link">Explore</Link>
            <Link to="/ranking" className="nav-link">Ranking</Link>
            <Link to="/write" className="nav-link">Write</Link>
            <Link to={userProfile ? "/library" : "/auth"} className="nav-link">Library</Link>
            {userProfile ? (
              <Link to="/profile" className="flex items-center nav-link">
                {userProfile.profile_picture ? (
                  <img 
                    src={userProfile.profile_picture} 
                    alt={userProfile.username}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-orange-500 font-semibold">
                      {userProfile.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </Link>
            ) : (
              <Link to="/auth" className="nav-link">Login</Link>
            )}
          </div>

          {/* Mobile Search and Profile */}
          <div className="flex items-center gap-4 md:hidden">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-gray-600 hover:text-orange-500"
              aria-label="Search"
            >
              <Search className="h-6 w-6" />
            </button>
            {userProfile && (
              <Link to="/profile" className="flex items-center">
                {userProfile.profile_picture ? (
                  <img 
                    src={userProfile.profile_picture} 
                    alt={userProfile.username}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-orange-500 font-semibold">
                      {userProfile.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isSearchOpen && (
          <div className="md:hidden py-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search novels..."
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            {showResults && searchResults.length > 0 && (
              <div className="mt-2 bg-white rounded-lg shadow-lg">
                <SearchResults results={searchResults} onResultClick={handleResultClick} />
              </div>
            )}
          </div>
        )}

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50">
            <div className="bg-white h-full w-4/5 max-w-sm">
              <div className="p-4 flex justify-between items-center border-b">
                <h2 className="text-xl font-bold text-gray-800">Menu</h2>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 text-gray-600 hover:text-orange-500"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="py-4">
                <Link
                  to="/"
                  className="block px-4 py-3 text-gray-800 hover:bg-orange-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  to="/explore"
                  className="block px-4 py-3 text-gray-800 hover:bg-orange-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Explore
                </Link>
                <Link
                  to="/ranking"
                  className="block px-4 py-3 text-gray-800 hover:bg-orange-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Ranking
                </Link>
                <Link
                  to="/write"
                  className="block px-4 py-3 text-gray-800 hover:bg-orange-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Write
                </Link>
                <Link
                  to="/library"
                  className="block px-4 py-3 text-gray-800 hover:bg-orange-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Library
                </Link>
                {!userProfile && (
                  <Link
                    to="/auth"
                    className="block px-4 py-3 text-gray-800 hover:bg-orange-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}