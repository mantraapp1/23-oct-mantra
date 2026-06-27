import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import contestService from '@/services/contestService';
import type { Contest } from '@/types/supabase';
import { Trophy, Calendar, Loader2 } from 'lucide-react';
import SEO from '@/components/seo/SEO';
import { getContestBanner } from '@/lib/defaultImages';

export default function ContestsPage() {
    const [contests, setContests] = useState<Contest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'active' | 'upcoming' | 'completed'>('active');

    useEffect(() => {
        const fetchContests = async () => {
            try {
                const data = await contestService.getAllContests();
                setContests(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchContests();
    }, []);

    const getContestStatus = (contest: Contest) => {
        const now = new Date();
        const start = new Date(contest.start_date);
        const end = new Date(contest.end_date);

        if (now < start) return 'upcoming';
        if (now > end) return 'completed';
        return 'active';
    };

    const filteredContests = contests.filter(c => {
        return getContestStatus(c) === filter;
    });

    return (
        <div className="min-h-screen bg-[var(--background)] font-sans text-[var(--foreground)] pb-24 animate-in">
            <SEO
                title="Writing Contests & Competitions | Mantra"
                description="Join writing contests on Mantra. Submit your web novels and stories to win cash prizes, get editorial pick status, and gain reader votes."
                keywords="writing contests, novel competition, writing prizes, submit webnovel, mantra contest, author prizes"
                url="/contests"
            />

            {/* Premium Brand Header */}
            <div className="relative overflow-hidden bg-[var(--background-secondary)] py-12 border-b border-[var(--border)]">
                {/* Subtle Background Art Gradients */}
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[var(--primary)]/5 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[250px] h-[250px] bg-purple-500/5 rounded-full blur-[80px] pointer-events-none" />
                
                <div className="w-full px-4 relative z-10 max-w-[1800px] mx-auto text-center space-y-4">
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] text-xs font-bold uppercase tracking-wider">
                        <Trophy className="w-3.5 h-3.5 animate-pulse" /> Competition Hub
                    </div>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--foreground)]">
                        Mantra Writing Contests
                    </h1>
                    <p className="text-sm md:text-base text-[var(--foreground-secondary)] leading-relaxed max-w-2xl mx-auto">
                        Enter seasonal prompts, showcase your writing talent, win cash prizes, and secure exclusive publication opportunities. Let the reader community decide the winners!
                    </p>
                </div>
            </div>

            <div className="w-full px-4 pt-8 max-w-[1800px] mx-auto space-y-8">
                {/* Modern Filter Tabs */}
                <div className="flex justify-center border-b border-[var(--border)]">
                    <div className="flex w-full max-w-md justify-between -mb-[1px] gap-2">
                        {(['active', 'upcoming', 'completed'] as const).map(tab => {
                            const isActive = filter === tab;
                            return (
                                <button
                                    key={tab}
                                    onClick={() => setFilter(tab)}
                                    className="flex-1 py-3 text-sm font-bold border-b-2 transition-all capitalize cursor-pointer text-center outline-none relative"
                                    style={{
                                        borderBottomColor: isActive ? 'var(--primary)' : 'transparent',
                                        color: isActive ? 'var(--foreground)' : 'var(--foreground-secondary)'
                                    }}
                                >
                                    {tab}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Contests Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
                        <p className="text-sm text-[var(--foreground-secondary)] font-medium">Loading contests...</p>
                    </div>
                ) : filteredContests.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredContests.map(contest => {
                            const status = getContestStatus(contest);
                            const bannerUrl = contest.banner_image_url || getContestBanner(contest.id);
                            
                            return (
                                <Link
                                    key={contest.id}
                                    to={`/contests/${contest.id}`}
                                    className="flex flex-col rounded-[var(--radius-xl)] overflow-hidden border border-[var(--border)] bg-[var(--card)] shadow-sm hover:shadow-md hover:border-[var(--primary)]/30 transition-all duration-300 group cursor-pointer"
                                >
                                    {/* Top Section: Banner Image */}
                                    <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-[var(--background-secondary)]">
                                        <img
                                            src={bannerUrl}
                                            alt={contest.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        
                                        {/* Subtle overlay on the image */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                                        
                                        {/* Top Overlay Badges */}
                                        <div className="absolute top-3 left-3 flex gap-1.5">
                                            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider backdrop-blur-md shadow-sm border ${
                                                status === 'active' ? 'bg-emerald-500/85 text-white border-emerald-400/20' :
                                                status === 'upcoming' ? 'bg-sky-500/85 text-white border-sky-400/20' :
                                                'bg-slate-600/85 text-white border-slate-500/20'
                                            }`}>
                                                {status === 'active' ? 'Active' : status === 'upcoming' ? 'Upcoming' : 'Completed'}
                                            </span>
                                        </div>
                                        
                                        {contest.prize && (
                                            <div className="absolute top-3 right-3">
                                                <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-500/90 text-white border border-amber-400/25 font-bold uppercase tracking-wider backdrop-blur-md shadow-sm">
                                                    {contest.prize}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Bottom Section: Text Content */}
                                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                        <div className="space-y-2">
                                            <h3 className="text-lg font-bold tracking-tight text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors line-clamp-1">
                                                {contest.name}
                                            </h3>
                                            
                                            <p className="text-xs text-[var(--foreground-secondary)] line-clamp-3 leading-relaxed">
                                                {contest.description || 'Join this writing competition to show your storytelling skills.'}
                                            </p>
                                        </div>

                                        <div className="pt-3 border-t border-[var(--border)]/60 flex items-center justify-between">
                                            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground-secondary)]">
                                                <Calendar className="w-3.5 h-3.5 text-[var(--primary)]" />
                                                {new Date(contest.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(contest.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                            <span className="text-[10px] font-bold text-[var(--primary)] group-hover:translate-x-0.5 transition-transform duration-300 inline-flex items-center gap-1">
                                                View Details &rarr;
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-[var(--card)] rounded-[var(--radius-xl)] border border-[var(--border)] shadow-sm">
                        <span className="text-4xl mb-3 block opacity-50">🏆</span>
                        <h4 className="text-base font-bold text-[var(--foreground)] mb-1">No contests found</h4>
                        <p className="text-xs text-[var(--foreground-secondary)] max-w-xs mx-auto px-4">
                            We couldn't find any {filter} contests at this time. Stay tuned for future writing competitions!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

