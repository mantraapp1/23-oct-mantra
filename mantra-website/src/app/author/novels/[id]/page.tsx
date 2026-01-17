'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Novel {
    id: string;
    title: string;
    synopsis: string;
    cover_image_url: string;
    view_count: number;
    like_count: number;
    status: string;
    is_published: boolean;
    language: string;
    tags: string[];
    created_at: string;
}

interface Chapter {
    id: string;
    title: string;
    chapter_number: number;
    is_published: boolean;
    view_count: number;
    created_at: string;
}

export default function NovelManagePage() {
    const router = useRouter();
    const params = useParams();
    const novelId = params.id as string;
    const supabase = createClient();

    const [novel, setNovel] = useState<Novel | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPublishing, setIsPublishing] = useState(false);

    useEffect(() => {
        loadData();
    }, [novelId]);

    const loadData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }

        // Load novel
        const { data: novelData } = await supabase
            .from('novels')
            .select('*')
            .eq('id', novelId)
            .eq('author_id', user.id)
            .single();

        if (!novelData) {
            router.push('/author/dashboard');
            return;
        }
        setNovel(novelData);

        // Load chapters
        const { data: chaptersData } = await supabase
            .from('chapters')
            .select('id, title, chapter_number, is_published, view_count, created_at')
            .eq('novel_id', novelId)
            .order('chapter_number', { ascending: true });

        setChapters(chaptersData || []);
        setIsLoading(false);
    };

    const handlePublishToggle = async () => {
        if (!novel) return;
        setIsPublishing(true);

        const { error } = await supabase
            .from('novels')
            .update({ is_published: !novel.is_published })
            .eq('id', novel.id);

        if (!error) {
            setNovel({ ...novel, is_published: !novel.is_published });
        }
        setIsPublishing(false);
    };

    const handleDeleteNovel = async () => {
        if (!novel || !confirm('Are you sure you want to delete this novel? This action cannot be undone.')) return;

        const { error } = await supabase
            .from('novels')
            .delete()
            .eq('id', novel.id);

        if (!error) {
            router.push('/author/dashboard');
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!novel) return null;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 font-inter text-slate-800">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/author/dashboard" className="p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
                </Link>
                <h1 className="text-2xl font-bold text-slate-900 flex-1 truncate">{novel.title}</h1>
            </div>

            {/* Novel Info Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 shadow-sm">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-32 h-44 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 mx-auto md:mx-0">
                        {novel.cover_image_url ? (
                            <img src={novel.cover_image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl text-slate-300">📖</div>
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="flex flex-wrap gap-2 mb-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${novel.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {novel.is_published ? 'PUBLISHED' : 'DRAFT'}
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                                {novel.status.toUpperCase()}
                            </span>
                        </div>
                        <p className="text-slate-600 text-sm line-clamp-3 mb-4">{novel.synopsis}</p>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="bg-slate-50 rounded-lg p-3">
                                <p className="text-lg font-bold text-slate-900">{chapters.length}</p>
                                <p className="text-xs text-slate-500">Chapters</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-3">
                                <p className="text-lg font-bold text-slate-900">{novel.view_count?.toLocaleString() || 0}</p>
                                <p className="text-xs text-slate-500">Views</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-3">
                                <p className="text-lg font-bold text-slate-900">{novel.like_count?.toLocaleString() || 0}</p>
                                <p className="text-xs text-slate-500">Likes</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-slate-100">
                    <Link
                        href={`/author/novels/${novel.id}/edit`}
                        className="flex-1 md:flex-none px-5 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-colors text-center"
                    >
                        Edit Details
                    </Link>
                    <button
                        onClick={handlePublishToggle}
                        disabled={isPublishing}
                        className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-semibold transition-colors text-center ${novel.is_published
                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                : 'bg-emerald-500 text-white hover:bg-emerald-600'
                            }`}
                    >
                        {isPublishing ? '...' : novel.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                        onClick={handleDeleteNovel}
                        className="px-5 py-2.5 border border-rose-200 text-rose-600 rounded-xl font-semibold hover:bg-rose-50 transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>

            {/* Chapters Section */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-900">Chapters ({chapters.length})</h2>
                    <Link
                        href={`/author/novels/${novel.id}/chapter/new`}
                        className="px-4 py-2 bg-sky-500 text-white rounded-lg font-semibold hover:bg-sky-600 transition-colors text-sm"
                    >
                        + Add Chapter
                    </Link>
                </div>

                {chapters.length > 0 ? (
                    <div className="space-y-2">
                        {chapters.map((chapter) => (
                            <Link
                                key={chapter.id}
                                href={`/author/novels/${novel.id}/chapter/${chapter.id}/edit`}
                                className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-sky-200 hover:shadow-sm transition-all group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                                    {chapter.chapter_number}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-slate-900 truncate group-hover:text-sky-600 transition-colors">{chapter.title}</h3>
                                    <p className="text-xs text-slate-500">{chapter.view_count || 0} views</p>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${chapter.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {chapter.is_published ? 'Live' : 'Draft'}
                                </span>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-xl">
                        <span className="text-4xl mb-4 block">📝</span>
                        <h3 className="font-bold text-slate-900 mb-2">No chapters yet</h3>
                        <p className="text-slate-500 text-sm mb-4">Start writing your first chapter!</p>
                        <Link
                            href={`/author/novels/${novel.id}/chapter/new`}
                            className="inline-block px-6 py-3 bg-sky-500 text-white rounded-xl font-bold hover:bg-sky-600 transition-colors"
                        >
                            Write First Chapter
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
