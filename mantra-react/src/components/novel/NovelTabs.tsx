import { useState, useMemo } from 'react';
import { Search, ArrowUpDown } from 'lucide-react';
import ChapterList from './ChapterList';
import ReviewSection from './ReviewSection';
import { getUserDisplayName, getUserProfileImage } from '@/lib/utils/profileUtils';

import type { User } from '@supabase/supabase-js';

interface NovelTabsProps {
    description: string;
    chapters: any[];
    novelId: string;
    reviews: any[];
    tags: string[];
    currentUser: User | null;
}

export default function NovelTabs({ description, chapters, novelId, reviews, tags, currentUser }: NovelTabsProps) {
    const [activeTab, setActiveTab] = useState<'about' | 'chapters' | 'reviews'>('about');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [activeChunkIndex, setActiveChunkIndex] = useState(0);

    const filteredChapters = useMemo(() => {
        let result = [...chapters];

        // 1. Filter
        if (searchQuery) {
            result = result.filter(c =>
                c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.chapter_number.toString().includes(searchQuery)
            );
        }

        // 2. Sort
        result.sort((a, b) => {
            return sortOrder === 'asc'
                ? a.chapter_number - b.chapter_number
                : b.chapter_number - a.chapter_number;
        });

        return result;
    }, [chapters, searchQuery, sortOrder]);

    return (
        <div className="mt-6">
            {/* Tab Buttons */}
            <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
                <button
                    onClick={() => setActiveTab('about')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'about'
                        ? 'bg-sky-500 text-white'
                        : 'border border-border bg-card text-foreground-secondary hover:border-sky-300 dark:hover:border-sky-700'
                        }`}
                >
                    About
                </button>
                <button
                    onClick={() => setActiveTab('chapters')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'chapters'
                        ? 'bg-sky-500 text-white'
                        : 'border border-border bg-card text-foreground-secondary hover:border-sky-300 dark:hover:border-sky-700'
                        }`}
                >
                    Chapters
                </button>
                <button
                    onClick={() => setActiveTab('reviews')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'reviews'
                        ? 'bg-sky-500 text-white'
                        : 'border border-border bg-card text-foreground-secondary hover:border-sky-300 dark:hover:border-sky-700'
                        }`}
                >
                    Reviews
                </button>
            </div>

            {/* Tab Content */}
            <div className="mt-4">
                {activeTab === 'about' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <p className="text-sm text-foreground-secondary leading-relaxed whitespace-pre-line mb-4">
                            {description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag, i) => (
                                <span key={i} className="px-3 py-1.5 rounded-full bg-background-secondary text-foreground-secondary text-xs font-medium">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        {reviews.length > 0 && (
                            <div className="mt-6 rounded-xl border border-border p-4 shadow-sm bg-card">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="text-sm font-semibold text-foreground">Top Reviews</div>
                                    <button className="text-xs text-sky-600 dark:text-sky-400 font-semibold" onClick={() => setActiveTab('reviews')}>See all</button>
                                </div>
                                {/* Simple Review Preview */}
                                {reviews.slice(0, 1).map(review => {
                                    const displayName = getUserDisplayName(review.user);
                                    const avatarUrl = getUserProfileImage(review.user);
                                    return (
                                        <div key={review.id} className="flex gap-2">
                                            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-background-secondary border border-border">
                                                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-semibold text-foreground">{displayName}</span>
                                                    <span className="text-[10px] text-foreground-secondary">{new Date(review.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-xs mt-1 text-foreground-secondary line-clamp-2">{review.content || review.review_text}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'chapters' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Filters & Search */}
                        <div className="bg-background-secondary p-4 rounded-xl mb-4 space-y-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-secondary" />
                                <input
                                    type="text"
                                    placeholder="Search specific chapter..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-foreground"
                                />
                            </div>

                            <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-card border border-border rounded-lg text-xs font-medium text-foreground hover:bg-background-secondary whitespace-nowrap"
                                    >
                                        <ArrowUpDown className="w-3.5 h-3.5" />
                                        {sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}
                                    </button>
                                </div>
                                <span className="text-xs text-foreground-secondary whitespace-nowrap">
                                    {filteredChapters.length} Chapters
                                </span>
                            </div>

                            {/* Range / Pagination (for large lists) */}
                            {!searchQuery && chapters.length > 50 && (
                                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
                                    {Array.from({ length: Math.ceil(chapters.length / 50) }).map((_, i) => {
                                        const start = i * 50 + 1;
                                        const end = Math.min((i + 1) * 50, chapters.length);
                                        const label = `${start}-${end}`;
                                        const isActive = i === activeChunkIndex;
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => setActiveChunkIndex(i)}
                                                className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${isActive
                                                    ? 'bg-sky-500 text-white border-sky-500 shadow-sm'
                                                    : 'bg-card border border-border text-foreground-secondary hover:bg-background-secondary'
                                                    }`}
                                            >
                                                {label}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        <ChapterList
                            chapters={searchQuery ? filteredChapters : filteredChapters.slice(activeChunkIndex * 50, (activeChunkIndex + 1) * 50)}
                            novelId={novelId}
                        />

                        {/* Load More Trigger or Pagination Info could go here if managed server side */}
                    </div>
                )}

                {activeTab === 'reviews' && (
                    <ReviewSection novelId={novelId} currentUser={currentUser} />
                )}
            </div>
        </div>
    );
}
