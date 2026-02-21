import React, { useState, useRef, useEffect } from 'react';
import { Check, Copy, Download, Code, Eye, ChevronDown } from 'lucide-react';

interface CodeBlockProps {
    language: string;
    code: string; // The raw code for copying
    children: React.ReactNode; // The content to display (highlighted code or diagram)
    isDiagram?: boolean;
    isPreview?: boolean; // For diagrams: true = preview, false = source
    onTogglePreview?: () => void;
    onDownload?: (format: 'svg' | 'png' | 'jpeg') => void;
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
    const downloadMenuRef = useRef<HTMLDivElement>(null);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Close download menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
                setShowDownloadMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                        <div className="relative" ref={downloadMenuRef}>
                            <button
                                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                                className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors flex items-center gap-1"
                                title="Download Diagram"
                            >
                                <Download size={18} />
                            </button>
                            
                            {showDownloadMenu && (
                                <div className="absolute right-0 top-full mt-1 min-w-[120px] bg-white border border-slate-200 rounded-md shadow-lg z-10 py-1 animate-in fade-in zoom-in-95 duration-100">
                                    <button
                                        onClick={() => { onDownload('svg'); setShowDownloadMenu(false); }}
                                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-teal-600"
                                    >
                                        SVG
                                    </button>
                                    <button
                                        onClick={() => { onDownload('png'); setShowDownloadMenu(false); }}
                                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-teal-600"
                                    >
                                        PNG
                                    </button>
                                    <button
                                        onClick={() => { onDownload('jpeg'); setShowDownloadMenu(false); }}
                                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-teal-600"
                                    >
                                        JPEG
                                    </button>
                                </div>
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
            <div className={`relative ${!isDiagram ? 'bg-[#f6f8fa]' : ''}`}>
                {children}
            </div>
        </div>
    );
};
