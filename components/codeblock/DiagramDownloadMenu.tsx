import React from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Download, Info, Loader2 } from 'lucide-react';

interface DiagramDownloadMenuProps {
    showDownloadMenu: boolean;
    showSettings: boolean;
    setShowSettings: (show: boolean) => void;
    exportFormat: 'png' | 'jpeg';
    setExportFormat: (format: 'png' | 'jpeg') => void;
    exportScale: number;
    setExportScale: (scale: number) => void;
    exportQuality: number;
    setExportQuality: (quality: number) => void;
    isDownloading: boolean;
    menuStyle: React.CSSProperties;
    menuRef: React.RefObject<HTMLDivElement | null>;
    onDownloadClick: (format: 'svg' | 'png' | 'jpeg') => void;
    onExecuteDownload: () => void;
}

export const DiagramDownloadMenu: React.FC<DiagramDownloadMenuProps> = ({
    showDownloadMenu,
    showSettings,
    setShowSettings,
    exportFormat,
    setExportFormat,
    exportScale,
    setExportScale,
    exportQuality,
    setExportQuality,
    isDownloading,
    menuStyle,
    menuRef,
    onDownloadClick,
    onExecuteDownload
}) => {
    if (!showDownloadMenu) return null;

    return createPortal(
        <div style={menuStyle}>
            <div
                ref={menuRef}
                style={{ pointerEvents: 'auto' }}
                className="min-w-[180px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-xl py-1 animate-in fade-in zoom-in-95 duration-100 overflow-hidden"
            >
                {!showSettings ? (
                    <>
                        <button onClick={() => onDownloadClick('svg')} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-300 flex items-center justify-between group">
                            <span>SVG</span><span className="text-[10px] text-slate-400 dark:text-slate-500 group-hover:text-teal-500 dark:group-hover:text-teal-400">Vector</span>
                        </button>
                        <button onClick={() => onDownloadClick('png')} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-300 flex items-center justify-between group">
                            <span>PNG</span><ChevronDown size={14} className="text-slate-300 dark:text-slate-500 group-hover:text-teal-400" />
                        </button>
                        <button onClick={() => onDownloadClick('jpeg')} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-300 flex items-center justify-between group">
                            <span>JPEG</span><ChevronDown size={14} className="text-slate-300 dark:text-slate-500 group-hover:text-teal-400" />
                        </button>
                    </>
                ) : (
                    <div className="p-3 space-y-4 animate-in slide-in-from-right-2 duration-200">
                        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2 mb-2">
                            <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <ChevronDown size={14} className="rotate-90" />
                            </button>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-100 uppercase">{exportFormat} Settings</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Scale</label>
                                <span className="text-[10px] font-mono text-teal-600 bg-teal-50 px-1 rounded">{exportScale}x</span>
                            </div>
                            <div className="grid grid-cols-4 gap-1">
                                {[1, 2, 4, 8].map((s) => (
                                    <button key={s} onClick={() => setExportScale(s)} className={`text-[10px] py-1 rounded border ${exportScale === s ? 'bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-700 text-teal-700 dark:text-teal-300' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-300'}`}>
                                        {s}x
                                    </button>
                                ))}
                            </div>
                        </div>
                        {exportFormat === 'jpeg' && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Quality</label>
                                    <span className="text-[10px] font-mono text-teal-600 bg-teal-50 px-1 rounded">{Math.round(exportQuality * 100)}%</span>
                                </div>
                                <input type="range" min="0.1" max="1" step="0.1" value={exportQuality} onChange={(e) => setExportQuality(parseFloat(e.target.value))} className="w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-600" />
                            </div>
                        )}
                        <div className="bg-blue-50/50 dark:bg-blue-900/20 p-2 rounded border border-blue-100/50 dark:border-blue-800/40">
                            <div className="flex items-center gap-1 text-blue-600 mb-1"><Info size={10} /><span className="text-[9px] font-bold uppercase">Tips</span></div>
                            <p className="text-[9px] text-blue-500 dark:text-blue-300 leading-tight">Use 2x for Retina screens, 4x+ for printing.</p>
                        </div>
                        <button onClick={onExecuteDownload} disabled={isDownloading} className="w-full py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                            {isDownloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                            {isDownloading ? 'Processing...' : 'Download'}
                        </button>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};
