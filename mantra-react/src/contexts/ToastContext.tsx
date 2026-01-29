import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, Loader2 } from 'lucide-react';

// Types
export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
    onAction?: () => void;
    actionText?: string;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
    toast: {
        success: (message: string, duration?: number) => void;
        error: (message: string, duration?: number) => void;
        info: (message: string, duration?: number) => void;
        warning: (message: string, duration?: number) => void;
        loading: (message: string) => string;
        dismiss: (id: string) => void;
    };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

// Toast Component - Pill-style matching mobile app
const ToastItem = ({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // Trigger entrance animation
        requestAnimationFrame(() => setIsVisible(true));

        // Auto-dismiss (skip for loading toasts)
        const duration = toast.duration ?? 3000;
        if (duration > 0 && toast.type !== 'loading') {
            const timer = setTimeout(() => {
                handleClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [toast.duration, toast.type]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => onRemove(toast.id), 300);
    };

    const icons = {
        success: <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
        error: <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />,
        info: <Info className="w-5 h-5 text-sky-500 flex-shrink-0" />,
        warning: <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />,
        loading: <Loader2 className="w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0 animate-spin" />
    };

    const iconColors = {
        success: 'text-emerald-500',
        error: 'text-red-500',
        info: 'text-sky-500',
        warning: 'text-amber-500',
        loading: 'text-slate-500'
    };

    return (
        <div
            role="alert"
            onClick={handleClose}
            className={`
                pointer-events-auto cursor-pointer
                flex items-center gap-3
                px-5 py-3.5
                min-w-[200px] max-w-sm
                rounded-full
                bg-white dark:bg-slate-800
                border border-slate-200 dark:border-slate-700
                shadow-lg dark:shadow-black/40
                transition-all duration-300 ease-out
                ${isVisible && !isExiting
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-6'
                }
            `}
        >
            {/* Icon */}
            {icons[toast.type]}

            {/* Message */}
            <span className="text-sm font-medium text-slate-900 dark:text-slate-50 tracking-wide leading-5">
                {toast.message}
            </span>

            {/* Action Button */}
            {toast.actionText && toast.onAction && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        toast.onAction?.();
                        handleClose();
                    }}
                    className={`ml-2 text-xs font-bold ${iconColors[toast.type]} hover:underline`}
                >
                    {toast.actionText}
                </button>
            )}
        </div>
    );
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const addToast = useCallback(({ type, message, duration, onAction, actionText }: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast = { id, type, message, duration, onAction, actionText };
        setToasts((prev) => [...prev, newToast]);
        return id;
    }, []);

    const toast = {
        success: (message: string, duration?: number) =>
            addToast({ type: 'success', message, duration: duration ?? 3000 }),
        error: (message: string, duration?: number) =>
            addToast({ type: 'error', message, duration: duration ?? 4000 }),
        info: (message: string, duration?: number) =>
            addToast({ type: 'info', message, duration: duration ?? 3000 }),
        warning: (message: string, duration?: number) =>
            addToast({ type: 'warning', message, duration: duration ?? 3500 }),
        loading: (message: string) =>
            addToast({ type: 'loading', message, duration: 0 }), // Never auto-dismiss
        dismiss: (id: string) => removeToast(id)
    };

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, toast }}>
            {children}
            {/* Toast Container - Bottom Center like mobile */}
            <div className="pointer-events-none fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col-reverse gap-2 items-center">
                {toasts.map((t) => (
                    <ToastItem key={t.id} toast={t} onRemove={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}
