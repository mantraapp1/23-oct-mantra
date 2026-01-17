'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function CreateChapterPage() {
    const router = useRouter();
    const params = useParams();
    const novelId = params.id as string;
    const supabase = createClient();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [chapterNumber, setChapterNumber] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [novelTitle, setNovelTitle] = useState('');

    useEffect(() => {
        loadNovelData();
    }, [novelId]);

    const loadNovelData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }

        // Get novel info
        const { data: novel } = await supabase
            .from('novels')
            .select('title')
            .eq('id', novelId)
            .eq('author_id', user.id)
            .single();

        if (!novel) {
            router.push('/author/dashboard');
            return;
        }
        setNovelTitle(novel.title);

        // Get next chapter number
        const { count } = await supabase
            .from('chapters')
            .select('*', { count: 'exact', head: true })
            .eq('novel_id', novelId);

        setChapterNumber((count || 0) + 1);
    };

    const handleSubmit = async (publish: boolean) => {
        setError('');

        if (!title.trim()) {
            setError('Chapter title is required');
            return;
        }
        if (!content.trim()) {
            setError('Chapter content is required');
            return;
        }

        setIsSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data: chapter, error: insertError } = await supabase
                .from('chapters')
                .insert({
                    novel_id: novelId,
                    title: title.trim(),
                    content: content.trim(),
                    chapter_number: chapterNumber,
                    is_published: publish,
                    word_count: content.trim().split(/\s+/).length,
                })
                .select()
                .single();

            if (insertError) throw insertError;

            router.push(`/author/novels/${novelId}`);
        } catch (err: any) {
            setError(err.message || 'Failed to create chapter');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 font-inter text-slate-800">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href={`/author/novels/${novelId}`} className="p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
                </Link>
                <div>
                    <p className="text-sm text-slate-500">{novelTitle}</p>
                    <h1 className="text-xl font-bold text-slate-900">New Chapter #{chapterNumber}</h1>
                </div>
            </div>

            <div className="space-y-6">
                {error && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
                        {error}
                    </div>
                )}

                {/* Title */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Chapter Title *</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter chapter title"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-lg"
                    />
                </div>

                {/* Content */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Content *</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Start writing your chapter..."
                        rows={20}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none font-mono text-sm leading-relaxed"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                        Word count: {content.trim() ? content.trim().split(/\s+/).length : 0}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                        onClick={() => handleSubmit(false)}
                        disabled={isSubmitting}
                        className="flex-1 py-3.5 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                        Save as Draft
                    </button>
                    <button
                        onClick={() => handleSubmit(true)}
                        disabled={isSubmitting}
                        className="flex-1 py-3.5 bg-sky-500 text-white rounded-xl font-bold hover:bg-sky-600 transition-colors disabled:opacity-50"
                    >
                        {isSubmitting ? 'Saving...' : 'Publish Chapter'}
                    </button>
                </div>
            </div>
        </div>
    );
}
