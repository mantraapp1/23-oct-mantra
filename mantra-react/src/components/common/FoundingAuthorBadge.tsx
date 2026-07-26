import React from 'react';
import { Crown } from 'lucide-react';

interface FoundingAuthorBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const FoundingAuthorBadge: React.FC<FoundingAuthorBadgeProps> = ({ 
  className = '',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[9px] gap-1',
    md: 'px-2.5 py-1 text-[10px] gap-1.5',
    lg: 'px-3.5 py-1.5 text-[11px] gap-2',
  };

  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
  };

  return (
    <div 
      className={`inline-flex items-center rounded-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white font-extrabold tracking-wider uppercase border border-amber-300/30 select-none shadow-[0_2px_8px_rgba(245,158,11,0.25)] ${sizeClasses[size]} ${className}`}
    >
      <Crown className={`${iconSizes[size]} text-white stroke-[2.5] flex-shrink-0`} />
      <span className="leading-none whitespace-nowrap">FOUNDING AUTHOR</span>
    </div>
  );
};

export default FoundingAuthorBadge;
