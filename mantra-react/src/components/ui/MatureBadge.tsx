import { ShieldAlert } from 'lucide-react';

interface MatureBadgeProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

/**
 * 18+ Badge component for mature content
 * Displays on novel covers to indicate adult content
 */
export default function MatureBadge({ size = 'sm', className = '' }: MatureBadgeProps) {
    const sizes = {
        sm: 'text-[10px] px-1.5 py-0.5',
        md: 'text-xs px-2 py-1',
        lg: 'text-sm px-2.5 py-1'
    };

    return (
        <div
            className={`
                inline-flex items-center gap-1 
                bg-red-500 text-white font-bold 
                rounded ${sizes[size]} 
                shadow-lg
                ${className}
            `}
        >
            <ShieldAlert className={size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
            <span>18+</span>
        </div>
    );
}
