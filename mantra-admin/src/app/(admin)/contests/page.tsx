'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { Contest, ContestSubmissionWithNovel } from '@/types/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Trophy, Plus, Trash2, Edit, Loader2, Calendar, Award, CheckCircle, Info, ArrowLeft, Users } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ContestsPage() {
    const [contests, setContests] = useState<Contest[]>([]);
    const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
    const [submissions, setSubmissions] = useState<ContestSubmissionWithNovel[]>([]);
    
    // Contests list filtering/tabs
    const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'ended'>('all');

    // Contest Forms
    const [contestDialog, setContestDialog] = useState(false);
    const [editContest, setEditContest] = useState<Contest | null>(null);
    const [contestForm, setContestForm] = useState({
        name: '',
        description: '',
        rules: '',
        prize: '',
        start_date: '',
        end_date: '',
        requires_new_novel: false,
        banner_image_url: ''
    });

    // Delete
    const [deleteContestId, setDeleteContestId] = useState<string | null>(null);
    const [deleteContestName, setDeleteContestName] = useState('');

    const [loading, setLoading] = useState(true);
    const [submissionsLoading, setSubmissionsLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadContests();
    }, []);

    const loadContests = async () => {
        setLoading(true);
        try {
            const data = await adminService.getAllContests();
            setContests(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load contests');
        } finally {
            setLoading(false);
        }
    };

    const loadSubmissions = async (contestId: string) => {
        setSubmissionsLoading(true);
        try {
            const data = await adminService.getContestSubmissions(contestId);
            setSubmissions(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load submissions');
        } finally {
            setSubmissionsLoading(false);
        }
    };

    const handleSelectContest = (contest: Contest) => {
        setSelectedContest(contest);
        loadSubmissions(contest.id);
    };

    const handleBackToList = () => {
        setSelectedContest(null);
        setSubmissions([]);
    };

    const openContestDialog = (contest?: Contest) => {
        if (contest) {
            setEditContest(contest);
            // Format dates for datetime-local input (YYYY-MM-DDTHH:MM)
            const startStr = contest.start_date ? new Date(contest.start_date).toISOString().slice(0, 16) : '';
            const endStr = contest.end_date ? new Date(contest.end_date).toISOString().slice(0, 16) : '';
            
            setContestForm({
                name: contest.name,
                description: contest.description || '',
                rules: contest.rules || '',
                prize: contest.prize || '',
                start_date: startStr,
                end_date: endStr,
                requires_new_novel: contest.requires_new_novel,
                banner_image_url: contest.banner_image_url || ''
            });
        } else {
            setEditContest(null);
            // Default to today and 30 days from now
            const today = new Date();
            const startStr = today.toISOString().slice(0, 16);
            const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
            const endStr = thirtyDaysLater.toISOString().slice(0, 16);

            setContestForm({
                name: '',
                description: '',
                rules: '',
                prize: '',
                start_date: startStr,
                end_date: endStr,
                requires_new_novel: false,
                banner_image_url: ''
            });
        }
        setContestDialog(true);
    };

    const handleSaveContest = async () => {
        if (!contestForm.name || !contestForm.start_date || !contestForm.end_date) {
            toast.error('Please fill in all required fields');
            return;
        }

        const start = new Date(contestForm.start_date);
        const end = new Date(contestForm.end_date);

        if (start >= end) {
            toast.error('Start date must be before end date');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                name: contestForm.name,
                description: contestForm.description || null,
                rules: contestForm.rules || null,
                prize: contestForm.prize || null,
                start_date: start.toISOString(),
                end_date: end.toISOString(),
                requires_new_novel: contestForm.requires_new_novel,
                winner_novel_id: editContest ? editContest.winner_novel_id : null,
                winner_novel_id_2: editContest ? editContest.winner_novel_id_2 : null,
                winner_novel_id_3: editContest ? editContest.winner_novel_id_3 : null,
                banner_image_url: contestForm.banner_image_url || null
            };

            if (editContest) {
                await adminService.updateContest(editContest.id, payload);
                toast.success('Contest updated successfully');
            } else {
                await adminService.createContest(payload);
                toast.success('Contest created successfully');
            }
            setContestDialog(false);
            loadContests();
        } catch (error) {
            console.error(error);
            toast.error('Failed to save contest');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteContest = async () => {
        if (!deleteContestId) return;
        try {
            await adminService.deleteContest(deleteContestId);
            toast.success('Contest deleted successfully');
            setDeleteContestId(null);
            if (selectedContest?.id === deleteContestId) {
                setSelectedContest(null);
            }
            loadContests();
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete contest');
        }
    };

    const handleSelectWinner = async (novelId: string | null, rank: 1 | 2 | 3) => {
        if (!selectedContest) return;
        try {
            const w1 = rank === 1 ? novelId : selectedContest.winner_novel_id;
            const w2 = rank === 2 ? novelId : selectedContest.winner_novel_id_2;
            const w3 = rank === 3 ? novelId : selectedContest.winner_novel_id_3;

            await adminService.setContestWinner(selectedContest.id, w1, w2, w3);
            const updatedContest = { 
                ...selectedContest, 
                winner_novel_id: w1,
                winner_novel_id_2: w2,
                winner_novel_id_3: w3
            };
            setSelectedContest(updatedContest);
            
            // Update in list
            setContests(prev => prev.map(c => c.id === selectedContest.id ? updatedContest : c));
            
            if (novelId) {
                toast.success(`Rank ${rank} winner declared successfully! 🎉`);
            } else {
                toast.success(`Rank ${rank} winner cleared successfully`);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to declare winner');
        }
    };

    const getContestStatus = (contest: Contest) => {
        const now = new Date();
        const start = new Date(contest.start_date);
        const end = new Date(contest.end_date);

        if (now < start) return 'upcoming';
        if (now > end) return 'ended';
        return 'active';
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
            case 'upcoming':
                return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
            case 'ended':
                return 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20';
            default:
                return 'bg-muted text-muted-foreground';
        }
    };

    const filteredContests = contests.filter(c => {
        if (filter === 'all') return true;
        return getContestStatus(c) === filter;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {!selectedContest ? (
                // ═══════════════════════════════════════════
                // CONTEST LIST VIEW
                // ═══════════════════════════════════════════
                <>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">Contest Hosting</h2>
                            <p className="text-muted-foreground mt-1">Host competitions, set rules, review submissions, and declare winners.</p>
                        </div>
                        <Button onClick={() => openContestDialog()} className="self-start md:self-auto">
                            <Plus className="h-4 w-4 mr-2" /> Add Contest
                        </Button>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-2 border-b pb-1">
                        {(['all', 'active', 'upcoming', 'ended'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setFilter(tab)}
                                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-[6px] transition-all capitalize ${
                                    filter === tab
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {filteredContests.length === 0 ? (
                        <Card>
                            <CardContent className="py-12">
                                <EmptyState
                                    icon={Trophy}
                                    title={`No ${filter !== 'all' ? filter : ''} contests`}
                                    description={filter === 'all' ? 'Create your first contest to start a writing competition.' : 'There are no contests in this category.'}
                                />
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredContests.map(contest => {
                                const status = getContestStatus(contest);
                                return (
                                    <Card key={contest.id} className="flex flex-col h-full bg-card/40 hover:bg-card/80 transition-all border border-muted hover:border-accent overflow-hidden">
                                        {contest.banner_image_url && (
                                            <div className="w-full h-32 shrink-0 overflow-hidden border-b">
                                                <img src={contest.banner_image_url} alt={contest.name} className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start gap-2 mb-2">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${getStatusBadgeClass(status)}`}>
                                                    {status}
                                                </span>
                                                {contest.requires_new_novel && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                                                        New Novels Only
                                                    </span>
                                                )}
                                            </div>
                                            <CardTitle className="text-lg line-clamp-1">{contest.name}</CardTitle>
                                            <CardDescription className="line-clamp-2 min-h-[40px]">{contest.description || 'No description provided.'}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-1 space-y-4">
                                            <Separator />
                                            <div className="space-y-2 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                                                    <span>
                                                        {format(new Date(contest.start_date), 'MMM dd, yyyy')} - {format(new Date(contest.end_date), 'MMM dd, yyyy')}
                                                    </span>
                                                </div>
                                                {contest.prize && (
                                                    <div className="flex items-center gap-2">
                                                        <Award className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                                                        <span className="font-medium text-foreground">{contest.prize}</span>
                                                    </div>
                                                )}
                                                {contest.winner_novel_id && (
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                                        <span className="text-emerald-400 font-medium">Winner declared</span>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                        <div className="p-4 pt-0 flex gap-2">
                                            <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => handleSelectContest(contest)}>
                                                <Users className="h-3.5 w-3.5 mr-1.5" /> Manage Entries
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openContestDialog(contest)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => {
                                                setDeleteContestId(contest.id);
                                                setDeleteContestName(contest.name);
                                            }}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </>
            ) : (
                // ═══════════════════════════════════════════
                // SUBMISSIONS / DETAILS VIEW
                // ═══════════════════════════════════════════
                <>
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={handleBackToList} className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">{selectedContest.name}</h2>
                            <p className="text-sm text-muted-foreground">Manage competition entries, review votes, and declare the winner.</p>
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Info details */}
                        <div className="md:col-span-1 space-y-4">
                            <Card className="bg-card/30 overflow-hidden">
                                {selectedContest.banner_image_url && (
                                    <div className="w-full h-32 shrink-0 overflow-hidden border-b">
                                        <img src={selectedContest.banner_image_url} alt={selectedContest.name} className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <CardHeader>
                                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Contest Settings</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm">
                                    <div>
                                        <Label className="text-muted-foreground text-xs">Description</Label>
                                        <p className="mt-1 text-foreground whitespace-pre-wrap">{selectedContest.description || 'No description'}</p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <Label className="text-muted-foreground text-xs">Rules</Label>
                                        <p className="mt-1 text-foreground whitespace-pre-wrap">{selectedContest.rules || 'No rules set'}</p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <Label className="text-muted-foreground text-xs">Prize Pool</Label>
                                        <div className="flex items-center gap-2 mt-1 text-amber-400 font-semibold">
                                            <Award className="h-4 w-4" />
                                            <span>{selectedContest.prize || 'No prize specified'}</span>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground text-xs">Start Date:</span>
                                            <span className="font-medium">{format(new Date(selectedContest.start_date), 'yyyy-MM-dd HH:mm')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground text-xs">End Date:</span>
                                            <span className="font-medium">{format(new Date(selectedContest.end_date), 'yyyy-MM-dd HH:mm')}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground text-xs">Requires New Novel:</span>
                                            <span className={`text-xs px-2 py-0.5 rounded ${selectedContest.requires_new_novel ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-zinc-500/10 text-zinc-400'}`}>
                                                {selectedContest.requires_new_novel ? 'Yes' : 'No'}
                                            </span>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="flex-1" onClick={() => openContestDialog(selectedContest)}>
                                            <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit Settings
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Submissions List */}
                        <div className="md:col-span-2 space-y-4">
                            <Card>
                                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base">Submitted Entries</CardTitle>
                                        <CardDescription>All novels submitted to this competition, ordered by votes.</CardDescription>
                                    </div>
                                    <span className="text-xs px-2 py-1 rounded-full bg-accent font-semibold">
                                        {submissions.length} {submissions.length === 1 ? 'Novel' : 'Novels'}
                                    </span>
                                </CardHeader>
                                <CardContent>
                                    {submissionsLoading ? (
                                        <div className="flex justify-center items-center py-12">
                                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        </div>
                                    ) : submissions.length === 0 ? (
                                        <EmptyState
                                            icon={Users}
                                            title="No Submissions Yet"
                                            description="Authors haven't submitted any novels to this contest yet."
                                        />
                                    ) : (
                                        <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                                                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
                                                    <tr>
                                                        <th className="py-3 px-4 text-left">Novel</th>
                                                        <th className="py-3 px-4 text-left">Author</th>
                                                        <th className="py-3 px-4 text-center">Votes</th>
                                                        <th className="py-3 px-4 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {submissions.map((sub) => {
                                                        const isWinner1 = selectedContest.winner_novel_id === sub.novel_id;
                                                        const isWinner2 = selectedContest.winner_novel_id_2 === sub.novel_id;
                                                        const isWinner3 = selectedContest.winner_novel_id_3 === sub.novel_id;
                                                        const hasRank = isWinner1 || isWinner2 || isWinner3;
                                                        
                                                        return (
                                                            <tr key={sub.id} className={`hover:bg-accent/10 transition-colors ${hasRank ? 'bg-amber-500/5' : ''}`}>
                                                                <td className="py-3 px-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-9 h-12 rounded bg-muted overflow-hidden shrink-0 border">
                                                                            {sub.novel.cover_image_url ? (
                                                                                <img src={sub.novel.cover_image_url} alt="" className="w-full h-full object-cover" />
                                                                            ) : (
                                                                                <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">No Cover</div>
                                                                            )}
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="font-medium truncate max-w-[180px]">{sub.novel.title}</p>
                                                                            <p className="text-[10px] text-muted-foreground">Submitted {format(new Date(sub.submitted_at), 'yyyy-MM-dd')}</p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="py-3 px-4 text-muted-foreground">
                                                                    {sub.novel.author?.display_name || sub.novel.author?.username || 'Unknown'}
                                                                </td>
                                                                <td className="py-3 px-4 text-center font-bold">
                                                                    {sub.votes_count}
                                                                </td>
                                                                <td className="py-3 px-4 text-right">
                                                                    <div className="flex items-center justify-end gap-2">
                                                                        {isWinner1 ? (
                                                                            <span className="text-xs text-amber-500 font-bold bg-amber-500/10 px-2 py-1 rounded flex items-center gap-1 border border-amber-500/20">
                                                                                🥇 1st Place
                                                                            </span>
                                                                        ) : isWinner2 ? (
                                                                            <span className="text-xs text-slate-400 font-bold bg-slate-400/10 px-2 py-1 rounded flex items-center gap-1 border border-slate-400/20">
                                                                                🥈 2nd Place
                                                                            </span>
                                                                        ) : isWinner3 ? (
                                                                            <span className="text-xs text-amber-700 font-bold bg-amber-700/10 px-2 py-1 rounded flex items-center gap-1 border border-amber-700/20">
                                                                                🥉 3rd Place
                                                                            </span>
                                                                        ) : null}

                                                                        <div className="flex gap-1">
                                                                            {isWinner1 ? (
                                                                                <Button variant="ghost" size="sm" className="h-7 text-[10px] text-red-500 hover:text-red-600 hover:bg-red-500/5 font-semibold" onClick={() => handleSelectWinner(null, 1)}>
                                                                                    Revoke 1st
                                                                                </Button>
                                                                            ) : !isWinner2 && !isWinner3 && (
                                                                                <Button variant="outline" size="sm" className="h-7 text-[10px] border-amber-500/20 text-amber-500 hover:bg-amber-500/10" onClick={() => handleSelectWinner(sub.novel_id, 1)}>
                                                                                    1st
                                                                                </Button>
                                                                            )}

                                                                            {isWinner2 ? (
                                                                                <Button variant="ghost" size="sm" className="h-7 text-[10px] text-red-500 hover:text-red-600 hover:bg-red-500/5 font-semibold" onClick={() => handleSelectWinner(null, 2)}>
                                                                                    Revoke 2nd
                                                                                </Button>
                                                                            ) : !isWinner1 && !isWinner3 && (
                                                                                <Button variant="outline" size="sm" className="h-7 text-[10px] border-slate-400/20 text-slate-400 hover:bg-slate-400/10" onClick={() => handleSelectWinner(sub.novel_id, 2)}>
                                                                                    2nd
                                                                                </Button>
                                                                            )}

                                                                            {isWinner3 ? (
                                                                                <Button variant="ghost" size="sm" className="h-7 text-[10px] text-red-500 hover:text-red-600 hover:bg-red-500/5 font-semibold" onClick={() => handleSelectWinner(null, 3)}>
                                                                                    Revoke 3rd
                                                                                </Button>
                                                                            ) : !isWinner1 && !isWinner2 && (
                                                                                <Button variant="outline" size="sm" className="h-7 text-[10px] border-amber-700/20 text-amber-700 hover:bg-amber-700/10" onClick={() => handleSelectWinner(sub.novel_id, 3)}>
                                                                                    3rd
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </>
            )}

            {/* Contest Form Dialog (Create / Edit) */}
            <Dialog open={contestDialog} onOpenChange={setContestDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editContest ? 'Edit Contest' : 'Create Contest'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                        <div className="space-y-2">
                            <Label>Contest Name *</Label>
                            <Input value={contestForm.name} onChange={(e) => setContestForm({ ...contestForm, name: e.target.value })} placeholder="e.g. Summer Romance Competition" />
                        </div>
                        <div className="space-y-2">
                            <Label>Banner Image URL</Label>
                            <Input value={contestForm.banner_image_url} onChange={(e) => setContestForm({ ...contestForm, banner_image_url: e.target.value })} placeholder="e.g. https://example.com/banner.jpg" />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea value={contestForm.description} onChange={(e) => setContestForm({ ...contestForm, description: e.target.value })} placeholder="Explain the theme and parameters of the contest..." rows={3} />
                        </div>
                        <div className="space-y-2">
                            <Label>Rules</Label>
                            <Textarea value={contestForm.rules} onChange={(e) => setContestForm({ ...contestForm, rules: e.target.value })} placeholder="Entry rules, word limits, criteria..." rows={3} />
                        </div>
                        <div className="space-y-2">
                            <Label>Prize Pool</Label>
                            <Input value={contestForm.prize} onChange={(e) => setContestForm({ ...contestForm, prize: e.target.value })} placeholder="e.g. $500 Cash + Homepage Feature" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Date & Time *</Label>
                                <Input type="datetime-local" value={contestForm.start_date} onChange={(e) => setContestForm({ ...contestForm, start_date: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>End Date & Time *</Label>
                                <Input type="datetime-local" value={contestForm.end_date} onChange={(e) => setContestForm({ ...contestForm, end_date: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex items-center justify-between border-t pt-4">
                            <div className="space-y-0.5">
                                <Label>Requires New Novels</Label>
                                <p className="text-[11px] text-muted-foreground">Only novels created after the contest start date can participate.</p>
                            </div>
                            <Switch checked={contestForm.requires_new_novel} onCheckedChange={(checked) => setContestForm({ ...contestForm, requires_new_novel: checked })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setContestDialog(false)}>Cancel</Button>
                        <Button onClick={handleSaveContest} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {editContest ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <ConfirmDialog
                open={!!deleteContestId}
                onOpenChange={(open) => !open && setDeleteContestId(null)}
                title="Delete Contest"
                description={`Are you sure you want to delete "${deleteContestName}"? All submissions and votes associated with this contest will be permanently deleted.`}
                confirmLabel="Delete"
                variant="destructive"
                onConfirm={handleDeleteContest}
            />
        </div>
    );
}
