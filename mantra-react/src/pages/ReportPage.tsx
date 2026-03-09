import { useState, useEffect } from 'react';
import { sanitizeSearchInput } from '@/utils/sanitize';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
    ChevronLeft,
    Book,
    FileText,
    User,
    AlertCircle,
    HelpCircle,
    ChevronRight,
    Search,
    Info,
    Shield,
    X,
    Upload,
    Loader2,
    CheckCircle
} from 'lucide-react';
import reportService from '@/services/reportService';
import { supabase } from '@/lib/supabase/client';
import { getProfilePicture, getNovelCover } from '@/lib/defaultImages';
import { useAppNavigation } from '@/hooks/useAppNavigation';

type ReportType = 'novel' | 'chapter' | 'user' | 'comment' | 'review' | 'technical' | 'other' | null;

export default function ReportPage() {
    const { user, isLoading: authLoading } = useAuth();
    const { goBack, navigate } = useAppNavigation();
    const { toast } = useToast();
    const [searchParams] = useSearchParams();

    const [reportType, setReportType] = useState<ReportType>(null);
    const [selectedReason, setSelectedReason] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Search & Selection State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [, setIsSearching] = useState(false);
    const [selectedItem, setSelectedItem] = useState<{ id: string; name: string; type?: string; extra?: string; image?: string | null } | null>(null);

    // Image Upload State
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Chapter Selection (for chapter reports)
    const [selectedChapter, setSelectedChapter] = useState<{ id: string; title: string } | null>(null);
    const [chaptersList, setChaptersList] = useState<any[]>([]);
    const [isLoadingChapters, setIsLoadingChapters] = useState(false);
    const [chapterSearchQuery, setChapterSearchQuery] = useState('');

    // Prefill data
    const prefillType = searchParams.get('type') as ReportType;
    const prefillId = searchParams.get('id');
    const prefillName = searchParams.get('name');
    const prefillChapter = searchParams.get('chapter');
    const prefillExtra = searchParams.get('extra'); // Novel name for chapter reports

    useEffect(() => {
        if (prefillType) {
            setReportType(prefillType);
            if (prefillId) {
                setSelectedItem({
                    id: prefillId,
                    name: prefillName || 'Selected Item',
                    extra: (prefillChapter || prefillExtra) || undefined
                });
            }
        }
    }, [prefillType, prefillId, prefillName, prefillChapter, prefillExtra]);

    // Handle Search
    useEffect(() => {
        const handleSearch = async () => {
            if (!searchQuery || searchQuery.length < 2 || !reportType) {
                setSearchResults([]);
                return;
            }



            setIsSearching(true);
            try {
                let results: any[] = [];
                if (reportType === 'novel') {
                    const { data } = await supabase
                        .from('novels')
                        .select('id, title, cover_image_url, author:profiles(username)')
                        .ilike('title', `%${sanitizeSearchInput(searchQuery)}%`)
                        .limit(5);
                    results = data || [];
                } else if (reportType === 'user') {
                    const { data } = await supabase
                        .from('profiles')
                        .select('id, username, display_name, profile_picture_url')
                        .ilike('username', `%${sanitizeSearchInput(searchQuery)}%`)
                        .limit(5);
                    results = data || [];
                } else if (reportType === 'chapter') {
                    // For chapters, search novels first (same as novel search)
                    const { data } = await supabase
                        .from('novels')
                        .select('id, title, cover_image_url, author:profiles(username)')
                        .ilike('title', `%${sanitizeSearchInput(searchQuery)}%`)
                        .limit(5);
                    results = data || [];
                }
                setSearchResults(results);
            } catch {

            } finally {
                setIsSearching(false);
            }
        };

        const debounce = setTimeout(handleSearch, 500);
        return () => clearTimeout(debounce);
    }, [searchQuery, reportType]);

    // Fetch chapters when novel is selected for chapter reports
    useEffect(() => {
        const fetchChapters = async () => {
            if (reportType === 'chapter' && selectedItem) {
                setIsLoadingChapters(true);
                setSelectedChapter(null);
                try {
                    const { data } = await supabase
                        .from('chapters')
                        .select('id, title, chapter_number')
                        .eq('novel_id', selectedItem.id)
                        .order('chapter_number', { ascending: false })
                        .limit(100);
                    setChaptersList(data || []);
                } catch {

                    setChaptersList([]);
                } finally {
                    setIsLoadingChapters(false);
                }
            } else {
                setChaptersList([]);
                setSelectedChapter(null);
            }
        };
        fetchChapters();
    }, [selectedItem, reportType]);


    const reportReasons: Record<string, string[]> = {
        novel: ['Plagiarism', 'Inappropriate content', 'Hate speech', 'Violence/Gore', 'Sexual content', 'Copyright infringement', 'Other'],
        chapter: ['Duplicate chapter', 'Wrong chapter order', 'Missing content', 'Inappropriate content', 'Formatting issues', 'Other'],
        user: ['Harassment', 'Spam', 'Impersonation', 'Hate speech', 'Threatening behavior', 'Inappropriate profile', 'Other'],
        technical: ['App crashes', 'Login issues', 'Payment problems', 'Loading errors', 'Performance problems', 'Other'],
        other: ['Feature request', 'General feedback', 'Partnership inquiry', 'Other'],
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation: If type is Novel/User/Chapter, we NEED a selected item
        const requiresSelection = ['novel', 'user', 'chapter'].includes(reportType || '');
        if (requiresSelection && !selectedItem) {
            toast.error('Please search and select the item you want to report.');
            return;
        }

        // For chapter reports, also require a chapter selection
        if (reportType === 'chapter' && !selectedChapter) {
            toast.error('Please select a chapter to report.');
            return;
        }

        if (!user || !reportType || !selectedReason || description.length < 20) return;

        setIsSubmitting(true);
        try {
            let evidenceUrl = undefined;

            // Upload Image if selected
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('report-evidence')
                    .upload(filePath, imageFile);

                if (uploadError) {

                    toast.error('Failed to upload image. Submitting without it.');
                } else {
                    const { data } = supabase.storage
                        .from('report-evidence')
                        .getPublicUrl(filePath);
                    evidenceUrl = data.publicUrl;
                }
            }

            // Use selectedChapter.id for chapter reports, otherwise use selectedItem.id
            const reportedId = reportType === 'chapter' ? selectedChapter!.id : (selectedItem?.id || 'general');

            const result = await reportService.submitReport(user.id, {
                reported_type: reportType as any,
                reported_id: reportedId,
                reason: selectedReason,
                description: description.trim(),
                evidence_url: evidenceUrl
            });

            if (result.success) {
                toast.success('Report submitted successfully');
                setTimeout(() => navigate('/'), 1500);
            } else {
                toast.error(result.message);
            }
        } catch (error) {

            toast.error('Failed to submit report. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error('Image size must be less than 5MB');
            return;
        }

        setImageFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
    };

    const removeImage = () => {
        setImageFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
    };

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [authLoading, user, navigate]);

    if (authLoading) return null;
    if (!user) return null; // Will redirect via useEffect

    // Success screen removed in favor of toast


    return (
        <div className="min-h-screen flex flex-col w-full bg-background text-foreground font-inter antialiased">
            {/* Header */}
            {/* Header */}
            <div className="sticky top-0 bg-background z-40 border-b border-border">
                <div className="px-4 py-3 flex items-center gap-2 w-full">
                    <button
                        onClick={() => reportType ? setReportType(null) : goBack()}
                        className="p-2 rounded-lg hover:bg-background-secondary active:scale-95 transition-transform"
                    >
                        <ChevronLeft className="w-5 h-5 text-foreground-secondary" />
                    </button>
                    <div className="text-base font-semibold">Report</div>
                </div>
            </div>

            <div className="px-4 pt-4 pb-24 space-y-4 w-full">
                {/* Report Type Selection - Only show if no type selected */}
                {!reportType && (
                    <div className="animate-in fade-in duration-300">
                        <label className="block text-xs text-foreground-secondary mb-2 font-medium">What would you like to report?</label>
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {[
                                { id: 'novel', label: 'Report a Novel', sub: 'Content issues, plagiarism, etc.', icon: Book, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-100 dark:bg-sky-500/20' },
                                { id: 'chapter', label: 'Report a Chapter', sub: 'Specific chapter problems', icon: FileText, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-500/20' },
                                { id: 'user', label: 'Report a User', sub: 'Harassment, spam, abuse', icon: User, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-500/20' },
                                { id: 'technical', label: 'Technical Issue', sub: 'Bugs, errors, crashes', icon: AlertCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-500/20' },
                                { id: 'other', label: 'Other', sub: 'Something else', icon: HelpCircle, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-500/20' }
                            ].map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => setReportType(type.id as ReportType)}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/40 hover:shadow-md active:scale-98 transition group"
                                >
                                    <div className={`h-10 w-10 rounded-xl ${type.bg} flex items-center justify-center flex-shrink-0`}>
                                        <type.icon className={`w-5 h-5 ${type.color}`} />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="text-sm font-semibold text-foreground">{type.label}</div>
                                        <div className="text-xs text-foreground-secondary">{type.sub}</div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-foreground-secondary group-hover:text-foreground transition-colors" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Report Form */}
                {reportType && (
                    <div className="max-w-3xl mx-auto space-y-4 animate-in slide-in-from-bottom-4 duration-300">

                        {/* Target Selection Logic */}
                        {(['novel', 'chapter'].includes(reportType)) && (
                            <div>
                                <label className="block text-xs text-foreground-secondary mb-1 font-medium">Search for the novel <span className="text-red-500">*</span></label>
                                {!selectedItem ? (
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full rounded-xl border border-border pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500 bg-card placeholder:text-muted-foreground text-foreground"
                                            placeholder="Type novel name..."
                                            autoFocus
                                        />

                                        {/* Dropdown Results */}
                                        {searchResults.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto">
                                                {searchResults.map((result) => (
                                                    <button
                                                        key={result.id}
                                                        onClick={() => {
                                                            setSelectedItem({
                                                                id: result.id,
                                                                name: result.title || result.username || 'Unknown',
                                                                type: 'novel',
                                                                image: result.cover_image_url
                                                            });
                                                            setSearchQuery('');
                                                            setSearchResults([]);
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-background-secondary border-b border-border last:border-0 flex items-center gap-3"
                                                    >
                                                        <img
                                                            src={getNovelCover(result.cover_image_url)}
                                                            alt=""
                                                            className="w-8 h-10 object-cover rounded shadow-sm bg-muted"
                                                        />
                                                        <div>
                                                            <div className="text-sm font-semibold text-foreground">{result.title}</div>
                                                            <div className="text-xs text-foreground-secondary">by {result.author?.username || 'Unknown'}</div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-background-secondary">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={getNovelCover(selectedItem.image)}
                                                alt=""
                                                className="w-10 h-14 object-cover rounded bg-white shadow-sm"
                                            />
                                            <div>
                                                <div className="text-xs text-foreground-secondary font-medium uppercase tracking-wide">Selected Novel</div>
                                                <div className="text-sm font-bold text-foreground">{selectedItem.name}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedItem(null)}
                                            className="text-xs font-semibold text-sky-600 hover:text-sky-700 px-3 py-1.5 hover:bg-sky-500/10 rounded-lg transition-colors"
                                        >
                                            Change
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Chapter Select (Mockup for now, follows HTML logic) */}
                        {reportType === 'chapter' && selectedItem && (
                            <div>
                                <label className="block text-xs text-foreground-secondary mb-1 font-medium">Search Chapter <span className="text-red-500">*</span></label>
                                {isLoadingChapters ? (
                                    <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Loading chapters...
                                    </div>
                                ) : chaptersList.length === 0 ? (
                                    <div className="text-sm text-muted-foreground py-2">No chapters found for this novel.</div>
                                ) : !selectedChapter ? (
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary" />
                                        <input
                                            type="text"
                                            value={chapterSearchQuery}
                                            onChange={(e) => setChapterSearchQuery(e.target.value)}
                                            className="w-full rounded-xl border border-border pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500 bg-card placeholder:text-muted-foreground text-foreground"
                                            placeholder="Type chapter number or title..."
                                        />
                                        {/* Filtered Chapter Results */}
                                        {chapterSearchQuery.length >= 1 && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto">
                                                {chaptersList
                                                    .filter(ch =>
                                                        ch.title.toLowerCase().includes(chapterSearchQuery.toLowerCase()) ||
                                                        String(ch.chapter_number).includes(chapterSearchQuery)
                                                    )
                                                    .slice(0, 10)
                                                    .map((ch) => (
                                                        <button
                                                            key={ch.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedChapter({ id: ch.id, title: `Ch ${ch.chapter_number}: ${ch.title}` });
                                                                setChapterSearchQuery('');
                                                            }}
                                                            className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 flex items-center gap-3"
                                                        >
                                                            <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                                                <FileText className="w-4 h-4 text-purple-500" />
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-semibold text-slate-800">Chapter {ch.chapter_number}</div>
                                                                <div className="text-xs text-slate-500 truncate max-w-xs">{ch.title}</div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                {chaptersList.filter(ch =>
                                                    ch.title.toLowerCase().includes(chapterSearchQuery.toLowerCase()) ||
                                                    String(ch.chapter_number).includes(chapterSearchQuery)
                                                ).length === 0 && (
                                                        <div className="px-4 py-3 text-sm text-slate-400">No chapters match your search.</div>
                                                    )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                                <FileText className="w-4 h-4 text-purple-500" />
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Selected Chapter</div>
                                                <div className="text-sm font-bold text-slate-800">{selectedChapter.title}</div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedChapter(null)}
                                            className="text-xs font-semibold text-sky-600 hover:text-sky-700 px-3 py-1.5 hover:bg-sky-50 rounded-lg transition-colors"
                                        >
                                            Change
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* User Search */}
                        {reportType === 'user' && (
                            <div>
                                <label className="block text-xs text-slate-500 mb-1 font-medium">Username or profile link <span className="text-slate-400">*</span></label>
                                {!selectedItem ? (
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500 bg-white placeholder:text-slate-400"
                                            placeholder="@username"
                                            autoFocus
                                        />
                                        {/* Dropdown Results */}
                                        {searchResults.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto">
                                                {searchResults.map((result) => (
                                                    <button
                                                        key={result.id}
                                                        onClick={() => {
                                                            setSelectedItem({
                                                                id: result.id,
                                                                name: result.username || 'Unknown',
                                                                type: 'user',
                                                                image: result.profile_picture_url,
                                                                extra: result.display_name
                                                            });
                                                            setSearchQuery('');
                                                            setSearchResults([]);
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-background-secondary border-b border-border last:border-0 flex items-center gap-3"
                                                    >
                                                        <img
                                                            src={getProfilePicture(result.profile_picture_url, result.username)}
                                                            alt=""
                                                            className="w-8 h-8 rounded-full object-cover border border-border"
                                                        />
                                                        <div>
                                                            <div className="text-sm font-semibold text-foreground">@{result.username}</div>
                                                            {result.display_name && <div className="text-xs text-foreground-secondary">{result.display_name}</div>}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={getProfilePicture(selectedItem.image, selectedItem.name)}
                                                alt=""
                                                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                                            />
                                            <div>
                                                <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Report Target</div>
                                                <div className="text-sm font-bold text-slate-800">@{selectedItem.name}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedItem(null)}
                                            className="text-xs font-semibold text-sky-600 hover:text-sky-700 px-3 py-1.5 hover:bg-sky-50 rounded-lg transition-colors"
                                        >
                                            Change
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Reason Selection */}
                        <div>
                            <label className="block text-xs text-slate-500 mb-2 font-medium">Reason <span className="text-slate-400">*</span></label>
                            <div className="space-y-2">
                                {reportReasons[reportType || 'other']?.map((reason) => (
                                    <button
                                        key={reason}
                                        type="button"
                                        onClick={() => setSelectedReason(reason)}
                                        className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-all ${selectedReason === reason
                                            ? 'bg-sky-50 border-sky-500 text-sky-700 font-medium shadow-sm'
                                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                                            }`}
                                    >
                                        {reason}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-xs text-slate-500 mb-1 font-medium">Description <span className="text-slate-400">*</span></label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={5}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/50 bg-white placeholder:text-slate-400 resize-none text-slate-700"
                                placeholder="Please provide details about the issue..."
                            />
                            <div className={`text-xs mt-1 font-medium ${description.length < 20 ? 'text-slate-400' : 'text-emerald-600'}`}>
                                {description.length < 20 ? `Minimum 20 characters (${20 - description.length} left)` : 'Length requirement met'}
                            </div>
                        </div>

                        {/* Screenshots */}
                        <div>
                            <label className="block text-xs text-slate-500 mb-1 font-medium">Screenshots (Optional)</label>

                            {!previewUrl ? (
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-sky-300 hover:bg-sky-50 transition-colors text-sm text-slate-600 flex items-center justify-center gap-2 group">
                                        <Upload className="w-4 h-4 text-slate-400 group-hover:text-sky-500" />
                                        <span>Upload evidence</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative w-full h-48 rounded-xl overflow-hidden border border-slate-200 group">
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        onClick={removeImage}
                                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !selectedReason || description.length < 20 || (['novel', 'user', 'chapter'].includes(reportType) && !selectedItem)}
                            className="w-full rounded-xl bg-sky-500 text-white text-sm font-semibold py-3 shadow-md active:scale-95 transition-all hover:bg-sky-600 disabled:opacity-50 disabled:shadow-none disabled:active:scale-100"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Report'}
                        </button>

                        {/* Disclaimer */}
                        <div className="rounded-xl border border-slate-100 bg-amber-50 p-3">
                            <div className="flex gap-2 items-start">
                                <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div className="text-xs text-amber-900 leading-relaxed">
                                    False reports may result in account restrictions. We review all reports within 24-48 hours.
                                </div>
                            </div>
                        </div>
                    </div>
                )
                }

                {/* Help Section - Always visible */}
                <div className="mt-8 max-w-4xl mx-auto">
                    <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-sky-50 p-6 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="h-10 w-10 rounded-xl bg-sky-500 flex items-center justify-center flex-shrink-0 shadow-md">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="text-base font-bold text-slate-800">Our Commitment to Safety</div>
                                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                                    We're dedicated to maintaining a safe and respectful community. Your reports help us keep Mantra a better place for everyone. All reports are reviewed within 24-48 hours.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div >

            {/* Report History */}
            {user && <UserReportsList userId={user.id} />}
        </div >

    );
}

function UserReportsList({ userId }: { userId: string }) {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const data = await reportService.getUserReports(userId);
                setReports(data);
            } catch {

            } finally {
                setLoading(false);
            }
        };

        fetchReports();

        // Subscribe to changes
        const channel = supabase
            .channel('report_changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'reports',
                    filter: `reporter_id=eq.${userId}`
                },
                (payload) => {
                    setReports(prev => prev.map(report =>
                        report.id === payload.new.id ? { ...report, ...payload.new } : report
                    ));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);

    if (loading) return <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>;
    if (reports.length === 0) return null;

    return (
        <div className="px-4 pb-24 w-full">
            <div className="max-w-4xl mx-auto mt-10 pt-10 border-t border-slate-200">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-slate-800">My Reports</h2>
                    <span className="text-xs text-slate-400">{reports.length} total</span>
                </div>
                <div className="space-y-4">
                    {reports.map((report) => (
                        <div key={report.id} className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300 hover:shadow-sm transition-all h-full">
                            <div>
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                                {report.reported_type}
                                            </span>
                                            <span className="text-slate-300">•</span>
                                            <span className="text-xs text-slate-400 font-medium">
                                                {new Date(report.created_at).toLocaleDateString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                        <h3 className="font-semibold text-slate-800 text-base">{report.reason}</h3>
                                    </div>
                                </div>

                                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                                    {report.description}
                                </p>

                            </div>
                            {/* Admin Resolution Note */}
                            {(report.resolution_notes || report.status === 'resolved') && (
                                <div className="relative mt-3 rounded-lg bg-sky-50 border border-sky-100 p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-4 h-4 rounded-full bg-sky-500 flex items-center justify-center">
                                            <CheckCircle className="w-2.5 h-2.5 text-white" />
                                        </div>
                                        <span className="text-xs text-sky-700 font-bold uppercase tracking-wide">
                                            Resolution
                                        </span>
                                        {report.resolved_at && (
                                            <span className="text-[10px] text-sky-400 ml-auto">
                                                {new Date(report.resolved_at).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-slate-700 text-sm leading-relaxed pl-6">
                                        {report.resolution_notes || 'This report has been reviewed and resolved.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

