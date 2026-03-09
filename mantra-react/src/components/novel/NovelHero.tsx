import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreVertical, Share2, User, Flag } from 'lucide-react';
import ActionButtons from './ActionButtons';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Badge } from '@/components/ui/badge-2';

import { getGenreBadgeColor } from '@/utils/genreUtils';

interface NovelHeroProps {
    novel: {
        id: string;
        title: string;
        cover_image_url: string | null;
        author?: {
            id: string;
            username: string;
        };
        status: string;
        genres?: string[];
        average_rating?: number;
        total_views?: number;
        total_votes?: number;
        total_chapters?: number;
    };
    chapters?: { id: string; chapter_number: number }[];
    children?: React.ReactNode;
    onVoteChange?: (increment: boolean) => void;
}


export default function NovelHero({ novel, chapters = [], children, onVoteChange }: NovelHeroProps) {
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();
    const usedGenreColors = new Set<string>();

    const handleShare = async () => {
        setShowMenu(false);
        try {
            if (navigator.share) {
                await navigator.share({
                    title: novel.title,
                    text: `Check out "${novel.title}" by ${novel.author?.username || 'Unknown'}`,
                    url: window.location.href,
                });
            } else {
                await navigator.clipboard.writeText(window.location.href);
                toast.success('Link copied to clipboard!');
            }
        } catch {
        }
    };

    const handleReport = () => {
        setShowMenu(false);
        navigate(`/report?type=novel&id=${novel.id}&name=${encodeURIComponent(novel.title)}`);
    };

    // Genre Color Logic matching mobile - UPDATED to Card Style (White BG, Gray Border)
    // Mobile GenreTag uses theme.card + theme.border
    // Genre Color Logic matching mobile (Restored Colored Styles)
    // Genre Color Logic matching mobile (Restored Colored Styles)
    // Helper components cleaned up - using inline Badge now


    return (
        <div className="bg-background w-full">
            {/* 1. Banner Image with Gradient */}
            <div className="relative h-64 md:h-80 w-full">
                <img
                    src={novel.cover_image_url || '/placeholder.png'}
                    className="h-full w-full object-cover"
                    alt="Cover Backdrop"
                />
                {/* Gradient: Transparent top -> Background bottom */}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent"></div>

                {/* Navbar Overlay */}
                <div className="absolute inset-0 z-20 pointer-events-none">
                    <Link
                        to="/"
                        className="pointer-events-auto absolute top-4 left-4 p-2 rounded-full bg-black/60 hover:bg-black/70 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </Link>

                    <div className="pointer-events-auto absolute top-4 right-4 flex items-center gap-2">
                        <button
                            onClick={handleShare}
                            className="p-2 rounded-full bg-black/60 hover:bg-black/70 transition-colors"
                        >
                            <Share2 className="w-5 h-5 text-white" />
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-2 rounded-full bg-black/60 hover:bg-black/70 transition-colors"
                            >
                                <MoreVertical className="w-5 h-5 text-white" />
                            </button>

                            {showMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-card rounded-xl shadow-xl border border-border py-2 z-50">
                                        {novel.author?.id && (
                                            <Link
                                                to={`/user/${novel.author.id}`}
                                                className="flex items-center gap-3 px-4 py-2 hover:bg-background-secondary text-sm text-foreground"
                                            >
                                                <User className="w-4 h-4" /> View Author
                                            </Link>
                                        )}
                                        <button onClick={handleShare} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-background-secondary text-sm text-foreground text-left">
                                            <Share2 className="w-4 h-4" /> Share
                                        </button>
                                        <button onClick={handleReport} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 text-sm text-red-600 text-left">
                                            <Flag className="w-4 h-4" /> Report
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Overlapping Container (Wraps Info + Stats + Buttons + Tabs/Content) */}
            <div className="max-w-6xl mx-auto px-4 -mt-16 md:-mt-20 relative z-10 pb-16 md:pb-24">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
                    {/* Cover */}
                    <div className="flex flex-col items-center lg:items-start gap-4">
                        <img
                            src={novel.cover_image_url || '/placeholder.png'}
                            className="w-32 h-44 sm:w-40 sm:h-56 lg:w-[220px] lg:h-[320px] xl:w-[240px] xl:h-[360px] rounded-2xl object-cover border-4 border-card shadow-xl bg-card"
                            alt={novel.title}
                        />
                    </div>

                    {/* Primary Info */}
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-4 md:gap-6">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                <div className="space-y-3">
                                    <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-foreground-secondary">
                                        Mantra Original
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                                        {novel.title}
                                    </h1>
                                    <div className="text-sm sm:text-base text-foreground-secondary">
                                        by{' '}
                                        <Link
                                            to={`/user/${novel.author?.id}`}
                                            className="font-semibold text-foreground hover:text-sky-500 transition-colors"
                                        >
                                            {novel.author?.username || 'Unknown'}
                                        </Link>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge
                                            variant="outline"
                                            size="sm"
                                            className="rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-wide px-3 py-1 text-white shadow-sm border-none"
                                            style={{ backgroundColor: '#16A34A', borderColor: 'transparent' }}
                                        >
                                            {novel.status}
                                        </Badge>

                                        {novel.genres?.map((genre, i) => (
                                            <Badge
                                                key={i}
                                                variant="outline"
                                                size="sm"
                                                className="rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-wide px-2.5 py-1 border-none text-white"
                                                style={{ backgroundColor: getGenreBadgeColor(genre, usedGenreColors), borderColor: 'transparent' }}
                                            >
                                                {genre}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <span className="hidden md:block h-10" />
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
                                    <div className="text-sm sm:text-base font-bold text-foreground">{novel.average_rating?.toFixed(1) || '0.0'}</div>
                                    <div className="text-[11px] sm:text-xs text-foreground-secondary">Rating</div>
                                </div>
                                <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
                                    <div className="text-sm sm:text-base font-bold text-foreground">{novel.total_views ? (novel.total_views > 1000 ? (novel.total_views / 1000).toFixed(1) + 'K' : novel.total_views) : '0'}</div>
                                    <div className="text-[11px] sm:text-xs text-foreground-secondary">Views</div>
                                </div>
                                <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
                                    <div className="text-sm sm:text-base font-bold text-foreground">{novel.total_votes ? (novel.total_votes > 1000 ? (novel.total_votes / 1000).toFixed(1) + 'K' : novel.total_votes) : '0'}</div>
                                    <div className="text-[11px] sm:text-xs text-foreground-secondary">Votes</div>
                                </div>
                                <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
                                    <div className="text-sm sm:text-base font-bold text-foreground">{novel.total_chapters || '0'}</div>
                                    <div className="text-[11px] sm:text-xs text-foreground-secondary">Chapters</div>
                                </div>
                            </div>
                        </div>

                        <ActionButtons novelId={novel.id} currentUser={user} chapters={chapters} onVoteChange={onVoteChange} />
                    </div>
                </div>

                <div className="mt-8 lg:mt-12">
                    {children}
                </div>
            </div>
        </div>
    );
}
