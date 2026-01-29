import { createContext, useContext, useState, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { X, HelpCircle, AlertTriangle } from 'lucide-react';

interface DialogOptions {
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
}

interface DialogContextType {
    confirm: (message: string, options?: Omit<DialogOptions, 'title'> & { title?: string }) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const useConfirm = () => {
    const context = useContext(DialogContext);
    if (!context) {
        throw new Error('useConfirm must be used within a DialogProvider');
    }
    return context.confirm;
};

export function DialogProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [config, setConfig] = useState<DialogOptions>({ title: '' });

    // Store the resolve promise
    const resolveRef = useRef<(value: boolean) => void>(() => { });

    const confirm = useCallback((message: string, options?: Omit<DialogOptions, 'title'> & { title?: string }) => {
        return new Promise<boolean>((resolve) => {
            setConfig({
                title: options?.title || 'Confirmation',
                description: message,
                confirmText: options?.confirmText || 'Confirm',
                cancelText: options?.cancelText || 'Cancel',
                variant: options?.variant || 'default'
            });
            setIsOpen(true);
            resolveRef.current = resolve;
        });
    }, []);

    const handleClose = (value: boolean) => {
        setIsOpen(false);
        resolveRef.current(value);
    };

    return (
        <DialogContext.Provider value={{ confirm }}>
            {children}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/60 animate-in fade-in duration-200"
                        onClick={() => handleClose(false)}
                    />

                    {/* Dialog Panel */}
                    <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md border border-border overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.variant === 'destructive' ? 'bg-red-50 text-red-500' : 'bg-sky-50 text-sky-500'}`}>
                                    {config.variant === 'destructive' ? (
                                        <AlertTriangle className="w-5 h-5" />
                                    ) : (
                                        <HelpCircle className="w-5 h-5" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-foreground">{config.title}</h3>
                                </div>
                            </div>

                            <p className="text-foreground-secondary leading-relaxed mb-6">
                                {config.description}
                            </p>

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => handleClose(false)}
                                    className="px-4 py-2 text-sm font-semibold text-foreground-secondary hover:bg-secondary rounded-lg transition-colors border border-border"
                                >
                                    {config.cancelText}
                                </button>
                                <button
                                    onClick={() => handleClose(true)}
                                    className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-transform active:scale-95 shadow-md ${config.variant === 'destructive'
                                        ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                                        : 'bg-sky-500 hover:bg-sky-600 shadow-sky-500/20'
                                        }`}
                                >
                                    {config.confirmText}
                                </button>
                            </div>
                        </div>

                        {/* Close X */}
                        <button
                            onClick={() => handleClose(false)}
                            className="absolute top-4 right-4 text-foreground-secondary/50 hover:text-foreground p-1"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </DialogContext.Provider>
    );
}
