import React, { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
// @ts-ignore
import plantumlEncoder from 'plantuml-encoder';
import { Loader2, AlertTriangle } from 'lucide-react';
import { CodeBlock } from './CodeBlock';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import { ImageViewer } from './ImageViewer';

interface DiagramRendererProps {
    code: string;
    language: 'mermaid' | 'plantuml';
}

export const DiagramRenderer: React.FC<DiagramRendererProps> = ({ code, language }) => {
    const [isPreview, setIsPreview] = useState(true);
    const [content, setContent] = useState<string>(''); // SVG string for Mermaid, URL for PlantUML
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [viewerOpen, setViewerOpen] = useState(false);
    
    const [isDownloading, setIsDownloading] = useState(false);
    
    // Unique ID for mermaid to avoid conflicts if multiple diagrams exist
    const containerId = useRef(`diagram-${Math.random().toString(36).substr(2, 9)}`);

    useEffect(() => {
        if (!isPreview) {
            setContent('');
            setError(null);
            return;
        }
        
        let isMounted = true;
        let lastRenderedCode = '';

        const render = async () => {
            if (code === lastRenderedCode) return;
            
            setLoading(true);
            setError(null);
            
            try {
                if (language === 'mermaid') {
                    lastRenderedCode = code;
                    // Initialize for each render to ensure settings are fresh
                    mermaid.initialize({ 
                        startOnLoad: false,
                        theme: 'default',
                        securityLevel: 'loose',
                        suppressErrorRendering: false, // Set to false to allow mermaid to render the error SVG into the DOM
                    });

                    const id = `mermaid-${Math.random().toString(36).substring(2, 11)}`;
                    
                    try {
                        const { svg } = await mermaid.render(id, code);
                        
                        if (isMounted && svg) {
                            // Fix for React negative width/height warnings
                            // Use a more robust cleanup that doesn't break the SVG
                            const cleanedSvg = svg
                                .replace(/\b(width|height)\s*=\s*"-\d+[^"]*"/g, (match, prop) => {
                                    return prop === 'width' ? 'width="100%"' : 'height="auto"';
                                });
                            
                            setContent(cleanedSvg);
                            setError(null);
                        }
                    } catch (err: any) {
                        if (isMounted) {
                            setError(err.message || 'Mermaid Syntax Error');
                            
                            // Try to capture the error SVG that mermaid might have generated in the DOM
                            const captureErrorSvg = () => {
                                const errorEl = document.getElementById(id) || document.getElementById(`d${id}`);
                                if (errorEl) {
                                    const svgContent = errorEl.outerHTML;
                                    const cleanedErrorSvg = svgContent
                                        .replace(/\b(width|height)\s*=\s*"-\d+[^"]*"/g, (match, prop) => {
                                            return prop === 'width' ? 'width="100%"' : 'height="auto"';
                                        });
                                    setContent(cleanedErrorSvg);
                                    errorEl.remove();
                                    return true;
                                }
                                return false;
                            };

                            if (!captureErrorSvg()) {
                                setTimeout(captureErrorSvg, 50);
                            }
                        }
                    } finally {
                        // Cleanup temporary elements
                        const el = document.getElementById(id) || document.getElementById(`d${id}`);
                        if (el) el.remove();
                    }
                } else if (language === 'plantuml') {
                    lastRenderedCode = code;
                    const encoded = plantumlEncoder.encode(code);
                    const url = `https://www.plantuml.com/plantuml/svg/${encoded}`;
                    
                    try {
                        // Fetch the content instead of just setting the URL
                        // This allows us to handle error SVGs in the response body
                        const response = await fetch(url);
                        const svgText = await response.text();
                        
                        if (isMounted) {
                            setContent(svgText);
                            setError(null);
                        }
                    } catch (err) {
                        // If network fails entirely, fall back to setting URL directly
                        if (isMounted) {
                            setContent(''); // Clear content to avoid showing old chart
                            setError('Network error: Failed to fetch PlantUML diagram');
                        }
                    }
                }
            } catch (err: any) {
                if (isMounted) {
                    setError(err.message || 'Failed to render diagram');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        render();

        return () => {
            isMounted = false;
        };
    }, [code, language, isPreview]);

    const handleDownload = async (format: 'svg' | 'png' | 'jpeg', scale: number = 1, quality: number = 0.92) => {
        let svgString = content;
        setIsDownloading(true);

        try {
            if (!svgString) {
                setIsDownloading(false);
                return;
            }

            const filename = `diagram-${Date.now()}.${format}`;

            if (format === 'svg') {
                const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                setIsDownloading(false);
            } else {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();
                
                const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(svgBlob);
                
                img.onload = () => {
                    // Set canvas size with scale
                    canvas.width = img.width * scale;
                    canvas.height = img.height * scale;
                    
                    if (ctx) {
                         // Fill white background for JPEG/PNG (to ensure transparency is white if needed)
                         ctx.fillStyle = '#FFFFFF';
                         ctx.fillRect(0, 0, canvas.width, canvas.height);
                        
                        // Enable high-quality image smoothing
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
                        const dataUrl = canvas.toDataURL(mimeType, format === 'jpeg' ? quality : undefined);
                        
                        const a = document.createElement('a');
                        a.href = dataUrl;
                        a.download = filename;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    }
                    URL.revokeObjectURL(url);
                    setIsDownloading(false);
                };
                
                img.onerror = () => {
                    URL.revokeObjectURL(url);
                    setIsDownloading(false);
                    alert('Failed to process image for download.');
                };
                
                img.src = url;
            }
        } catch (e) {
            alert('Failed to download diagram.');
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
                            
                            {/* If Mermaid generated an error SVG, show it here but constrained */}
                            {language === 'mermaid' && content && (
                                <div 
                                    className="mermaid-error-svg w-full flex justify-center overflow-hidden border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-900/40 p-4 shadow-inner"
                                    dangerouslySetInnerHTML={{ __html: content }} 
                                />
                            )}
                        </div>
                    ) : language === 'mermaid' || language === 'plantuml' ? (
                        <div 
                            className={`${language}-diagram w-full flex justify-center cursor-zoom-in`}
                            dangerouslySetInnerHTML={{ __html: content }} 
                            onClick={() => setViewerOpen(true)}
                        />
                    ) : (
                        null
                    )}
                </div>
            ) : (
                <div className="bg-[#f6f8fa] dark:bg-slate-950 p-4">
                    <pre className="font-mono text-sm overflow-auto max-h-[600px] text-slate-800 dark:text-slate-100 leading-relaxed m-0">
                        <code>{code}</code>
                    </pre>
                </div>
            )}
            
            <ImageViewer 
                isOpen={viewerOpen}
                onClose={() => setViewerOpen(false)}
                content={content}
                type="svg"
            />
        </CodeBlock>
    );
};
