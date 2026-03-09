import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import notificationService from '@/services/notificationService';

interface NotificationContextType {
    unreadCount: number;
    refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
    unreadCount: 0,
    refreshUnreadCount: async () => { },
});

export function useNotifications() {
    return useContext(NotificationContext);
}

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    const refreshUnreadCount = useCallback(async () => {
        if (!user) {
            setUnreadCount(0);
            return;
        }
        try {
            const count = await notificationService.getUnreadCount(user.id);
            setUnreadCount(count);
        } catch {
        }
    }, [user]);

    // Fetch unread count when user logs in
    useEffect(() => {
        refreshUnreadCount();
    }, [refreshUnreadCount]);

    // Poll every 60 seconds for new notifications
    useEffect(() => {
        if (!user) return;
        const interval = setInterval(refreshUnreadCount, 60000);
        return () => clearInterval(interval);
    }, [user, refreshUnreadCount]);

    return (
        <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount }}>
            {children}
        </NotificationContext.Provider>
    );
}
