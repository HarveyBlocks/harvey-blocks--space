import React, { useEffect, useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { CodeBlock } from './CodeBlock';
import { ImageViewer } from './ImageViewer';
import { renderDiagramContent } from './diagram/renderDiagramContent';
import { downloadDiagram } from './diagram/downloadDiagram';

interface DiagramRendererProps {
    code: string;
    language: 'mermaid' | 'plantuml';
}

export const DiagramRenderer: React.FC<DiagramRendererProps> = ({ code, language }) => {
    const [isPreview, setIsPreview] = useState(true);
    const [content, setContent] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        if (!isPreview) {
            setContent('');
            setError(null);
            return;
        }

        let isMounted = true;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await renderDiagramContent(language, code);
                if (!isMounted) return;
                setContent(result.content);
                setError(result.error);
            } catch (err: any) {
                if (isMounted) {
                    setError(err.message || 'Failed to render diagram');
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        })();

        return () => {
            isMounted = false;
        };
    }, [code, language, isPreview]);

    const handleDownload = async (format: 'svg' | 'png' | 'jpeg', scale: number = 1, quality: number = 0.92) => {
        setIsDownloading(true);
        try {
            await downloadDiagram(content, format, scale, quality);
        } catch {
            alert('Failed to download diagram.');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <CodeBlock
            language={language}
            code={code}
            isDiagram={true}
            isPreview={isPreview}
            onTogglePreview={() => setIsPreview(!isPreview)}
            onDownload={handleDownload}
        >
            {isPreview ? (
                <div className="p-4 flex justify-center overflow-auto w-full min-h-[100px] max-h-[500px] bg-white dark:bg-slate-900">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-slate-500 animate-pulse">
                            <Loader2 className="animate-spin mb-2" size={24} />
                            <span className="text-sm">Rendering...</span>
                        </div>
                    ) : error ? (
                        <div className="w-full flex flex-col gap-3">
                            <div className="bg-red-50/80 border border-red-200 rounded-lg p-4 text-sm text-red-700 shadow-sm backdrop-blur-sm">
                                <div className="flex items-center gap-2 font-bold mb-3 uppercase tracking-wider text-red-800">
                                    <AlertTriangle size={18} className="text-red-600" />
                                    <span>{language} Syntax Error</span>
                                </div>
                                <pre className="whitespace-pre-wrap font-mono text-xs overflow-x-auto bg-white/60 dark:bg-slate-900/60 p-3 rounded-md border border-red-100/50 dark:border-red-900/40 leading-relaxed">{error}</pre>
                            </div>
                            {language === 'mermaid' && content && (
                                <div
                                    className="mermaid-error-svg w-full flex justify-center overflow-hidden border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-900/40 p-4 shadow-inner"
                                    dangerouslySetInnerHTML={{ __html: content }}
                                />
                            )}
                        </div>
                    ) : (
                        <div
                            className={`${language}-diagram w-full flex justify-center cursor-zoom-in`}
                            dangerouslySetInnerHTML={{ __html: content }}
                            onClick={() => setViewerOpen(true)}
                        />
                    )}
                </div>
            ) : (
                <div className="bg-[#f6f8fa] dark:bg-slate-950 p-4">
                    <pre className="font-mono text-sm overflow-auto max-h-[600px] text-slate-800 dark:text-slate-100 leading-relaxed m-0">
                        <code>{code}</code>
                    </pre>
                </div>
            )}

            <ImageViewer isOpen={viewerOpen} onClose={() => setViewerOpen(false)} content={content} type="svg" />
        </CodeBlock>
    );
};
