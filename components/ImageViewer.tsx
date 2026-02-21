import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut, Move, ArrowLeft } from 'lucide-react';

interface ImageViewerProps {
    isOpen: boolean;
    onClose: () => void;
    content: string; // URL string for image, or SVG string for svg
    type: 'image' | 'svg';
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ isOpen, onClose, content, type }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            // Reset state when opening
            setScale(1);
            setPosition({ x: 0, y: 0 });
            document.body.style.overflow = 'hidden';

            // Prevent default browser zoom behavior
            const preventDefault = (e: Event) => e.preventDefault();
            document.addEventListener('gesturestart', preventDefault);
            document.addEventListener('gesturechange', preventDefault);
            document.addEventListener('gestureend', preventDefault);

            // Intercept wheel events to prevent browser zoom (ctrl + wheel)
            const handleWheelGlobal = (e: WheelEvent) => {
                if (e.ctrlKey) {
                    e.preventDefault();
                }
            };
            document.addEventListener('wheel', handleWheelGlobal, { passive: false });

            return () => {
                document.body.style.overflow = '';
                document.removeEventListener('gesturestart', preventDefault);
                document.removeEventListener('gesturechange', preventDefault);
                document.removeEventListener('gestureend', preventDefault);
                document.removeEventListener('wheel', handleWheelGlobal);
            };
        } else {
            document.body.style.overflow = '';
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleWheel = (e: React.WheelEvent) => {
        e.stopPropagation();
        // If ctrlKey is pressed, it's likely a pinch-to-zoom gesture on trackpad
        if (e.ctrlKey) {
             const delta = e.deltaY > 0 ? -0.05 : 0.05; 
             setScale(prev => Math.max(0.1, Math.min(prev + delta, 100)));
        } else {
             const delta = e.deltaY > 0 ? -0.1 : 0.1;
             setScale(prev => Math.max(0.1, Math.min(prev + delta, 100)));
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        setPosition({
            x: e.clientX - dragStart.current.x,
            y: e.clientY - dragStart.current.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    return createPortal(
        <div 
            className="fixed inset-0 z-[99999] bg-black/90 flex items-center justify-center overflow-hidden touch-none"
            onClick={onClose}
        >
            {/* Back Button (Top Left) */}
            <div className="absolute top-4 left-4 z-50">
                <button 
                    className="flex items-center gap-2 px-4 py-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors font-medium border border-white/10 backdrop-blur-sm"
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    title="Back"
                >
                    <ArrowLeft size={20} />
                    <span>Back</span>
                </button>
            </div>

            {/* Controls (Top Right) */}
            <div className="absolute top-4 right-4 flex gap-2 z-50">
                <button 
                    className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors border border-white/10 backdrop-blur-sm"
                    onClick={(e) => { e.stopPropagation(); setScale(s => Math.min(s + 0.1, 100)); }}
                    title="Zoom In"
                >
                    <ZoomIn size={24} />
                </button>
                <button 
                    className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors border border-white/10 backdrop-blur-sm"
                    onClick={(e) => { e.stopPropagation(); setScale(s => Math.max(0.1, s - 0.1)); }}
                    title="Zoom Out"
                >
                    <ZoomOut size={24} />
                </button>
                 <button 
                    className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors border border-white/10 backdrop-blur-sm"
                    onClick={(e) => { e.stopPropagation(); setScale(1); setPosition({x:0, y:0}); }}
                    title="Reset"
                >
                    <Move size={24} />
                </button>
                <button 
                    className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors border border-white/10 backdrop-blur-sm"
                    onClick={onClose}
                    title="Close"
                >
                    <X size={24} />
                </button>
            </div>
            
            <div 
                ref={containerRef}
                className="w-full h-full flex items-center justify-center cursor-move"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={(e) => e.stopPropagation()}
            >
                <div 
                    style={{ 
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                        transformOrigin: 'center',
                        maxWidth: '90%',
                        maxHeight: '90%'
                    }}
                    className="flex items-center justify-center"
                >
                    {type === 'image' ? (
                        <img 
                            src={content} 
                            alt="Preview" 
                            className="max-w-none pointer-events-none select-none"
                            draggable={false}
                        />
                    ) : (
                        <div 
                            className="pointer-events-none select-none [&_svg]:max-w-none [&_svg]:w-auto [&_svg]:h-auto bg-white p-4 rounded"
                            dangerouslySetInnerHTML={{ __html: content }} 
                        />
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};
