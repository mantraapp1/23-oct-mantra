'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminService } from '@/services/adminService';
import { NovelWithAuthor } from '@/types/supabase';
import { StatsCard } from '@/components/common/StatsCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BookOpen, Star, Eye, MoreHorizontal, Search, ChevronLeft, ChevronRight, ExternalLink, Sparkles, Award, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

export default function NovelsPage() {
    const [novels, setNovels] = useState<NovelWithAuthor[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [featuredFilter, setFeaturedFilter] = useState('');
    const [deleteNovel, setDeleteNovel] = useState<NovelWithAuthor | null>(null);
    const limit = 20;

    const loadNovels = useCallback(async () => {
        setLoading(true);
        try {
            const { novels, count } = await adminService.getAllNovels(page, limit, search, statusFilter, featuredFilter);
            setNovels(novels);
            setTotalCount(count);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load novels');
        } finally {
            setLoading(false);
        }
    }, [page, search, statusFilter, featuredFilter]);

    useEffect(() => { loadNovels(); }, [loadNovels]);

    const handleToggleFeatured = async (novelId: string, isFeatured: boolean) => {
        try {
            await adminService.toggleFeatured(novelId, isFeatured);
            toast.success(isFeatured ? 'Marked as featured' : 'Removed from featured');
            loadNovels();
        } catch { toast.error('Failed to update'); }
    };

    const handleToggleEditorsPick = async (novelId: string, isEditorsPick: boolean) => {
        try {
            await adminService.toggleEditorsPick(novelId, isEditorsPick);
            toast.success(isEditorsPick ? 'Marked as editor\'s pick' : 'Removed from editor\'s pick');
            loadNovels();
        } catch { toast.error('Failed to update'); }
    };

    const handleDeleteNovel = async () => {
        if (!deleteNovel) return;
        try {
            await adminService.deleteNovel(deleteNovel.id);
            toast.success('Novel deleted');
            setDeleteNovel(null);
            loadNovels();
        } catch { toast.error('Failed to delete novel'); }
    };

    const totalPages = Math.ceil(totalCount / limit);
    const featuredCount = novels.filter(n => n.is_featured).length;
    const ongoingCount = novels.filter(n => n.status === 'ongoing').length;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Novel Management</h2>
                <p className="text-muted-foreground mt-1">Browse, moderate, and feature novels.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <StatsCard title="Total Novels" value={totalCount} icon={BookOpen} iconColor="text-pink-400" />
                <StatsCard title="Ongoing" value={ongoingCount} icon={BookOpen} iconColor="text-blue-400" />
                <StatsCard title="Featured" value={featuredCount} icon={Sparkles} iconColor="text-amber-400" />
                <StatsCard title="Avg Rating" value={novels.length ? (novels.reduce((s, n) => s + n.average_rating, 0) / novels.length).toFixed(1) : '—'} icon={Star} iconColor="text-yellow-400" />
            </div>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search novels..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
                        </div>
                        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1); }}>
                            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="ongoing">Ongoing</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="hiatus">Hiatus</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={featuredFilter} onValueChange={(v) => { setFeaturedFilter(v === 'all' ? '' : v); setPage(1); }}>
                            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Featured" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Novels</SelectItem>
                                <SelectItem value="featured">Featured Only</SelectItem>
                                <SelectItem value="editors_pick">Editor&apos;s Pick</SelectItem>
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
                                <TableHead className="w-12"></TableHead>
                                <TableHead>Novel</TableHead>
                                <TableHead>Author</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-center">Chapters</TableHead>
                                <TableHead className="text-center">Views</TableHead>
                                <TableHead className="text-center">Rating</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}><TableCell colSpan={8} className="h-16"><div className="animate-pulse bg-muted h-4 rounded w-full" /></TableCell></TableRow>
                                ))
                            ) : novels.length === 0 ? (
                                <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">No novels found</TableCell></TableRow>
                            ) : (
                                novels.map((novel) => (
                                    <TableRow key={novel.id}>
                                        <TableCell>
                                            <div className="w-10 h-14 rounded overflow-hidden bg-muted">
                                                {novel.cover_image_url && <img src={novel.cover_image_url} alt="" className="w-full h-full object-cover" />}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Link href={`/novels/${novel.id}`} className="font-medium hover:text-primary transition-colors">
                                                {novel.title}
                                            </Link>
                                            <div className="flex gap-1 mt-1">
                                                {novel.is_featured && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">Featured</span>}
                                                {novel.is_editors_pick && <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400">Editor&apos;s Pick</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {(novel.author as any)?.display_name || (novel.author as any)?.username || '—'}
                                        </TableCell>
                                        <TableCell><StatusBadge status={novel.status} /></TableCell>
                                        <TableCell className="text-center text-sm">{novel.total_chapters}</TableCell>
                                        <TableCell className="text-center text-sm">{novel.total_views.toLocaleString()}</TableCell>
                                        <TableCell className="text-center text-sm">
                                            <span className="flex items-center justify-center gap-1">
                                                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                                                {novel.average_rating.toFixed(1)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/novels/${novel.id}`}><ExternalLink className="mr-2 h-4 w-4" /> View Details</Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleToggleFeatured(novel.id, !novel.is_featured)}>
                                                        <Sparkles className="mr-2 h-4 w-4" /> {novel.is_featured ? 'Remove Featured' : 'Mark Featured'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleToggleEditorsPick(novel.id, !novel.is_editors_pick)}>
                                                        <Award className="mr-2 h-4 w-4" /> {novel.is_editors_pick ? 'Remove Pick' : 'Editor\'s Pick'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-destructive" onClick={() => setDeleteNovel(novel)}>
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete Novel
                                                    </DropdownMenuItem>
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

            <ConfirmDialog
                open={!!deleteNovel}
                onOpenChange={(open) => !open && setDeleteNovel(null)}
                title="Delete Novel"
                description={`Are you sure you want to delete "${deleteNovel?.title}"? This will also delete all chapters and reviews. This action cannot be undone.`}
                confirmLabel="Delete"
                variant="destructive"
                onConfirm={handleDeleteNovel}
            />
        </div>
    );
}
