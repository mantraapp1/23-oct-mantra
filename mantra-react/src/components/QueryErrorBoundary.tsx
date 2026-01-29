import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * PRODUCTION-GRADE ERROR BOUNDARY
 * 
 * Catches React errors and displays a fallback UI.
 * Works with React Query's error handling for robust error management.
 */
export class QueryErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('QueryErrorBoundary caught an error:', error, errorInfo);
        // In production, you could send this to an error tracking service
        // e.g., Sentry, LogRocket, etc.
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <svg
                        className="w-12 h-12 text-red-500 mb-4"
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
                    <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
                        Something went wrong
                    </h3>
                    <p className="text-sm text-red-600 dark:text-red-300 mb-4 text-center max-w-md">
                        {this.state.error?.message || 'An unexpected error occurred'}
                    </p>
                    <button
                        onClick={this.handleRetry}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Simple inline error display for query errors
 */
export function QueryError({
    error,
    onRetry
}: {
    error: Error | null;
    onRetry?: () => void;
}) {
    if (!error) return null;

    return (
        <div className="flex flex-col items-center justify-center p-4 text-center">
            <p className="text-red-500 dark:text-red-400 mb-2">
                Failed to load data
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                {error.message}
            </p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="px-3 py-1.5 text-sm bg-sky-500 hover:bg-sky-600 text-white rounded-md transition-colors"
                >
                    Retry
                </button>
            )}
        </div>
    );
}

/**
 * Loading skeleton for query loading states
 */
export function QueryLoading({ className = '' }: { className?: string }) {
    return (
        <div className={`animate-pulse ${className}`}>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
        </div>
    );
}
