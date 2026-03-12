import React, { useState } from 'react';
import { Check, Copy, Download, Code, Eye } from 'lucide-react';
import { useDownloadMenu } from './codeblock/useDownloadMenu';
import { DiagramDownloadMenu } from './codeblock/DiagramDownloadMenu';

interface CodeBlockProps {
    language: string;
    code: string;
    children: React.ReactNode;
    isDiagram?: boolean;
    isPreview?: boolean;
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
    const [isDownloading, setIsDownloading] = useState(false);
    const menu = useDownloadMenu();

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
            menu.setShowDownloadMenu(false);
            return;
        }
        menu.setExportFormat(format);
        menu.setShowSettings(true);
    };

    const executeDownload = async () => {
        setIsDownloading(true);
        try {
            await onDownload?.(menu.exportFormat, menu.exportScale, menu.exportQuality);
        } finally {
            setIsDownloading(false);
            menu.setShowSettings(false);
            menu.setShowDownloadMenu(false);
        }
    };

    const toggleClass = (active: boolean) =>
        active
            ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
            : 'text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700';

    return (
        <div className="my-6 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow duration-200 group">
            <div className="flex justify-between items-center px-4 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-200 uppercase tracking-wider bg-slate-200/60 dark:bg-slate-700 px-2 py-0.5 rounded text-center min-w-[3rem]">
                    {language || 'TEXT'}
                </span>

                <div className="flex items-center gap-2">
                    {isDiagram && onTogglePreview && (
                        <div className="flex items-center mr-1 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 p-0.5">
                            <button onClick={onTogglePreview} className={`flex items-center justify-center w-7 h-7 rounded transition-colors ${toggleClass(!isPreview)}`} title="View Source"><Code size={16} /></button>
                            <button onClick={onTogglePreview} className={`flex items-center justify-center w-7 h-7 rounded transition-colors ${toggleClass(isPreview)}`} title="View Preview"><Eye size={16} /></button>
                        </div>
                    )}

                    {isDiagram && onDownload && (
                        <div className="relative">
                            <button
                                ref={menu.downloadButtonRef}
                                onClick={menu.toggleDownloadMenu}
                                className={`p-1.5 rounded-md transition-colors flex items-center gap-1 ${menu.showDownloadMenu ? 'text-teal-600 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/30' : 'text-slate-400 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/30'}`}
                                title="Download Diagram"
                            >
                                <Download size={18} />
                            </button>
                            <DiagramDownloadMenu
                                showDownloadMenu={menu.showDownloadMenu}
                                showSettings={menu.showSettings}
                                setShowSettings={menu.setShowSettings}
                                exportFormat={menu.exportFormat}
                                setExportFormat={menu.setExportFormat}
                                exportScale={menu.exportScale}
                                setExportScale={menu.setExportScale}
                                exportQuality={menu.exportQuality}
                                setExportQuality={menu.setExportQuality}
                                isDownloading={isDownloading}
                                menuStyle={menu.menuStyle}
                                menuRef={menu.downloadMenuRef}
                                onDownloadClick={handleDownloadClick}
                                onExecuteDownload={executeDownload}
                            />
                        </div>
                    )}

                    <button onClick={handleCopy} className="p-1.5 text-slate-400 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-md transition-colors" title="Copy Code">
                        {copied ? <Check size={18} className="text-teal-600" /> : <Copy size={18} />}
                    </button>
                </div>
            </div>

            <div className={`relative ${!isDiagram || !isPreview ? 'bg-[#f6f8fa] dark:bg-slate-950' : ''}`}>
                {children}
            </div>
        </div>
    );
};
