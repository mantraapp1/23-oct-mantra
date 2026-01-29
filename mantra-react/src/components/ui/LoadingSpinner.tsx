interface LoadingSpinnerProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function LoadingSpinner({ className = "", size = "md" }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'w-4 h-4 border-2',
        md: 'w-8 h-8 border-4',
        lg: 'w-12 h-12 border-4',
        xl: 'w-16 h-16 border-4',
    };

    return (
        <div className={`flex justify-center items-center ${className}`}>
            <div className={`border-sky-500 border-t-transparent rounded-full animate-spin ${sizeClasses[size]}`} />
        </div>
    );
}

export function FullScreenLoader() {
    return (
        <div className="flex justify-center items-center min-h-screen bg-[var(--background)]">
            <LoadingSpinner />
        </div>
    );
}
