'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Tag {
    name: string;
    count: number;
}

const POPULAR_TAGS = [
    'reincarnation', 'cultivation', 'magic', 'academy', 'system',
    'revenge', 'op-mc', 'romance', 'action', 'adventure',
    'harem', 'kingdom-building', 'martial-arts', 'isekai', 'litrpg',
    'dungeon', 'vampire', 'dragon', 'demon', 'villainess'
];

export default function TagsPage() {
    const supabase = createClient();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTags = POPULAR_TAGS.filter(tag =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-2xl mx-auto px-4 py-8 font-inter text-slate-800">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => window.history.back()} className="p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <h1 className="text-xl font-bold text-slate-900">Browse by Tag</h1>
            </div>

            {/* Search */}
            <div className="mb-6">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tags..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
            </div>

            {/* Tags Grid */}
            <div className="flex flex-wrap gap-2">
                {filteredTags.map(tag => (
                    <Link
                        key={tag}
                        href={`/tags/${tag}`}
                        className="px-4 py-2 bg-slate-100 hover:bg-sky-100 hover:text-sky-700 rounded-full text-sm font-medium transition-colors"
                    >
                        #{tag}
                    </Link>
                ))}
            </div>

            {filteredTags.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-slate-500">No tags found matching "{searchQuery}"</p>
                </div>
            )}
        </div>
    );
}
