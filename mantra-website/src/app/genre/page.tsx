import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function GenresPage() {
    const supabase = await createServerSupabaseClient();

    const { data: genres } = await supabase
        .from('genres')
        .select('*')
        .order('name', { ascending: true });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-inter">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">📚 Browse by Genre</h1>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {genres?.map((genre) => (
                    <Link
                        key={genre.id}
                        href={`/genre/${genre.slug || genre.id}`}
                        className="group p-6 bg-white border border-slate-200 rounded-xl hover:shadow-lg hover:border-sky-500 hover:shadow-sky-100 transition-all text-center relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-2 opacity-5">
                            <span className="text-6xl">{genre.emoji || '📖'}</span>
                        </div>
                        <span className="text-4xl mb-3 block relative z-10 transform group-hover:scale-110 transition-transform duration-300">{genre.emoji || '📖'}</span>
                        <h3 className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors relative z-10">
                            {genre.name}
                        </h3>
                        {genre.description && (
                            <p className="text-xs text-slate-500 mt-2 line-clamp-2 relative z-10 leading-relaxed">
                                {genre.description}
                            </p>
                        )}
                    </Link>
                )) || (
                        <p className="col-span-full text-center text-slate-500 py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            No genres found
                        </p>
                    )}
            </div>
        </div>
    );
}
