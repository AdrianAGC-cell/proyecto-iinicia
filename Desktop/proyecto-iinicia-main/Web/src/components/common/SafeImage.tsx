import React, { useState } from 'react';
import { ImageOff, Sparkles, User as UserIcon } from 'lucide-react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  isAvatar?: boolean;
  avatarInitials?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt = '',
  className = '',
  fallbackSrc,
  isAvatar = false,
  avatarInitials,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    if (fallbackSrc && src !== fallbackSrc) {
      setHasError(false);
    } else {
      setHasError(true);
    }
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // If error and it is an avatar, show initial avatar badge
  if (hasError && isAvatar) {
    const initials = avatarInitials || (alt ? alt.slice(0, 2).toUpperCase() : 'IN');
    return (
      <div 
        className={`flex items-center justify-center font-bold text-white bg-gradient-to-br from-[#22abe2] to-[#1283af] select-none ${className}`}
        title={alt}
      >
        <span>{initials}</span>
      </div>
    );
  }

  // If error and it's a banner/card image, show stylized university branded placeholder
  if (hasError) {
    return (
      <div 
        className={`flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#05080f] via-[#09101d] to-[#0d1829] text-white border border-[#22abe2]/20 relative overflow-hidden select-none ${className}`}
        title={alt}
      >
        <div className="absolute inset-0 bg-tech-grid opacity-30 pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center text-center space-y-1.5 max-w-[85%]">
          <div className="w-9 h-9 rounded-xl bg-[#22abe2]/15 border border-[#22abe2]/40 flex items-center justify-center text-[#22abe2]">
            <Sparkles className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-bold text-slate-200 line-clamp-1">{alt || 'I²NICIA Campus'}</p>
          <span className="text-[9px] uppercase tracking-wider text-[#22abe2] font-semibold">Campus Digital</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Subtle skeleton shimmer while loading */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-200/80 animate-pulse z-10 flex items-center justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-[#22abe2] border-t-transparent animate-spin" />
        </div>
      )}
      <img
        src={hasError && fallbackSrc ? fallbackSrc : src}
        alt={alt}
        onError={handleError}
        onLoad={handleLoad}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        {...props}
      />
    </div>
  );
};
