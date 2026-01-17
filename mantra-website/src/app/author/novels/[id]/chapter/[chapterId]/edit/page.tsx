'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Chapter {
    id: string;
    title: string;
    content: string;
    chapter_number: number;
    is_published: boolean;
}

export default function EditChapterPage() {
    const router = useRouter();
    const params = useParams();
    const novelId = params.id as string;
    const chapterId = params.chapterId as string;
    const supabase = createClient();

    const [chapter, setChapter] = useState<Chapter | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadChapter();
    }, [chapterId]);

    const loadChapter = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }

        const { data: chapterData } = await supabase
            .from('chapters')
            .select('*')
            .eq('id', chapterId)
            .single();

        if (!chapterData) {
            router.push(`/author/novels/${novelId}`);
            return;
        }

        setChapter(chapterData);
        setTitle(chapterData.title);
        setContent(chapterData.content);
        setIsLoading(false);
    };

    const handleSave = async (publish?: boolean) => {
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
            const updateData: any = {
                title: title.trim(),
                content: content.trim(),
                word_count: content.trim().split(/\s+/).length,
            };

            if (publish !== undefined) {
                updateData.is_published = publish;
            }

            const { error: updateError } = await supabase
                .from('chapters')
                .update(updateData)
                .eq('id', chapterId);

            if (updateError) throw updateError;

            router.push(`/author/novels/${novelId}`);
        } catch (err: any) {
            setError(err.message || 'Failed to save chapter');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this chapter?')) return;

        const { error } = await supabase
            .from('chapters')
            .delete()
            .eq('id', chapterId);

        if (!error) {
            router.push(`/author/novels/${novelId}`);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!chapter) return null;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 font-inter text-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <Link href={`/author/novels/${novelId}`} className="p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
                    </Link>
                    <h1 className="text-xl font-bold text-slate-900">Edit Chapter #{chapter.chapter_number}</h1>
                </div>
                <button
                    onClick={handleDelete}
                    className="px-4 py-2 border border-rose-200 text-rose-600 rounded-lg font-semibold hover:bg-rose-50 transition-colors text-sm"
                >
                    Delete
                </button>
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
                        onClick={() => handleSave()}
                        disabled={isSubmitting}
                        className="flex-1 py-3.5 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                        Save Changes
                    </button>
                    <button
                        onClick={() => handleSave(!chapter.is_published)}
                        disabled={isSubmitting}
                        className={`flex-1 py-3.5 rounded-xl font-bold transition-colors disabled:opacity-50 ${chapter.is_published
                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                : 'bg-sky-500 text-white hover:bg-sky-600'
                            }`}
                    >
                        {isSubmitting ? 'Saving...' : chapter.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                </div>
            </div>
        </div>
    );
}
