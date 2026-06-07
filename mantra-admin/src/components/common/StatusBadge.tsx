'use client';

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType =
    | 'pending' | 'reviewed' | 'resolved' | 'dismissed'
    | 'approved' | 'completed' | 'failed' | 'rejected'
    | 'ongoing' | 'hiatus'
    | 'successful'
    | 'responded'
    | 'user' | 'author' | 'admin';

const statusConfig: Record<StatusType, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
    pending: { label: 'Pending', variant: 'outline', className: 'border-amber-500/50 text-amber-600 bg-amber-50 dark:bg-amber-950/20' },
    reviewed: { label: 'Reviewed', variant: 'outline', className: 'border-blue-500/50 text-blue-600 bg-blue-50 dark:bg-blue-950/20' },
    resolved: { label: 'Resolved', variant: 'outline', className: 'border-emerald-500/50 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20' },
    dismissed: { label: 'Dismissed', variant: 'outline', className: 'border-gray-500/50 text-gray-600 bg-gray-50 dark:bg-gray-950/20' },
    approved: { label: 'Approved', variant: 'outline', className: 'border-emerald-500/50 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20' },
    completed: { label: 'Completed', variant: 'outline', className: 'border-emerald-500/50 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20' },
    successful: { label: 'Successful', variant: 'outline', className: 'border-emerald-500/50 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20' },
    failed: { label: 'Failed', variant: 'destructive', className: '' },
    rejected: { label: 'Rejected', variant: 'destructive', className: '' },
    ongoing: { label: 'Ongoing', variant: 'outline', className: 'border-blue-500/50 text-blue-600 bg-blue-50 dark:bg-blue-950/20' },
    hiatus: { label: 'Hiatus', variant: 'outline', className: 'border-amber-500/50 text-amber-600 bg-amber-50 dark:bg-amber-950/20' },
    responded: { label: 'Responded', variant: 'outline', className: 'border-blue-500/50 text-blue-600 bg-blue-50 dark:bg-blue-950/20' },
    user: { label: 'User', variant: 'secondary', className: '' },
    author: { label: 'Author', variant: 'default', className: 'bg-violet-600 hover:bg-violet-700' },
    admin: { label: 'Admin', variant: 'destructive', className: '' },
};

interface StatusBadgeProps {
    status: string;
    className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const config = statusConfig[status as StatusType] || {
        label: status,
        variant: 'secondary' as const,
        className: '',
    };

    return (
        <Badge
            variant={config.variant}
            className={cn("text-xs font-medium", config.className, className)}
        >
            {config.label}
        </Badge>
    );
}
