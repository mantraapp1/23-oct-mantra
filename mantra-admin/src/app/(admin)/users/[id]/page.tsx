'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { adminService } from '@/services/adminService';
import { Profile, Novel, Wallet } from '@/types/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Users, Wallet as WalletIcon, ShieldCheck, ShieldOff, Crown, ArrowLeft, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Link from 'next/link';

export default function UserDetailPage() {
    const params = useParams();
    const userId = params.id as string;
    const [profile, setProfile] = useState<Profile | null>(null);
    const [novels, setNovels] = useState<Novel[]>([]);
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [novelCount, setNovelCount] = useState(0);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUser();
    }, [userId]);

    const loadUser = async () => {
        try {
            const data = await adminService.getUserDetails(userId);
            setProfile(data.profile);
            setNovels(data.novels);
            setNovelCount(data.novelCount);
            setWallet(data.wallet);
            setFollowersCount(data.followersCount);
            setFollowingCount(data.followingCount);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load user details');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (role: 'user' | 'author' | 'admin') => {
        try {
            await adminService.updateUserRole(userId, role);
            toast.success(`Role updated to ${role}`);
            loadUser();
        } catch { toast.error('Failed to update role'); }
    };

    const handleVerifyToggle = async () => {
        if (!profile) return;
        try {
            await adminService.toggleUserVerification(userId, !profile.is_verified);
            toast.success(profile.is_verified ? 'Verification removed' : 'User verified');
            loadUser();
        } catch { toast.error('Failed to update'); }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!profile) {
        return <div className="text-center py-16 text-muted-foreground">User not found</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/users"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">User Details</h2>
                    <p className="text-muted-foreground">Manage {profile.display_name || profile.username}</p>
                </div>
            </div>

            {/* Profile Card */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row items-start gap-6">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={profile.profile_picture_url || ''} />
                            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-2xl">
                                {(profile.username || '?').charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h3 className="text-xl font-bold">{profile.display_name || profile.full_name || 'Unknown'}</h3>
                                <StatusBadge status={profile.role} />
                                {profile.is_verified && (
                                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                                        <ShieldCheck className="h-3.5 w-3.5" /> Verified
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">@{profile.username || 'no-username'}</p>
                            {profile.bio && <p className="text-sm text-muted-foreground max-w-lg">{profile.bio}</p>}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-1">
                                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Joined {profile.created_at ? format(new Date(profile.created_at), 'MMM dd, yyyy') : '—'}</span>
                                {profile.gender && <span>• {profile.gender}</span>}
                                {profile.age && <span>• Age {profile.age}</span>}
                            </div>
                        </div>
                    </div>

                    <Separator className="my-6" />

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                        <div className="text-center p-3 rounded-lg bg-muted/30">
                            <div className="text-2xl font-bold">{novelCount}</div>
                            <div className="text-xs text-muted-foreground">Novels</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-muted/30">
                            <div className="text-2xl font-bold">{followersCount}</div>
                            <div className="text-xs text-muted-foreground">Followers</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-muted/30">
                            <div className="text-2xl font-bold">{followingCount}</div>
                            <div className="text-xs text-muted-foreground">Following</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-muted/30">
                            <div className="text-2xl font-bold">₹{wallet?.balance?.toLocaleString() || '0'}</div>
                            <div className="text-xs text-muted-foreground">Balance</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-muted/30">
                            <div className="text-2xl font-bold">₹{wallet?.total_earned?.toLocaleString() || '0'}</div>
                            <div className="text-xs text-muted-foreground">Total Earned</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="novels">
                <TabsList>
                    <TabsTrigger value="novels">Novels ({novelCount})</TabsTrigger>
                    <TabsTrigger value="actions">Admin Actions</TabsTrigger>
                </TabsList>

                <TabsContent value="novels" className="mt-4">
                    <Card>
                        <CardContent className="pt-6">
                            {novels.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No novels published yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {novels.map((novel) => (
                                        <Link key={novel.id} href={`/novels/${novel.id}`} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                            <div className="w-10 h-14 rounded bg-muted overflow-hidden shrink-0">
                                                {novel.cover_image_url && (
                                                    <img src={novel.cover_image_url} alt="" className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{novel.title}</p>
                                                <p className="text-xs text-muted-foreground">{novel.total_chapters} chapters • {novel.total_views.toLocaleString()} views</p>
                                            </div>
                                            <StatusBadge status={novel.status} />
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="actions" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle className="text-base">Admin Actions</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg border">
                                <div>
                                    <p className="font-medium">Change Role</p>
                                    <p className="text-sm text-muted-foreground">Current: {profile.role}</p>
                                </div>
                                <div className="flex gap-2">
                                    {(['user', 'author', 'admin'] as const).map((role) => (
                                        <Button key={role} size="sm" variant={profile.role === role ? 'default' : 'outline'}
                                            onClick={() => handleRoleChange(role)} disabled={profile.role === role}>
                                            <Crown className="h-3 w-3 mr-1" />{role}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-lg border">
                                <div>
                                    <p className="font-medium">Verification</p>
                                    <p className="text-sm text-muted-foreground">{profile.is_verified ? 'Currently verified' : 'Not verified'}</p>
                                </div>
                                <Button size="sm" variant={profile.is_verified ? 'outline' : 'default'} onClick={handleVerifyToggle}>
                                    {profile.is_verified ? <><ShieldOff className="h-3 w-3 mr-1" /> Remove</> : <><ShieldCheck className="h-3 w-3 mr-1" /> Verify</>}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
