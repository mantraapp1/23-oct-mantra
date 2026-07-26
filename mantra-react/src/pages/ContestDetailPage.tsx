import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import contestService from '@/services/contestService';
import type { Contest, ContestSubmissionWithNovel, Novel } from '@/types/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Calendar, Award, Info, Loader2, ArrowLeft, X, BookOpen, Clock } from 'lucide-react';
import SEO from '@/components/seo/SEO';
import { getNovelCover, getContestBanner } from '@/lib/defaultImages';
import { supabase } from '@/lib/supabase/client';
import UserAvatar from '@/components/common/UserAvatar';

export default function ContestDetailPage() {
    const { id: contestId } = useParams<{ id: string }>();
    const { user } = useAuth();

    const [contest, setContest] = useState<Contest | null>(null);
    const [submissions, setSubmissions] = useState<ContestSubmissionWithNovel[]>([]);
    const [eligibleNovels, setEligibleNovels] = useState<Array<Novel & { isEligible: boolean; reason?: string }>>([]);
    const [winnerNovel, setWinnerNovel] = useState<any | null>(null);
    const [winnerNovel2, setWinnerNovel2] = useState<any | null>(null);
    const [winnerNovel3, setWinnerNovel3] = useState<any | null>(null);

    const [loading, setLoading] = useState(true);
    const [submitModalOpen, setSubmitModalOpen] = useState(false);
    const [loadingNovels, setLoadingNovels] = useState(false);
    const [submittingNovelId, setSubmittingNovelId] = useState<string | null>(null);

    // Countdown state
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [isEnded, setIsEnded] = useState(false);

    const loadContestData = useCallback(async () => {
        if (!contestId) return;

        try {
            const [contestData, submissionsData] = await Promise.all([
                contestService.getContestById(contestId),
                contestService.getContestSubmissions(contestId)
            ]);

            setContest(contestData);
            setSubmissions(submissionsData);

            if (contestData?.winner_novel_id) {
                const { data: novelData } = await supabase
                    .from('novels')
                    .select(`
                        id, title, cover_image_url, genres,
                        author:profiles!novels_author_id_fkey(username, display_name, profile_picture_url, founding_author_number)
                    `)
                    .eq('id', contestData.winner_novel_id)
                    .single();
                if (novelData) {
                    setWinnerNovel(novelData as any);
                }
            } else {
                setWinnerNovel(null);
            }

            const cData = contestData as any;
            if (cData?.winner_novel_id_2) {
                const { data: novelData } = await supabase
                    .from('novels')
                    .select(`
                        id, title, cover_image_url, genres,
                        author:profiles!novels_author_id_fkey(username, display_name, profile_picture_url, founding_author_number)
                    `)
                    .eq('id', cData.winner_novel_id_2)
                    .single();
                if (novelData) {
                    setWinnerNovel2(novelData as any);
                }
            } else {
                setWinnerNovel2(null);
            }

            if (cData?.winner_novel_id_3) {
                const { data: novelData } = await supabase
                    .from('novels')
                    .select(`
                        id, title, cover_image_url, genres,
                        author:profiles!novels_author_id_fkey(username, display_name, profile_picture_url, founding_author_number)
                    `)
                    .eq('id', cData.winner_novel_id_3)
                    .single();
                if (novelData) {
                    setWinnerNovel3(novelData as any);
                }
            } else {
                setWinnerNovel3(null);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [contestId]);

    useEffect(() => {
        setLoading(true);
        loadContestData();
    }, [loadContestData]);

    // Calculate time remaining
    useEffect(() => {
        if (!contest) return;

        const calculateTimeLeft = () => {
            const difference = +new Date(contest.end_date) - +new Date();
            let newTimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

            if (difference > 0) {
                newTimeLeft = {
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                };
                setTimeLeft(newTimeLeft);
                setIsEnded(false);
            } else {
                setIsEnded(true);
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [contest]);

    const handleOpenSubmitModal = async () => {
        if (!contestId || !user) return;

        setSubmitModalOpen(true);
        setLoadingNovels(true);
        try {
            const novels = await contestService.getUserEligibleNovels(contestId, user.id);
            setEligibleNovels(novels);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingNovels(false);
        }
    };

    const handleSubmitNovel = async (novelId: string) => {
        if (!contestId || !user) return;

        setSubmittingNovelId(novelId);
        try {
            const res = await contestService.submitNovel(contestId, novelId, user.id);
            if (res.success) {
                setSubmitModalOpen(false);
                loadContestData();
            } else {
                alert(res.message);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSubmittingNovelId(null);
        }
    };

    const getContestStatus = (c: Contest) => {
        const now = new Date();
        const start = new Date(c.start_date);
        const end = new Date(c.end_date);

        if (now < start) return 'upcoming';
        if (now > end) return 'completed';
        return 'active';
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-foreground-secondary font-medium">Loading contest details...</p>
            </div>
        );
    }

    if (!contest) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-8">
                <span className="text-4xl mb-4">⚠️</span>
                <h3 className="text-xl font-bold mb-2">Contest Not Found</h3>
                <p className="text-foreground-secondary mb-4">The contest you are looking for does not exist or has been deleted.</p>
                <Link to="/contests" className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold transition-colors">
                    Back to Contests
                </Link>
            </div>
        );
    }

    const status = getContestStatus(contest);
    // Find the current author's submission
    const userSubmission = user ? submissions.find(s => s.novel.author_id === user.id) : null;

    const bannerUrl = contest.banner_image_url || getContestBanner(contest.id);

    return (
        <div className="min-h-screen bg-[var(--background)] font-sans text-[var(--foreground)] pb-24 animate-in">
            <SEO
                title={`${contest.name} | Mantra`}
                description={contest.description || 'Competition details, rules, prizes, and submissions on Mantra.'}
                url={`/contests/${contest.id}`}
            />

            {/* Back to Contests Header */}
            <div className="w-full max-w-[1800px] mx-auto px-4 pt-6 text-left">
                <Link 
                    to="/contests" 
                    className="inline-flex items-center gap-2 text-sm font-bold text-[var(--foreground-secondary)] hover:text-[var(--primary)] transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" /> 
                    <span>Back to Contests</span>
                </Link>
            </div>

            {/* Main Details Layout */}
            <div className="w-full max-w-[1800px] mx-auto px-4 mt-6 space-y-8">
                
                {/* Premium Banner Header */}
                <div className="relative h-64 sm:h-80 w-full rounded-[var(--radius-xl)] overflow-hidden shadow-md border border-[var(--border)] bg-[var(--background-secondary)]">
                    <img src={bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />
                    
                    <div className="absolute bottom-0 left-0 p-6 md:p-8 space-y-3 w-full">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider backdrop-blur-md border ${
                                status === 'active' ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/30' :
                                status === 'upcoming' ? 'bg-blue-500/25 text-blue-300 border-blue-500/30' :
                                'bg-zinc-500/25 text-zinc-300 border-zinc-500/30'
                            }`}>
                                {status === 'active' ? 'Active Now' : status === 'upcoming' ? 'Upcoming' : 'Completed'}
                            </span>
                            {contest.requires_new_novel && (
                                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase tracking-wider backdrop-blur-md">
                                    New Novels Only
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight !text-white text-left" style={{ color: '#ffffff' }}>{contest.name}</h1>
                        <p className="text-xs md:text-sm text-slate-200 max-w-3xl line-clamp-2 leading-relaxed text-left">
                            {contest.description || 'No description provided.'}
                        </p>
                    </div>
                </div>

                {/* Detail Columns */}
                <div className="grid gap-8 lg:grid-cols-3">
                    
                    {/* Left Column (2/3): Content details and submissions */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Winner Showcase Banner */}
                        {isEnded && (
                            <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-600/10 border border-amber-500/30 rounded-[var(--radius-xl)] p-6 md:p-8 space-y-6 shadow-sm text-left relative overflow-hidden">
                                <div className="absolute right-0 top-0 w-64 h-64 bg-[radial-gradient(circle,rgba(245,158,11,0.08)_0%,rgba(255,255,255,0)_70%)] pointer-events-none" />
                                
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        <Award className="w-6 h-6 text-amber-500 animate-bounce" />
                                        <h2 className="text-xl font-black text-amber-500 uppercase tracking-widest">Contest Winners</h2>
                                    </div>
                                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 font-bold uppercase tracking-wider">
                                        Official Podiums
                                    </span>
                                </div>

                                {winnerNovel && winnerNovel2 && winnerNovel3 ? (
                                    /* Three-Winner Podium Grid */
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end relative z-10 pt-4">
                                        {/* Rank 2 (Silver) */}
                                        <div className="flex flex-col items-center bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 hover:border-slate-400/40 transition-all text-center space-y-3 order-2 md:order-1 md:h-[92%] justify-between">
                                            <div className="space-y-3 flex flex-col items-center w-full">
                                                <span className="text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-300/30 font-extrabold uppercase tracking-wider">
                                                    🥈 2nd Place
                                                </span>
                                                <Link
                                                    to={`/novel/${winnerNovel2.id}`}
                                                    className="w-20 h-30 rounded-xl bg-[var(--background-secondary)] overflow-hidden shrink-0 border border-[var(--border)] shadow-md hover:scale-[1.02] transition-transform block"
                                                >
                                                    <img
                                                        src={getNovelCover(winnerNovel2.cover_image_url)}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                </Link>
                                                <div className="space-y-1 w-full">
                                                    <h3 className="font-extrabold text-sm text-[var(--foreground)] truncate">
                                                        <Link to={`/novel/${winnerNovel2.id}`} className="hover:text-[var(--primary)] transition-colors">
                                                            {winnerNovel2.title}
                                                        </Link>
                                                    </h3>
                                                    <p className="text-[11px] text-[var(--foreground-secondary)] truncate">
                                                        By {winnerNovel2.author?.display_name || winnerNovel2.author?.username}
                                                    </p>
                                                </div>
                                            </div>
                                            <Link
                                                to={`/novel/${winnerNovel2.id}`}
                                                className="w-full py-2 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] hover:border-slate-400/40 text-xs font-bold text-[var(--foreground-secondary)] hover:text-[var(--foreground)] text-center transition-all block"
                                            >
                                                Read Story
                                            </Link>
                                        </div>

                                        {/* Rank 1 (Gold) */}
                                        <div className="flex flex-col items-center bg-[var(--card)] border border-amber-500/30 rounded-2xl p-6 hover:border-amber-500/50 transition-all text-center space-y-4 order-1 md:order-2 md:scale-[1.04] shadow-md shadow-amber-500/5 justify-between">
                                            <div className="space-y-3.5 flex flex-col items-center w-full">
                                                <span className="text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 font-extrabold uppercase tracking-wider animate-pulse">
                                                    👑 Winner / 1st
                                                </span>
                                                <Link
                                                    to={`/novel/${winnerNovel.id}`}
                                                    className="w-24 h-36 rounded-xl bg-[var(--background-secondary)] overflow-hidden shrink-0 border border-[var(--border)] shadow-lg hover:scale-[1.02] transition-transform block"
                                                >
                                                    <img
                                                        src={getNovelCover(winnerNovel.cover_image_url)}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                </Link>
                                                <div className="space-y-1 w-full">
                                                    <h3 className="font-extrabold text-base text-[var(--foreground)] truncate">
                                                        <Link to={`/novel/${winnerNovel.id}`} className="hover:text-[var(--primary)] transition-colors">
                                                            {winnerNovel.title}
                                                        </Link>
                                                    </h3>
                                                    <p className="text-xs text-[var(--foreground-secondary)] truncate font-semibold">
                                                        By {winnerNovel.author?.display_name || winnerNovel.author?.username}
                                                    </p>
                                                </div>
                                            </div>
                                            <Link
                                                to={`/novel/${winnerNovel.id}`}
                                                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 text-center transition-all block"
                                            >
                                                Read Winning Story
                                            </Link>
                                        </div>

                                        {/* Rank 3 (Bronze) */}
                                        <div className="flex flex-col items-center bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 hover:border-amber-700/30 transition-all text-center space-y-3 order-3 md:h-[92%] justify-between">
                                            <div className="space-y-3 flex flex-col items-center w-full">
                                                <span className="text-xs px-3 py-1 rounded-full bg-amber-700/10 text-amber-700 dark:text-amber-600 border border-amber-700/20 font-extrabold uppercase tracking-wider">
                                                    🥉 3rd Place
                                                </span>
                                                <Link
                                                    to={`/novel/${winnerNovel3.id}`}
                                                    className="w-20 h-30 rounded-xl bg-[var(--background-secondary)] overflow-hidden shrink-0 border border-[var(--border)] shadow-md hover:scale-[1.02] transition-transform block"
                                                >
                                                    <img
                                                        src={getNovelCover(winnerNovel3.cover_image_url)}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                </Link>
                                                <div className="space-y-1 w-full">
                                                    <h3 className="font-extrabold text-sm text-[var(--foreground)] truncate">
                                                        <Link to={`/novel/${winnerNovel3.id}`} className="hover:text-[var(--primary)] transition-colors">
                                                            {winnerNovel3.title}
                                                        </Link>
                                                    </h3>
                                                    <p className="text-[11px] text-[var(--foreground-secondary)] truncate">
                                                        By {winnerNovel3.author?.display_name || winnerNovel3.author?.username}
                                                    </p>
                                                </div>
                                            </div>
                                            <Link
                                                to={`/novel/${winnerNovel3.id}`}
                                                className="w-full py-2 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] hover:border-amber-700/30 text-xs font-bold text-[var(--foreground-secondary)] hover:text-[var(--foreground)] text-center transition-all block"
                                            >
                                                Read Story
                                            </Link>
                                        </div>
                                    </div>
                                ) : winnerNovel && winnerNovel2 ? (
                                    /* Two-Winner Grid */
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end relative z-10 pt-4 max-w-3xl mx-auto">
                                        {/* Rank 1 (Gold) */}
                                        <div className="flex flex-col items-center bg-[var(--card)] border border-amber-500/30 rounded-2xl p-6 hover:border-amber-500/50 transition-all text-center space-y-4 md:scale-[1.02] shadow-md shadow-amber-500/5 justify-between w-full">
                                            <div className="space-y-3.5 flex flex-col items-center w-full">
                                                <span className="text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 font-extrabold uppercase tracking-wider animate-pulse">
                                                    👑 Winner / 1st
                                                </span>
                                                <Link
                                                    to={`/novel/${winnerNovel.id}`}
                                                    className="w-24 h-36 rounded-xl bg-[var(--background-secondary)] overflow-hidden shrink-0 border border-[var(--border)] shadow-lg hover:scale-[1.02] transition-transform block"
                                                >
                                                    <img
                                                        src={getNovelCover(winnerNovel.cover_image_url)}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                </Link>
                                                <div className="space-y-1 w-full">
                                                    <h3 className="font-extrabold text-base text-[var(--foreground)] truncate">
                                                        <Link to={`/novel/${winnerNovel.id}`} className="hover:text-[var(--primary)] transition-colors">
                                                            {winnerNovel.title}
                                                        </Link>
                                                    </h3>
                                                    <p className="text-xs text-[var(--foreground-secondary)] truncate font-semibold">
                                                        By {winnerNovel.author?.display_name || winnerNovel.author?.username}
                                                    </p>
                                                </div>
                                            </div>
                                            <Link
                                                to={`/novel/${winnerNovel.id}`}
                                                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 text-center transition-all block"
                                            >
                                                Read Winning Story
                                            </Link>
                                        </div>

                                        {/* Rank 2 (Silver) */}
                                        <div className="flex flex-col items-center bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 hover:border-slate-400/40 transition-all text-center space-y-3 justify-between w-full">
                                            <div className="space-y-3 flex flex-col items-center w-full">
                                                <span className="text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-300/30 font-extrabold uppercase tracking-wider">
                                                    🥈 2nd Place
                                                </span>
                                                <Link
                                                    to={`/novel/${winnerNovel2.id}`}
                                                    className="w-20 h-30 rounded-xl bg-[var(--background-secondary)] overflow-hidden shrink-0 border border-[var(--border)] shadow-md hover:scale-[1.02] transition-transform block"
                                                >
                                                    <img
                                                        src={getNovelCover(winnerNovel2.cover_image_url)}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                </Link>
                                                <div className="space-y-1 w-full">
                                                    <h3 className="font-extrabold text-sm text-[var(--foreground)] truncate">
                                                        <Link to={`/novel/${winnerNovel2.id}`} className="hover:text-[var(--primary)] transition-colors">
                                                            {winnerNovel2.title}
                                                        </Link>
                                                    </h3>
                                                    <p className="text-[11px] text-[var(--foreground-secondary)] truncate">
                                                        By {winnerNovel2.author?.display_name || winnerNovel2.author?.username}
                                                    </p>
                                                </div>
                                            </div>
                                            <Link
                                                to={`/novel/${winnerNovel2.id}`}
                                                className="w-full py-2 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] hover:border-slate-400/40 text-xs font-bold text-[var(--foreground-secondary)] hover:text-[var(--foreground)] text-center transition-all block"
                                            >
                                                Read Story
                                            </Link>
                                        </div>
                                    </div>
                                ) : winnerNovel ? (
                                    /* Single Winner Layout */
                                    <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-[var(--card)] border border-[var(--border)] rounded-2xl relative z-10 hover:border-amber-500/30 transition-colors">
                                        {/* Cover */}
                                        <Link
                                            to={`/novel/${winnerNovel.id}`}
                                            className="w-24 h-36 rounded-xl bg-[var(--background-secondary)] overflow-hidden shrink-0 border border-[var(--border)] shadow-md hover:scale-[1.02] transition-transform block"
                                        >
                                            <img
                                                src={getNovelCover(winnerNovel.cover_image_url)}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        </Link>
                                        
                                        <div className="flex-grow text-center sm:text-left space-y-2.5 min-w-0">
                                            <h3 className="font-extrabold text-lg text-[var(--foreground)] truncate">
                                                <Link to={`/novel/${winnerNovel.id}`} className="hover:text-[var(--primary)] transition-colors">
                                                    {winnerNovel.title}
                                                </Link>
                                            </h3>
                                            
                                            <div className="flex items-center justify-center sm:justify-start gap-2">
                                                <UserAvatar
                                                    uri={winnerNovel.author?.profile_picture_url}
                                                    name={winnerNovel.author?.display_name || winnerNovel.author?.username || 'User'}
                                                    size={20}
                                                    showBorder
                                                    borderColorClass="border-[var(--border)]"
                                                />
                                                <span className="text-xs font-semibold text-[var(--foreground-secondary)]">
                                                    By {winnerNovel.author?.display_name || winnerNovel.author?.username || 'Unknown Author'}
                                                </span>
                                            </div>
                                            
                                            <p className="text-xs text-[var(--foreground-secondary)] font-medium">
                                                Congratulations to the author on winning the {contest.name}!
                                            </p>
                                        </div>

                                        <Link
                                            to={`/novel/${winnerNovel.id}`}
                                            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all hover:scale-[1.01] shrink-0 w-full sm:w-auto text-center"
                                        >
                                            Read Winning Story
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-xs text-[var(--foreground-secondary)] bg-[var(--background-secondary)]/50 border border-dashed border-[var(--border)] rounded-2xl">
                                        The winning novels will be announced soon by our editorial team. Stay tuned!
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 1. About the Contest */}
                        <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-xl)] p-6 md:p-8 space-y-4 shadow-sm text-left">
                            <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                                <Info className="w-5 h-5 text-[var(--primary)]" /> About this Competition
                            </h2>
                            <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed whitespace-pre-wrap">
                                {contest.description || 'No description available for this contest.'}
                            </p>
                        </div>

                        {/* 2. Personalized Submission Status */}
                        <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-xl)] p-6 md:p-8 space-y-6 shadow-sm text-left relative overflow-hidden">
                            <div className="absolute right-0 top-0 w-32 h-32 bg-[radial-gradient(circle,rgba(14,165,233,0.05)_0%,rgba(255,255,255,0)_70%)] pointer-events-none" />
                            
                            <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2 relative z-10">
                                <Trophy className="w-5 h-5 text-amber-500" /> Your Submission Status
                            </h2>

                            {!user ? (
                                <div className="text-center py-6">
                                    <p className="text-sm text-[var(--foreground-secondary)] mb-4">You must be logged in as an author to submit a novel to this contest.</p>
                                    <Link to="/login" className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold transition-all">
                                        Login to Participate
                                    </Link>
                                </div>
                            ) : userSubmission ? (
                                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-[var(--background-secondary)] border border-[var(--border)] rounded-2xl relative z-10">
                                    {/* Cover */}
                                    <Link
                                        to={`/novel/${userSubmission.novel_id}`}
                                        className="w-20 h-28 rounded-xl bg-[var(--card)] overflow-hidden shrink-0 border border-[var(--border)] shadow-md hover:scale-[1.01] transition-transform block"
                                    >
                                        <img
                                            src={getNovelCover(userSubmission.novel.cover_image_url)}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    </Link>
                                    {/* Details */}
                                    <div className="flex-grow text-center sm:text-left space-y-2">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
                                            Entered
                                        </span>
                                        <h3 className="font-extrabold text-base text-[var(--foreground)]">
                                            <Link to={`/novel/${userSubmission.novel_id}`} className="hover:text-[var(--primary)] transition-colors">
                                                {userSubmission.novel.title}
                                            </Link>
                                        </h3>
                                        <p className="text-xs text-[var(--foreground-secondary)]">
                                            Your novel has been successfully submitted to this competition.
                                        </p>
                                    </div>
                                    <Link
                                        to={`/novel/${userSubmission.novel_id}`}
                                        className="px-5 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--foreground-secondary)] hover:text-[var(--foreground)] text-xs font-bold shadow-sm transition-all shrink-0 w-full sm:w-auto text-center flex items-center justify-center gap-1.5"
                                    >
                                        <BookOpen className="w-4 h-4" /> View Novel Page
                                    </Link>
                                </div>
                            ) : (
                                <div className="text-center py-8 space-y-4">
                                    <p className="text-sm text-[var(--foreground-secondary)] max-w-md mx-auto">
                                        You haven't submitted a novel to this contest yet. Select one of your eligible stories to compete!
                                    </p>
                                    {status === 'active' ? (
                                        <button
                                            onClick={handleOpenSubmitModal}
                                            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-md shadow-amber-500/20"
                                        >
                                            Submit Your Novel
                                        </button>
                                    ) : (
                                        <p className="text-xs text-red-500 font-semibold">Submissions are currently closed for this timeline stage.</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 3. Rules & Guidelines */}
                        <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-xl)] p-6 md:p-8 space-y-4 shadow-sm text-left">
                            <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                                <Info className="w-5 h-5 text-[var(--primary)]" /> Rules & Entry Guidelines
                            </h2>
                            <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed whitespace-pre-wrap">
                                {contest.rules || 'No guidelines have been specified for this competition.'}
                            </p>
                        </div>

                        {/* 4. Prizes */}
                        <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-xl)] p-6 md:p-8 space-y-4 shadow-sm text-left">
                            <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                                <Award className="w-5 h-5 text-amber-500" /> Reward Details & Prizes
                            </h2>
                            <div className="bg-amber-500/5 border border-amber-500/15 p-5 rounded-2xl">
                                <p className="text-sm text-amber-600 dark:text-amber-400 font-extrabold mb-1">Prize Pool</p>
                                <p className="text-base text-[var(--foreground)] font-bold">{contest.prize || 'No reward specifications detailed yet.'}</p>
                            </div>
                        </div>

                    </div>

                    {/* Right Column (1/3): Countdown, stats, dates */}
                    <div className="lg:col-span-1 space-y-6">
                        
                        {/* Countdown */}
                        <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-xl)] p-6 space-y-4 shadow-sm text-left">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-secondary)] flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-[var(--primary)]" /> {isEnded ? 'Contest Ended' : 'Time Remaining'}
                            </h3>
                            {isEnded ? (
                                <div className="text-sm font-bold text-red-500 py-1">
                                    Submissions are closed for this competition.
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 font-mono text-[var(--foreground)] font-bold">
                                    <div className="bg-[var(--background-secondary)] border border-[var(--border)] px-2.5 py-2 rounded-xl text-center min-w-[40px]">
                                        <span className="text-sm sm:text-base">{timeLeft.days}</span>
                                        <span className="text-[9px] text-[var(--foreground-secondary)] font-sans font-semibold block uppercase">d</span>
                                    </div>
                                    <span className="text-[var(--foreground-secondary)] animate-pulse font-sans">:</span>
                                    <div className="bg-[var(--background-secondary)] border border-[var(--border)] px-2.5 py-2 rounded-xl text-center min-w-[40px]">
                                        <span className="text-sm sm:text-base">{String(timeLeft.hours).padStart(2, '0')}</span>
                                        <span className="text-[9px] text-[var(--foreground-secondary)] font-sans font-semibold block uppercase">h</span>
                                    </div>
                                    <span className="text-[var(--foreground-secondary)] animate-pulse font-sans">:</span>
                                    <div className="bg-[var(--background-secondary)] border border-[var(--border)] px-2.5 py-2 rounded-xl text-center min-w-[40px]">
                                        <span className="text-sm sm:text-base">{String(timeLeft.minutes).padStart(2, '0')}</span>
                                        <span className="text-[9px] text-[var(--foreground-secondary)] font-sans font-semibold block uppercase">m</span>
                                    </div>
                                    <span className="text-[var(--foreground-secondary)] animate-pulse font-sans">:</span>
                                    <div className="bg-[var(--background-secondary)] border border-[var(--border)] px-2.5 py-2 rounded-xl text-center min-w-[40px]">
                                        <span className="text-sm sm:text-base">{String(timeLeft.seconds).padStart(2, '0')}</span>
                                        <span className="text-[9px] text-[var(--foreground-secondary)] font-sans font-semibold block uppercase">s</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Dates */}
                        <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-xl)] p-6 space-y-4 shadow-sm text-left">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-secondary)] flex items-center gap-2">
                                <Calendar className="w-4.5 h-4.5 text-[var(--primary)]" /> Key Dates
                            </h3>
                            <div className="space-y-3 text-xs font-semibold">
                                <div className="bg-[var(--background-secondary)] p-3 rounded-xl border border-[var(--border)]">
                                    <span className="text-[10px] text-[var(--foreground-secondary)] block uppercase">Starts</span>
                                    <span className="text-[var(--foreground)] mt-0.5 block">
                                        {new Date(contest.start_date).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="bg-[var(--background-secondary)] p-3 rounded-xl border border-[var(--border)]">
                                    <span className="text-[10px] text-[var(--foreground-secondary)] block uppercase">Ends / Voting Closes</span>
                                    <span className="text-[var(--foreground)] mt-0.5 block">
                                        {new Date(contest.end_date).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        </div>



                    </div>

                </div>

            </div>

            {/* Submission Selection Modal */}
            {submitModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSubmitModalOpen(false)} />
                    <div className="relative bg-[var(--card)] border border-[var(--border)] w-full max-w-md rounded-[var(--radius-xl)] shadow-xl overflow-hidden animate-in">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-[var(--border)] flex justify-between items-center">
                            <h3 className="text-base font-bold flex items-center gap-2 text-[var(--foreground)]">
                                <Trophy className="w-4.5 h-4.5 text-[var(--primary)]" /> Submit Your Novel
                            </h3>
                            <button onClick={() => setSubmitModalOpen(false)} className="p-1 rounded-full hover:bg-[var(--background-secondary)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)]">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        {/* Content */}
                        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                            {loadingNovels ? (
                                <div className="flex justify-center items-center py-12">
                                    <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
                                </div>
                            ) : eligibleNovels.length === 0 ? (
                                <div className="text-center py-8">
                                    <span className="text-3xl mb-2 block">📚</span>
                                    <h4 className="font-bold mb-1">No Novels Found</h4>
                                    <p className="text-xs text-[var(--foreground-secondary)]">
                                        You need to write novels before submitting to a contest. Create a novel from your Author Dashboard.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-xs text-[var(--foreground-secondary)] text-left">Select one of your novels to submit. Note: You can only submit one novel per competition.</p>
                                    <div className="space-y-2">
                                        {eligibleNovels.map(novel => (
                                            <div
                                                key={novel.id}
                                                className={`p-3 border rounded-xl flex items-center justify-between gap-4 transition-all ${
                                                    novel.isEligible
                                                        ? 'border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-[var(--primary-light)] cursor-pointer'
                                                        : 'border-[var(--border)] opacity-60 bg-[var(--background-secondary)] cursor-not-allowed'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-9 h-12 rounded bg-[var(--background-secondary)] overflow-hidden shrink-0 border border-[var(--border)]/80">
                                                        <img src={getNovelCover(novel.cover_image_url)} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="min-w-0 text-left">
                                                        <p className="font-bold text-xs truncate max-w-[180px]">{novel.title}</p>
                                                        {!novel.isEligible && (
                                                            <p className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
                                                                <Info className="w-3 h-3" /> {novel.reason}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {novel.isEligible && (
                                                    <button
                                                        disabled={submittingNovelId !== null}
                                                        onClick={() => handleSubmitNovel(novel.id)}
                                                        className="px-3 py-1.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold transition-all disabled:opacity-50"
                                                    >
                                                        {submittingNovelId === novel.id ? (
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        ) : (
                                                            'Submit'
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
