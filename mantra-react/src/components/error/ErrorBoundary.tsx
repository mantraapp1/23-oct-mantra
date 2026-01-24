import { Component, type ReactNode, type ErrorInfo } from 'react';

// ============================================
// Types
// ============================================

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

// ============================================
// Error Boundary Component
// ============================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log to console in development
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        // Call optional error handler
        this.props.onError?.(error, errorInfo);

        // TODO: Send to error reporting service (e.g., Sentry)
        // if (import.meta.env.PROD) {
        //     captureException(error, { extra: errorInfo });
        // }
    }

    handleRetry = (): void => {
        this.setState({ hasError: false, error: null });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <ErrorFallback
                    error={this.state.error}
                    onRetry={this.handleRetry}
                />
            );
        }

        return this.props.children;
    }
}

// ============================================
// Default Error Fallback
// ============================================

interface ErrorFallbackProps {
    error: Error | null;
    onRetry?: () => void;
}

export function ErrorFallback({ error, onRetry }: ErrorFallbackProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
            <div className="max-w-md w-full text-center">
                {/* Error Icon */}
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
                    <svg
                        className="w-10 h-10 text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                </div>

                {/* Error Message */}
                <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                    Something went wrong
                </h1>
                <p className="text-[var(--foreground-secondary)] mb-6">
                    We're sorry, but something unexpected happened. Please try again.
                </p>

                {/* Error Details (Development Only) */}
                {import.meta.env.DEV && error && (
                    <div className="mb-6 p-4 bg-red-50 rounded-xl text-left overflow-auto max-h-32">
                        <p className="text-xs font-mono text-red-600 break-all">
                            {error.message}
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className="px-6 py-3 bg-[var(--primary)] text-white rounded-xl font-semibold hover:bg-sky-600 transition-colors"
                        >
                            Try Again
                        </button>
                    )}
                    <button
                        onClick={() => window.location.href = '/'}
                        className="px-6 py-3 border border-[var(--border)] rounded-xl font-semibold text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-colors"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================
// Page-Level Error Fallback
// ============================================

interface PageErrorProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
}

export function PageError({
    title = 'Failed to load',
    message = 'There was an error loading this page. Please try again.',
    onRetry
}: PageErrorProps) {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-16 h-16 mb-4 rounded-full bg-red-50 flex items-center justify-center">
                <svg
                    className="w-8 h-8 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            </div>
            <h2 className="text-lg font-bold text-[var(--foreground)] mb-1">{title}</h2>
            <p className="text-sm text-[var(--foreground-secondary)] text-center mb-4">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors"
                >
                    Retry
                </button>
            )}
        </div>
    );
}
