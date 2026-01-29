import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import MatureBadge from './MatureBadge';

interface NovelCardProps {
    novel: {
        id: string;
        title: string;
        cover_image_url: string | null;
        is_mature?: boolean;
        author?: {
            username: string;
        };
        category?: string;
    };
    variant?: 'vertical' | 'horizontal';
    className?: string;
}

export default function NovelCard({ novel, variant = 'vertical', className }: NovelCardProps) {
    if (variant === 'horizontal') {
        // Todo: Implement horizontal card if needed, for now default to vertical as per mobile
    }

    return (
        <Link to={`/novel/${novel.id}`} className={cn("group block w-full space-y-3", className)}>
            {/* Cover Image Container */}
            <div className="relative w-full aspect-[2/3] rounded-[var(--radius-xl)] overflow-hidden bg-[var(--background-secondary)] shadow-sm group-hover:shadow-[var(--primary)]/20 group-hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                <img
                    src={novel.cover_image_url || '/placeholder.png'}
                    alt={novel.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* 18+ Mature Badge */}
                {novel.is_mature && (
                    <div className="absolute top-2 left-2 z-10">
                        <MatureBadge size="sm" />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="space-y-1.5 px-1">
                <h3 className="font-bold text-[var(--foreground)] line-clamp-2 leading-tight group-hover:text-[var(--primary)] transition-colors text-sm">
                    {novel.title}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--foreground-secondary)]">
                    {novel.category && (
                        <span className="px-2 py-0.5 rounded-full bg-[var(--background-secondary)] text-[var(--foreground)] font-medium border border-[var(--border)] group-hover:border-[var(--primary)] group-hover:text-[var(--primary)] transition-colors">
                            {novel.category}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}
