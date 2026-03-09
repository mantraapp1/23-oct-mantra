import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/contexts/DialogContext';
import { Dropdown } from '@/components/ui/Dropdown';
import {
    ArrowLeft,
    Upload,
    X,
    Check,
    Info,
    Image as ImageIcon
} from 'lucide-react';
import novelService from '@/services/novelService';

const GENRES = [
    'Romance', 'Fantasy', 'Action', 'Adventure', 'Drama', 'Mystery',
    'Thriller', 'Isekai', 'Reincarnation', 'Slice of Life', 'Werewolf',
    'Supernatural', 'Historical', 'Psychological', 'Dystopian', 'Crime',
    'Sci-Fi', 'Martial Arts', 'Comedy', 'Romantic Fantasy', 'Mythology'
];

const POPULAR_TAGS = [
    'strong-protagonist', 'system', 'cultivation', 'transmigration',
    'magic', 'revenge', 'academy', 'kingdom-building', 'level-up', 'modern-day'
];

const TAG_COLORS = [
    'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-amber-500',
    'bg-emerald-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500',
    'bg-orange-500', 'bg-lime-500'
];

const LANGUAGES = [
    'English', 'Hindi', 'Spanish', 'French', 'German', 'Portuguese',
    'Italian', 'Russian', 'Japanese', 'Korean', 'Chinese', 'Arabic', 'Other'
];

export default function CreateNovelPage() {
    const { user, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const confirm = useConfirm();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Protect Route
    useEffect(() => {
        if (!authLoading && !user) {
            toast.error("You must be logged in to create a novel");
            navigate('/login');
        }
    }, [user, authLoading, navigate, toast]);

    const [form, setForm] = useState({
        title: '',
        description: '',
        status: 'ongoing',
        language: 'English',
        is_mature: false,
    });

    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    if (authLoading) return null;
    if (!user) {
        navigate('/login');
        return null;
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setErrors({ ...errors, cover: 'Please upload an image file' });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setErrors({ ...errors, cover: 'Image size should be less than 5MB' });
            return;
        }

        setCoverImage(file);
        setCoverPreview(URL.createObjectURL(file));
        setErrors({ ...errors, cover: '' });
    };

    const toggleGenre = (genre: string) => {
        if (selectedGenres.includes(genre)) {
            setSelectedGenres(selectedGenres.filter(g => g !== genre));
        } else if (selectedGenres.length < 3) {
            setSelectedGenres([...selectedGenres, genre]);
            setErrors({ ...errors, genres: '' });
        } else {
            setErrors({ ...errors, genres: 'You can only select up to 3 genres' });
            setTimeout(() => setErrors({ ...errors, genres: '' }), 3000);
        }
    };

    const addTag = () => {
        const cleanTag = tagInput.trim().toLowerCase();
        if (!cleanTag) return;
        if (tags.length >= 10) {
            setErrors({ ...errors, tags: 'You can add up to 10 tags' });
            setTimeout(() => setErrors({ ...errors, tags: '' }), 3000);
            return;
        }
        if (tags.includes(cleanTag)) {
            setTagInput('');
            return;
        }
        setTags([...tags, cleanTag]);
        setTagInput('');
    };

    const addPopularTag = (tag: string) => {
        if (tags.includes(tag)) return;
        if (tags.length >= 10) {
            setErrors({ ...errors, tags: 'You can add up to 10 tags' });
            setTimeout(() => setErrors({ ...errors, tags: '' }), 3000);
            return;
        }
        setTags([...tags, tag]);
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!coverImage) newErrors.cover = 'Cover image is required';
        if (!form.title.trim()) newErrors.title = 'Title is required';
        if (!form.description.trim()) newErrors.description = 'Description is required';
        if (selectedGenres.length === 0) newErrors.genres = 'Please select at least one genre';
        if (!form.status) newErrors.status = 'Please select a status';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !validate() || isSubmitting) return;



        setIsSubmitting(true);
        try {
            // 1. Create novel FIRST (without cover) - this creates the novel record
            const result = await novelService.createNovel(user.id, {
                title: form.title.trim(),
                description: form.description.trim(),
                cover_image_url: '', // Will update after upload
                genres: selectedGenres,
                tags: tags,
                status: form.status as 'ongoing' | 'completed' | 'hiatus',
                language: form.language,
                is_mature: form.is_mature,
            });

            if (!result.success || !result.novel) {
                throw new Error(result.message || 'Failed to create novel');
            }

            const novelId = result.novel.id;

            // 2. Upload cover using NOVEL ID as folder (matches RLS policy)
            if (coverImage) {
                const uploadResult = await novelService.uploadCoverImage(coverImage, novelId);
                if (uploadResult.success && uploadResult.url) {
                    // 3. Update novel with cover URL
                    await novelService.updateNovel(novelId, {
                        cover_image_url: uploadResult.url,
                    });
                } else {

                    // Don't throw - novel was created successfully, just without cover
                }
            }

            toast.success('Novel created successfully!');
            navigate(`/novel/${novelId}`, { replace: true });
        } catch (error: any) {

            toast.error(error.message || 'Failed to create novel');
        } finally {
            setIsSubmitting(false);
        }
    };

    const goBack = async () => {
        const hasContent = form.title || form.description || coverImage || selectedGenres.length > 0 || tags.length > 0;
        if (hasContent) {
            if (await confirm('Are you sure you want to go back? Any unsaved changes will be lost.', { title: 'Discard Changes?', variant: 'destructive' })) {
                navigate('/dashboard');
            }
        } else {
            navigate('/dashboard');
        }
    };

    if (authLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div></div>;

    return (
        <div className="min-h-screen bg-background">
            <div className="w-full px-4">
                {/* Header */}
                <header className="sticky top-0 z-50 bg-background border-b border-border">
                    <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
                        <button
                            type="button"
                            onClick={goBack}
                            className="p-2 -ml-2 rounded-lg hover:bg-background-secondary active:scale-95 transition"
                        >
                            <ArrowLeft className="w-5 h-5 text-foreground" />
                        </button>
                        <h1 className="text-base md:text-lg font-semibold text-foreground">Create Novel</h1>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-5 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg active:scale-95 transition disabled:opacity-50 hover:bg-sky-600"
                        >
                            {isSubmitting ? '...' : 'Create'}
                        </button>
                    </div>
                </header>

                {/* Main Content - 2 column on desktop */}
                <main className="px-4 sm:px-6 lg:px-8 py-6 pb-20">
                    <div className="flex flex-col lg:flex-row lg:gap-10">
                        {/* Left Column: Cover Image (sticky on desktop) */}
                        <div className="lg:w-64 lg:flex-shrink-0 mb-6 lg:mb-0">
                            <div className="lg:sticky lg:top-24">
                                <label className="block text-xs font-medium text-foreground-secondary mb-2.5">
                                    Cover Image *
                                </label>
                                <div className="flex flex-row lg:flex-col items-start gap-3">
                                    <div className="relative">
                                        {coverPreview ? (
                                            <img
                                                src={coverPreview}
                                                alt="Cover"
                                                className="w-[120px] h-[170px] lg:w-full lg:h-auto lg:aspect-[2/3] object-cover rounded-xl border border-border shadow-sm"
                                            />
                                        ) : (
                                            <div className="w-[120px] h-[170px] lg:w-full lg:aspect-[2/3] rounded-xl border-2 border-dashed border-border bg-background-secondary flex flex-col items-center justify-center">
                                                <ImageIcon className="w-10 h-10 text-foreground-secondary mb-2" />
                                                <span className="text-xs text-foreground-secondary text-center">Cover<br />Image</span>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleImageChange}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm text-foreground hover:bg-background-secondary active:scale-95 transition"
                                        >
                                            <Upload className="w-4 h-4" />
                                            Upload Cover
                                        </button>
                                        <p className="text-xs text-foreground-secondary">Recommended: 800x1200px<br />Max: 5MB</p>
                                    </div>
                                </div>
                                {errors.cover && <p className="text-red-500 text-xs mt-2">{errors.cover}</p>}
                            </div>
                        </div>

                        {/* Right Column: Form Fields */}
                        <div className="flex-1 space-y-6">
                            {/* Title Section */}
                            <div>
                                <label className="block text-xs font-medium text-foreground-secondary mb-2.5">
                                    Novel Title *
                                </label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                    className="w-full px-4 py-3 border border-border rounded-xl text-sm text-foreground bg-card outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                                    placeholder="Enter your novel title"
                                />
                                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                            </div>

                            {/* Description Section */}
                            <div>
                                <label className="block text-xs font-medium text-foreground-secondary mb-2.5">
                                    Description *
                                </label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    rows={6}
                                    className="w-full px-4 py-3 border border-border rounded-xl text-sm text-foreground bg-card leading-relaxed outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition resize-none"
                                    placeholder="Write a compelling description that will hook readers..."
                                />
                                <p className="text-xs text-foreground-secondary mt-1.5">Describe your story, main characters, and what makes it unique</p>
                                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                            </div>

                            {/* Genres Section */}
                            <div>
                                <label className="block text-xs font-medium text-foreground-secondary mb-2.5">
                                    Genres * (select up to 3)
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {GENRES.map(genre => (
                                        <button
                                            key={genre}
                                            type="button"
                                            onClick={() => toggleGenre(genre)}
                                            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95 ${selectedGenres.includes(genre)
                                                ? 'bg-sky-500 text-white'
                                                : 'bg-background-secondary text-foreground-secondary hover:bg-slate-200 dark:hover:bg-slate-700'
                                                }`}
                                        >
                                            {selectedGenres.includes(genre) && <Check className="w-3 h-3 inline mr-1" />}
                                            {genre}
                                        </button>
                                    ))}
                                </div>
                                {errors.genres && <p className="text-red-500 text-xs mt-1">{errors.genres}</p>}
                            </div>

                            {/* Tags Section */}
                            <div>
                                <label className="block text-xs font-medium text-foreground-secondary mb-2.5">
                                    Tags (up to 10)
                                </label>

                                {/* Added Tags Display */}
                                {tags.length > 0 && (
                                    <div className="mb-2 min-h-[32px] flex flex-wrap gap-2">
                                        {tags.map((tag, index) => (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => removeTag(tag)}
                                                className={`${TAG_COLORS[index % 10]} text-white px-3.5 py-1.5 rounded-full text-sm font-medium flex items-center gap-1 active:scale-95 transition`}
                                            >
                                                {tag}
                                                <X className="w-4 h-4" />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Tag Input with Button */}
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={e => setTagInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                        className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm text-foreground bg-card outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                                        placeholder="Type a tag..."
                                    />
                                    <button
                                        type="button"
                                        onClick={addTag}
                                        className="px-4 py-2.5 bg-background-secondary text-foreground text-sm font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition"
                                    >
                                        Add
                                    </button>
                                </div>

                                {/* Popular Tags */}
                                <div className="mb-2">
                                    <p className="text-xs font-medium text-foreground-secondary mb-2">Popular Tags:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {POPULAR_TAGS.map(tag => (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => addPopularTag(tag)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${tags.includes(tag)
                                                    ? 'bg-background-secondary border-border text-foreground-secondary opacity-50'
                                                    : 'bg-card text-foreground-secondary border border-border hover:bg-background-secondary'
                                                    }`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <p className="text-xs text-foreground-secondary mt-1.5">Tags help readers discover your story</p>
                                {errors.tags && <p className="text-red-500 text-xs mt-1">{errors.tags}</p>}
                            </div>

                            {/* Status, Language, and Mature Content Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Status Section */}
                                <div>
                                    <label className="block text-xs font-medium text-foreground-secondary mb-2">
                                        Status *
                                    </label>
                                    <Dropdown
                                        options={['Ongoing', 'Completed', 'Hiatus']}
                                        value={form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                                        onChange={(val) => setForm({ ...form, status: val.toLowerCase() })}
                                    />
                                    {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status}</p>}
                                </div>

                                {/* Language Section */}
                                <div>
                                    <label className="block text-xs font-medium text-foreground-secondary mb-2">
                                        Language *
                                    </label>
                                    <Dropdown
                                        options={LANGUAGES}
                                        value={form.language}
                                        onChange={(val) => setForm({ ...form, language: val })}
                                    />
                                </div>

                                {/* Mature Content Section */}
                                <div>
                                    <label className="block text-xs font-medium text-foreground-secondary mb-2">
                                        Content Rating
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer px-4 py-3 border border-border rounded-xl bg-card hover:bg-background-secondary transition">
                                        <input
                                            type="checkbox"
                                            checked={form.is_mature}
                                            onChange={e => setForm({ ...form, is_mature: e.target.checked })}
                                            className="w-5 h-5 rounded border-border text-sky-500 cursor-pointer focus:ring-0 accent-sky-500"
                                        />
                                        <span className="text-sm text-foreground">
                                            Mature (18+)
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* Publishing Options Info */}
                            <div className="p-4 bg-card rounded-xl border border-border">
                                <div className="flex items-start gap-3">
                                    <Info className="w-5 h-5 text-foreground-secondary mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Publishing Your Novel</p>
                                        <p className="text-xs text-foreground-secondary mt-1">
                                            After creating your novel, you'll be able to add chapters and publish them for readers. You can save as draft or publish immediately.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
