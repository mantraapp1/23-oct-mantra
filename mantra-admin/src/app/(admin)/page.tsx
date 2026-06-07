'use client';

import { useEffect, useState } from 'react';
import { StatsCard } from '@/components/common/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminService } from '@/services/adminService';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, BookOpen, DollarSign, ShieldAlert, TrendingUp, FileText, Clock, UserPlus } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { DashboardStats, ChartDataPoint, ActivityItem } from '@/types/supabase';
import { formatDistanceToNow } from 'date-fns';

const activityIcons: Record<string, { icon: string; color: string }> = {
    new_user: { icon: '👤', color: 'bg-violet-500/10 text-violet-400' },
    new_novel: { icon: '📖', color: 'bg-pink-500/10 text-pink-400' },
    new_report: { icon: '⚠️', color: 'bg-orange-500/10 text-orange-400' },
    withdrawal: { icon: '💰', color: 'bg-emerald-500/10 text-emerald-400' },
    new_chapter: { icon: '📝', color: 'bg-blue-500/10 text-blue-400' },
};

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [revenueData, setRevenueData] = useState<ChartDataPoint[]>([]);
    const [userGrowthData, setUserGrowthData] = useState<ChartDataPoint[]>([]);
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const [statsData, revenue, growth, activity] = await Promise.all([
                adminService.getDashboardStats(),
                adminService.getRevenueChart(30),
                adminService.getUserGrowthChart(30),
                adminService.getRecentActivity(8),
            ]);
            setStats(statsData);
            setRevenueData(revenue);
            setUserGrowthData(growth);
            setActivities(activity);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground mt-1">Overview of your Mantra Novels platform.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
                            <CardContent><Skeleton className="h-8 w-32" /><Skeleton className="h-3 w-20 mt-2" /></CardContent>
                        </Card>
                    ))}
                </div>
                <div className="grid gap-4 md:grid-cols-7">
                    <Card className="col-span-4"><CardContent className="pt-6"><Skeleton className="h-[280px]" /></CardContent></Card>
                    <Card className="col-span-3"><CardContent className="pt-6"><Skeleton className="h-[280px]" /></CardContent></Card>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground mt-1">Overview of your Mantra Novels platform.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Total Users"
                    value={stats?.totalUsers || 0}
                    icon={Users}
                    iconColor="text-violet-400"
                    subtitle={`+${stats?.newUsersThisWeek || 0} this week`}
                    trend={stats?.newUsersThisWeek ? { value: Math.round(((stats.newUsersThisWeek) / Math.max(stats.totalUsers - stats.newUsersThisWeek, 1)) * 100), isPositive: true } : undefined}
                />
                <StatsCard
                    title="Total Novels"
                    value={stats?.totalNovels || 0}
                    icon={BookOpen}
                    iconColor="text-pink-400"
                    subtitle={`+${stats?.newNovelsThisWeek || 0} this week`}
                />
                <StatsCard
                    title="Total Revenue"
                    value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`}
                    icon={DollarSign}
                    iconColor="text-emerald-400"
                    subtitle="All time earnings"
                />
                <StatsCard
                    title="Pending Reports"
                    value={stats?.pendingReports || 0}
                    icon={ShieldAlert}
                    iconColor="text-orange-400"
                    subtitle={`${stats?.pendingWithdrawals || 0} pending withdrawals`}
                />
            </div>

            {/* Charts Row */}
            <div className="grid gap-4 md:grid-cols-7">
                {/* Revenue Chart */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <TrendingUp className="h-4 w-4 text-emerald-400" />
                            Revenue Overview
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">Last 30 days</p>
                    </CardHeader>
                    <CardContent>
                        {revenueData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={revenueData}>
                                    <defs>
                                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="oklch(0.72 0.19 265)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="oklch(0.72 0.19 265)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.26 0.01 270)" />
                                    <XAxis dataKey="date" stroke="oklch(0.65 0.015 270)" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="oklch(0.65 0.015 270)" fontSize={11} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'oklch(0.16 0.005 270)',
                                            border: '1px solid oklch(0.26 0.01 270)',
                                            borderRadius: '8px',
                                            color: 'oklch(0.95 0.005 270)',
                                            fontSize: '12px',
                                        }}
                                    />
                                    <Area type="monotone" dataKey="value" stroke="oklch(0.72 0.19 265)" fill="url(#revenueGradient)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                                No revenue data yet
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* User Growth Chart */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <UserPlus className="h-4 w-4 text-violet-400" />
                            User Growth
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">New registrations per day</p>
                    </CardHeader>
                    <CardContent>
                        {userGrowthData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={userGrowthData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.26 0.01 270)" />
                                    <XAxis dataKey="date" stroke="oklch(0.65 0.015 270)" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="oklch(0.65 0.015 270)" fontSize={11} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'oklch(0.16 0.005 270)',
                                            border: '1px solid oklch(0.26 0.01 270)',
                                            borderRadius: '8px',
                                            color: 'oklch(0.95 0.005 270)',
                                            fontSize: '12px',
                                        }}
                                    />
                                    <Bar dataKey="value" fill="oklch(0.72 0.19 265)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                                No growth data yet
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Row */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Clock className="h-4 w-4 text-blue-400" />
                            Recent Activity
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">Latest events across the platform</p>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {activities.length > 0 ? activities.map((activity) => {
                                const config = activityIcons[activity.type] || activityIcons.new_user;
                                return (
                                    <div key={activity.id} className="flex items-start gap-3">
                                        <div className={`h-8 w-8 rounded-lg ${config.color} flex items-center justify-center text-sm shrink-0`}>
                                            {config.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium">{activity.title}</p>
                                            <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground shrink-0">
                                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                                        </span>
                                    </div>
                                );
                            }) : (
                                <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FileText className="h-4 w-4 text-teal-400" />
                            Platform Stats
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">Key metrics at a glance</p>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-2 border-b border-border">
                                <span className="text-sm text-muted-foreground">Total Chapters</span>
                                <span className="text-sm font-semibold">{(stats?.totalChapters || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-border">
                                <span className="text-sm text-muted-foreground">Pending Reports</span>
                                <span className="text-sm font-semibold text-orange-400">{stats?.pendingReports || 0}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-border">
                                <span className="text-sm text-muted-foreground">Pending Withdrawals</span>
                                <span className="text-sm font-semibold text-amber-400">{stats?.pendingWithdrawals || 0}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-border">
                                <span className="text-sm text-muted-foreground">New Users (7d)</span>
                                <span className="text-sm font-semibold text-violet-400">+{stats?.newUsersThisWeek || 0}</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-sm text-muted-foreground">New Novels (7d)</span>
                                <span className="text-sm font-semibold text-pink-400">+{stats?.newNovelsThisWeek || 0}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
