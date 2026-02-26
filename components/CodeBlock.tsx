import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, Download, Code, Eye, ChevronDown, Settings, Info, Loader2 } from 'lucide-react';

interface CodeBlockProps {
    language: string;
    code: string; // The raw code for copying
    children: React.ReactNode; // The content to display (highlighted code or diagram)
    isDiagram?: boolean;
    isPreview?: boolean; // For diagrams: true = preview, false = source
    onTogglePreview?: () => void;
    onDownload?: (format: 'svg' | 'png' | 'jpeg', scale?: number, quality?: number) => void;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
    language,
    code,
    children,
    isDiagram = false,
    isPreview = true,
    onTogglePreview,
    onDownload
}) => {
    const [copied, setCopied] = useState(false);
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [exportFormat, setExportFormat] = useState<'png' | 'jpeg'>('png');
    const [exportScale, setExportScale] = useState(2);
    const [exportQuality, setExportQuality] = useState(0.92);
    const [isDownloading, setIsDownloading] = useState(false);
    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
    
    const downloadMenuRef = useRef<HTMLDivElement>(null);
    const downloadButtonRef = useRef<HTMLButtonElement>(null);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleDownloadClick = (format: 'svg' | 'png' | 'jpeg') => {
        if (format === 'svg') {
            onDownload?.('svg');
            setShowDownloadMenu(false);
        } else {
            setExportFormat(format);
            setShowSettings(true);
        }
    };

    const toggleDownloadMenu = () => {
        if (!showDownloadMenu && downloadButtonRef.current) {
            const rect = downloadButtonRef.current.getBoundingClientRect();
            const vWidth = window.innerWidth;
            const vHeight = window.innerHeight;

            // Simple quadrant detection: 
            // If button is in the bottom half, expand UP.
            // If button is in the right half, expand LEFT.
            const isBottomHalf = rect.top > vHeight / 2;
            const isRightHalf = rect.left > vWidth / 2;

            const style: React.CSSProperties = {
                position: 'fixed',
                zIndex: 9999,
                // If expanding up, align bottom of menu to top of button (with 8px gap)
                // If expanding down, align top of menu to bottom of button (with 8px gap)
                top: isBottomHalf ? rect.top - 8 : rect.bottom + 8,
                // If expanding left, align right of menu to right of button
                // If expanding right, align left of menu to left of button
                left: isRightHalf ? rect.right : rect.left,
                // Use transform ONLY for direction, separating it from animation scale
                transform: `translate(${isRightHalf ? '-100%' : '0'}, ${isBottomHalf ? '-100%' : '0'})`,
                pointerEvents: 'none', // Wrapper is transparent, don't block clicks
            };
            
            setMenuStyle(style);
        }
        setShowDownloadMenu(!showDownloadMenu);
        if (showDownloadMenu) {
            setShowSettings(false);
        }
    };

    const executeDownload = async () => {
        setIsDownloading(true);
        try {
            await onDownload?.(exportFormat, exportScale, exportQuality);
        } finally {
            setIsDownloading(false);
            setShowSettings(false);
            setShowDownloadMenu(false);
        }
    };

    // Close download menu when clicking outside or scrolling
    useEffect(() => {
        const handleClose = (event: MouseEvent | Event) => {
            if (showDownloadMenu) {
                // If it's a click event, check if it's inside the menu or on the button
                if (event instanceof MouseEvent) {
                    const isInsideMenu = downloadMenuRef.current && downloadMenuRef.current.contains(event.target as Node);
                    const isInsideButton = downloadButtonRef.current && downloadButtonRef.current.contains(event.target as Node);
                    if (!isInsideMenu && !isInsideButton) {
                        setShowDownloadMenu(false);
                        setShowSettings(false);
                    }
                } else {
                    // For scroll events, we close the menu to avoid positioning drift
                    setShowDownloadMenu(false);
                    setShowSettings(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClose);
        // Using capture: true to ensure we catch scrolls in overflow containers
        window.addEventListener('scroll', handleClose, true);
        
        return () => {
            document.removeEventListener('mousedown', handleClose);
            window.removeEventListener('scroll', handleClose, true);
        };
    }, [showDownloadMenu]);

    return (
        <div className="my-6 border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-200 group">
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-2 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider bg-slate-200/60 px-2 py-0.5 rounded text-center min-w-[3rem]">
                        {language || 'TEXT'}
                    </span>
                </div>
                
                <div className="flex items-center gap-2">
                    {/* Diagram Controls */}
                    {isDiagram && onTogglePreview && (
                        <div className="flex items-center mr-1 bg-white rounded-md border border-slate-200 p-0.5">
                            <button
                                onClick={() => onTogglePreview()}
                                className={`flex items-center justify-center w-7 h-7 rounded transition-colors ${
                                    !isPreview 
                                        ? 'bg-slate-100 text-slate-900' 
                                        : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                                }`}
                                title="View Source"
                            >
                                <Code size={16} />
                            </button>
                            <button
                                onClick={() => onTogglePreview()}
                                className={`flex items-center justify-center w-7 h-7 rounded transition-colors ${
                                    isPreview 
                                        ? 'bg-slate-100 text-slate-900' 
                                        : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                                }`}
                                title="View Preview"
                            >
                                <Eye size={16} />
                            </button>
                        </div>
                    )}

                    {/* Download Button (Diagrams only) */}
                    {isDiagram && onDownload && (
                        <div className="relative">
                            <button
                                ref={downloadButtonRef}
                                onClick={toggleDownloadMenu}
                                className={`p-1.5 rounded-md transition-colors flex items-center gap-1 ${
                                    showDownloadMenu ? 'text-teal-600 bg-teal-50' : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'
                                }`}
                                title="Download Diagram"
                            >
                                <Download size={18} />
                            </button>
                            
                            {showDownloadMenu && createPortal(
                                <div style={menuStyle}>
                                    <div 
                                        ref={downloadMenuRef}
                                        style={{ pointerEvents: 'auto' }}
                                        className="min-w-[180px] bg-white border border-slate-200 rounded-md shadow-xl py-1 animate-in fade-in zoom-in-95 duration-100 overflow-hidden"
                                    >
                                    {!showSettings ? (
                                        <>
                                            <button
                                                onClick={() => handleDownloadClick('svg')}
                                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-teal-600 flex items-center justify-between group"
                                            >
                                                <span>SVG</span>
                                                <span className="text-[10px] text-slate-400 group-hover:text-teal-500">Vector</span>
                                            </button>
                                            <button
                                                onClick={() => handleDownloadClick('png')}
                                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-teal-600 flex items-center justify-between group"
                                            >
                                                <span>PNG</span>
                                                <ChevronDown size={14} className="text-slate-300 group-hover:text-teal-400" />
                                            </button>
                                            <button
                                                onClick={() => handleDownloadClick('jpeg')}
                                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-teal-600 flex items-center justify-between group"
                                            >
                                                <span>JPEG</span>
                                                <ChevronDown size={14} className="text-slate-300 group-hover:text-teal-400" />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="p-3 space-y-4 animate-in slide-in-from-right-2 duration-200">
                                            {/* Header with back button */}
                                            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-2">
                                                <button 
                                                    onClick={() => setShowSettings(false)}
                                                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                                                >
                                                    <ChevronDown size={14} className="rotate-90" />
                                                </button>
                                                <span className="text-xs font-bold text-slate-700 uppercase">{exportFormat} Settings</span>
                                            </div>

                                            {/* Scale */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Scale</label>
                                                    <span className="text-[10px] font-mono text-teal-600 bg-teal-50 px-1 rounded">{exportScale}x</span>
                                                </div>
                                                <div className="grid grid-cols-4 gap-1">
                                                    {[1, 2, 4, 8].map(s => (
                                                        <button 
                                                            key={s}
                                                            onClick={() => setExportScale(s)}
                                                            className={`text-[10px] py-1 rounded border ${exportScale === s ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-white border-slate-100 text-slate-500'}`}
                                                        >
                                                            {s}x
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Quality for JPEG */}
                                            {exportFormat === 'jpeg' && (
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Quality</label>
                                                        <span className="text-[10px] font-mono text-teal-600 bg-teal-50 px-1 rounded">{Math.round(exportQuality * 100)}%</span>
                                                    </div>
                                                    <input 
                                                        type="range" min="0.1" max="1" step="0.1" 
                                                        value={exportQuality} 
                                                        onChange={(e) => setExportQuality(parseFloat(e.target.value))}
                                                        className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-teal-600"
                                                    />
                                                </div>
                                            )}

                                            {/* Recommendations Info */}
                                            <div className="bg-blue-50/50 p-2 rounded border border-blue-100/50">
                                                <div className="flex items-center gap-1 text-blue-600 mb-1">
                                                    <Info size={10} />
                                                    <span className="text-[9px] font-bold uppercase">Tips</span>
                                                </div>
                                                <p className="text-[9px] text-blue-500 leading-tight">
                                                    Use 2x for Retina screens, 4x+ for printing.
                                                </p>
                                            </div>

                                            <button
                                                onClick={executeDownload}
                                                disabled={isDownloading}
                                                className="w-full py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                            >
                                                {isDownloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                                                {isDownloading ? 'Processing...' : 'Download'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                                </div>,
                                document.body
                            )}
                        </div>
                    )}

                    {/* Copy Button */}
                    <button
                        onClick={handleCopy}
                        className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors"
                        title="Copy Code"
                    >
                        {copied ? <Check size={18} className="text-teal-600" /> : <Copy size={18} />}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className={`relative ${!isDiagram || !isPreview ? 'bg-[#f6f8fa]' : ''}`}>
                {children}
            </div>
        </div>
    );
};
