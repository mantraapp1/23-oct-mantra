import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface GenreDetailPageProps {
    params: {
        slug: string;
    }
}

export default async function GenreDetailPage({ params }: GenreDetailPageProps) {
    const supabase = await createServerSupabaseClient();
    const { slug } = params;

    // Fetch Genre Details
    const { data: genre } = await supabase
        .from('genres')
        .select('*')
        // Try matching slug or id (if using ID in url for now)
        .or(`slug.eq.${slug},id.eq.${slug}`)
        .single();

    // If not found, show error or redirect (handled simply here)
    if (!genre) {
        return <div className="p-8 text-center">Genre not found</div>;
    }

    // Fetch Novels in this Genre (Trending, Top, etc would be complex queries, mocking simplified fetching for now)
    const { data: novels } = await supabase
        .from('novels')
        .select('*, author:profiles(username)')
        .eq('is_published', true)
        // .contains('genre_ids', [genre.id]) // Assuming array of genre IDs or similar relationship
        // Since schema might vary, simplifiying to just fetch recent for demo
        .limit(20);

    // Helper to format rows
    const trending = novels?.slice(0, 5) || [];
    const topRanked = novels?.slice(5, 7) || [];
    const popular = novels?.slice(7, 12) || [];
    const recommended = novels?.slice(12, 14) || [];
    const newArrivals = novels?.slice(14, 16) || [];
    const recent = novels?.slice(16, 20) || [];


    return (
        <div className="max-w-md mx-auto min-h-screen bg-white font-inter text-slate-800 pb-24 md:max-w-2xl lg:max-w-4xl">
            {/* Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-30 border-b border-slate-100 px-4 py-3">
                <div className="flex items-center gap-3">
                    <Link href="/genre" className="p-2 -ml-2 rounded-lg hover:bg-slate-100 active:scale-95 transition-transform text-slate-600">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </Link>
                    <div>
                        <div className="text-base font-bold text-slate-900 flex items-center gap-2">
                            {genre.emoji} {genre.name}
                        </div>
                        <div className="text-xs text-slate-500">{novels?.length || 0} novels</div>
                    </div>
                </div>
            </div>

            <div className="space-y-8 pt-4">

                {/* Trending */}
                <section>
                    <div className="px-4 flex items-center justify-between mb-3">
                        <h2 className="text-base font-bold tracking-tight text-slate-900">Trending</h2>
                        <button className="text-xs text-sky-600 font-bold hover:text-sky-700">See all</button>
                    </div>
                    <div className="flex gap-4 overflow-x-auto px-4 pb-4 no-scrollbar snap-x">
                        {trending.map(novel => (
                            <Link key={novel.id} href={`/novel/${novel.id}`} className="w-32 flex-shrink-0 snap-start group">
                                <div className="relative rounded-xl overflow-hidden bg-slate-100 aspect-[2/3] shadow-sm mb-2 group-hover:shadow-md transition-all">
                                    {novel.cover_image_url ? (
                                        <img src={novel.cover_image_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl">📖</div>
                                    )}
                                </div>
                                <div className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-sky-600 transition-colors">{novel.title}</div>
                                <div className="text-xs text-slate-500">{(novel.view_count || 0).toLocaleString()} views</div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Top Rankings */}
                <section>
                    <div className="px-4 flex items-center justify-between mb-3">
                        <h2 className="text-base font-bold tracking-tight text-slate-900">Top Rankings</h2>
                        <button className="text-xs text-sky-600 font-bold hover:text-sky-700">See all</button>
                    </div>
                    <div className="px-4 grid grid-cols-2 gap-4">
                        {topRanked.map(novel => (
                            <Link key={novel.id} href={`/novel/${novel.id}`} className="rounded-xl border border-slate-100 shadow-sm overflow-hidden bg-white hover:shadow-md transition-all group">
                                <div className="h-32 bg-slate-100 overflow-hidden relative">
                                    {novel.cover_image_url ? (
                                        <img src={novel.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl">📖</div>
                                    )}
                                </div>
                                <div className="p-3">
                                    <div className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-sky-600 transition-colors">{novel.title}</div>
                                    <div className="text-xs text-slate-500 mt-1">★ 4.8 · {(novel.view_count || 0)}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Popular */}
                <section>
                    <div className="px-4 flex items-center justify-between mb-3">
                        <h2 className="text-base font-bold tracking-tight text-slate-900">Popular</h2>
                        <button className="text-xs text-sky-600 font-bold hover:text-sky-700">See all</button>
                    </div>
                    <div className="flex gap-4 overflow-x-auto px-4 pb-4 no-scrollbar snap-x">
                        {popular.map(novel => (
                            <Link key={novel.id} href={`/novel/${novel.id}`} className="w-32 flex-shrink-0 snap-start group">
                                <div className="relative rounded-xl overflow-hidden bg-slate-100 aspect-[2/3] shadow-sm mb-2 group-hover:shadow-md transition-all">
                                    {novel.cover_image_url ? (
                                        <img src={novel.cover_image_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl">📖</div>
                                    )}
                                </div>
                                <div className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-sky-600 transition-colors">{novel.title}</div>
                                <div className="text-xs text-slate-500">★ 4.6</div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Recommended */}
                <section>
                    <div className="px-4 flex items-center justify-between mb-3">
                        <h2 className="text-base font-bold tracking-tight text-slate-900">Recommended</h2>
                        <button className="text-xs text-sky-600 font-bold hover:text-sky-700">See all</button>
                    </div>
                    <div className="px-4 grid grid-cols-2 gap-4">
                        {recommended.map(novel => (
                            <Link key={novel.id} href={`/novel/${novel.id}`} className="rounded-xl border border-slate-100 shadow-sm overflow-hidden bg-white hover:shadow-md transition-all group">
                                <div className="h-32 bg-slate-100 overflow-hidden relative">
                                    {novel.cover_image_url ? (
                                        <img src={novel.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl">📖</div>
                                    )}
                                </div>
                                <div className="p-3">
                                    <div className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-sky-600 transition-colors">{novel.title}</div>
                                    <div className="text-xs text-slate-500 mt-1">★ 4.9</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* New Arrivals */}
                <section>
                    <div className="px-4 flex items-center justify-between mb-3">
                        <h2 className="text-base font-bold tracking-tight text-slate-900">New Arrivals</h2>
                        <button className="text-xs text-sky-600 font-bold hover:text-sky-700">See all</button>
                    </div>
                    <div className="px-4 space-y-3">
                        {newArrivals.map(novel => (
                            <Link key={novel.id} href={`/novel/${novel.id}`} className="flex gap-3 p-3 rounded-xl border border-slate-100 shadow-sm bg-white hover:bg-slate-50 transition-colors group">
                                <div className="h-16 w-12 rounded-md bg-slate-100 overflow-hidden flex-shrink-0">
                                    {novel.cover_image_url ? (
                                        <img src={novel.cover_image_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-lg">📖</div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-sky-600 transition-colors">{novel.title}</div>
                                    <div className="text-xs text-slate-500 mt-1">New · {genre.name}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Recently Updated */}
                <section>
                    <div className="px-4 flex items-center justify-between mb-3">
                        <h2 className="text-base font-bold tracking-tight text-slate-900">Recently Updated</h2>
                        <button className="text-xs text-sky-600 font-bold hover:text-sky-700">See all</button>
                    </div>
                    <div className="px-4 space-y-3">
                        {recent.map(novel => (
                            <Link key={novel.id} href={`/novel/${novel.id}`} className="flex gap-3 p-3 rounded-xl border border-slate-100 shadow-sm bg-white hover:bg-slate-50 transition-colors group">
                                <div className="h-16 w-12 rounded-md bg-slate-100 overflow-hidden flex-shrink-0">
                                    {novel.cover_image_url ? (
                                        <img src={novel.cover_image_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-lg">📖</div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-sky-600 transition-colors">{novel.title}</div>
                                    <div className="text-xs text-slate-500 mt-1">Updated recently</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
