import { useState } from 'react';
import { Leaf } from 'lucide-react';

interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export function SafeImage({ src, alt, className = '', fallbackLabel }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#E8F5E9] to-[#F7F9F5] text-[#1B5E20]/70 p-4 ${className}`}
        role="img"
        aria-label={alt}
      >
        <Leaf className="w-7 h-7 mb-2 opacity-60" strokeWidth={1.75} />
        <span className="text-xs font-medium text-center text-[#263238]/70 line-clamp-2">
          {fallbackLabel || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
