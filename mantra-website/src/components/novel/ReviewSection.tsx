'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Star, ThumbsUp, ThumbsDown, MoreVertical, Flag, Trash2, Edit3, X, Loader2, PenLine } from 'lucide-react';
import reviewService, { ReviewWithUser } from '@/lib/services/reviewService';
import { getUserDisplayName, getUserProfileImage } from '@/lib/utils/profileUtils';
import type { User } from '@supabase/supabase-js';

interface ReviewSectionProps {
    novelId: string;
    currentUser: User | null;
    initialReviews?: ReviewWithUser[];
}

export default function ReviewSection({ novelId, currentUser, initialReviews = [] }: ReviewSectionProps) {
    const router = useRouter();
    const [reviews, setReviews] = useState<ReviewWithUser[]>(initialReviews);
    const [isLoading, setIsLoading] = useState(initialReviews.length === 0);
    const [showWriteModal, setShowWriteModal] = useState(false);
    const [editingReview, setEditingReview] = useState<ReviewWithUser | null>(null);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    // Form state
    const [rating, setRating] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // User's existing review
    const [userReview, setUserReview] = useState<ReviewWithUser | null>(null);

    useEffect(() => {
        if (initialReviews.length === 0) {
            fetchReviews();
        }
        if (currentUser) {
            checkUserReview();
        }
    }, [novelId, currentUser]);

    const fetchReviews = async () => {
        setIsLoading(true);
        const data = await reviewService.getNovelReviews(novelId, currentUser?.id || null);
        setReviews(data);
        setIsLoading(false);
    };

    const checkUserReview = async () => {
        if (!currentUser) return;
        const review = await reviewService.getUserReview(currentUser.id, novelId);
        setUserReview(review);
    };

    const handleSubmitReview = async () => {
        if (!currentUser || rating < 1) return;
        setIsSubmitting(true);

        if (editingReview) {
            // Update existing review
            const result = await reviewService.updateReview(editingReview.id, {
                rating,
                review_text: reviewText.trim() || undefined,
            });
            if (result.success) {
                setReviews(prev => prev.map(r => r.id === editingReview.id ? { ...r, rating, review_text: reviewText.trim() } : r));
                setEditingReview(null);
                setShowWriteModal(false);
            }
        } else {
            // Create new review
            const result = await reviewService.createReview(currentUser.id, {
                novel_id: novelId,
                rating,
                review_text: reviewText.trim() || undefined,
            });
            if (result.success && result.review) {
                setReviews(prev => [result.review, ...prev]);
                setUserReview(result.review);
                setShowWriteModal(false);
            } else {
                alert(result.message);
            }
        }

        setRating(5);
        setReviewText('');
        setIsSubmitting(false);
    };

    const handleDelete = async (reviewId: string) => {
        if (!confirm('Delete this review?')) return;

        const result = await reviewService.deleteReview(reviewId);
        if (result.success) {
            setReviews(prev => prev.filter(r => r.id !== reviewId));
            if (userReview?.id === reviewId) {
                setUserReview(null);
            }
        }
    };

    const handleReaction = async (reviewId: string, type: 'like' | 'dislike') => {
        if (!currentUser) {
            router.push('/login');
            return;
        }

        // Optimistic update
        setReviews(prev => prev.map(r => {
            if (r.id !== reviewId) return r;
            const wasLiked = r.user_has_liked;
            const wasDisliked = r.user_has_disliked;

            if (type === 'like') {
                return {
                    ...r,
                    user_has_liked: !wasLiked,
                    user_has_disliked: false,
                    likes: wasLiked ? r.likes - 1 : r.likes + 1,
                    dislikes: wasDisliked ? r.dislikes - 1 : r.dislikes,
                };
            } else {
                return {
                    ...r,
                    user_has_disliked: !wasDisliked,
                    user_has_liked: false,
                    dislikes: wasDisliked ? r.dislikes - 1 : r.dislikes + 1,
                    likes: wasLiked ? r.likes - 1 : r.likes,
                };
            }
        }));

        await reviewService.reactToReview(currentUser.id, reviewId, type);
    };

    const openEditModal = (review: ReviewWithUser) => {
        setEditingReview(review);
        setRating(review.rating);
        setReviewText(review.review_text || '');
        setShowWriteModal(true);
        setActiveMenu(null);
    };

    const getDisplayName = (user: ReviewWithUser['user']) => {
        return getUserDisplayName(user);
    };

    const getAvatarUrl = (user: ReviewWithUser['user']) => {
        return getUserProfileImage(user);
    };

    const StarRating = ({ value, onChange, size = 'md' }: { value: number; onChange?: (v: number) => void; size?: 'sm' | 'md' }) => {
        const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                    <button
                        key={n}
                        type="button"
                        onClick={() => onChange?.(n)}
                        disabled={!onChange}
                        className={`${onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
                    >
                        <Star className={`${sizeClass} ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                    </button>
                ))}
            </div>
        );
    };

    const ReviewCard = ({ review }: { review: ReviewWithUser }) => {
        const isOwn = currentUser?.id === review.user_id;
        const isMenuOpen = activeMenu === review.id;

        return (
            <div className="group rounded-2xl border border-slate-100 p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                        <img src={getAvatarUrl(review.user)} alt="" className="w-full h-full object-cover" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-semibold text-slate-800">{getDisplayName(review.user)}</span>
                                    {isOwn && (
                                        <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-600 rounded">You</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <StarRating value={review.rating} size="sm" />
                                    <span className="text-xs text-slate-400">{new Date(review.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* 3-dot Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setActiveMenu(isMenuOpen ? null : review.id)}
                                    className="p-1 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <MoreVertical className="w-4 h-4" />
                                </button>

                                {isMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                                        <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-xl border border-slate-100 py-1 z-50 text-sm">
                                            {isOwn ? (
                                                <>
                                                    <button
                                                        onClick={() => openEditModal(review)}
                                                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-slate-700"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5" /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => { handleDelete(review.id); setActiveMenu(null); }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-600"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => { alert('Report submitted'); setActiveMenu(null); }}
                                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-600"
                                                >
                                                    <Flag className="w-3.5 h-3.5" /> Report
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Review Text */}
                        {review.review_text && (
                            <p className="text-sm text-slate-700 mt-2 leading-relaxed">{review.review_text}</p>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-4 mt-3">
                            <button
                                onClick={() => handleReaction(review.id, 'like')}
                                className={`flex items-center gap-1.5 text-xs transition-colors ${review.user_has_liked ? 'text-sky-600 font-semibold' : 'text-slate-500 hover:text-sky-600'}`}
                            >
                                <ThumbsUp className="w-3.5 h-3.5" fill={review.user_has_liked ? 'currentColor' : 'none'} /> <span>Helpful ({review.likes || 0})</span>
                            </button>
                            <button
                                onClick={() => handleReaction(review.id, 'dislike')}
                                className={`flex items-center gap-1.5 text-xs transition-colors ${review.user_has_disliked ? 'text-red-500 font-semibold' : 'text-slate-500 hover:text-red-500'}`}
                            >
                                <ThumbsDown className="w-3.5 h-3.5" fill={review.user_has_disliked ? 'currentColor' : 'none'} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Header with Write Button */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-800">
                    Reviews <span className="text-slate-400 font-normal">({reviews.length})</span>
                </h3>
                {currentUser && !userReview && (
                    <button
                        onClick={() => setShowWriteModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 transition-colors shadow-sm"
                    >
                        <PenLine className="w-3.5 h-3.5" /> Write Review
                    </button>
                )}
            </div>

            {/* Reviews List */}
            {isLoading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                </div>
            ) : reviews.length > 0 ? (
                <div className="space-y-3">
                    {reviews.map(review => (
                        <ReviewCard key={review.id} review={review} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-sm text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No reviews yet. {currentUser ? 'Be the first to review!' : <Link href="/login" className="text-amber-600 font-semibold hover:underline">Log in</Link>}
                </div>
            )}

            {/* Write/Edit Review Modal */}
            {showWriteModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowWriteModal(false); setEditingReview(null); }}>
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-900">{editingReview ? 'Edit Review' : 'Write a Review'}</h3>
                            <button onClick={() => { setShowWriteModal(false); setEditingReview(null); }} className="p-1 text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Rating */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Your Rating</label>
                            <StarRating value={rating} onChange={setRating} />
                        </div>

                        {/* Text */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Your Review (optional)</label>
                            <textarea
                                value={reviewText}
                                onChange={e => setReviewText(e.target.value)}
                                placeholder="Share your thoughts about this novel..."
                                className="w-full border border-slate-200 rounded-xl p-3 text-sm min-h-[120px] outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-y"
                            />
                        </div>

                        {/* Submit */}
                        <button
                            onClick={handleSubmitReview}
                            disabled={rating < 1 || isSubmitting}
                            className="w-full py-3 bg-amber-500 text-white rounded-xl font-bold disabled:opacity-50 hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            {editingReview ? 'Update Review' : 'Submit Review'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
