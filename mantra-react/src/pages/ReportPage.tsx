import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
    CheckCircle2,
    X,
    Upload,
    MessageSquare,
    Star
} from 'lucide-react';
import reportService from '@/services/reportService';

type ReportType = 'novel' | 'chapter' | 'user' | 'comment' | 'review' | 'technical' | 'other' | null;

export default function ReportPage() {
    const { user, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [searchParams] = useSearchParams();

    const [reportType, setReportType] = useState<ReportType>(null);
    const [selectedReason, setSelectedReason] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Prefill data
    const prefillType = searchParams.get('type') as ReportType;
    const prefillId = searchParams.get('id');
    const prefillName = searchParams.get('name');
    const prefillChapter = searchParams.get('chapter');

    useEffect(() => {
        if (prefillType) {
            setReportType(prefillType);
        }
    }, [prefillType]);

    const reportTypes = [
        {
            id: 'novel' as ReportType,
            icon: Book,
            title: 'Report a Novel',
            subtitle: 'Content issues, plagiarism, etc.',
            bgColor: 'bg-card border border-border',
            iconColor: 'text-sky-500',
        },
        {
            id: 'chapter' as ReportType,
            icon: FileText,
            title: 'Report a Chapter',
            subtitle: 'Specific chapter problems',
            bgColor: 'bg-card border border-border',
            iconColor: 'text-purple-500',
        },
        {
            id: 'comment' as ReportType,
            icon: MessageSquare,
            title: 'Report a Comment',
            subtitle: 'Harassment, spam',
            bgColor: 'bg-card border border-border',
            iconColor: 'text-indigo-500',
        },
        {
            id: 'review' as ReportType,
            icon: Star,
            title: 'Report a Review',
            subtitle: 'Fake, inappropriate',
            bgColor: 'bg-card border border-border',
            iconColor: 'text-pink-500',
        },
        {
            id: 'user' as ReportType,
            icon: User,
            title: 'Report a User',
            subtitle: 'Harassment, spam, abuse',
            bgColor: 'bg-card border border-border',
            iconColor: 'text-amber-500',
        },
        {
            id: 'technical' as ReportType,
            icon: AlertCircle,
            title: 'Technical Issue',
            subtitle: 'Bugs, errors, crashes',
            bgColor: 'bg-card border border-border',
            iconColor: 'text-red-500',
        },
        {
            id: 'other' as ReportType,
            icon: HelpCircle,
            title: 'Other',
            subtitle: 'Something else',
            bgColor: 'bg-card border border-border',
            iconColor: 'text-slate-500',
        },
    ];

    const reportReasons: Record<string, string[]> = {
        novel: ['Plagiarism', 'Inappropriate content', 'Hate speech', 'Violence/Gore', 'Sexual content', 'Copyright infringement', 'Other'],
        chapter: ['Duplicate chapter', 'Wrong chapter order', 'Missing content', 'Inappropriate content', 'Formatting issues', 'Other'],
        user: ['Harassment', 'Spam', 'Impersonation', 'Hate speech', 'Threatening behavior', 'Inappropriate profile', 'Other'],
        comment: ['Harassment', 'Spam', 'Hate speech', 'Inappropriate content', 'Off-topic', 'Other'],
        review: ['Harassment', 'Spam', 'Hate speech', 'Inappropriate content', 'Fake review', 'Other'],
        technical: ['App crashes', 'Login issues', 'Payment problems', 'Loading errors', 'Performance problems', 'Other'],
        other: ['Feature request', 'General feedback', 'Partnership inquiry', 'Other'],
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !reportType || !selectedReason || description.length < 20) return;

        setIsSubmitting(true);
        try {
            const result = await reportService.submitReport(user.id, {
                reported_type: reportType as any,
                reported_id: prefillId || 'general',
                reason: selectedReason,
                description: description.trim(),
            });

            if (result.success) {
                setIsSuccess(true);
                toast.success('Report submitted successfully');
                setTimeout(() => navigate(-1), 2000);
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            console.error('Error submitting report:', error);
            toast.error('Failed to submit report. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [authLoading, user, navigate]);

    if (authLoading) return null;
    if (!user) return null; // Will redirect via useEffect

    if (isSuccess) {
        return (
            <div className="max-w-xl mx-auto min-h-screen flex items-center justify-center p-6 bg-background font-inter">
                <div className="text-center animate-in fade-in zoom-in duration-300 w-full">
                    <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-[40px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-100 dark:shadow-emerald-900/10 border border-emerald-100 dark:border-emerald-800">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 dark:text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-foreground mb-2 tracking-tight">Report Submitted</h2>
                    <p className="text-sm font-medium text-muted-foreground leading-relaxed max-w-xs mx-auto">
                        Thank you for helping us keep Mantra safe.<br />We'll review your report within 24-48 hours.
                    </p>
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-8 px-8 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-sky-200 dark:shadow-sky-900/20"
                    >
                        Return
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1800px] mx-auto bg-background min-h-screen pb-24 font-inter text-foreground">
            {/* Header */}
            <div className="sticky top-0 bg-background z-40 border-b border-border">
                <div className="px-6 py-4 flex items-center gap-4">
                    <button
                        onClick={() => reportType ? setReportType(null) : navigate(-1)}
                        className="p-2 hover:bg-background-secondary rounded-xl transition-colors text-foreground-secondary hover:text-foreground"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold text-foreground">Report</h1>
                </div>
            </div>

            <div className="px-6 py-8">
                {!reportType ? (
                    <div className="space-y-6">
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4">What would you like to report?</p>
                        <div className="space-y-2">
                            {reportTypes.map((type) => {
                                const Icon = type.icon;
                                return (
                                    <button
                                        key={type.id}
                                        onClick={() => setReportType(type.id)}
                                        className="w-full flex items-center gap-4 p-4 rounded-[28px] border border-border bg-card hover:border-sky-100 hover:shadow-xl hover:shadow-slate-100/50 dark:hover:shadow-none transition-all group text-left active:scale-[0.98]"
                                    >
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${type.bgColor} ${type.iconColor}`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-foreground">{type.title}</p>
                                            <p className="text-xs text-foreground-secondary font-medium">{type.subtitle}</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-sky-500 transition-transform group-hover:translate-x-1" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        {/* Selected Type Context */}
                        <div className="flex items-center gap-3 p-4 bg-background-secondary rounded-[28px] border border-border">
                            <div className="w-10 h-10 bg-card rounded-xl flex items-center justify-center text-sky-500 shadow-sm border border-border">
                                {(() => {
                                    const TypeIcon = reportTypes.find(t => t.id === reportType)?.icon;
                                    return TypeIcon ? <TypeIcon className="w-5 h-5" /> : null;
                                })()}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Report Category</p>
                                <p className="text-sm font-extrabold text-foreground leading-none">
                                    {reportTypes.find(t => t.id === reportType)?.title}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setReportType(null)}
                                className="ml-auto p-2 text-muted-foreground hover:text-red-500 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Prefilled Context Info */}
                        {prefillId && (
                            <div className="p-5 bg-card/50 rounded-[32px] border border-border flex items-start gap-4">
                                <Search className="w-5 h-5 text-sky-500 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Reporting context</p>
                                    <p className="text-sm font-bold text-foreground">{prefillName || 'Selection'}</p>
                                    {prefillChapter && <p className="text-[11px] text-sky-600 dark:text-sky-400 font-bold mt-0.5 uppercase tracking-wide">Chapter: {prefillChapter}</p>}
                                </div>
                            </div>
                        )}

                        {/* Reason Selection Grid */}
                        <div className="space-y-3">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Select a Reason <span className="text-red-400">*</span></p>
                            <div className="flex flex-wrap gap-2">
                                {reportReasons[reportType === 'comment' || reportType === 'review' ? reportType : reportType || 'other']?.map((reason) => (
                                    <button
                                        key={reason}
                                        type="button"
                                        onClick={() => setSelectedReason(reason)}
                                        className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all border ${selectedReason === reason
                                            ? 'bg-sky-500 border-sky-500 text-white shadow-lg shadow-sky-100 dark:shadow-sky-900/30'
                                            : 'bg-card border-border text-foreground-secondary hover:border-sky-200 hover:text-sky-500'
                                            }`}
                                    >
                                        {reason}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">
                                Description <span className="text-red-400">*</span>
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Please provide details about the issue..."
                                className="w-full h-40 p-5 rounded-[32px] border border-border bg-card focus:border-sky-500 focus:ring-4 focus:ring-sky-50 dark:focus:ring-sky-900/30 outline-none transition-all text-sm font-medium leading-relaxed resize-none text-foreground placeholder:text-muted-foreground"
                            />
                            <p className={`text-[10px] font-bold px-4 ${description.length < 20 ? 'text-muted-foreground' : 'text-emerald-500'}`}>
                                {description.length < 20 ? `Min. 20 characters required (${20 - description.length} left)` : 'Length satisfied!'}
                            </p>
                        </div>

                        {/* Screenshots Mockup */}
                        <div className="space-y-3">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Screenshots (Optional)</p>
                            <button type="button" className="w-full py-8 border-2 border-dashed border-border rounded-[32px] flex flex-col items-center justify-center gap-2 hover:border-sky-200 transition-colors text-muted-foreground hover:text-sky-500 group">
                                <Upload className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                <span className="text-[11px] font-bold uppercase tracking-widest">Upload images</span>
                            </button>
                        </div>

                        {/* Disclaimer */}
                        <div className="flex items-start gap-4 p-5 bg-card rounded-[32px] border border-border border-dashed">
                            <Info className="w-5 h-5 text-foreground-secondary mt-0.5 flex-shrink-0" />
                            <p className="text-[11px] text-foreground-secondary leading-relaxed font-bold uppercase tracking-wide">
                                False reports may result in account restrictions. We review all reports within 24-48 hours.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || !selectedReason || description.length < 20}
                            className="w-full py-5 bg-sky-500 text-white rounded-[28px] font-extrabold text-sm hover:bg-sky-600 transition-all shadow-xl shadow-sky-100 dark:shadow-sky-900/30 disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none active:scale-[0.98]"
                        >
                            {isSubmitting ? 'SUBMITTING...' : 'SUBMIT REPORT'}
                        </button>

                        <div className="flex items-center gap-4 pt-4 border-t border-border justify-center opacity-60">
                            <Shield className="w-4 h-4 text-emerald-500" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Community Safety Commitment</span>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
