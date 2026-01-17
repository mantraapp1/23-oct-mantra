"use client";

import Link from 'next/link';

interface NovelListCardProps {
    novel: {
        id: string;
        title: string;
        cover_image_url: string | null;
        author?: {
            username: string;
        };
        category?: string;
        description?: string;
        view_count?: number;
    };
}

export default function NovelListCard({ novel }: NovelListCardProps) {
    return (
        <Link
            href={`/novel/${novel.id}`}
            className="flex gap-4 p-3 rounded-[var(--radius-xl)] hover:bg-[var(--background-secondary)] transition-colors group"
        >
            {/* Cover Image */}
            <div className="relative w-20 h-28 flex-shrink-0 rounded-[var(--radius-lg)] overflow-hidden shadow-sm bg-[var(--background-secondary)]">
                <img
                    src={novel.cover_image_url || '/placeholder.png'}
                    alt={novel.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                />
            </div>

            {/* Content */}
            <div className="flex-1 py-1 min-w-0 flex flex-col justify-center">
                <h3 className="font-bold text-[var(--foreground)] text-sm mb-1 line-clamp-2 leading-tight group-hover:text-[var(--primary)] transition-colors">
                    {novel.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-[var(--foreground-secondary)] mb-2">
                    {novel.category && (
                        <span className="font-medium text-[var(--primary)]">
                            {novel.category}
                        </span>
                    )}
                    {novel.category && novel.view_count !== undefined && <span>•</span>}
                    {novel.view_count !== undefined && (
                        <span>{novel.view_count.toLocaleString()} views</span>
                    )}
                </div>

                <div className="flex items-center gap-1 text-xs text-[var(--foreground-secondary)] mb-2">
                    {novel.author?.username && (
                        <>
                            <span>by {novel.author.username}</span>
                        </>
                    )}
                </div>

                {novel.description && (
                    <p className="text-xs text-[var(--foreground-secondary)] line-clamp-2 opacity-80">
                        {novel.description}
                    </p>
                )}
            </div>
        </Link>
    );
}
