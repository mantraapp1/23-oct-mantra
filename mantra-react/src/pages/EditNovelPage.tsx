import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Dropdown } from '@/components/ui/Dropdown';
import {
    ArrowLeft,
    Upload,
    X,
    Check,
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
    'detective', 'noir', 'crime', 'conspiracy', 'betrayal',
    'revenge', 'magic', 'cultivation', 'system', 'transmigration'
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

export default function EditNovelPage() {
    const { id } = useParams<{ id: string }>();
    const { user, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(true);
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
    const [originalCoverUrl, setOriginalCoverUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (id && user) {
            loadNovel();
        }
    }, [id, user]);

    const loadNovel = async () => {
        try {
            const novel = await novelService.getNovel(id!);
            if (novel) {
                setForm({
                    title: novel.title || '',
                    description: novel.description || '',
                    status: (['ongoing', 'completed', 'hiatus'].includes(novel.status || '') ? novel.status : 'ongoing'),
                    language: novel.language || 'English',
                    is_mature: novel.is_mature || false,
                });
                setSelectedGenres(novel.genres || []);
                setTags(novel.tags || []);
                if (novel.cover_image_url) {
                    setCoverPreview(novel.cover_image_url);
                    setOriginalCoverUrl(novel.cover_image_url);
                }
            } else {
                toast.error('Failed to load novel');
                navigate('/dashboard');
            }
        } catch (error) {
            toast.error('Failed to load novel');
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

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
        if (!form.title.trim()) newErrors.title = 'Title is required';
        if (!form.description.trim()) newErrors.description = 'Description is required';
        if (selectedGenres.length === 0) newErrors.genres = 'Please select at least one genre';
        if (!form.status) newErrors.status = 'Please select a status';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            // 1. Upload new cover if changed
            let coverUrl = originalCoverUrl || '';
            if (coverImage) {
                const uploadResult = await novelService.uploadCoverImage(coverImage, user.id);
                if (uploadResult.success && uploadResult.url) {
                    coverUrl = uploadResult.url;
                } else {
                    throw new Error(uploadResult.message || 'Failed to upload cover');
                }
            }

            // 2. Update novel
            const result = await novelService.updateNovel(id!, {
                title: form.title.trim(),
                description: form.description.trim(),
                cover_image_url: coverUrl,
                genres: selectedGenres,
                tags: tags,
                status: form.status as 'ongoing' | 'completed' | 'hiatus',
                language: form.language,
                is_mature: form.is_mature,
            });

            if (result.success) {
                toast.success('Novel updated successfully!');
                navigate(`/novel/${id}`, { replace: true });
            } else {
                toast.error(result.message);
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to update novel');
        } finally {
            setIsSubmitting(false);
        }
    };

    const goBack = () => {
        navigate(`/novel/manage/${id}`);
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="w-full px-4">
                {/* Header */}
                <header className="sticky top-0 z-50 bg-background border-b border-border">
                    <div className="flex items-center justify-between px-4 py-3">
                        <button
                            type="button"
                            onClick={goBack}
                            className="p-2 -ml-2 rounded-lg hover:bg-muted active:scale-95 transition"
                        >
                            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                        </button>
                        <h1 className="text-base font-semibold text-foreground">Edit Novel Info</h1>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-5 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg active:scale-95 transition disabled:opacity-50"
                        >
                            {isSubmitting ? '...' : 'Save Changes'}
                        </button>
                    </div>
                </header>

                {/* Main Content */}
                <main className="px-4 py-5 pb-20">
                    {/* Cover Image Section */}
                    <div className="mb-6">
                        <label className="block text-xs font-medium text-muted-foreground mb-2.5">
                            Cover Image
                        </label>
                        <div className="flex items-start gap-3">
                            <div className="relative">
                                {coverPreview ? (
                                    <img
                                        src={coverPreview}
                                        alt="Cover"
                                        className="w-[100px] h-[140px] object-cover rounded-lg border border-border"
                                    />
                                ) : (
                                    <div className="w-[100px] h-[140px] rounded-lg border-2 border-dashed border-muted bg-muted/50 flex flex-col items-center justify-center">
                                        <ImageIcon className="w-8 h-8 text-muted-foreground mb-1" />
                                        <span className="text-[11px] text-muted-foreground text-center">Cover<br />Image</span>
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
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm text-foreground hover:bg-muted active:scale-95 transition"
                            >
                                <Upload className="w-4 h-4" />
                                Change Cover
                            </button>
                        </div>
                        {errors.cover && <p className="text-destructive text-xs mt-1">{errors.cover}</p>}
                    </div>

                    {/* Title Section */}
                    <div className="mb-6">
                        <label className="block text-xs font-medium text-muted-foreground mb-2.5">
                            Title
                        </label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                            className="w-full px-3 py-2.5 border border-input rounded-lg text-sm text-foreground bg-background outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                            placeholder="Enter novel title"
                        />
                        {errors.title && <p className="text-destructive text-xs mt-1">{errors.title}</p>}
                    </div>

                    {/* Description Section */}
                    <div className="mb-6">
                        <label className="block text-xs font-medium text-muted-foreground mb-2.5">
                            Description
                        </label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            rows={5}
                            className="w-full px-3 py-2.5 border border-input rounded-lg text-sm text-foreground bg-background leading-relaxed outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition resize-none"
                            placeholder="Write a compelling description for your novel..."
                        />
                        {errors.description && <p className="text-destructive text-xs mt-1">{errors.description}</p>}
                    </div>

                    {/* Genres Section */}
                    <div className="mb-6">
                        <label className="block text-xs font-medium text-muted-foreground mb-2.5">
                            Genres (select up to 3)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {GENRES.map(genre => (
                                <button
                                    key={genre}
                                    type="button"
                                    onClick={() => toggleGenre(genre)}
                                    className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95 ${selectedGenres.includes(genre)
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                        }`}
                                >
                                    {selectedGenres.includes(genre) && <Check className="w-3 h-3 inline mr-1" />}
                                    {genre}
                                </button>
                            ))}
                        </div>
                        {errors.genres && <p className="text-destructive text-xs mt-1">{errors.genres}</p>}
                    </div>

                    {/* Tags Section */}
                    <div className="mb-6">
                        <label className="block text-xs font-medium text-muted-foreground mb-2.5">
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
                                className="flex-1 px-3 py-2 border border-input rounded-lg text-sm text-foreground bg-background outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                                placeholder="Type a tag..."
                            />
                            <button
                                type="button"
                                onClick={addTag}
                                className="px-4 py-2 bg-muted text-foreground text-sm font-medium rounded-lg hover:bg-muted/80 active:scale-95 transition"
                            >
                                Add
                            </button>
                        </div>

                        {/* Popular Tags */}
                        <div className="mb-2">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Popular Tags:</p>
                            <div className="flex flex-wrap gap-2">
                                {POPULAR_TAGS.map(tag => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => addPopularTag(tag)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${tags.includes(tag)
                                            ? 'bg-primary/10 border-primary text-primary'
                                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                            }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {errors.tags && <p className="text-destructive text-xs mt-1">{errors.tags}</p>}
                    </div>

                    {/* Status, Language, and Mature Content Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        {/* Status Section */}
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-2.5">
                                Status
                            </label>
                            <Dropdown
                                options={['Ongoing', 'Completed', 'Hiatus']}
                                value={form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                                onChange={(val) => setForm({ ...form, status: val.toLowerCase() })}
                            />
                            {errors.status && <p className="text-destructive text-xs mt-1">{errors.status}</p>}
                        </div>

                        {/* Language Section */}
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-2.5">
                                Language
                            </label>
                            <Dropdown
                                options={LANGUAGES}
                                value={form.language}
                                onChange={(val) => setForm({ ...form, language: val })}
                            />
                        </div>

                        {/* Mature Content Section */}
                        <div className="flex flex-col justify-end">
                            <label className="flex items-center gap-3 cursor-pointer px-3 py-2.5 border border-border rounded-lg bg-card hover:bg-muted/50 transition h-[42px]">
                                <input
                                    type="checkbox"
                                    checked={form.is_mature}
                                    onChange={e => setForm({ ...form, is_mature: e.target.checked })}
                                    className="w-4 h-4 rounded border-border text-primary cursor-pointer focus:ring-0 accent-primary"
                                />
                                <span className="text-sm text-foreground">
                                    Mature Content (18+)
                                </span>
                            </label>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
