

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ThumbsUp, ThumbsDown, MoreVertical, Flag, Trash2, Edit3, Loader2 } from 'lucide-react';
import reviewService, { type ReviewWithUser } from '@/lib/services/reviewService';
import { getUserDisplayName, getUserProfileImage } from '@/lib/utils/profileUtils';
import type { User } from '@supabase/supabase-js';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/contexts/DialogContext';
import reportService from '@/services/reportService';

interface ReviewSectionProps {
    novelId: string;
    currentUser: User | null;
    initialReviews?: ReviewWithUser[];
}

export default function ReviewSection({ novelId, currentUser, initialReviews = [] }: ReviewSectionProps) {
    const navigate = useNavigate();
    const { toast } = useToast();
    const confirm = useConfirm();
    const [reviews, setReviews] = useState<ReviewWithUser[]>(initialReviews);
    const [isLoading, setIsLoading] = useState(initialReviews.length === 0);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    // Filter State
    const [reviewFilter, setReviewFilter] = useState<'all' | number>('all');

    // Inline Write/Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userReview, setUserReview] = useState<ReviewWithUser | null>(null);

    const { profile: currentUserProfile } = useAuth();



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
        if (reviews.length === 0) return 0;
        const total = reviews.reduce((acc, r) => acc + r.rating, 0);
        return (total / reviews.length).toFixed(1);
    }, [reviews]);

    useEffect(() => {
        if (initialReviews.length === 0) fetchReviews();
        if (currentUser) checkUserReview();
    }, [novelId, currentUser]);

    const fetchReviews = async () => {
        setIsLoading(true);
        const data = await reviewService.getNovelReviews(novelId, currentUser?.id || null);
        setReviews(data);
        setIsLoading(false);
    };

    // Derived state: Check if user has already reviewed from the 'reviews' list first
    // This avoids "flash" of write card while checkUserReview is running
    const existingUserReview = useMemo(() => {
        return currentUser ? reviews.find(r => r.user_id === currentUser.id) || null : null;
    }, [reviews, currentUser]);

    // specific state for the form (local edits)
    // const [userReview, setUserReview] = useState<ReviewWithUser | null>(null); -> Removed duplicate

    // Sync derived state to local state if needed, or just use derived state?
    // Using derived state is safer for UI conditions.
    // Let's rely on 'existingUserReview' for the UI condition mostly.

    useEffect(() => {
        if (existingUserReview && !userReview) {
            setUserReview(existingUserReview);
        }
    }, [existingUserReview]);

    useEffect(() => {
        if (initialReviews.length === 0) fetchReviews();
        // We still check server side just in case 'initialReviews' was empty/stale
        if (currentUser) checkUserReview();
    }, [novelId, currentUser]);

    // fetchReviews is already defined above, removing duplicate.

    const checkUserReview = async () => {
        if (!currentUser) return;
        const review = await reviewService.getUserReview(currentUser.id, novelId);
        if (review) setUserReview(review);
    };

    // Filter Logic
    const filteredReviews = reviews.filter(r =>
        reviewFilter === 'all' ? true : Math.round(r.rating) === reviewFilter
    );

    const handleSubmit = async () => {
        if (!currentUser || rating < 1) return;
        setIsSubmitting(true);

        if (isEditing && existingUserReview) {
            // Update
            const result = await reviewService.updateReview(existingUserReview.id, { rating, review_text: reviewText.trim() });
            if (result.success) {
                setReviews(prev => prev.map(r => r.id === existingUserReview.id ? { ...r, rating, review_text: reviewText.trim() } : r));
                setUserReview({ ...existingUserReview, rating, review_text: reviewText.trim() });
                setIsEditing(false);
            }
        } else {
            // Create
            const result = await reviewService.createReview(currentUser.id, { novel_id: novelId, rating, review_text: reviewText.trim() });
            if (result.success && result.review) {
                setReviews(prev => [result.review!, ...prev]);
                setUserReview(result.review);
                // Reset form
                setRating(0);
                setReviewText('');
            }
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (reviewId: string) => {
        if (!await confirm('Delete this review?', { variant: 'destructive', title: 'Delete Review' })) return;
        const result = await reviewService.deleteReview(reviewId);
        if (result.success) {
            setReviews(prev => prev.filter(r => r.id !== reviewId));
            setUserReview(null);
            setIsEditing(false);
            toast.success('Review deleted');
        } else {
            toast.error(result.message || 'Failed to delete review');
        }
    };

    const handleReport = async (reviewId: string) => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        if (!await confirm('Are you sure you want to report this review?', { title: 'Report Review', variant: 'destructive', confirmText: 'Report' })) {
            return;
        }

        const result = await reportService.quickReport(currentUser.id, 'review', reviewId);
        if (result.success) {
            toast.success('Review reported. Thank you for your feedback.');
            setActiveMenu(null);
        } else {
            toast.error(result.message || 'Failed to report review');
        }
    };

    const handleReaction = async (reviewId: string, type: 'like' | 'dislike') => {
        if (!currentUser) return navigate('/login');
        // Optimistic update
        setReviews(prev => prev.map(r => {
            if (r.id !== reviewId) return r;
            const wasLiked = r.user_has_liked;
            const wasDisliked = r.user_has_disliked;
            return type === 'like'
                ? { ...r, user_has_liked: !wasLiked, user_has_disliked: false, likes: wasLiked ? r.likes - 1 : r.likes + 1, dislikes: wasDisliked ? r.dislikes - 1 : r.dislikes }
                : { ...r, user_has_disliked: !wasDisliked, user_has_liked: false, dislikes: wasDisliked ? r.dislikes - 1 : r.dislikes + 1, likes: wasLiked ? r.likes - 1 : r.likes };
        }));
        await reviewService.reactToReview(currentUser.id, reviewId, type);
    };

    const startEditing = () => {
        if (!userReview) return;
        setRating(userReview.rating);
        setReviewText(userReview.review_text || '');
        setIsEditing(true);
        setActiveMenu(null);
    };

    // Components
    const StarRatingInput = ({ size = 20 }: { size?: number }) => (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setRating(n)} className="transition-transform hover:scale-110">
                    <Star size={size} className={n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'} />
                </button>
            ))}
        </div>
    );

    const RatingBar = ({ star, count, total }: { star: number, count: number, total: number }) => {
        const percentage = total > 0 ? (count / total) * 100 : 0;
        return (
            <div className="flex items-center gap-3 text-xs">
                <span className="w-3 font-medium text-foreground">{star}★</span>
                <div className="flex-1 h-2 bg-background-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${percentage}%` }} />
                </div>
                <span className="w-8 text-right text-foreground-secondary">{Math.round(percentage)}%</span>
            </div>
        );
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6"> {/* Reduced space-y */}
            {/* 1. Rating Overview */}
            <div className="rounded-2xl border border-border p-4 shadow-sm bg-card flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
                <div className="text-center min-w-[80px]">
                    <div className="text-4xl font-black text-foreground">{averageRating}</div>
                    <div className="flex justify-center my-1 gap-0.5">
                        <Star size={16} className="fill-amber-400 text-amber-400" />
                        <Star size={16} className="fill-amber-400 text-amber-400" />
                        <Star size={16} className="fill-amber-400 text-amber-400" />
                        <Star size={16} className="fill-amber-400 text-amber-400" />
                        <Star size={16} className="fill-amber-400 text-amber-400" />
                    </div>
                    <div className="text-xs text-foreground-secondary">{reviews.length.toLocaleString()} ratings</div>
                </div>
                <div className="flex-1 w-full space-y-1.5">
                    {[5, 4, 3, 2, 1].map(star => (
                        <RatingBar key={star} star={star} count={ratingStats[star]} total={reviews.length} />
                    ))}
                </div>
            </div>


            {/* 2. Filter Pills */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2" style={{ scrollbarWidth: 'none' }}>
                {['all', 5, 4, 3, 2, 1].map(filter => (
                    <button
                        key={filter}
                        onClick={() => setReviewFilter(filter as any)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${reviewFilter === filter
                            ? 'bg-sky-500 text-white border-sky-500'
                            : 'bg-card border-border text-foreground-secondary hover:text-foreground hover:bg-background-secondary'
                            }`}
                    >
                        {filter === 'all' ? 'All' : `${filter}★`}
                    </button>
                ))}
            </div>

            {/* 3. Inline Write/Edit Card */}
            {
                currentUser && (
                    (!existingUserReview || isEditing) ? (
                        <div className="border border-border rounded-2xl p-4 bg-card shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-background-secondary">
                                    {/* Use filteredReviews to find user's profile image if possible, or fallback */}
                                    <img
                                        src={
                                            (existingUserReview ? getUserProfileImage(existingUserReview.user) : null) ||
                                            getUserProfileImage(currentUserProfile)
                                        }
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-foreground">
                                        {
                                            (existingUserReview ? getUserDisplayName(existingUserReview.user) : null) ||
                                            getUserDisplayName(currentUserProfile)
                                        }
                                    </div>
                                    <div className="text-xs text-foreground-secondary">{isEditing ? 'Edit your review' : 'Write a review'}</div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <StarRatingInput size={24} />
                            </div>

                            <textarea
                                value={reviewText}
                                onChange={e => setReviewText(e.target.value)}
                                placeholder="Share your thoughts..."
                                className="w-full bg-card border border-border rounded-xl p-3 text-sm min-h-[100px] outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 mb-3 resize-none"
                            />

                            <div className="flex items-center justify-between">
                                <span className="text-xs text-foreground-secondary italic">Be respectful and constructive.</span>
                                <div className="flex gap-2">
                                    {isEditing && (
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="px-4 py-2 rounded-lg text-xs font-bold text-foreground hover:bg-background-secondary"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                    <button
                                        onClick={handleSubmit}
                                        disabled={rating < 1 || isSubmitting}
                                        className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold disabled:opacity-50 transition-colors flex items-center gap-2"
                                    >
                                        {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                                        Post
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : null
                )
            }

            {/* 4. Reviews List */}
            {
                isLoading ? (
                    <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-sky-500" /></div>
                ) : filteredReviews.length === 0 ? (
                    <div className="text-center py-12 text-foreground-secondary bg-background-secondary/30 rounded-2xl border border-dashed border-border">
                        <div className="text-sm">No reviews matching filter.</div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredReviews.map(review => {
                            const isOwn = currentUser?.id === review.user_id;

                            // Hide user's own review in the list if they are editing it (since the edit card shows above)
                            if (isOwn && isEditing) return null;

                            return (
                                <div key={review.id} className={`p-4 rounded-2xl border ${isOwn ? 'border-sky-200 dark:border-sky-800 border-[2px]' : 'border-border'} bg-card`}>
                                    <div className="flex gap-3">
                                        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-background-secondary">
                                            <img src={getUserProfileImage(review.user)} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-foreground">{getUserDisplayName(review.user)}</span>
                                                        {isOwn && <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-white text-sky-500 border border-sky-500 tracking-wider dark:bg-transparent">You</span>}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <div className="flex gap-0.5">
                                                            {[1, 2, 3, 4, 5].map(n => (
                                                                <Star key={n} size={10} className={n <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'} />
                                                            ))}
                                                        </div>
                                                        <span className="text-[10px] text-foreground-secondary">{new Date(review.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>

                                                {/* 3-Dot Menu */}
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setActiveMenu(activeMenu === review.id ? null : review.id)}
                                                        className="p-1 hover:bg-background-secondary rounded transition-colors text-foreground-secondary hover:text-foreground"
                                                    >
                                                        <MoreVertical size={16} />
                                                    </button>
                                                    {activeMenu === review.id && (
                                                        <>
                                                            <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                                                            <div className="absolute right-0 top-full mt-1 w-32 bg-card border border-border rounded-lg shadow-xl py-1 z-50">
                                                                {isOwn ? (
                                                                    <>
                                                                        <button onClick={startEditing} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-foreground hover:bg-background-secondary">
                                                                            <Edit3 size={12} /> Edit
                                                                        </button>
                                                                        <button onClick={() => handleDelete(review.id)} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                                                                            <Trash2 size={12} /> Delete
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <button onClick={() => handleReport(review.id)} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                                                                        <Flag size={12} /> Report
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <p className="mt-2 text-sm text-foreground leading-relaxed">
                                                {review.review_text}
                                            </p>

                                            <div className="flex items-center gap-4 mt-3">
                                                <button
                                                    onClick={() => handleReaction(review.id, 'like')}
                                                    className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${review.user_has_liked ? 'text-sky-500' : 'text-foreground-secondary hover:text-foreground'}`}
                                                >
                                                    <ThumbsUp size={14} className={review.user_has_liked ? 'fill-current' : ''} />
                                                    {review.likes > 0 && <span>{review.likes}</span>}
                                                </button>
                                                <button
                                                    onClick={() => handleReaction(review.id, 'dislike')}
                                                    className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${review.user_has_disliked ? 'text-red-500' : 'text-foreground-secondary hover:text-foreground'}`}
                                                >
                                                    <ThumbsDown size={14} className={review.user_has_disliked ? 'fill-current' : ''} />
                                                    {review.dislikes > 0 && <span>{review.dislikes}</span>}
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
        </div >
    );
}
