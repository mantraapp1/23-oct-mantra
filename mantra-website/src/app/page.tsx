import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Reusable Novel Card Component
function NovelCard({ novel }: { novel: any }) {
  return (
    <Link
      href={`/novel/${novel.id}`}
      className="group block bg-[var(--card)] rounded-xl overflow-hidden border border-[var(--border)] hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
    >
      <div className="aspect-[3/4] relative overflow-hidden bg-slate-200">
        {novel.cover_image_url ? (
          <img
            src={novel.cover_image_url}
            alt={novel.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-500/20 to-indigo-500/20">
            <span className="text-4xl">📖</span>
          </div>
        )}
        {/* Status Badge */}
        {novel.status && (
          <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${novel.status === 'ongoing' ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'
            }`}>
            {novel.status}
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-[var(--foreground)] line-clamp-2 text-sm group-hover:text-[var(--primary)] transition-colors">
          {novel.title}
        </h3>
        <p className="text-xs text-[var(--foreground-secondary)] mt-1 line-clamp-1">
          {novel.author_name || 'Unknown Author'}
        </p>
        <div className="flex items-center gap-3 mt-2 text-xs text-[var(--foreground-secondary)]">
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            {novel.view_count?.toLocaleString() || 0}
          </span>
          <span className="flex items-center gap-1">
            ❤️ {novel.like_count?.toLocaleString() || 0}
          </span>
        </div>
      </div>
    </Link>
  );
}

// Section Component
function Section({ title, viewAllLink, children }: { title: string; viewAllLink?: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[var(--foreground)]">{title}</h2>
        {viewAllLink && (
          <Link href={viewAllLink} className="text-sm text-[var(--primary)] hover:underline font-medium">
            See all →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();

  // Fetch trending novels
  const { data: trendingNovels } = await supabase
    .from('novels')
    .select(`
      id, title, cover_image_url, status, view_count, like_count,
      author:profiles!novels_author_id_fkey(username)
    `)
    .eq('is_published', true)
    .order('view_count', { ascending: false })
    .limit(8);

  // Fetch latest updates
  const { data: latestNovels } = await supabase
    .from('novels')
    .select(`
      id, title, cover_image_url, status, view_count, like_count,
      author:profiles!novels_author_id_fkey(username)
    `)
    .eq('is_published', true)
    .order('updated_at', { ascending: false })
    .limit(8);

  // Fetch genres
  const { data: genres } = await supabase
    .from('genres')
    .select('*')
    .limit(12);

  // Format novels with author name
  const formatNovels = (novels: any[]) =>
    novels?.map(n => ({ ...n, author_name: n.author?.username })) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden mb-12 bg-gradient-to-r from-sky-500 to-indigo-600 p-8 md:p-12">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Discover Your Next Favorite Story
          </h1>
          <p className="text-white/90 mb-6 text-lg">
            Thousands of web novels from talented authors. Read for free, support creators, or start writing your own masterpiece.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/ranking"
              className="px-6 py-3 bg-white text-sky-600 rounded-lg font-semibold hover:bg-white/90 transition-colors"
            >
              Browse Novels
            </Link>
            <Link
              href="/author/dashboard"
              className="px-6 py-3 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition-colors border border-white/30"
            >
              Start Writing
            </Link>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 w-1/3 h-full opacity-20">
          <div className="absolute right-10 top-10 w-32 h-32 border-4 border-white rounded-full"></div>
          <div className="absolute right-20 bottom-10 w-24 h-24 border-4 border-white rounded-full"></div>
        </div>
      </div>

      {/* Genres */}
      <Section title="Browse by Genre" viewAllLink="/genre">
        <div className="flex flex-wrap gap-2">
          {genres?.map((genre) => (
            <Link
              key={genre.id}
              href={`/genre/${genre.slug}`}
              className="px-4 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-full text-sm font-medium text-[var(--foreground)] hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] transition-all"
            >
              {genre.emoji} {genre.name}
            </Link>
          )) || (
              <p className="text-[var(--foreground-secondary)]">No genres found</p>
            )}
        </div>
      </Section>

      {/* Trending Novels */}
      <Section title="🔥 Trending Now" viewAllLink="/see-all/trending">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {formatNovels(trendingNovels || []).slice(0, 6).map((novel) => (
            <NovelCard key={novel.id} novel={novel} />
          ))}
          {(!trendingNovels || trendingNovels.length === 0) && (
            <p className="col-span-full text-center text-[var(--foreground-secondary)] py-8">
              No novels found. Check back later!
            </p>
          )}
        </div>
      </Section>

      {/* Latest Updates */}
      <Section title="📚 Latest Updates" viewAllLink="/see-all/latest">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {formatNovels(latestNovels || []).slice(0, 6).map((novel) => (
            <NovelCard key={novel.id} novel={novel} />
          ))}
        </div>
      </Section>

      {/* Call to Action */}
      <div className="bg-[var(--background-secondary)] rounded-2xl p-8 text-center border border-[var(--border)]">
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
          Ready to Share Your Story?
        </h2>
        <p className="text-[var(--foreground-secondary)] mb-6 max-w-xl mx-auto">
          Join thousands of authors on Mantra Novel. Share your stories, build your audience, and earn from your creativity.
        </p>
        <Link
          href="/signup"
          className="inline-block px-8 py-3 bg-[var(--primary)] text-white rounded-lg font-semibold hover:bg-sky-600 transition-colors"
        >
          Get Started Free
        </Link>
      </div>
    </div>
  );
}
