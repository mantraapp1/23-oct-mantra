import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ThumbsUp, ThumbsDown, MessageCircle, Send, MoreVertical, Flag, Trash2 } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface Comment {
    id: string;
    chapter_id: string;
    user_id: string;
    parent_comment_id: string | null;
    comment_text: string;
    likes: number;
    dislikes: number;
    created_at: string;
    user: {
        username: string;
        profile_picture_url: string | null;
    };
    replies?: Comment[];
}

interface ChapterCommentsProps {
    chapterId: string;
    currentUser: User | null;
}

export default function ChapterComments({ chapterId, currentUser }: ChapterCommentsProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        fetchComments();
    }, [chapterId]);

    const fetchComments = async () => {
        setIsLoading(true);
        // Fetch comments with user details
        const { data, error } = await supabase
            .from('comments')
            .select(`
                *,
                user:profiles!comments_user_id_fkey(username, profile_picture_url)
            `)
            .eq('chapter_id', chapterId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching comments:', error);
        } else {
            // Organize into threads (simple 1-level nesting for now)
            const threads: Comment[] = [];
            const lookup: Record<string, Comment> = {};

            // first pass: create lookup and separate root comments
            data?.forEach((c: any) => {
                const comment = { ...c, replies: [] };
                lookup[c.id] = comment;
                if (!c.parent_comment_id) {
                    threads.push(comment);
                }
            });

            // second pass: attach replies
            data?.forEach((c: any) => {
                if (c.parent_comment_id && lookup[c.parent_comment_id]) {
                    lookup[c.parent_comment_id].replies?.push(lookup[c.id]);
                }
            });

            // Sort replies by oldest first
            threads.forEach(t => {
                t.replies?.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            });

            setComments(threads);
        }
        setIsLoading(false);
    };

    const handlePostComment = async (parentId: string | null = null) => {
        if (!newComment.trim() || !currentUser) return;

        const { data, error } = await supabase
            .from('comments')
            .insert({
                chapter_id: chapterId,
                user_id: currentUser.id,
                comment_text: newComment.trim(),
                parent_comment_id: parentId
            })
            .select(`
                *,
                user:profiles!comments_user_id_fkey(username, profile_picture_url)
            `)
            .single();

        if (error) {
            alert('Failed to post comment');
            console.error(error);
        } else {
            setNewComment('');
            setReplyingTo(null);

            // Re-fetch or manually update state (simple re-fetch for now for correctness)
            fetchComments();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this comment?')) return;

        const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', id)
            .eq('user_id', currentUser?.id); // Security check

        if (error) {
            alert('Failed to delete');
        } else {
            fetchComments();
        }
    }

    const CommentItem = ({ comment, isReply = false }: { comment: Comment, isReply?: boolean }) => (
        <div className={`group ${isReply ? 'ml-10 mt-3 pl-3 border-l-2 border-slate-100' : 'border-b border-slate-50 py-4 last:border-0'}`}>
            <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                    {comment.user.profile_picture_url ? (
                        <img src={comment.user.profile_picture_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs uppercase">
                            {comment.user.username?.[0] || '?'}
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-800">{comment.user.username}</span>
                            <span className="text-xs text-slate-400">{new Date(comment.created_at).toLocaleDateString()}</span>
                        </div>
                        {currentUser?.id === comment.user_id && (
                            <button onClick={() => handleDelete(comment.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    <p className="text-sm text-slate-700 mt-1 leading-relaxed">{comment.comment_text}</p>

                    <div className="flex items-center gap-4 mt-2">
                        <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-sky-600 transition-colors">
                            <ThumbsUp className="w-3.5 h-3.5" /> <span>{comment.likes || 0}</span>
                        </button>
                        <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-500 transition-colors">
                            <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                        {!isReply && (
                            <button
                                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-sky-600 transition-colors"
                            >
                                <MessageCircle className="w-3.5 h-3.5" /> <span>Reply</span>
                            </button>
                        )}
                    </div>

                    {/* Reply Input */}
                    {replyingTo === comment.id && (
                        <div className="mt-3 flex gap-2 animate-in fade-in slide-in-from-top-1">
                            <input
                                autoFocus
                                type="text"
                                placeholder={`Reply to ${comment.user.username}...`}
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handlePostComment(comment.id)}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 transition-all"
                            />
                            <button
                                onClick={() => handlePostComment(comment.id)}
                                disabled={!newComment.trim()}
                                className="p-2 bg-sky-500 text-white rounded-lg disabled:opacity-50 hover:bg-sky-600 transition-colors"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Render Replies */}
            {comment.replies && comment.replies.map(reply => (
                <CommentItem key={reply.id} comment={reply} isReply={true} />
            ))}
        </div>
    );

    return (
        <div className="mt-12 pt-8 border-t border-slate-100 max-w-[800px] mx-auto px-5 md:px-8 pb-32">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                Comments <span className="text-slate-400 font-normal text-sm">({comments.length})</span>
            </h3>

            {/* Main Input */}
            {currentUser ? (
                <div className="flex gap-3 mb-8">
                    <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-bold text-sm">
                        You
                    </div>
                    <div className="flex-1">
                        <textarea
                            placeholder="What did you think of this chapter?"
                            value={!replyingTo ? newComment : ''}
                            onChange={(e) => {
                                setReplyingTo(null);
                                setNewComment(e.target.value);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm min-h-[80px] outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all resize-y"
                        />
                        <div className="flex justify-end mt-2">
                            <button
                                onClick={() => handlePostComment(null)}
                                disabled={!newComment.trim() || !!replyingTo}
                                className="px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-sky-600 transition-colors shadow-sm"
                            >
                                Post Comment
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-50 rounded-xl p-6 text-center text-slate-500 mb-8 border border-slate-100 border-dashed">
                    <Link href="/login" className="text-sky-600 font-semibold hover:underline">Log in</Link> to join the discussion.
                </div>
            )}

            {/* Comments List */}
            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-3 animate-pulse">
                            <div className="w-8 h-8 bg-slate-100 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-slate-100 rounded w-1/4"></div>
                                <div className="h-3 bg-slate-100 rounded w-3/4"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : comments.length > 0 ? (
                <div className="space-y-1">
                    {comments.map(comment => (
                        <CommentItem key={comment.id} comment={comment} />
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
