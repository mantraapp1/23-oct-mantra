'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    trend?: { value: number; isPositive: boolean };
    className?: string;
    iconColor?: string;
}

export function StatsCard({ title, value, subtitle, icon: Icon, trend, className, iconColor = 'text-muted-foreground' }: StatsCardProps) {
    return (
        <Card className={cn("relative overflow-hidden", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center bg-muted/50", iconColor)}>
                    <Icon className="h-5 w-5" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold tracking-tight">{typeof value === 'number' ? value.toLocaleString() : value}</div>
                {(subtitle || trend) && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        {trend && (
                            <span className={cn(
                                "font-medium",
                                trend.isPositive ? 'text-emerald-500' : 'text-red-500'
                            )}>
                                {trend.isPositive ? '+' : ''}{trend.value}%
                            </span>
                        )}
                        {subtitle}
                    </p>
                )}
            </CardContent>
            <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.03]">
                <Icon className="w-full h-full" />
            </div>
        </Card>
    );
}
