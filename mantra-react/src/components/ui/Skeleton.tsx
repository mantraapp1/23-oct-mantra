import { cn } from '@/lib/utils';

// ============================================
// Base Skeleton
// ============================================

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                'animate-pulse bg-slate-200 dark:bg-slate-700 rounded-lg',
                className
            )}
        />
    );
}

// ============================================
// Novel Card Skeleton
// ============================================

export function NovelCardSkeleton() {
    return (
        <div className="w-full space-y-3">
            {/* Cover Image */}
            <Skeleton className="w-full aspect-[2/3] rounded-xl" />
            {/* Title */}
            <Skeleton className="h-4 w-3/4" />
            {/* Category */}
            <Skeleton className="h-3 w-1/2" />
        </div>
    );
}

// ============================================
// Novel Cards Grid Skeleton
// ============================================

interface NovelGridSkeletonProps {
    count?: number;
}

export function NovelGridSkeleton({ count = 8 }: NovelGridSkeletonProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <NovelCardSkeleton key={i} />
            ))}
        </div>
    );
}

// ============================================
// Novel List Card Skeleton (Horizontal)
// ============================================

export function NovelListCardSkeleton() {
    return (
        <div className="flex gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            {/* Cover */}
            <Skeleton className="h-20 w-14 rounded-lg flex-shrink-0" />
            {/* Content */}
            <div className="flex-1 space-y-2 py-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-5 w-20 rounded-full" />
            </div>
        </div>
    );
}

// ============================================
// Chapter List Skeleton
// ============================================

interface ChapterListSkeletonProps {
    count?: number;
}

export function ChapterListSkeleton({ count = 5 }: ChapterListSkeletonProps) {
    return (
        <div className="space-y-2">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-4" />
                </div>
            ))}
        </div>
    );
}

// ============================================
// Profile Skeleton
// ============================================

export function ProfileSkeleton() {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            {/* Header Banner */}
            <Skeleton className="h-32 rounded-none" />

            {/* Profile Content */}
            <div className="px-8 pb-8">
                <div className="relative -mt-16 mb-6 flex justify-between items-end">
                    {/* Avatar */}
                    <Skeleton className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-900" />
                    {/* Edit Button */}
                    <Skeleton className="h-10 w-28 rounded-lg" />
                </div>

                {/* Name */}
                <Skeleton className="h-7 w-48 mb-2" />
                {/* Username */}
                <Skeleton className="h-4 w-32" />
            </div>
        </div>
    );
}

// ============================================
// Wallet Skeleton
// ============================================

export function WalletSkeleton() {
    return (
        <div className="space-y-8">
            {/* Balance Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Skeleton className="md:col-span-2 h-48 rounded-2xl" />
                <div className="flex flex-col gap-4">
                    <Skeleton className="flex-1 h-24 rounded-2xl" />
                    <Skeleton className="flex-1 h-24 rounded-2xl" />
                </div>
            </div>

            {/* Transactions */}
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <Skeleton className="h-6 w-40" />
                </div>
                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-4">
                                <Skeleton className="w-12 h-12 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                            </div>
                            <div className="text-right space-y-2">
                                <Skeleton className="h-4 w-20 ml-auto" />
                                <Skeleton className="h-3 w-16 ml-auto" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ============================================
// Comment Skeleton
// ============================================

export function CommentSkeleton() {
    return (
        <div className="flex gap-3">
            <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-4 pt-1">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-12" />
                </div>
            </div>
        </div>
    );
}

// ============================================
// Text Skeleton
// ============================================

interface TextSkeletonProps {
    lines?: number;
    className?: string;
}

export function TextSkeleton({ lines = 3, className }: TextSkeletonProps) {
    return (
        <div className={cn('space-y-2', className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={cn('h-4', i === lines - 1 ? 'w-3/4' : 'w-full')}
                />
            ))}
        </div>
    );
}
