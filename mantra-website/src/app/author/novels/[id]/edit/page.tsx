'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Dropdown } from '@/components/ui/Dropdown';

const GENRES = ['Fantasy', 'Romance', 'Sci-Fi', 'Mystery', 'Thriller', 'Adventure', 'Horror', 'Comedy', 'Drama', 'Action', 'Slice of Life', 'Historical'];
const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 'Portuguese', 'Hindi', 'Other'];
const STATUSES = ['Ongoing', 'Completed', 'Hiatus'];

interface Novel {
    id: string;
    title: string;
    description: string;
    cover_image_url: string;
    genres: string[];
    tags: string[];
    language: string;
    status: string;
}

export default function EditNovelPage() {
    const router = useRouter();
    const params = useParams();
    const novelId = params.id as string;
    const supabase = createClient();

    const [novel, setNovel] = useState<Novel | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [language, setLanguage] = useState('English');
    const [status, setStatus] = useState('Ongoing');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadNovel();
    }, [novelId]);

    const loadNovel = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }

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
        setTitle(novelData.title || '');
        setDescription(novelData.description || '');
        setSelectedGenres(novelData.genres || []);
        setLanguage(novelData.language || 'English');
        // Capitalize status for dropdown display
        setStatus(novelData.status ? novelData.status.charAt(0).toUpperCase() + novelData.status.slice(1) : 'Ongoing');
        setTags(novelData.tags || []);
        setIsLoading(false);
    };

    const handleGenreToggle = (genre: string) => {
        if (selectedGenres.includes(genre)) {
            setSelectedGenres(selectedGenres.filter(g => g !== genre));
        } else if (selectedGenres.length < 3) {
            setSelectedGenres([...selectedGenres, genre]);
        }
    };

    const handleAddTag = () => {
        const tag = tagInput.trim().toLowerCase();
        if (tag && !tags.includes(tag) && tags.length < 10) {
            setTags([...tags, tag]);
            setTagInput('');
        }
    };

    const handleRemoveTag = (index: number) => {
        setTags(tags.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!title.trim()) {
            setError('Title is required');
            return;
        }
        if (!description.trim()) {
            setError('Description is required');
            return;
        }
        if (selectedGenres.length === 0) {
            setError('Please select at least one genre');
            return;
        }

        setIsSubmitting(true);

        try {
            const { error: updateError } = await supabase
                .from('novels')
                .update({
                    title: title.trim(),
                    description: description.trim(),
                    genres: selectedGenres,
                    language,
                    status: status.toLowerCase(), // Store as lowercase in DB
                    tags,
                })
                .eq('id', novelId);

            if (updateError) throw updateError;

            router.push(`/author/novels/${novelId}`);
        } catch (err: any) {
            setError(err.message || 'Failed to update novel');
        } finally {
            setIsSubmitting(false);
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
        <div className="max-w-2xl mx-auto px-4 py-8 font-inter text-slate-800">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href={`/author/novels/${novelId}`} className="p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
                </Link>
                <h1 className="text-2xl font-bold text-slate-900">Edit Novel</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
                        {error}
                    </div>
                )}

                {/* Title */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Title *</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                        maxLength={100}
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Description *</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={5}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                        maxLength={2000}
                    />
                    <p className="text-xs text-slate-500 mt-1">{description.length}/2000</p>
                </div>

                {/* Status - Using Dropdown */}
                <Dropdown
                    label="Status"
                    options={STATUSES}
                    value={status}
                    onChange={setStatus}
                    fullWidth
                />

                {/* Genres */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Genres * (up to 3)</label>
                    <div className="flex flex-wrap gap-2">
                        {GENRES.map(genre => (
                            <button
                                key={genre}
                                type="button"
                                onClick={() => handleGenreToggle(genre)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedGenres.includes(genre)
                                        ? 'bg-sky-500 text-white'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                            >
                                {genre}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Language - Using Dropdown */}
                <Dropdown
                    label="Language"
                    options={LANGUAGES}
                    value={language}
                    onChange={setLanguage}
                    fullWidth
                />

                {/* Tags */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Tags</label>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                            placeholder="Add a tag"
                            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                        <button
                            type="button"
                            onClick={handleAddTag}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold transition-colors"
                        >
                            Add
                        </button>
                    </div>
                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag, index) => (
                                <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 rounded-full text-sm">
                                    #{tag}
                                    <button type="button" onClick={() => handleRemoveTag(index)} className="text-slate-400 hover:text-slate-600">×</button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Submit */}
                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-sky-500 text-white rounded-xl font-bold text-lg hover:bg-sky-600 transition-colors disabled:opacity-50"
                    >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}
