import { Link, useSearchParams } from 'react-router-dom';

export default function CategoryRail({ categories = [] }: { categories: any[] }) {
    const [searchParams] = useSearchParams();
    const currentGenre = searchParams.get('genre');

    return (
        <div className="sticky top-16 z-40 bg-background border-b border-border py-3">
            <div className="flex overflow-x-auto px-4 sm:px-6 lg:px-8 gap-3 scrollbar-hide">
                <Link
                    to="/"
                    className={`
                        flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                        ${!currentGenre
                            ? 'bg-[var(--primary)] text-white shadow-md shadow-sky-500/20'
                            : 'bg-[var(--background-secondary)] text-[var(--foreground-secondary)] hover:bg-[var(--border)] hover:text-[var(--foreground)]'}
                    `}
                >
                    For You
                </Link>
                {categories.map((category) => {
                    const isActive = currentGenre === category.slug;
                    return (
                        <Link
                            key={category.id}
                            to={`/?genre=${category.slug}`}
                            className={`
                                flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                                ${isActive
                                    ? 'bg-[var(--primary)] text-white shadow-md shadow-sky-500/20'
                                    : 'bg-[var(--background-secondary)] text-[var(--foreground-secondary)] hover:bg-[var(--border)] hover:text-[var(--foreground)]'}
                            `}
                        >
                            {category.name}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
