'use client';

import Link from 'next/link';

// Mock data based on HTML
const NOTIFICATIONS = [
    {
        id: 1,
        type: 'chapter',
        title: 'New chapter released',
        description: 'Crimson Ledger - Chapter 149 is now available',
        time: '2 minutes ago',
        isRead: false,
    },
    {
        id: 2,
        type: 'follower',
        title: 'New follower',
        description: 'Alex started following you',
        time: '3 hours ago',
        isRead: false,
    },
    {
        id: 3,
        type: 'comment',
        title: 'New comment',
        description: 'Someone commented on Chapter 148',
        time: '5 hours ago',
        isRead: true,
    },
    {
        id: 4,
        type: 'like',
        title: 'Someone liked your review',
        description: 'Yi Chen liked your review on Blue Horizon',
        time: '1 hour ago',
        isRead: true,
    }
];

export default function NotificationsPage() {
    return (
        <div className="max-w-2xl mx-auto px-4 py-8 font-inter text-slate-800 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Link href="/" className="p-2 -ml-2 rounded-lg hover:bg-slate-100 active:scale-95 transition-transform text-slate-600">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </Link>
                    <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
                </div>
                <button className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:bg-sky-50 px-3 py-1.5 rounded-lg transition-colors">
                    Mark all read
                </button>
            </div>

            <div className="space-y-3">
                {NOTIFICATIONS.map((item) => (
                    <div
                        key={item.id}
                        className={`flex gap-4 p-4 rounded-2xl border transition-all ${!item.isRead
                                ? 'bg-sky-50/40 border-sky-100'
                                : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
                            }`}
                    >
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${item.type === 'chapter' ? 'bg-sky-100 text-sky-600' :
                                item.type === 'follower' ? 'bg-amber-100 text-amber-600' :
                                    item.type === 'comment' ? 'bg-indigo-100 text-indigo-600' :
                                        'bg-emerald-100 text-emerald-600'
                            }`}>
                            {item.type === 'chapter' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>}
                            {item.type === 'follower' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>}
                            {item.type === 'comment' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>}
                            {item.type === 'like' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                                <span className={`text-sm font-bold ${!item.isRead ? 'text-slate-900' : 'text-slate-700'}`}>{item.title}</span>
                                {!item.isRead && <div className="h-2 w-2 rounded-full bg-sky-500 mt-1.5 shadow-sm shadow-sky-200"></div>}
                            </div>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{item.description}</p>
                            <div className="text-[10px] text-slate-400 mt-2 font-medium">{item.time}</div>
                        </div>
                    </div>
                ))}

                {/* Empty State (Hidden if has content) */}
                {NOTIFICATIONS.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mb-1">No notifications yet</h3>
                        <p className="text-xs text-slate-500">We'll let you know when something important happens.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
