import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export default function FormInput({
    label,
    error,
    className = '',
    icon,
    ...props
}: FormInputProps) {
    return (
        <div className="w-full space-y-1.5">
            {label && (
                <label className="block text-xs font-medium text-[var(--foreground-secondary)]">
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    className={`
            w-full px-4 py-3 
            bg-[var(--input-background)] 
            border border-[var(--border)] 
            rounded-[var(--radius-xl)] 
            text-[var(--foreground)] 
            text-sm
            placeholder-[var(--foreground-secondary)]
            focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            ${error ? 'border-[var(--error)] focus:ring-[var(--error)]' : ''}
            ${className}
          `}
                    {...props}
                />
                {icon && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-secondary)]">
                        {icon}
                    </div>
                )}
            </div>
            {error && (
                <p className="text-xs text-[var(--error)] mt-1 font-medium">
                    {error}
                </p>
            )}
        </div>
    );
}
