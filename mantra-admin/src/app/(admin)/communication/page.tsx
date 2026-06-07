'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminService } from '@/services/adminService';
import { ContactSubmission } from '@/types/supabase';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Send, Inbox, MessageSquare, Loader2, ChevronLeft, ChevronRight, Eye, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { createClient } from '@/lib/supabase/client';

export default function CommunicationPage() {
    // Broadcast
    const [broadcastTitle, setBroadcastTitle] = useState('');
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [broadcastRole, setBroadcastRole] = useState('');
    const [broadcasting, setBroadcasting] = useState(false);

    // Contact Inbox
    const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [viewSubmission, setViewSubmission] = useState<ContactSubmission | null>(null);
    const limit = 20;

    const loadSubmissions = useCallback(async () => {
        setLoading(true);
        try {
            const { submissions, count } = await adminService.getContactSubmissions(page, limit, statusFilter);
            setSubmissions(submissions);
            setTotalCount(count);
        } catch { toast.error('Failed to load submissions'); } finally { setLoading(false); }
    }, [page, statusFilter]);

    useEffect(() => { loadSubmissions(); }, [loadSubmissions]);

    const handleBroadcast = async () => {
        if (!broadcastTitle || !broadcastMessage) return;
        setBroadcasting(true);
        try {
            await adminService.sendBroadcastNotification(broadcastTitle, broadcastMessage, broadcastRole || undefined);
            toast.success('Broadcast sent successfully!');
            setBroadcastTitle('');
            setBroadcastMessage('');
            setBroadcastRole('');
        } catch { toast.error('Failed to send broadcast'); } finally { setBroadcasting(false); }
    };

    const handleMarkResolved = async (submissionId: string) => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            await adminService.updateContactStatus(submissionId, 'resolved', user.id);
            toast.success('Marked as resolved');
            setViewSubmission(null);
            loadSubmissions();
        } catch { toast.error('Failed to update'); }
    };

    const totalPages = Math.ceil(totalCount / limit);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Communication</h2>
                <p className="text-muted-foreground mt-1">Send broadcasts and manage contact form submissions.</p>
            </div>

            <Tabs defaultValue="broadcast">
                <TabsList>
                    <TabsTrigger value="broadcast"><Send className="h-4 w-4 mr-1.5" /> Broadcast</TabsTrigger>
                    <TabsTrigger value="inbox"><Inbox className="h-4 w-4 mr-1.5" /> Contact Inbox</TabsTrigger>
                </TabsList>

                {/* BROADCAST */}
                <TabsContent value="broadcast" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Send className="h-4 w-4 text-blue-400" /> Send Broadcast Notification
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 max-w-xl">
                            <div className="space-y-2">
                                <Label>Title *</Label>
                                <Input value={broadcastTitle} onChange={(e) => setBroadcastTitle(e.target.value)} placeholder="Notification title" />
                            </div>
                            <div className="space-y-2">
                                <Label>Message *</Label>
                                <Textarea value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} placeholder="Type your message..." rows={4} />
                            </div>
                            <div className="space-y-2">
                                <Label>Target Audience</Label>
                                <Select value={broadcastRole} onValueChange={(v) => setBroadcastRole(v === 'all' ? '' : v)}>
                                    <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Users" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Users</SelectItem>
                                        <SelectItem value="user">Readers Only</SelectItem>
                                        <SelectItem value="author">Authors Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleBroadcast} disabled={!broadcastTitle || !broadcastMessage || broadcasting} className="bg-gradient-to-r from-violet-600 to-indigo-600">
                                {broadcasting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : <><Send className="mr-2 h-4 w-4" /> Send Broadcast</>}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* CONTACT INBOX */}
                <TabsContent value="inbox" className="mt-4 space-y-4">
                    <Card>
                        <CardContent className="pt-6">
                            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1); }}>
                                <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="responded">Responded</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="w-12"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        [...Array(5)].map((_, i) => (
                                            <TableRow key={i}><TableCell colSpan={5} className="h-16"><div className="animate-pulse bg-muted h-4 rounded w-full" /></TableCell></TableRow>
                                        ))
                                    ) : submissions.length === 0 ? (
                                        <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No submissions found</TableCell></TableRow>
                                    ) : (
                                        submissions.map((sub) => (
                                            <TableRow key={sub.id} className="cursor-pointer hover:bg-accent/50" onClick={() => setViewSubmission(sub)}>
                                                <TableCell className="font-medium text-sm">{sub.subject}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{sub.email}</TableCell>
                                                <TableCell><StatusBadge status={sub.status} /></TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {formatDistanceToNow(new Date(sub.created_at), { addSuffix: true })}
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
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
                            <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}><ChevronLeft className="h-4 w-4" /></Button>
                                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* View Submission Dialog */}
            <Dialog open={!!viewSubmission} onOpenChange={(open) => !open && setViewSubmission(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{viewSubmission?.subject}</DialogTitle>
                        <DialogDescription>From: {viewSubmission?.email}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <StatusBadge status={viewSubmission?.status || 'pending'} />
                            <span className="text-xs text-muted-foreground">
                                {viewSubmission?.created_at && formatDistanceToNow(new Date(viewSubmission.created_at), { addSuffix: true })}
                            </span>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/30 text-sm whitespace-pre-wrap">
                            {viewSubmission?.message}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewSubmission(null)}>Close</Button>
                        {viewSubmission?.status !== 'resolved' && (
                            <Button onClick={() => viewSubmission && handleMarkResolved(viewSubmission.id)}>
                                <CheckCircle className="mr-2 h-4 w-4" /> Mark Resolved
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
