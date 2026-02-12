import { Flame } from 'lucide-react';

interface MatureBadgeProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

/**
 * 18+ Badge component for mature content
 * Design inspired by 21st.dev (Glassmorphism + Neon Icon)
 */
export default function MatureBadge({ size = 'sm', className = '' }: MatureBadgeProps) {
    // Size classes tailored for component scale
    const sizes = {
        sm: 'h-6 px-2.5 text-[10px]',
        md: 'h-7 px-3 text-xs',
        lg: 'h-8 px-4 text-sm'
    };

    const iconSizes = {
        sm: 'w-3 h-3',
        md: 'w-3.5 h-3.5',
        lg: 'w-4 h-4'
    };

    return (
        <div
            className={`
                inline-flex items-center gap-1.5
                rounded-full
                bg-black/70 backdrop-blur-md
                border border-white/10
                text-white font-semibold tracking-wide uppercase
                shadow-sm
                ${sizes[size]} 
                ${className}
            `}
        >
            <Flame className={`${iconSizes[size]} text-rose-500 fill-rose-500`} />
            <span className="opacity-90">18+</span>
        </div>
    );
}
