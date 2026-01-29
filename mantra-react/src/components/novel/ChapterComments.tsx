import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, MessageCircle, Send, MoreVertical, Flag, Trash2, Edit3, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import commentService from '@/lib/services/commentService';
import type { CommentWithUser } from '@/lib/services/commentService';
import { getUserDisplayName, getUserProfileImage } from '@/lib/utils/profileUtils';
import { formatTimeAgo } from '@/utils/dateUtils';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/contexts/DialogContext';
import reportService from '@/services/reportService';
import type { User } from '@supabase/supabase-js';

interface ChapterCommentsProps {
    chapterId: string;
    currentUser: User | null;
    theme?: 'light' | 'sepia' | 'dark';
}

// ... helper functions ...

export default function ChapterComments({ chapterId, currentUser, theme = 'light' }: ChapterCommentsProps) {
    const navigate = useNavigate();
    const { profile: currentUserProfile } = useAuth();
    const { toast } = useToast();
    const confirm = useConfirm();
    const [comments, setComments] = useState<CommentWithUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'newest' | 'most_liked'>('newest');
    const [newComment, setNewComment] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
    const [repliesData, setRepliesData] = useState<Record<string, CommentWithUser[]>>({});
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    useEffect(() => {
        fetchComments();
    }, [chapterId, sortBy]);

    const fetchComments = async () => {
        setIsLoading(true);
        const data = await commentService.getChapterComments(chapterId, currentUser?.id || null, 1, 50, sortBy);
        setComments(data);
        setIsLoading(false);
    };

    const handlePostComment = async () => {
        if (!newComment.trim() || !currentUser) return;
        setIsPosting(true);

        const result = await commentService.createComment(currentUser.id, {
            chapter_id: chapterId,
            comment_text: newComment.trim(),
        });

        if (result.success && result.comment) {
            setComments(prev => [result.comment, ...prev]);
            setNewComment('');
        }
        setIsPosting(false);
    };

    const handlePostReply = async (parentId: string) => {
        if (!replyText.trim() || !currentUser) return;

        const result = await commentService.createComment(currentUser.id, {
            chapter_id: chapterId,
            comment_text: replyText.trim(),
            parent_comment_id: parentId,
        });

        if (result.success && result.comment) {
            // Add to replies
            setRepliesData(prev => ({
                ...prev,
                [parentId]: [...(prev[parentId] || []), result.comment],
            }));
            // Expand replies
            setExpandedReplies(prev => new Set([...prev, parentId]));
            setReplyText('');
            setReplyingTo(null);
        }
    };

    const handleEdit = async (commentId: string) => {
        if (!editText.trim()) return;

        const result = await commentService.updateComment(commentId, editText.trim());
        if (result.success) {
            setComments(prev => prev.map(c => c.id === commentId ? { ...c, comment_text: editText.trim() } : c));
            setEditingId(null);
            setEditText('');
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!await confirm('Delete this comment?', { variant: 'destructive', title: 'Delete Comment' })) return;

        const result = await commentService.deleteComment(commentId);
        if (result.success) {
            setComments(prev => prev.filter(c => c.id !== commentId));
        }
    };

    const handleReport = async (commentId: string) => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        if (!await confirm('Are you sure you want to report this comment?', { title: 'Report Comment', variant: 'destructive', confirmText: 'Report' })) {
            return;
        }

        const result = await reportService.quickReport(currentUser.id, 'comment', commentId);
        if (result.success) {
            toast.success('Comment reported. Thank you for your feedback.');
            setActiveMenu(null);
        } else {
            toast.error(result.message || 'Failed to report comment');
        }
    };

    const handleReaction = async (commentId: string, type: 'like' | 'dislike') => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        // Optimistic update
        setComments(prev => prev.map(c => {
            if (c.id !== commentId) return c;
            const wasLiked = c.user_has_liked;
            const wasDisliked = c.user_has_disliked;

            if (type === 'like') {
                return {
                    ...c,
                    user_has_liked: !wasLiked,
                    user_has_disliked: false,
                    likes: wasLiked ? c.likes - 1 : c.likes + 1,
                    dislikes: wasDisliked ? c.dislikes - 1 : c.dislikes,
                };
            } else {
                return {
                    ...c,
                    user_has_disliked: !wasDisliked,
                    user_has_liked: false,
                    dislikes: wasDisliked ? c.dislikes - 1 : c.dislikes + 1,
                    likes: wasLiked ? c.likes - 1 : c.likes,
                };
            }
        }));

        await commentService.reactToComment(currentUser.id, commentId, type);
    };

    const toggleReplies = async (commentId: string) => {
        if (expandedReplies.has(commentId)) {
            setExpandedReplies(prev => {
                const next = new Set(prev);
                next.delete(commentId);
                return next;
            });
        } else {
            // Fetch replies if not already loaded
            if (!repliesData[commentId]) {
                const replies = await commentService.getCommentReplies(commentId, currentUser?.id || null);
                setRepliesData(prev => ({ ...prev, [commentId]: replies }));
            }
            setExpandedReplies(prev => new Set([...prev, commentId]));
        }
    };

    const getDisplayName = (user: CommentWithUser['user']) => {
        return getUserDisplayName(user);
    };

    const getAvatarUrl = (user: CommentWithUser['user']) => {
        return getUserProfileImage(user);
    };

    const CommentCard = ({ comment, isReply = false }: { comment: CommentWithUser; isReply?: boolean }) => {
        const isOwn = currentUser?.id === comment.user_id;
        const isMenuOpen = activeMenu === comment.id;

        return (
            <div className={`group ${isReply ? `ml-10 mt-3 pl-4 border-l-2 ${theme === 'dark' ? 'border-gray-700' : theme === 'sepia' ? 'border-[#e6dec1]' : 'border-slate-100'}` : `py-4 border-b ${theme === 'dark' ? 'border-gray-800' : theme === 'sepia' ? 'border-[#e6dec1]' : 'border-slate-50'} last:border-0`}`}>
                <div className="flex gap-3">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                        <img src={getAvatarUrl(comment.user)} alt="" className="w-full h-full object-cover" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-200' : theme === 'sepia' ? 'text-[#5b4636]' : 'text-slate-800'}`}>{getDisplayName(comment.user)}</span>
                                {isOwn && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-white text-sky-500 border border-sky-500 rounded dark:bg-transparent">You</span>
                                )}
                                <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : theme === 'sepia' ? 'text-[#8b7355]' : 'text-slate-400'}`}>{formatTimeAgo(comment.created_at)}</span>
                            </div>

                            {/* 3-dot Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setActiveMenu(isMenuOpen ? null : comment.id)}
                                    className="p-1 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <MoreVertical className="w-4 h-4" />
                                </button>

                                {isMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                                        <div className={`absolute right-0 top-full mt-1 w-36 rounded-lg shadow-xl border py-1 z-50 text-sm ${theme === 'dark' ? 'bg-[#1a1a1a] border-gray-700' : theme === 'sepia' ? 'bg-[#f6f1d1] border-[#e6dec1]' : 'bg-white border-slate-100'}`}>
                                            {isOwn ? (
                                                <>
                                                    <button
                                                        onClick={() => { setEditingId(comment.id); setEditText(comment.comment_text); setActiveMenu(null); }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-slate-700"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5" /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => { handleDelete(comment.id); setActiveMenu(null); }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-600"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => handleReport(comment.id)}
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

                        {/* Text or Edit Input */}
                        {editingId === comment.id ? (
                            <div className="mt-2 flex gap-2">
                                <input
                                    autoFocus
                                    value={editText}
                                    onChange={e => setEditText(e.target.value)}
                                    className={`flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-100' : theme === 'sepia' ? 'bg-[#f6f1d1] border-[#e6dec1] text-[#5b4636]' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                />
                                <button onClick={() => handleEdit(comment.id)} className="px-3 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium">Save</button>
                                <button onClick={() => setEditingId(null)} className={`px-3 py-2 rounded-lg text-sm font-medium ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : theme === 'sepia' ? 'bg-[#e6dec1] text-[#5b4636]' : 'bg-slate-100 text-slate-600'}`}>Cancel</button>
                            </div>
                        ) : (
                            <p className={`text-sm mt-1 leading-relaxed ${theme === 'dark' ? 'text-gray-300' : theme === 'sepia' ? 'text-[#5b4636]' : 'text-slate-700'}`}>{comment.comment_text}</p>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-4 mt-2">
                            <button
                                onClick={() => handleReaction(comment.id, 'like')}
                                className={`flex items-center gap-1.5 text-xs transition-colors ${comment.user_has_liked ? 'text-sky-600 font-semibold' : 'text-slate-500 hover:text-sky-600'}`}
                            >
                                <ThumbsUp className="w-3.5 h-3.5" fill={comment.user_has_liked ? 'currentColor' : 'none'} /> <span>{comment.likes || 0}</span>
                            </button>
                            <button
                                onClick={() => handleReaction(comment.id, 'dislike')}
                                className={`flex items-center gap-1.5 text-xs transition-colors ${comment.user_has_disliked ? 'text-red-500 font-semibold' : 'text-slate-500 hover:text-red-500'}`}
                            >
                                <ThumbsDown className="w-3.5 h-3.5" fill={comment.user_has_disliked ? 'currentColor' : 'none'} />
                            </button>
                            {!isReply && (
                                <button
                                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                    className={`flex items-center gap-1.5 text-xs transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-sky-400' : theme === 'sepia' ? 'text-[#8b7355] hover:text-[#5b4636]' : 'text-slate-500 hover:text-sky-600'}`}
                                >
                                    <MessageCircle className="w-3.5 h-3.5" /> Reply
                                </button>
                            )}
                            {!isReply && (comment.reply_count > 0 || (repliesData[comment.id]?.length || 0) > 0) && (
                                <button
                                    onClick={() => toggleReplies(comment.id)}
                                    className={`flex items-center gap-1 text-xs font-medium ${theme === 'dark' ? 'text-sky-400 hover:text-sky-300' : theme === 'sepia' ? 'text-[#5b4636] hover:text-[#423328]' : 'text-sky-600 hover:text-sky-700'}`}
                                >
                                    {expandedReplies.has(comment.id) ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    {repliesData[comment.id]?.length || comment.reply_count || 0} {(repliesData[comment.id]?.length || comment.reply_count || 0) === 1 ? 'reply' : 'replies'}
                                </button>
                            )}
                        </div>

                        {/* Reply Input */}
                        {replyingTo === comment.id && (
                            <div className="mt-3 flex gap-2 animate-in fade-in slide-in-from-top-1">
                                <input
                                    autoFocus
                                    placeholder={`Reply to ${getDisplayName(comment.user)}...`}
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handlePostReply(comment.id)}
                                    className={`flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500' : theme === 'sepia' ? 'bg-[#f6f1d1] border-[#e6dec1] text-[#5b4636] placeholder:text-[#8b7355]' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                />
                                <button
                                    onClick={() => handlePostReply(comment.id)}
                                    disabled={!replyText.trim()}
                                    className="p-2 bg-sky-500 text-white rounded-lg disabled:opacity-50 hover:bg-sky-600 transition-colors"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* Replies */}
                        {expandedReplies.has(comment.id) && repliesData[comment.id]?.map(reply => (
                            <CommentCard key={reply.id} comment={reply} isReply />
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={`mt-8 pt-6 border-t ${theme === 'dark' ? 'border-gray-800' : theme === 'sepia' ? 'border-[#e6dec1]' : 'border-slate-100'}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-gray-100' : theme === 'sepia' ? 'text-[#5b4636]' : 'text-slate-900'}`}>
                    Comments <span className={`font-normal text-sm ${theme === 'dark' ? 'text-gray-500' : theme === 'sepia' ? 'text-[#8b7355]' : 'text-slate-400'}`}>({comments.length})</span>
                </h3>
                <div className={`flex gap-1 rounded-lg p-0.5 ${theme === 'dark' ? 'bg-gray-800' : theme === 'sepia' ? 'bg-[#e6dec1]' : 'bg-slate-100'}`}>
                    <button
                        onClick={() => setSortBy('newest')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${sortBy === 'newest' ? (theme === 'dark' ? 'bg-gray-700 shadow-sm text-white' : theme === 'sepia' ? 'bg-[#f6f1d1] shadow-sm text-[#5b4636]' : 'bg-white shadow-sm text-slate-900') : (theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : theme === 'sepia' ? 'text-[#8b7355] hover:text-[#5b4636]' : 'text-slate-600 hover:text-slate-900')}`}
                    >
                        Newest
                    </button>
                    <button
                        onClick={() => setSortBy('most_liked')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${sortBy === 'most_liked' ? (theme === 'dark' ? 'bg-gray-700 shadow-sm text-white' : theme === 'sepia' ? 'bg-[#f6f1d1] shadow-sm text-[#5b4636]' : 'bg-white shadow-sm text-slate-900') : (theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : theme === 'sepia' ? 'text-[#8b7355] hover:text-[#5b4636]' : 'text-slate-600 hover:text-slate-900')}`}
                    >
                        Most Liked
                    </button>
                </div>
            </div>

            {/* Post Box */}
            {currentUser ? (
                <div className="flex gap-3 mb-6">
                    <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                        <img
                            src={getUserProfileImage(currentUserProfile)}
                            alt="You"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex-1">
                        <textarea
                            placeholder="Share your thoughts on this chapter..."
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            className={`w-full border rounded-xl p-3 text-sm min-h-[80px] outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all resize-y ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500' : theme === 'sepia' ? 'bg-[#f6f1d1] border-[#e6dec1] text-[#5b4636] placeholder:text-[#8b7355]' : 'bg-white border-slate-200 text-slate-900'}`}
                        />
                        <div className="flex justify-end mt-2">
                            <button
                                onClick={handlePostComment}
                                disabled={!newComment.trim() || isPosting}
                                className="px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-sky-600 transition-colors shadow-sm flex items-center gap-2"
                            >
                                {isPosting && <Loader2 className="w-4 h-4 animate-spin" />}
                                Post Comment
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className={`rounded-xl p-6 text-center mb-6 border border-dashed ${theme === 'dark' ? 'bg-gray-800/50 text-gray-400 border-gray-700' : theme === 'sepia' ? 'bg-[#e6dec1] text-[#8b7355] border-[#d5c9a8]' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                    <Link to="/login" className="text-sky-600 font-semibold hover:underline">Log in</Link> to join the discussion.
                </div>
            )}

            {/* Comments List */}
            {isLoading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 text-sky-500 animate-spin" />
                </div>
            ) : comments.length > 0 ? (
                <div>
                    {comments.map(comment => (
                        <CommentCard key={comment.id} comment={comment} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-slate-400">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No comments yet. Be the first to share your thoughts!</p>
                </div>
            )}
        </div>
    );
}
