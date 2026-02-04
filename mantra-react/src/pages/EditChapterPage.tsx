import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
    ChevronLeft,
    Zap,
    Send,
    Info,
    Type,
    Hash,
    Trash2,
    Calendar
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/contexts/DialogContext';
import chapterService from '@/services/chapterService';
import novelService from '@/services/novelService';

export default function EditChapterPage() {
    const { novelId, chapterId } = useParams<{ novelId: string; chapterId: string }>();
    const { user, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const confirm = useConfirm();

    const [novelTitle, setNovelTitle] = useState('Loading...');
    const [chapterNumber, setChapterNumber] = useState('1');
    const [chapterTitle, setChapterTitle] = useState('');
    const [content, setContent] = useState('');
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Stats
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

    useEffect(() => {
        if (!user || !novelId || !chapterId) return;

        const init = async () => {
            try {
                // Get novel info
                const novel = await novelService.getNovel(novelId);
                if (novel) {
                    setNovelTitle(novel.title);
                }

                // Get chapter data
                const chapter = await chapterService.getChapter(chapterId);
                if (chapter) {
                    setChapterNumber(chapter.chapter_number?.toString() || '1');
                    setChapterTitle(chapter.title || '');
                    setContent(chapter.content || '');
                    setLastUpdated(chapter.updated_at || chapter.published_at);
                } else {
                    toast.error('Chapter not found');
                    setTimeout(() => navigate(-1), 1000);
                }
            } catch (error) {
                console.error('Error loading chapter data:', error);
                toast.error('Failed to load chapter data');
            } finally {
                setIsLoading(false);
            }
        };

        init();
    }, [novelId, chapterId, user]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!chapterNumber || parseInt(chapterNumber) < 1) newErrors.chapterNumber = 'Valid chapter number required';
        if (!chapterTitle.trim()) newErrors.chapterTitle = 'Chapter title is required';
        if (wordCount < 100) newErrors.content = `Minimum 100 words required (current: ${wordCount})`;

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleUpdate = async () => {
        if (!validate() || isSubmitting || !novelId || !chapterId) return;

        setIsSubmitting(true);
        try {
            const result = await chapterService.updateChapter(chapterId, {
                chapter_number: parseInt(chapterNumber),
                title: chapterTitle.trim(),
                content: content.trim(),
            });

            if (result.success) {
                navigate(-1);
            } else {
                toast.error(result.message || 'Error updating chapter');
            }
        } catch (error: any) {
            console.error('Error updating chapter:', error);
            toast.error(error.message || 'Error updating chapter');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!await confirm('Are you sure you want to delete this chapter? This action is permanent.', { title: 'Delete Chapter', variant: 'destructive', confirmText: 'Delete' })) {
            return;
        }

        setIsDeleting(true);
        try {
            const result = await chapterService.deleteChapter(chapterId!);
            if (result.success) {
                toast.success('Chapter deleted successfully');
                navigate(`/novel/${novelId}/manage`);
            } else {
                toast.error(result.message || 'Error deleting chapter');
            }
        } catch (error: any) {
            console.error('Error deleting chapter:', error);
            toast.error(error.message || 'Error deleting chapter');
        } finally {
            setIsDeleting(false);
        }
    };

    if (authLoading || isLoading) return null;
    if (!user) {
        navigate('/login');
        return null;
    }

    return (
        <div className="w-full max-w-[1800px] mx-auto bg-background min-h-screen pb-24 font-inter">
            {/* Header */}
            <div className="sticky top-0 bg-background z-40 border-b border-border">
                <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(`/novel/${novelId}/manage`)}
                            className="p-2 hover:bg-background-secondary rounded-xl transition-colors text-foreground-secondary hover:text-foreground"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-lg md:text-xl font-bold text-foreground">Edit Chapter</h1>
                            <p className="text-[10px] font-bold text-foreground-secondary uppercase tracking-widest truncate max-w-[200px] md:max-w-md">
                                {novelTitle}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors border border-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 dark:border-red-900/30"
                        >
                            <Trash2 className="w-4 h-4" /> Delete
                        </button>
                        <button
                            onClick={handleUpdate}
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-6 py-2.5 bg-sky-500 text-white rounded-xl text-xs font-extrabold hover:bg-sky-600 transition-all shadow-lg shadow-sky-500/20 disabled:bg-background-secondary disabled:text-foreground-secondary disabled:shadow-none"
                        >
                            <Send className="w-4 h-4" /> {isSubmitting ? 'SAVING...' : 'SAVE CHANGES'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Chapter Info */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-1 space-y-1.5">
                            <label className="text-[10px] font-bold text-foreground-secondary uppercase tracking-widest px-1">No. <span className="text-red-400">*</span></label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-secondary" />
                                <input
                                    type="number"
                                    value={chapterNumber}
                                    onChange={e => setChapterNumber(e.target.value)}
                                    className="w-full p-3 pl-9 rounded-xl border border-border bg-card text-sm font-bold text-foreground focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div className="col-span-3 space-y-1.5">
                            <label className="text-[10px] font-bold text-foreground-secondary uppercase tracking-widest px-1">Chapter Title <span className="text-red-400">*</span></label>
                            <div className="relative">
                                <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-secondary" />
                                <input
                                    type="text"
                                    value={chapterTitle}
                                    onChange={e => setChapterTitle(e.target.value)}
                                    placeholder="Enter chapter title"
                                    className={`w-full p-3 pl-9 rounded-xl border transition-all text-sm font-bold text-foreground outline-none ${errors.chapterTitle ? 'border-red-300 bg-red-50 dark:bg-red-900/20 focus:ring-red-500/20' : 'border-border bg-card focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                                        }`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Content Editor */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-[10px] font-bold text-foreground-secondary uppercase tracking-widest">Chapter Content <span className="text-red-400">*</span></label>
                            <span className={`text-[10px] font-bold ${wordCount < 100 ? 'text-foreground-secondary' : 'text-emerald-500'}`}>
                                {wordCount} words / 100 min
                            </span>
                        </div>
                        <textarea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="Start writing your chapter here..."
                            className={`w-full min-h-[600px] p-6 rounded-2xl border bg-card focus:ring-4 transition-all text-sm font-medium text-foreground leading-[1.8] resize-none outline-none ${errors.content ? 'border-red-300 focus:ring-red-500/20' : 'border-border focus:border-sky-500 focus:ring-sky-500/10'
                                }`}
                        />
                        {errors.content && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider px-4">{errors.content}</p>}
                    </div>

                    {/* Submit Mobile Button */}
                    <button
                        onClick={handleUpdate}
                        disabled={isSubmitting}
                        className="lg:hidden w-full py-4 bg-sky-500 text-white rounded-xl font-extrabold text-sm hover:bg-sky-600 transition-all shadow-xl shadow-sky-500/20 disabled:bg-background-secondary disabled:text-foreground-secondary active:scale-[0.98]"
                    >
                        {isSubmitting ? 'SAVING...' : 'SAVE CHANGES'}
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="lg:hidden w-full py-4 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-all border border-red-100"
                    >
                        Delete Chapter
                    </button>
                </div>

                {/* Sidebar - Tips & Info */}
                <div className="space-y-6">
                    {/* Last Updated - specific to Edit Page */}
                    {lastUpdated && (
                        <div className="bg-card border border-border rounded-2xl p-6">
                            <div className="flex items-center gap-2 text-foreground-secondary mb-2">
                                <Calendar className="w-5 h-5" />
                                <h2 className="text-sm font-extrabold uppercase tracking-wider">Last Sync</h2>
                            </div>
                            <p className="text-xs text-foreground-secondary font-medium">
                                {new Date(lastUpdated).toLocaleString()}
                            </p>
                        </div>
                    )}

                    {/* Writing Tips - Shared with Create Page */}
                    <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                        <div className="flex items-center gap-2 text-foreground-secondary">
                            <Zap className="w-5 h-5" />
                            <h2 className="text-sm font-extrabold uppercase tracking-wider">Writing Tips</h2>
                        </div>
                        <div className="space-y-3">
                            {[
                                'Keep paragraphs short for better mobile reading',
                                'Aim for 1000-3000 words per chapter',
                                'End with a hook to keep readers engaged',
                                'Proofread before publishing'
                            ].map((tip, i) => (
                                <div key={i} className="flex gap-2">
                                    <div className="w-1 h-1 bg-foreground-secondary rounded-full mt-2 flex-shrink-0" />
                                    <p className="text-xs text-foreground-secondary font-medium leading-relaxed">{tip}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Locking Info */}
                    <div className="bg-background-secondary border border-border rounded-2xl p-6 space-y-3">
                        <div className="flex items-center gap-2 text-foreground-secondary">
                            <Info className="w-5 h-5" />
                            <h2 className="text-xs font-bold uppercase tracking-widest">Publishing Info</h2>
                        </div>
                        <p className="text-xs text-foreground-secondary leading-relaxed font-medium">
                            Chapters 1-7 are automatically set as <span className="text-sky-600 dark:text-sky-400 font-bold">Free</span> to help build your audience.
                        </p>
                    </div>


                </div>
            </div>
        </div>
    );
}
