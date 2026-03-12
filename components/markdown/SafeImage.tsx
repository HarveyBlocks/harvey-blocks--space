import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface SafeImageProps {
    src?: string;
    alt: string;
    onClick?: (src: string) => void;
}

export const SafeImage: React.FC<SafeImageProps> = ({ src, alt, onClick }) => {
    const [hasError, setHasError] = useState(false);

    if (!src) return null;

    if (hasError) {
        return (
            <span className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 dark:text-slate-500 my-4">
                <ImageOff size={48} className="mb-2 opacity-50" />
                <span className="text-sm font-medium">Image failed to load</span>
                {alt && <span className="text-xs mt-1 italic">"{alt}"</span>}
            </span>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className="cursor-zoom-in max-w-full h-auto transition-transform hover:scale-[1.02]"
            onError={() => setHasError(true)}
            onClick={(e) => {
                e.stopPropagation();
                if (onClick) onClick(src);
            }}
        />
    );
};
