"use client";

import Link from 'next/link';
import { Novel } from '@/types/database';

interface NovelCardProps {
    novel: {
        id: string;
        title: string;
        cover_image_url: string | null;
        author?: {
            username: string;
        };
        category?: string;
    };
    variant?: 'vertical' | 'horizontal';
}

export default function NovelCard({ novel, variant = 'vertical' }: NovelCardProps) {
    if (variant === 'horizontal') {
        // Todo: Implement horizontal card if needed, for now default to vertical as per mobile
    }

    return (
        <Link href={`/novel/${novel.id}`} className="group block w-full space-y-3">
            {/* Cover Image Container */}
            <div className="relative w-full aspect-[2/3] rounded-[var(--radius-xl)] overflow-hidden bg-[var(--background-secondary)] shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-1">
                <img
                    src={novel.cover_image_url || '/placeholder.png'}
                    alt={novel.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Content */}
            <div className="space-y-1">
                <h3 className="font-bold text-[var(--foreground)] line-clamp-2 leading-tight group-hover:text-[var(--primary)] transition-colors text-sm">
                    {novel.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-[var(--foreground-secondary)]">
                    {novel.category && (
                        <span className="px-1.5 py-0.5 rounded-md bg-[var(--background-secondary)] text-[var(--primary)] font-medium">
                            {novel.category}
                        </span>
                    )}
                    {novel.author?.username && (
                        <span className="line-clamp-1">by {novel.author.username}</span>
                    )}
                </div>
            </div>
        </Link>
    );
}
