'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Dropdown } from '@/components/ui/Dropdown';

const GENRES = ['Fantasy', 'Romance', 'Sci-Fi', 'Mystery', 'Thriller', 'Adventure', 'Horror', 'Comedy', 'Drama', 'Action', 'Slice of Life', 'Historical'];
const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 'Portuguese', 'Hindi', 'Other'];

export default function CreateNovelPage() {
    const router = useRouter();
    const supabase = createClient();

    const [title, setTitle] = useState('');
    const [synopsis, setSynopsis] = useState('');
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [language, setLanguage] = useState('English');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

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

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCoverImage(file);
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!title.trim()) {
            setError('Title is required');
            return;
        }
        if (!synopsis.trim()) {
            setError('Synopsis is required');
            return;
        }
        if (selectedGenres.length === 0) {
            setError('Please select at least one genre');
            return;
        }

        setIsSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            let coverUrl = null;
            if (coverImage) {
                const fileExt = coverImage.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('novel-covers')
                    .upload(fileName, coverImage);

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('novel-covers')
                        .getPublicUrl(fileName);
                    coverUrl = publicUrl;
                }
            }

            const { data: novel, error: insertError } = await supabase
                .from('novels')
                .insert({
                    title: title.trim(),
                    description: synopsis.trim(),
                    author_id: user.id,
                    cover_image_url: coverUrl,
                    genres: selectedGenres,
                    language,
                    tags,
                    is_published: false,
                    status: 'ongoing',
                })
                .select()
                .single();

            if (insertError) throw insertError;

            router.push(`/author/novels/${novel.id}`);
        } catch (err: any) {
            setError(err.message || 'Failed to create novel');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-8 font-inter text-slate-800">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/author/dashboard" className="p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
                </Link>
                <h1 className="text-2xl font-bold text-slate-900">Create Novel</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
                        {error}
                    </div>
                )}

                {/* Cover Image */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Cover Image</label>
                    <div className="flex items-start gap-4">
                        <div className="w-32 h-44 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                            {coverPreview ? (
                                <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl text-slate-300">📖</span>
                            )}
                        </div>
                        <div className="flex-1">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                                id="cover-upload"
                            />
                            <label
                                htmlFor="cover-upload"
                                className="inline-block px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-semibold cursor-pointer transition-colors"
                            >
                                Upload Cover
                            </label>
                            <p className="text-xs text-slate-500 mt-2">Recommended: 600×900px</p>
                        </div>
                    </div>
                </div>

                {/* Title */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Title *</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter your novel title"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        maxLength={100}
                    />
                </div>

                {/* Synopsis */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Synopsis *</label>
                    <textarea
                        value={synopsis}
                        onChange={(e) => setSynopsis(e.target.value)}
                        placeholder="Write a compelling synopsis for your novel..."
                        rows={5}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                        maxLength={2000}
                    />
                    <p className="text-xs text-slate-500 mt-1">{synopsis.length}/2000</p>
                </div>

                {/* Genres */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Genres * (Select up to 3)</label>
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
                    <label className="block text-sm font-bold text-slate-700 mb-2">Tags (Optional)</label>
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
                        className="w-full py-4 bg-sky-500 text-white rounded-xl font-bold text-lg hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Creating...' : 'Create Novel'}
                    </button>
                </div>
            </form>
        </div>
    );
}
