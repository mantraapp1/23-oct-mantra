import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
    ChevronLeft,
    Search,
    Eye,
    ThumbsUp,
    BookOpen,
    Star,
    MessageSquare,
    Edit3,
    Trash2,
    MoreVertical,
    ThumbsDown,
    Loader2,
    FileText,
    Lock,
    Activity,
    Bookmark
} from 'lucide-react';
import novelService from '@/services/novelService';
import chapterService from '@/services/chapterService';
import reviewService from '@/services/reviewService';
import type { Novel, Chapter } from '@/types/supabase';
import { Badge } from '@/components/ui/badge-2';
import { getGenreBadgeColor } from '@/utils/genreUtils';
import { getUserDisplayName, getUserProfileImage } from '@/lib/utils/profileUtils';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/contexts/DialogContext';

type TabType = 'overview' | 'chapters' | 'reviews';

export default function NovelManagePage() {
    const { id } = useParams();
    const { user, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const confirm = useConfirm();

    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [novel, setNovel] = useState<Novel | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'most-views'>('newest');
    const [reviewFilter, setReviewFilter] = useState<'all' | number>('all');
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [totalBookmarks, setTotalBookmarks] = useState(0);

    useEffect(() => {
        if (!id || !user) return;
        loadData();
    }, [id, user]);

    const loadData = async () => {
        if (!id || !user) return;
        setIsLoading(true);
        try {
            const novelData = await novelService.getNovel(id);
            if (!novelData) {
                navigate('/dashboard');
                return;
            }
            if (novelData.author_id !== user.id) {
                navigate('/dashboard');
                return;
            }
            setNovel(novelData);

            const chaptersData = await chapterService.getAllChaptersByNovel(id);
            setChapters(chaptersData.sort((a, b) => b.chapter_number - a.chapter_number));

            const reviewsData = await reviewService.getNovelReviews(id);
            setReviews(reviewsData.reviews || []);

            const libData = await novelService.getLibraryInfo(id);
            setTotalBookmarks(libData.count);
        } catch (error) {
            console.error('Error loading novel management data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Derived: Rating Stats
    const ratingStats = useMemo(() => {
        const stats: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach(r => {
            const rVal = Math.round(r.rating);
            if (stats[rVal] !== undefined) stats[rVal]++;
        });
        return stats;
    }, [reviews]);

    const averageRating = useMemo(() => {
        if (reviews.length === 0) return '0.0';
        const total = reviews.reduce((acc, r) => acc + r.rating, 0);
        return (total / reviews.length).toFixed(1);
    }, [reviews]);

    const formatNumber = (num: number): string => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
        return num.toString();
    };

    const getProgressStats = (value: number) => {
        if (value <= 0) return { percent: 0, target: 10 };
        const power = Math.floor(Math.log10(value));
        const base = Math.pow(10, power);
        let target = base * 10;

        if (value < base * 2) target = base * 2;
        else if (value < base * 5) target = base * 5;

        return { percent: (value / target) * 100, target };
    };

    const handleDeleteNovel = async () => {
        if (!novel) return;
        setIsDeleting(true);
        try {
            const result = await novelService.deleteNovel(novel.id);
            if (result.success) {
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Error deleting novel:', error);
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const handleDeleteReview = async (reviewId: string) => {
        if (!await confirm('Are you sure you want to delete this review?', { title: 'Delete Review', variant: 'destructive', confirmText: 'Delete' })) return;
        try {
            await reviewService.deleteReview(reviewId);
            setReviews(prev => prev.filter(r => r.id !== reviewId));
            setActiveMenu(null);
            toast.success('Review deleted');
        } catch (error) {
            console.error('Failed to delete review:', error);
            toast.error('Failed to delete review');
        }
    };

    const handleVote = async (reviewId: string, type: 'like' | 'dislike') => {
        if (!user) return;

        // Optimistic Update
        const previousReviews = [...reviews];

        setReviews(prev => prev.map(r => {
            if (r.id !== reviewId) return r;

            // Logic for toggling/switching votes
            let newLikes = r.likes || 0;
            let newDislikes = r.dislikes || 0;
            const hasLiked = r.user_has_liked;
            const hasDisliked = r.user_has_disliked;

            if (type === 'like') {
                if (hasLiked) {
                    // Toggle off
                    newLikes--;
                    return { ...r, likes: newLikes, user_has_liked: false };
                } else {
                    // Toggle on
                    newLikes++;
                    if (hasDisliked) newDislikes--;
                    return { ...r, likes: newLikes, dislikes: newDislikes, user_has_liked: true, user_has_disliked: false };
                }
            } else {
                if (hasDisliked) {
                    // Toggle off
                    newDislikes--;
                    return { ...r, dislikes: newDislikes, user_has_disliked: false };
                } else {
                    // Toggle on
                    newDislikes++;
                    if (hasLiked) newLikes--;
                    return { ...r, likes: newLikes, dislikes: newDislikes, user_has_disliked: true, user_has_liked: false };
                }
            }
        }));

        try {
            await reviewService.voteReview(reviewId, user.id, type);
        } catch (error) {
            console.error('Failed to vote:', error);
            // Revert on error
            setReviews(previousReviews);
        }
    };

    // Filter and sort chapters
    const getFilteredChapters = () => {
        let filtered = chapters.filter(c =>
            c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.chapter_number.toString().includes(searchQuery)
        );
        return filtered.sort((a, b) => {
            if (sortBy === 'newest') return b.chapter_number - a.chapter_number;
            if (sortBy === 'oldest') return a.chapter_number - b.chapter_number;
            if (sortBy === 'most-views') return (b.views || 0) - (a.views || 0);
            return 0;
        });
    };

    const filteredReviews = reviews.filter(r =>
        reviewFilter === 'all' ? true : Math.round(r.rating) === reviewFilter
    );

    const RatingBar = ({ star, count, total }: { star: number, count: number, total: number }) => {
        const percentage = total > 0 ? (count / total) * 100 : 0;
        return (
            <div className="flex items-center gap-3 text-xs">
                <span className="w-3 font-medium text-foreground">{star}★</span>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${percentage}%` }} />
                </div>
                <span className="w-8 text-right text-muted-foreground">{Math.round(percentage)}%</span>
            </div>
        );
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-sky-500 animate-spin mx-auto" />
                    <p className="text-muted-foreground text-sm mt-3">Loading novel data...</p>
                </div>
            </div>
        );
    }

    if (!novel) return null;

    return (
        <div className="min-h-screen bg-background pb-safe text-foreground">
            {/* Novel Info Banner */}
            <div className="relative h-64 w-full bg-secondary/30">
                <img
                    src={novel.cover_image_url || ''}
                    alt=""
                    className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                <button
                    onClick={() => navigate('/dashboard')}
                    className="absolute top-4 left-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/70 transition-colors z-20"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
            </div>

            {/* Main Container */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* Cover Image */}
                    <div className="relative group shrink-0 mx-auto md:mx-0">
                        <img
                            src={novel.cover_image_url || ''}
                            alt={novel.title}
                            className="w-32 h-48 md:w-40 md:h-60 rounded-xl border-4 border-background shadow-2xl object-cover bg-card"
                        />
                        <button
                            onClick={() => navigate(`/novel/edit/${novel.id}`)}
                            className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Edit3 className="w-8 h-8 text-white" />
                        </button>
                    </div>

                    {/* Details */}
                    <div className="flex-1 pt-2 md:pt-24 text-center md:text-left">
                        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{novel.title}</h2>
                        <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                            {/* Status */}
                            <Badge
                                variant="outline"
                                size="sm"
                                className="uppercase tracking-wider text-[10px] px-2.5 py-0.5 border-none text-white font-bold"
                                style={{ backgroundColor: '#16A34A' }}
                            >
                                {novel.status || 'Ongoing'}
                            </Badge>
                            {/* Genres */}
                            {novel.genres?.slice(0, 3).map((genre, i) => (
                                <Badge
                                    key={i}
                                    variant="outline"
                                    size="sm"
                                    className="text-[10px] px-2.5 py-0.5 border-none text-white font-bold uppercase tracking-wide"
                                    style={{ backgroundColor: getGenreBadgeColor(genre) }}
                                >
                                    {genre}
                                </Badge>
                            ))}
                        </div>
                        <div className="flex gap-3 justify-center md:justify-start">
                            <button
                                onClick={() => navigate(`/novel/edit/${novel.id}`)}
                                className="px-5 py-2 bg-sky-500 text-white rounded-lg text-sm font-semibold hover:bg-sky-600 transition-colors shadow-lg shadow-sky-500/20"
                            >
                                Edit Info
                            </button>
                            <button
                                onClick={() => navigate(`/novel/${novel.id}/create-chapter`)}
                                className="px-5 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-semibold hover:bg-secondary/80 transition-colors border border-border"
                            >
                                + Add Chapter
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs - Now clearly below */}
                <div className="mt-8 border-b border-border sticky top-0 bg-background z-20">
                    <div className="flex gap-8">
                        {['overview', 'chapters', 'reviews'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as TabType)}
                                className={`py-4 text-sm font-bold capitalize transition-colors relative ${activeTab === tab
                                    ? 'text-sky-500'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {tab}
                                {activeTab === tab && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 rounded-t-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="py-8">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Left Column: Stats & Description */}
                            <div className="lg:col-span-2 space-y-8">
                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {[
                                        { label: 'Total Views', value: formatNumber(novel.total_views || 0), icon: Eye, color: 'text-sky-500' },
                                        { label: 'Total Votes', value: formatNumber(novel.total_votes || 0), icon: ThumbsUp, color: 'text-amber-500' },
                                        { label: 'Chapters', value: novel.total_chapters || 0, icon: BookOpen, color: 'text-indigo-500' },
                                        { label: 'Rating', value: novel.average_rating?.toFixed(1) || '0.0', icon: Star, color: 'text-amber-400' },
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between h-28 hover:border-sky-500/30 transition-colors">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                                <span className="text-xs font-bold uppercase tracking-wide">{stat.label}</span>
                                            </div>
                                            <p className="text-2xl font-black text-foreground">{stat.value}</p>
                                        </div>
                                    ))}
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                                        <FileText className="w-4 h-4" /> Synopsis
                                    </h3>
                                    <div className="bg-card border border-border rounded-xl p-6">
                                        <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap font-serif">
                                            {novel.description || 'No description provided.'}
                                        </p>
                                    </div>
                                </div>

                                {novel.tags && novel.tags.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wider">Tags</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {novel.tags.map((tag, i) => (
                                                <span key={i} className="px-3 py-1.5 text-sm bg-secondary text-secondary-foreground rounded-lg font-medium border border-transparent hover:border-border transition-colors">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Performance Summary */}
                            <div className="space-y-6">
                                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                                            <Activity className="w-5 h-5 text-emerald-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-foreground">Performance Summary</h3>
                                            <p className="text-xs text-muted-foreground">Based on current stats</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Metric 1: Avg Views per Chapter */}
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground flex items-center gap-2"><Eye className="w-4 h-4" /> Avg. Views / Chapter</span>
                                                <span className="font-bold text-foreground">
                                                    {novel.total_chapters > 0
                                                        ? formatNumber(Math.round((novel.total_views || 0) / novel.total_chapters))
                                                        : '0'}
                                                </span>
                                            </div>
                                            {(() => {
                                                const avgViews = novel.total_chapters > 0 ? Math.round((novel.total_views || 0) / novel.total_chapters) : 0;
                                                const stats = getProgressStats(avgViews);
                                                return (
                                                    <div className="space-y-1">
                                                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                                            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${stats.percent}%` }} />
                                                        </div>
                                                        <div className="flex justify-end">
                                                            <span className="text-[10px] text-muted-foreground">Next: {formatNumber(stats.target)}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        {/* Metric 2: Engagement Rate */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground flex items-center gap-2"><ThumbsUp className="w-4 h-4" /> Engagement Rate</span>
                                                <span className="font-bold text-foreground">
                                                    {(novel.total_views || 0) > 0
                                                        ? `${((novel.total_votes || 0) / novel.total_views * 100).toFixed(2)}%`
                                                        : '0%'}
                                                </span>
                                            </div>
                                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                                <div className="h-full bg-amber-500" style={{ width: `${Math.min(((novel.total_votes || 0) / (novel.total_views || 1) * 100) * 5, 100)}%` }} />
                                            </div>
                                        </div>

                                        {/* Metric 3: Total Reviews */}
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Total Reviews</span>
                                                <span className="font-bold text-foreground">{formatNumber(novel.total_reviews || 0)}</span>
                                            </div>
                                            {(() => {
                                                const stats = getProgressStats(novel.total_reviews || 0);
                                                return (
                                                    <div className="space-y-1">
                                                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                                            <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${stats.percent}%` }} />
                                                        </div>
                                                        <div className="flex justify-end">
                                                            <span className="text-[10px] text-muted-foreground">Next: {formatNumber(stats.target)}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        {/* Metric 4: Library Adds (Bookmarks) */}
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground flex items-center gap-2"><Bookmark className="w-4 h-4" /> Library Adds</span>
                                                <span className="font-bold text-foreground">{formatNumber(totalBookmarks)}</span>
                                            </div>
                                            {(() => {
                                                const stats = getProgressStats(totalBookmarks);
                                                return (
                                                    <div className="space-y-1">
                                                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                                            <div className="h-full bg-sky-500 transition-all duration-500" style={{ width: `${stats.percent}%` }} />
                                                        </div>
                                                        <div className="flex justify-end">
                                                            <span className="text-[10px] text-muted-foreground">Next: {formatNumber(stats.target)}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    {/* Link to Analytics Removed */}
                                </div>

                                {/* Tips Card */}
                                <div className="bg-sky-500/5 border border-sky-500/20 rounded-xl p-5">
                                    <h4 className="text-sm font-bold text-sky-600 dark:text-sky-400 mb-2">Boost your visibility</h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Consistent updates help you reach more readers. Try publishing at least 2 chapters a week to maintain engagement.
                                    </p>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* Chapters Tab */}
                    {activeTab === 'chapters' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl">
                            {/* Search & Actions */}
                            <div className="flex gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Search chapters..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-foreground placeholder:text-muted-foreground transition-all"
                                    />
                                </div>
                                <button
                                    onClick={() => navigate(`/novel/${novel.id}/create-chapter`)}
                                    className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-bold whitespace-nowrap transition-colors shadow-lg shadow-sky-500/20"
                                >
                                    + New Chapter
                                </button>
                            </div>

                            {/* Sort Options */}
                            <div className="flex gap-2 pb-2">
                                {(['newest', 'oldest', 'most-views'] as const).map(sort => (
                                    <button
                                        key={sort}
                                        onClick={() => setSortBy(sort)}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${sortBy === sort
                                            ? 'bg-sky-500 text-white'
                                            : 'bg-card border border-border text-muted-foreground hover:bg-secondary'
                                            }`}
                                    >
                                        {sort === 'newest' ? 'Newest' : sort === 'oldest' ? 'Oldest' : 'Most Views'}
                                    </button>
                                ))}
                            </div>

                            {/* Chapter List */}
                            <div className="space-y-3">
                                {getFilteredChapters().map(chapter => (
                                    <div
                                        key={chapter.id}
                                        onClick={() => navigate(`/novel/${novel.id}/chapter/${chapter.id}`)}
                                        className={`flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-md hover:border-sky-500/30 transition-all cursor-pointer group ${chapter.is_locked ? 'opacity-75 hover:opacity-100' : ''}`}
                                    >
                                        <div className="h-12 w-12 rounded-xl bg-sky-500 text-white flex items-center justify-center text-base font-bold shrink-0 shadow-lg shadow-sky-500/20 dark:shadow-none">
                                            {chapter.chapter_number}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <div className="text-base font-bold truncate group-hover:text-sky-500 transition-colors text-foreground">
                                                    {chapter.title}
                                                </div>
                                                {chapter.is_locked && <Lock className="w-3.5 h-3.5 text-amber-500" />}
                                            </div>

                                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                                <span>{formatNumber(chapter.views || 0)} views</span>
                                                <span>•</span>
                                                <span>{new Date(chapter.published_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        {/* Actions (Edit/Delete) - Replaces Chevron */}
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/novel/${novel.id}/chapter/${chapter.id}/edit`);
                                                }}
                                                className="p-2.5 text-muted-foreground hover:text-sky-500 hover:bg-sky-500/10 rounded-lg transition-colors"
                                                title="Edit Chapter"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    // Handle delete TODO - using confirm for now
                                                    if (await confirm('Are you sure you want to delete this chapter?', { variant: 'destructive', title: 'Delete Chapter' })) {
                                                        // Call delete
                                                        toast.info("Chapter deletion not implemented yet");
                                                    }
                                                }}
                                                className="p-2.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Delete Chapter"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {getFilteredChapters().length === 0 && (
                                    <div className="py-20 text-center text-muted-foreground bg-secondary/20 rounded-2xl border border-dashed border-border">
                                        <div className="flex justify-center mb-4">
                                            <FileText className="w-12 h-12 opacity-20" />
                                        </div>
                                        <p className="text-base font-medium">No chapters found.</p>
                                        <p className="text-sm opacity-60 mt-1">Get started by creating your first chapter.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Reviews Tab */}
                    {activeTab === 'reviews' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl">
                            {/* Rating Overview */}
                            <div className="rounded-2xl border border-border p-6 shadow-sm bg-card flex flex-col md:flex-row items-center gap-8">
                                <div className="text-center min-w-[120px]">
                                    <div className="text-5xl font-black text-foreground">{averageRating}</div>
                                    <div className="flex justify-center my-2 gap-1">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <Star key={s} size={16} className="fill-amber-400 text-amber-400" />
                                        ))}
                                    </div>
                                    <div className="text-sm text-muted-foreground">{reviews.length.toLocaleString()} ratings</div>
                                </div>
                                <div className="flex-1 w-full space-y-2">
                                    {[5, 4, 3, 2, 1].map(star => (
                                        <RatingBar key={star} star={star} count={ratingStats[star]} total={reviews.length} />
                                    ))}
                                </div>
                            </div>

                            {/* Filter Pills */}
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2" style={{ scrollbarWidth: 'none' }}>
                                {['all', 5, 4, 3, 2, 1].map(filter => (
                                    <button
                                        key={filter}
                                        onClick={() => setReviewFilter(filter as any)}
                                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${reviewFilter === filter
                                            ? 'bg-sky-500 text-white border-sky-500'
                                            : 'bg-card border-border text-foreground hover:bg-secondary'
                                            }`}
                                    >
                                        {filter === 'all' ? 'All' : `${filter}★`}
                                    </button>
                                ))}
                            </div>

                            {/* Reviews List */}
                            {isLoading ? (
                                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-sky-500" /></div>
                            ) : filteredReviews.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground bg-secondary/30 rounded-2xl border border-dashed border-border">
                                    <div className="text-sm">No reviews matching filter.</div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredReviews.map((review: any) => {
                                        const isOwn = user?.id === review.user_id;

                                        return (
                                            <div key={review.id} className={`p-6 rounded-2xl border ${isOwn ? 'border-sky-500/30 bg-sky-500/5' : 'border-border bg-card'}`}>
                                                <div className="flex gap-4">
                                                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-secondary">
                                                        <img src={getUserProfileImage(review.user || review.profiles)} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between">
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-bold text-foreground">{getUserDisplayName(review.user || review.profiles)}</span>
                                                                    {isOwn && <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-white text-sky-500 border border-sky-500 tracking-wider dark:bg-transparent">You</span>}
                                                                </div>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <div className="flex gap-0.5">
                                                                        {[1, 2, 3, 4, 5].map(n => (
                                                                            <Star key={n} size={12} className={n <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'} />
                                                                        ))}
                                                                    </div>
                                                                    <span className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</span>
                                                                </div>
                                                            </div>

                                                            {/* 3-Dot Menu */}
                                                            <div className="relative">
                                                                <button
                                                                    onClick={() => setActiveMenu(activeMenu === review.id ? null : review.id)}
                                                                    className="p-1 hover:bg-secondary rounded transition-colors text-muted-foreground hover:text-foreground"
                                                                >
                                                                    <MoreVertical size={16} />
                                                                </button>
                                                                {activeMenu === review.id && (
                                                                    <>
                                                                        <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                                                                        <div className="absolute right-0 top-full mt-1 w-32 bg-card border border-border rounded-lg shadow-xl py-1 z-50">
                                                                            <button onClick={() => handleDeleteReview(review.id)} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-500/10">
                                                                                <Trash2 size={12} /> Delete
                                                                            </button>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <p className="mt-3 text-sm text-foreground leading-relaxed">
                                                            {review.review_text}
                                                        </p>

                                                        {/* Reactions */}
                                                        <div className="flex items-center gap-4 mt-4">
                                                            <button
                                                                onClick={() => handleVote(review.id, 'like')}
                                                                className={`flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-sky-500 ${review.user_has_liked ? 'text-sky-500' : 'text-muted-foreground'}`}
                                                            >
                                                                <ThumbsUp size={14} className={review.user_has_liked ? 'fill-current' : ''} />
                                                                {(review.likes > 0 || review.user_has_liked) && <span>{review.likes}</span>}
                                                            </button>
                                                            <button
                                                                onClick={() => handleVote(review.id, 'dislike')}
                                                                className={`flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-red-500 ${review.user_has_disliked ? 'text-red-500' : 'text-muted-foreground'}`}
                                                            >
                                                                <ThumbsDown size={14} className={review.user_has_disliked ? 'fill-current' : ''} />
                                                                {(review.dislikes > 0 || review.user_has_disliked) && <span>{review.dislikes}</span>}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )
                            }
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Modal */}
            {
                showDeleteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5">
                        <div className="bg-card border border-border rounded-2xl max-w-xs w-full p-6 shadow-2xl">
                            <h3 className="text-lg font-bold text-foreground mb-3">Delete Novel?</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                                Are you sure you want to delete "{novel.title}"? This will permanently remove all chapters, reviews, and analytics. This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    disabled={isDeleting}
                                    className="flex-1 h-12 bg-secondary text-secondary-foreground font-semibold rounded-xl text-sm hover:bg-secondary/80 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteNovel}
                                    disabled={isDeleting}
                                    className="flex-1 h-12 bg-red-500 text-white font-semibold rounded-xl text-sm flex items-center justify-center hover:bg-red-600 transition-colors"
                                >
                                    {isDeleting ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        'Delete'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
}
