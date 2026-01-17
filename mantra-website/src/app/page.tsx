'use client';

import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { getNovelCover } from '@/lib/defaultImages';

interface Novel {
  id: string;
  title: string;
  cover_image_url: string;
  genres: string[];
  total_views: number;
  total_votes: number;
  average_rating: number;
  author: { username: string; display_name: string } | { username: string; display_name: string }[];
  updated_at: string;
  status: string;
}

export default function HomePage() {
  const [trendingNovels, setTrendingNovels] = useState<Novel[]>([]);
  const [topRankedNovels, setTopRankedNovels] = useState<Novel[]>([]);
  const [latestNovels, setLatestNovels] = useState<Novel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      // Trending (by views)
      const { data: trending } = await supabase
        .from('novels')
        .select(`id, title, cover_image_url, genres, total_views, total_votes, average_rating, status, updated_at, author:profiles!novels_author_id_fkey(username, display_name)`)
        .order('total_views', { ascending: false })
        .limit(8);

      // Top Ranked (by votes)
      const { data: ranked } = await supabase
        .from('novels')
        .select(`id, title, cover_image_url, genres, total_views, total_votes, average_rating, status, updated_at, author:profiles!novels_author_id_fkey(username, display_name)`)
        .order('total_votes', { ascending: false })
        .limit(8);

      // Latest Updated
      const { data: latest } = await supabase
        .from('novels')
        .select(`id, title, cover_image_url, genres, total_views, total_votes, average_rating, status, updated_at, author:profiles!novels_author_id_fkey(username, display_name)`)
        .order('updated_at', { ascending: false })
        .limit(5);

      setTrendingNovels((trending as any) || []);
      setTopRankedNovels((ranked as any) || []);
      setLatestNovels((latest as any) || []);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const formatViews = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return (count || 0).toString();
  };

  const getAuthorName = (author: any) => {
    if (Array.isArray(author)) {
      return author[0]?.display_name || author[0]?.username || 'Unknown';
    }
    return author?.display_name || author?.username || 'Unknown';
  };

  const getGenre = (novel: Novel) => {
    return novel.genres?.[0] || 'Unknown';
  };

  if (isLoading) {
    return <div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="min-h-screen bg-white text-slate-800 pb-24">
      {/* Header */}
      <div className="w-full px-4 pt-6 md:px-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-slate-900">Mantra</h1>
          <Link href="/search" className="p-2 rounded-full hover:bg-slate-100 transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          </Link>
        </div>
      </div>

      <div className="w-full">
        {/* Featured Banner */}
        <div className="px-4 md:px-8">
          <div className="relative rounded-2xl overflow-hidden h-44 shadow-sm md:h-[400px] lg:h-[450px]">
            <img
              src="https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=1200&auto=format&fit=crop"
              className="h-full w-full object-cover"
              alt="Featured"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
            <div className="absolute bottom-3 left-3 right-3 text-white md:bottom-6 md:left-6 md:right-6">
              <div className="text-lg font-semibold tracking-tight md:text-2xl">Weekly Featured</div>
              <div className="text-xs text-white/80 mt-0.5 line-clamp-1 md:text-sm">Handpicked stories loved by editors</div>
            </div>
          </div>
        </div>

        {/* Trending Section */}
        <div className="mt-6">
          <div className="px-4 flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold tracking-tight">Trending</h2>
            <Link href="/ranking" className="text-xs text-sky-600 font-semibold hover:text-sky-700">See all</Link>
          </div>
          <div className="overflow-x-auto px-4 no-scrollbar">
            <div className="flex gap-3 min-w-max">
              {trendingNovels.map((novel) => (
                <Link key={novel.id} href={`/novel/${novel.id}`} className="w-36 md:w-44 flex-shrink-0 block group">
                  <div className="relative rounded-xl overflow-hidden bg-slate-100 h-48 md:h-60 shadow-sm group-hover:shadow-md transition-shadow">
                    <img src={getNovelCover(novel.cover_image_url)} className="h-full w-full object-cover" alt={novel.title} />
                  </div>
                  <div className="mt-2">
                    <div className="text-sm font-semibold line-clamp-1 group-hover:text-sky-600 transition-colors">{novel.title}</div>
                    <div className="text-xs text-slate-500">{getGenre(novel)}</div>
                  </div>
                </Link>
              ))}
              {trendingNovels.length === 0 && (
                <div className="text-sm text-slate-500 py-8">No trending novels yet</div>
              )}
            </div>
          </div>
        </div>

        {/* Top Rankings */}
        <div className="mt-6">
          <div className="px-4 flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold tracking-tight">Top Rankings</h2>
            <Link href="/ranking" className="text-xs text-sky-600 font-semibold hover:text-sky-700">View all</Link>
          </div>
          <div className="overflow-x-auto px-4 no-scrollbar">
            <div className="flex gap-3 min-w-max">
              {topRankedNovels.map((novel) => (
                <Link key={novel.id} href={`/novel/${novel.id}`} className="w-44 md:w-52 flex-shrink-0 block group">
                  <div className="relative rounded-xl overflow-hidden bg-slate-100 h-56 md:h-72 shadow-sm group-hover:shadow-md transition-shadow">
                    <img src={getNovelCover(novel.cover_image_url)} className="h-full w-full object-cover" alt={novel.title} />
                  </div>
                  <div className="mt-2">
                    <div className="text-sm font-semibold line-clamp-1 group-hover:text-sky-600 transition-colors">{novel.title}</div>
                    <div className="text-xs text-slate-500">{getGenre(novel)} · {novel.average_rating || '0'}★</div>
                  </div>
                </Link>
              ))}
              {topRankedNovels.length === 0 && (
                <div className="text-sm text-slate-500 py-8">No novels ranked yet</div>
              )}
            </div>
          </div>
        </div>

        {/* Recently Updated */}
        <div className="mt-6">
          <div className="px-4 mb-2">
            <h2 className="text-lg font-semibold tracking-tight">Recently Updated</h2>
          </div>
          <div className="px-4 space-y-3 md:grid md:grid-cols-2 md:space-y-0 md:gap-4 lg:grid-cols-3">
            {latestNovels.map(novel => (
              <Link key={novel.id} href={`/novel/${novel.id}`} className="flex gap-3 p-3 rounded-xl border border-slate-100 shadow-sm hover:shadow transition bg-white block">
                <div className="h-16 w-12 rounded-md overflow-hidden bg-slate-100 flex-shrink-0">
                  <img src={getNovelCover(novel.cover_image_url)} className="h-full w-full object-cover" alt={novel.title} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold line-clamp-1">{novel.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {getGenre(novel)} · {new Date(novel.updated_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${novel.status === 'ongoing' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-700'}`}>
                      {novel.status || 'Ongoing'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            {latestNovels.length === 0 && (
              <div className="text-sm text-slate-500 py-8 col-span-full text-center">No novels updated yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
