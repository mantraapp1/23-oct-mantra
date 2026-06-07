'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { adminService } from '@/services/adminService';
import { NovelWithAuthor, Chapter } from '@/types/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ArrowLeft, Star, Eye, BookOpen, Users, Sparkles, Award, Trash2, Calendar, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NovelDetailPage() {
    const params = useParams();
    const novelId = params.id as string;
    const router = useRouter();
    const [novel, setNovel] = useState<NovelWithAuthor | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteOpen, setDeleteOpen] = useState(false);

    useEffect(() => { loadNovel(); }, [novelId]);

    const loadNovel = async () => {
        try {
            const data = await adminService.getNovelById(novelId);
            setNovel(data.novel);
            setChapters(data.chapters);
            setReviews(data.reviews);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load novel');
        } finally { setLoading(false); }
    };

    const handleToggleFeatured = async () => {
        if (!novel) return;
        try {
            await adminService.toggleFeatured(novel.id, !novel.is_featured);
            toast.success(novel.is_featured ? 'Removed from featured' : 'Marked as featured');
            loadNovel();
        } catch { toast.error('Failed to update'); }
    };

    const handleToggleEditorsPick = async () => {
        if (!novel) return;
        try {
            await adminService.toggleEditorsPick(novel.id, !novel.is_editors_pick);
            toast.success(novel.is_editors_pick ? 'Removed editor\'s pick' : 'Marked as editor\'s pick');
            loadNovel();
        } catch { toast.error('Failed to update'); }
    };

    const handleDelete = async () => {
        try {
            await adminService.deleteNovel(novelId);
            toast.success('Novel deleted');
            router.push('/novels');
        } catch { toast.error('Failed to delete novel'); }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-48 w-full" />
            </div>
        );
    }

    if (!novel) {
        return <div className="text-center py-16 text-muted-foreground">Novel not found</div>;
    }

    const author = novel.author as any;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/novels"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div className="flex-1">
                    <h2 className="text-3xl font-bold tracking-tight">{novel.title}</h2>
                    <p className="text-muted-foreground">by {author?.display_name || author?.username || 'Unknown'}</p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
            </div>

            {/* Info Card */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Cover */}
                        <div className="w-40 h-56 rounded-lg overflow-hidden bg-muted shrink-0">
                            {novel.cover_image_url && <img src={novel.cover_image_url} alt="" className="w-full h-full object-cover" />}
                        </div>

                        {/* Details */}
                        <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-2 flex-wrap">
                                <StatusBadge status={novel.status} />
                                {novel.is_mature && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">18+</span>}
                                {novel.genres?.map((g) => (
                                    <span key={g} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{g}</span>
                                ))}
                            </div>

                            {novel.description && (
                                <p className="text-sm text-muted-foreground line-clamp-4">{novel.description}</p>
                            )}

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="text-center p-3 rounded-lg bg-muted/30">
                                    <div className="flex items-center justify-center gap-1 text-lg font-bold">
                                        <BookOpen className="h-4 w-4 text-blue-400" /> {novel.total_chapters}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Chapters</div>
                                </div>
                                <div className="text-center p-3 rounded-lg bg-muted/30">
                                    <div className="flex items-center justify-center gap-1 text-lg font-bold">
                                        <Eye className="h-4 w-4 text-green-400" /> {novel.total_views.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Views</div>
                                </div>
                                <div className="text-center p-3 rounded-lg bg-muted/30">
                                    <div className="flex items-center justify-center gap-1 text-lg font-bold">
                                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" /> {novel.average_rating.toFixed(1)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">{novel.total_reviews} reviews</div>
                                </div>
                                <div className="text-center p-3 rounded-lg bg-muted/30">
                                    <div className="flex items-center justify-center gap-1 text-lg font-bold">
                                        <Users className="h-4 w-4 text-violet-400" /> {novel.total_votes.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Votes</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(new Date(novel.created_at), 'MMM dd, yyyy')}</span>
                                <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {novel.language}</span>
                            </div>
                        </div>
                    </div>

                    <Separator className="my-6" />

                    {/* Admin Controls */}
                    <div className="flex flex-col sm:flex-row gap-6">
                        <div className="flex items-center gap-3">
                            <Switch checked={novel.is_featured} onCheckedChange={handleToggleFeatured} id="featured" />
                            <Label htmlFor="featured" className="flex items-center gap-1.5 cursor-pointer">
                                <Sparkles className="h-4 w-4 text-amber-400" /> Featured
                            </Label>
                        </div>
                        <div className="flex items-center gap-3">
                            <Switch checked={novel.is_editors_pick} onCheckedChange={handleToggleEditorsPick} id="editors-pick" />
                            <Label htmlFor="editors-pick" className="flex items-center gap-1.5 cursor-pointer">
                                <Award className="h-4 w-4 text-violet-400" /> Editor&apos;s Pick
                            </Label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="chapters">
                <TabsList>
                    <TabsTrigger value="chapters">Chapters ({chapters.length})</TabsTrigger>
                    <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="chapters" className="mt-4">
                    <Card>
                        <CardContent className="pt-6">
                            {chapters.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">No chapters yet</div>
                            ) : (
                                <div className="space-y-2">
                                    {chapters.map((chapter) => (
                                        <div key={chapter.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/30 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-mono text-muted-foreground w-8">#{chapter.chapter_number}</span>
                                                <div>
                                                    <p className="font-medium text-sm">{chapter.title}</p>
                                                    <p className="text-xs text-muted-foreground">{chapter.word_count.toLocaleString()} words</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {chapter.views.toLocaleString()}</span>
                                                <span>👍 {chapter.likes}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="reviews" className="mt-4">
                    <Card>
                        <CardContent className="pt-6">
                            {reviews.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">No reviews yet</div>
                            ) : (
                                <div className="space-y-3">
                                    {reviews.map((review: any) => (
                                        <div key={review.id} className="p-3 rounded-lg border">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium">{review.user?.display_name || review.user?.username || 'User'}</span>
                                                <div className="flex items-center gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                            {review.review_text && (
                                                <p className="text-sm text-muted-foreground">{review.review_text}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <ConfirmDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title="Delete Novel"
                description={`Are you sure you want to delete "${novel.title}"? This will permanently remove all chapters and reviews. This action cannot be undone.`}
                confirmLabel="Delete Novel"
                variant="destructive"
                onConfirm={handleDelete}
            />
        </div>
    );
}
