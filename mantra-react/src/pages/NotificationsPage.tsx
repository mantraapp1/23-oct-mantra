
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, UserPlus, MessageCircle, Heart, DollarSign, CreditCard, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import notificationService, { type Notification } from '@/services/notificationService';

function formatTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}

export default function NotificationsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // Removed unused isRefreshing


    useEffect(() => {
        if (!authLoading && !user) navigate('/login');
        if (user) loadNotifications(user.id);
    }, [user, authLoading, navigate]);

    const loadNotifications = async (userId: string) => {
        setIsLoading(true);
        const data = await notificationService.getNotifications(userId);
        setNotifications(data);
        setIsLoading(false);
    };

    const handleMarkAllRead = async () => {
        if (!user) return;
        await notificationService.markAllAsRead(user.id);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    };

    const handleMarkRead = async (id: string) => {
        await notificationService.markAsRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'new_chapter': return <Bell className="w-5 h-5 text-sky-500" />;
            case 'new_follower': return <UserPlus className="w-5 h-5 text-amber-500" />;
            case 'new_comment': return <MessageCircle className="w-5 h-5 text-sky-500" />;
            case 'comment_reply': return <MessageCircle className="w-5 h-5 text-sky-500" />;
            case 'review_like':
            case 'comment_like': return <Heart className="w-5 h-5 text-rose-500" />;
            case 'wallet_earning': return <DollarSign className="w-5 h-5 text-emerald-500" />;
            case 'withdrawal_status': return <CreditCard className="w-5 h-5 text-sky-500" />;
            default: return <Bell className="w-5 h-5 text-slate-500" />;
        }
    };

    const getBgColor = (_type: string) => {
        return 'bg-secondary/50 dark:bg-secondary/20';
    };

    if (isLoading) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-8 flex justify-center">
                <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-[1800px] mx-auto px-4 py-6 font-inter text-foreground min-h-screen pb-20">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/profile')} className="p-2 -ml-2 hover:bg-background-secondary rounded-full items-center justify-center flex transition-colors">
                        <ChevronLeft className="w-6 h-6 text-foreground-secondary" />
                    </button>
                    <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
                </div>
                {notifications.some(n => !n.is_read) && (
                    <button
                        onClick={handleMarkAllRead}
                        className="text-sm font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                    >
                        <Check className="w-4 h-4" /> Mark all read
                    </button>
                )}
            </div>

            <div className="space-y-3">
                {notifications.length > 0 ? (
                    notifications.map((notification) => (
                        <div
                            key={notification.id}
                            onClick={() => handleMarkRead(notification.id)}
                            className={`flex gap-4 p-4 rounded-xl border transition-all cursor-pointer hover:shadow-sm ${notification.is_read ? 'bg-card border-border' : 'bg-secondary/30 border-sky-500/20 dark:bg-secondary/10'
                                }`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getBgColor(notification.type)}`}>
                                {getIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-foreground text-sm mb-0.5">
                                    {notification.title || 'Notification'}
                                </h4>
                                <p className="text-foreground-secondary text-sm leading-relaxed">
                                    {notification.message}
                                </p>
                                <div className="text-xs text-muted-foreground mt-2 font-medium">
                                    {formatTimeAgo(notification.created_at)}
                                </div>
                            </div>
                            {!notification.is_read && (
                                <div className="w-2 h-2 bg-sky-500 rounded-full flex-shrink-0 mt-2"></div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-16 bg-muted/10 rounded-2xl border border-border border-dashed">
                        <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-border">
                            <Bell className="w-8 h-8 text-foreground-secondary" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-1">No notifications</h3>
                        <p className="text-muted-foreground text-sm">You haven't received any alerts yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
