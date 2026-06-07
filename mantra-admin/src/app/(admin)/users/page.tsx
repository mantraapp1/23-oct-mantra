'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminService } from '@/services/adminService';
import { Profile } from '@/types/supabase';
import { StatsCard } from '@/components/common/StatsCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Users, UserCheck, Crown, Shield, MoreHorizontal, Search, ChevronLeft, ChevronRight, ExternalLink, Gift, MessageSquare, ShieldCheck, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { UserActionsDialog } from '@/components/users/UserActionsDialog';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export default function UsersPage() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [giftUser, setGiftUser] = useState<Profile | null>(null);
    const [msgUser, setMsgUser] = useState<Profile | null>(null);
    const limit = 20;

    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const { users, count } = await adminService.getAllUsers(page, limit, search, roleFilter);
            setUsers(users);
            setTotalCount(count);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    }, [page, search, roleFilter]);

    useEffect(() => { loadUsers(); }, [loadUsers]);

    const handleRoleChange = async (userId: string, newRole: 'user' | 'author' | 'admin') => {
        try {
            await adminService.updateUserRole(userId, newRole);
            toast.success(`Role updated to ${newRole}`);
            loadUsers();
        } catch {
            toast.error('Failed to update role');
        }
    };

    const handleVerifyToggle = async (userId: string, isVerified: boolean) => {
        try {
            await adminService.toggleUserVerification(userId, isVerified);
            toast.success(isVerified ? 'User verified' : 'Verification removed');
            loadUsers();
        } catch {
            toast.error('Failed to update verification');
        }
    };

    const totalPages = Math.ceil(totalCount / limit);

    // Count roles
    const authorCount = users.filter(u => u.role === 'author').length;
    const adminCount = users.filter(u => u.role === 'admin').length;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
                <p className="text-muted-foreground mt-1">Manage all registered users on the platform.</p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <StatsCard title="Total Users" value={totalCount} icon={Users} iconColor="text-violet-400" />
                <StatsCard title="Authors" value={authorCount} icon={Crown} iconColor="text-pink-400" />
                <StatsCard title="Admins" value={adminCount} icon={Shield} iconColor="text-red-400" />
                <StatsCard title="Verified" value={users.filter(u => u.is_verified).length} icon={UserCheck} iconColor="text-emerald-400" />
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by username or name..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="pl-9"
                            />
                        </div>
                        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v === 'all' ? '' : v); setPage(1); }}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="All Roles" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="author">Author</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12"></TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Verified</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={6} className="h-16">
                                            <div className="animate-pulse bg-muted h-4 rounded w-full" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No users found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={user.profile_picture_url || ''} />
                                                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-xs">
                                                    {(user.username || user.display_name || '?').charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <Link href={`/users/${user.id}`} className="font-medium hover:text-primary transition-colors">
                                                    {user.display_name || user.username || 'Unknown'}
                                                </Link>
                                                <p className="text-xs text-muted-foreground">@{user.username || 'no-username'}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell><StatusBadge status={user.role} /></TableCell>
                                        <TableCell>
                                            {user.is_verified ? (
                                                <span className="text-emerald-400 text-xs font-medium flex items-center gap-1">
                                                    <ShieldCheck className="h-3.5 w-3.5" /> Verified
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {user.created_at
                                                ? formatDistanceToNow(new Date(user.created_at), { addSuffix: true })
                                                : '—'}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/users/${user.id}`}>
                                                            <ExternalLink className="mr-2 h-4 w-4" /> View Details
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleVerifyToggle(user.id, !user.is_verified)}>
                                                        {user.is_verified ? (
                                                            <><ShieldOff className="mr-2 h-4 w-4" /> Remove Verification</>
                                                        ) : (
                                                            <><ShieldCheck className="mr-2 h-4 w-4" /> Verify User</>
                                                        )}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuLabel className="text-xs text-muted-foreground">Change Role</DropdownMenuLabel>
                                                    {(['user', 'author', 'admin'] as const).map((role) => (
                                                        <DropdownMenuItem
                                                            key={role}
                                                            onClick={() => handleRoleChange(user.id, role)}
                                                            disabled={user.role === role}
                                                        >
                                                            Set as {role.charAt(0).toUpperCase() + role.slice(1)}
                                                        </DropdownMenuItem>
                                                    ))}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => setGiftUser(user)}>
                                                        <Gift className="mr-2 h-4 w-4" /> Send Gift
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setMsgUser(user)}>
                                                        <MessageSquare className="mr-2 h-4 w-4" /> Send Message
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

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, totalCount)} of {totalCount}
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>
                            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
                            Next <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Dialogs */}
            {giftUser && (
                <UserActionsDialog user={giftUser} type="gift" open={!!giftUser} onOpenChange={(open) => !open && setGiftUser(null)} />
            )}
            {msgUser && (
                <UserActionsDialog user={msgUser} type="message" open={!!msgUser} onOpenChange={(open) => !open && setMsgUser(null)} />
            )}
        </div>
    );
}
