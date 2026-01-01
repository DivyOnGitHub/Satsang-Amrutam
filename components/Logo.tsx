
import React from 'react';
import { APP_LOGO } from '../constants';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-8 h-8 border',
    md: 'w-12 h-12 border-2',
    lg: 'w-24 h-24 border-4',
    xl: 'w-40 h-40 border-4',
  };

  return (
    <div className={`relative rounded-full overflow-hidden border-orange-400 shadow-lg shadow-orange-200/50 bg-white flex items-center justify-center ${sizes[size]} ${className}`}>
      <img 
        src={APP_LOGO} 
        alt="Pragat Purushottam Logo" 
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          e.currentTarget.parentElement!.innerHTML = '<span class="text-orange-600 font-bold">🕉️</span>';
        }}
      />
    </div>
  );
};

export default Logo;
