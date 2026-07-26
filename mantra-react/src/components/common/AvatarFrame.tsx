import React from 'react';
import { Crown } from 'lucide-react';

interface AvatarFrameProps {
  children: React.ReactNode;
  active?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const AvatarFrame: React.FC<AvatarFrameProps> = ({ children, active = false, size = 'md' }) => {
  if (!active) return <>{children}</>;

  const badgeSizeClasses = {
    sm: 'w-4 h-4 -bottom-0.5 -right-0.5 border-[1.5px]',
    md: 'w-5.5 h-5.5 -bottom-1 -right-1 border-2',
    lg: 'w-7 h-7 -bottom-1.5 -right-1.5 border-2',
  };

  const iconSizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
  };

  return (
    <div className="relative inline-block select-none group">
      {/* Sleek Golden Metallic Gradient Ring */}
      <div className="rounded-full p-[2.5px] bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)] transition-all duration-300 group-hover:shadow-[0_0_18px_rgba(245,158,11,0.45)]">
        <div className="rounded-full p-[1.5px] bg-background">
          <div className="rounded-full overflow-hidden flex items-center justify-center">
            {children}
          </div>
        </div>
      </div>

      {/* Docked Gold Crown Status Badge */}
      <div 
        className={`absolute bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-white border-background rounded-full flex items-center justify-center shadow-md z-20 ${badgeSizeClasses[size]}`}
        title="Founding Author"
        style={{
          boxShadow: '0 2px 6px rgba(217, 119, 6, 0.35)',
        }}
      >
        <Crown className={`${iconSizes[size]} text-white stroke-[2.5]`} />
      </div>
    </div>
  );
};

export default AvatarFrame;
