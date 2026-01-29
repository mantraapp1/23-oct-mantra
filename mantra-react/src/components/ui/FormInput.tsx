import React from 'react';
import { Input } from '@/components/ui/Input';

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
            <Input
                error={!!error}
                endIcon={icon}
                className={className}
                {...props}
            />
            {error && (
                <p className="text-xs text-[var(--destructive)] mt-1 font-medium animate-in">
                    {error}
                </p>
            )}
        </div>
    );
}
