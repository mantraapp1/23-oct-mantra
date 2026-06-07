'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminService } from '@/services/adminService';
import { WithdrawalWithUser } from '@/types/supabase';
import { StatsCard } from '@/components/common/StatsCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, TrendingUp, Clock, Wallet, ChevronLeft, ChevronRight, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { createClient } from '@/lib/supabase/client';

export default function FinancialsPage() {
    const [summary, setSummary] = useState({ totalEarnings: 0, totalWithdrawals: 0, pendingWithdrawals: 0, pendingAmount: 0, platformBalance: 0 });
    const [withdrawals, setWithdrawals] = useState<WithdrawalWithUser[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [rejectDialog, setRejectDialog] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const limit = 20;

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [summaryData, withdrawalData] = await Promise.all([
                adminService.getFinancialSummary(),
                adminService.getAllWithdrawals(page, limit, statusFilter),
            ]);
            setSummary(summaryData);
            setWithdrawals(withdrawalData.withdrawals);
            setTotalCount(withdrawalData.count);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load financial data');
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleApprove = async (withdrawalId: string) => {
        setActionLoading(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            await adminService.approveWithdrawal(withdrawalId, user.id);
            toast.success('Withdrawal approved');
            loadData();
        } catch { toast.error('Failed to approve'); } finally { setActionLoading(false); }
    };

    const handleReject = async () => {
        if (!rejectDialog || !rejectReason) return;
        setActionLoading(true);
        try {
            await adminService.rejectWithdrawal(rejectDialog, rejectReason);
            toast.success('Withdrawal rejected');
            setRejectDialog(null);
            setRejectReason('');
            loadData();
        } catch { toast.error('Failed to reject'); } finally { setActionLoading(false); }
    };

    const totalPages = Math.ceil(totalCount / limit);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Financials</h2>
                <p className="text-muted-foreground mt-1">Platform revenue, withdrawals, and transaction management.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <StatsCard title="Total Earnings" value={`₹${summary.totalEarnings.toLocaleString()}`} icon={TrendingUp} iconColor="text-emerald-400" />
                <StatsCard title="Total Withdrawn" value={`₹${summary.totalWithdrawals.toLocaleString()}`} icon={DollarSign} iconColor="text-blue-400" />
                <StatsCard title="Pending Withdrawals" value={summary.pendingWithdrawals} icon={Clock} iconColor="text-amber-400" subtitle={`₹${summary.pendingAmount.toLocaleString()} total`} />
                <StatsCard title="Platform Balance" value={`₹${summary.platformBalance.toLocaleString()}`} icon={Wallet} iconColor="text-violet-400" />
            </div>

            <Tabs defaultValue="withdrawals">
                <TabsList>
                    <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                </TabsList>

                <TabsContent value="withdrawals" className="mt-4 space-y-4">
                    <Card>
                        <CardContent className="pt-6">
                            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1); }}>
                                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Stellar Address</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Requested</TableHead>
                                        <TableHead className="w-24">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        [...Array(5)].map((_, i) => (
                                            <TableRow key={i}><TableCell colSpan={6} className="h-16"><div className="animate-pulse bg-muted h-4 rounded w-full" /></TableCell></TableRow>
                                        ))
                                    ) : withdrawals.length === 0 ? (
                                        <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No withdrawals found</TableCell></TableRow>
                                    ) : (
                                        withdrawals.map((w) => (
                                            <TableRow key={w.id}>
                                                <TableCell className="font-medium text-sm">
                                                    {(w.user as any)?.display_name || (w.user as any)?.username || '—'}
                                                </TableCell>
                                                <TableCell className="font-semibold">₹{w.amount.toLocaleString()}</TableCell>
                                                <TableCell>
                                                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                                                        {w.stellar_address.slice(0, 8)}...{w.stellar_address.slice(-4)}
                                                    </code>
                                                </TableCell>
                                                <TableCell><StatusBadge status={w.status} /></TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {formatDistanceToNow(new Date(w.requested_at), { addSuffix: true })}
                                                </TableCell>
                                                <TableCell>
                                                    {w.status === 'pending' && (
                                                        <div className="flex gap-1">
                                                            <Button size="sm" variant="ghost" className="h-7 text-emerald-400 hover:text-emerald-300" onClick={() => handleApprove(w.id)} disabled={actionLoading}>
                                                                <CheckCircle className="h-4 w-4" />
                                                            </Button>
                                                            <Button size="sm" variant="ghost" className="h-7 text-red-400 hover:text-red-300" onClick={() => setRejectDialog(w.id)} disabled={actionLoading}>
                                                                <XCircle className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                    {w.status === 'rejected' && w.rejection_reason && (
                                                        <span className="text-xs text-red-400" title={w.rejection_reason}>Rejected</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, totalCount)} of {totalCount}</p>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}><ChevronLeft className="h-4 w-4 mr-1" /> Previous</Button>
                                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
                            </div>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="overview" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle className="text-base">Financial Summary</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between py-3 border-b"><span className="text-muted-foreground">Total Platform Earnings</span><span className="font-semibold">₹{summary.totalEarnings.toLocaleString()}</span></div>
                            <div className="flex justify-between py-3 border-b"><span className="text-muted-foreground">Total Withdrawn</span><span className="font-semibold">₹{summary.totalWithdrawals.toLocaleString()}</span></div>
                            <div className="flex justify-between py-3 border-b"><span className="text-muted-foreground">Pending Withdrawal Amount</span><span className="font-semibold text-amber-400">₹{summary.pendingAmount.toLocaleString()}</span></div>
                            <div className="flex justify-between py-3"><span className="text-muted-foreground">Total User Balances</span><span className="font-semibold text-violet-400">₹{summary.platformBalance.toLocaleString()}</span></div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Reject Dialog */}
            <Dialog open={!!rejectDialog} onOpenChange={(open) => { if (!open) { setRejectDialog(null); setRejectReason(''); } }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Withdrawal</DialogTitle>
                        <DialogDescription>Please provide a reason for rejection. The user will be notified.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label>Reason</Label>
                        <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Enter rejection reason..." required />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setRejectDialog(null); setRejectReason(''); }}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject} disabled={!rejectReason || actionLoading}>
                            {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
