import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function GenresPage() {
    const supabase = await createServerSupabaseClient();

    const { data: genres } = await supabase
        .from('genres')
        .select('*')
        .order('name', { ascending: true });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-[var(--foreground)] mb-8">📚 Browse by Genre</h1>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {genres?.map((genre) => (
                    <Link
                        key={genre.id}
                        href={`/genre/${genre.slug}`}
                        className="group p-6 bg-[var(--card)] border border-[var(--border)] rounded-xl hover:shadow-lg hover:border-[var(--primary)] transition-all text-center"
                    >
                        <span className="text-4xl mb-3 block">{genre.emoji || '📖'}</span>
                        <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                            {genre.name}
                        </h3>
                        {genre.description && (
                            <p className="text-sm text-[var(--foreground-secondary)] mt-1 line-clamp-2">
                                {genre.description}
                            </p>
                        )}
                    </Link>
                )) || (
                        <p className="col-span-full text-center text-[var(--foreground-secondary)] py-8">
                            No genres found
                        </p>
                    )}
            </div>
        </div>
    );
}
