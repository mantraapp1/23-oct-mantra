'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageCircle, MoreHorizontal, Edit3, Trash2, Flag, Send } from 'lucide-react';

interface Comment {
    id: number;
    userId: number;
    author: string;
    avatar: string;
    badge?: string;
    time: string;
    text: string;
    likes: number;
    dislikes: number;
    timestamp: number;
    userLiked: boolean;
    userDisliked: boolean;
    replies: Reply[];
}

interface Reply {
    id: number;
    userId: number;
    author: string;
    avatar: string;
    time: string;
    text: string;
}

const MOCK_COMMENTS: Comment[] = [
    {
        id: 1,
        userId: 1,
        author: "Jenna",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100&auto=format&fit=crop",
        badge: "AUTHOR",
        time: "2h ago",
        text: "That final line gave me chills! Perfect close to the arc.",
        likes: 124,
        dislikes: 2,
        timestamp: Date.now() - 7200000,
        userLiked: false,
        userDisliked: false,
        replies: [
            {
                id: 101,
                userId: 2,
                author: "Alex",
                avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100&auto=format&fit=crop",
                time: "1h ago",
                text: "Completely agree! This chapter was perfection."
            }
        ]
    },
    {
        id: 2,
        userId: 2,
        author: "Marcus",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop",
        badge: undefined,
        time: "5h ago",
        text: "The way you built the tension was masterful. Can't wait for the next chapter!",
        likes: 89,
        dislikes: 0,
        timestamp: Date.now() - 18000000,
        userLiked: true,
        userDisliked: false,
        replies: []
    }
];

export default function ReaderComments() {
    const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);
    const [activeTab, setActiveTab] = useState<'newest' | 'mostLiked'>('newest');
    const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
    const [inputText, setInputText] = useState('');
    const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

    const currentUser = { id: 1, username: 'You', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop' };

    const toggleReplies = (id: number) => {
        const newSet = new Set(expandedReplies);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedReplies(newSet);
    };

    const sortedComments = [...comments].sort((a, b) => {
        if (activeTab === 'mostLiked') return b.likes - a.likes;
        return b.timestamp - a.timestamp;
    });

    const handleSend = () => {
        if (!inputText.trim()) return;
        const newComment: Comment = {
            id: Date.now(),
            userId: currentUser.id,
            author: currentUser.username,
            avatar: currentUser.avatar,
            time: "Just now",
            text: inputText,
            likes: 0,
            dislikes: 0,
            timestamp: Date.now(),
            userLiked: false,
            userDisliked: false,
            replies: []
        };
        setComments([newComment, ...comments]);
        setInputText('');
    };

    return (
        <div className="mt-8 pb-32">
            {/* Header / Tabs */}
            <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold text-slate-900 border-l-4 border-sky-500 pl-3">Comments</div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('newest')}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${activeTab === 'newest' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        Newest
                    </button>
                    <button
                        onClick={() => setActiveTab('mostLiked')}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${activeTab === 'mostLiked' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        Most Liked
                    </button>
                </div>
            </div>

            {/* Comments List */}
            <div className="space-y-6">
                {sortedComments.map(comment => (
                    <div key={comment.id} className="relative">
                        <div className="flex gap-3">
                            <img src={comment.avatar} className="h-9 w-9 rounded-full object-cover flex-shrink-0 border border-slate-100 shadow-sm" alt="" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="text-sm font-bold text-slate-800">{comment.author}</span>
                                    {comment.badge === 'AUTHOR' && (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 tracking-wide">AUTHOR</span>
                                    )}
                                    <span className="text-xs text-slate-400 font-medium">• {comment.time}</span>
                                </div>

                                <p className="text-sm text-slate-700 mb-3 leading-relaxed">{comment.text}</p>

                                <div className="flex items-center gap-5">
                                    <button className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${comment.userLiked ? 'text-sky-500' : 'text-slate-400 hover:text-slate-600'}`}>
                                        <ThumbsUp className={`w-4 h-4 ${comment.userLiked ? 'fill-sky-500' : ''}`} />
                                        <span>{comment.likes}</span>
                                    </button>
                                    <button className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${comment.userDisliked ? 'text-red-500' : 'text-slate-400 hover:text-slate-600'}`}>
                                        <ThumbsDown className={`w-4 h-4 ${comment.userDisliked ? 'fill-red-500' : ''}`} />
                                    </button>
                                    <button className="text-xs text-slate-500 font-bold hover:text-sky-600 transition-colors">Reply</button>

                                    <div className="ml-auto relative">
                                        <button onClick={() => setMenuOpenId(menuOpenId === comment.id ? null : comment.id)} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                                            <MoreHorizontal className="w-4 h-4 text-slate-400" />
                                        </button>
                                        {menuOpenId === comment.id && (
                                            <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-xl border border-slate-100 z-10 py-1 overflow-hidden">
                                                <button className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-600">
                                                    <Flag className="w-3.5 h-3.5" /> Report
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Replies */}
                                {comment.replies.length > 0 && (
                                    <div className="mt-3">
                                        <button
                                            onClick={() => toggleReplies(comment.id)}
                                            className="text-xs text-slate-500 font-bold hover:text-slate-800 flex items-center gap-1.5 mb-2"
                                        >
                                            <div className="w-6 h-[1px] bg-slate-200"></div>
                                            {expandedReplies.has(comment.id) ? 'Hide Replies' : `View ${comment.replies.length} Replies`}
                                        </button>

                                        {expandedReplies.has(comment.id) && (
                                            <div className="pl-4 border-l-2 border-slate-100 space-y-3 mt-2">
                                                {comment.replies.map(reply => (
                                                    <div key={reply.id} className="flex gap-2">
                                                        <img src={reply.avatar} className="h-6 w-6 rounded-full object-cover flex-shrink-0" alt="" />
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-bold text-slate-800">{reply.author}</span>
                                                                <span className="text-[10px] text-slate-400">{reply.time}</span>
                                                            </div>
                                                            <p className="text-xs text-slate-600 mt-0.5">{reply.text}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Sticky Input */}
            <div className="fixed bottom-4 left-4 right-4 max-w-7xl mx-auto z-20">
                <div className="w-full max-w-2xl mx-auto bg-white rounded-full shadow-2xl border border-slate-100 p-1.5 pl-4 flex items-center gap-2">
                    <img src={currentUser.avatar} className="w-8 h-8 rounded-full border border-slate-100" alt="You" />
                    <input
                        className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-400"
                        placeholder="Write a comment..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button
                        onClick={handleSend}
                        className="w-9 h-9 rounded-full bg-sky-500 flex items-center justify-center text-white hover:bg-sky-600 active:scale-95 transition-all shadow-md shadow-sky-200"
                    >
                        <Send className="w-4 h-4 ml-0.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
