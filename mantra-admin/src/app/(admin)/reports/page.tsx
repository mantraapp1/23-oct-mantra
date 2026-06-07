'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminService } from '@/services/adminService';
import { ReportWithDetails } from '@/types/supabase';
import { StatsCard } from '@/components/common/StatsCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ShieldAlert, CheckCircle, XCircle, Clock, MoreHorizontal, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { createClient } from '@/lib/supabase/client';

export default function ReportsPage() {
    const [reports, setReports] = useState<ReportWithDetails[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [typeFilter, setTypeFilter] = useState('');
    const limit = 20;

    const loadReports = useCallback(async () => {
        setLoading(true);
        try {
            const { reports, count } = await adminService.getAllReports(page, limit, statusFilter, typeFilter);
            setReports(reports);
            setTotalCount(count);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, typeFilter]);

    useEffect(() => { loadReports(); }, [loadReports]);

    const handleResolve = async (reportId: string) => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            await adminService.resolveReport(reportId, user.id);
            toast.success('Report resolved');
            loadReports();
        } catch { toast.error('Failed to resolve report'); }
    };

    const handleDismiss = async (reportId: string) => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            await adminService.dismissReport(reportId, user.id);
            toast.success('Report dismissed');
            loadReports();
        } catch { toast.error('Failed to dismiss report'); }
    };

    const totalPages = Math.ceil(totalCount / limit);
    const pendingCount = reports.filter(r => r.status === 'pending').length;

    const typeLabel: Record<string, string> = {
        novel: '📖 Novel',
        chapter: '📝 Chapter',
        review: '⭐ Review',
        comment: '💬 Comment',
        user: '👤 User',
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Reports & Moderation</h2>
                <p className="text-muted-foreground mt-1">Review and resolve user reports.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <StatsCard title="Total Reports" value={totalCount} icon={ShieldAlert} iconColor="text-orange-400" />
                <StatsCard title="Pending" value={pendingCount} icon={Clock} iconColor="text-amber-400" />
                <StatsCard title="Resolved" value={reports.filter(r => r.status === 'resolved').length} icon={CheckCircle} iconColor="text-emerald-400" />
                <StatsCard title="Dismissed" value={reports.filter(r => r.status === 'dismissed').length} icon={XCircle} iconColor="text-gray-400" />
            </div>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-3">
                        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1); }}>
                            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="reviewed">Reviewed</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="dismissed">Dismissed</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v === 'all' ? '' : v); setPage(1); }}>
                            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="novel">Novel</SelectItem>
                                <SelectItem value="chapter">Chapter</SelectItem>
                                <SelectItem value="review">Review</SelectItem>
                                <SelectItem value="comment">Comment</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Reporter</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}><TableCell colSpan={6} className="h-16"><div className="animate-pulse bg-muted h-4 rounded w-full" /></TableCell></TableRow>
                                ))
                            ) : reports.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        <AlertTriangle className="h-6 w-6 mx-auto mb-2 opacity-50" />
                                        No reports found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                reports.map((report) => (
                                    <TableRow key={report.id}>
                                        <TableCell>
                                            <span className="text-sm">{typeLabel[report.reported_type] || report.reported_type}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-sm">{report.reason}</p>
                                                {report.description && (
                                                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">{report.description}</p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {(report.reporter as any)?.display_name || (report.reporter as any)?.username || '—'}
                                        </TableCell>
                                        <TableCell><StatusBadge status={report.status} /></TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(report.reported_id)}>
                                                        Copy Reported ID
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {report.status === 'pending' && (
                                                        <>
                                                            <DropdownMenuItem onClick={() => handleResolve(report.id)}>
                                                                <CheckCircle className="mr-2 h-4 w-4 text-emerald-400" /> Resolve
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleDismiss(report.id)}>
                                                                <XCircle className="mr-2 h-4 w-4 text-gray-400" /> Dismiss
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
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
        </div>
    );
}
