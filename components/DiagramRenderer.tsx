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
        if (!isPreview) return;
        
        let isMounted = true;

        const render = async () => {
            setLoading(true);
            setError(null);
            
            try {
                if (language === 'mermaid') {
                    mermaid.initialize({ 
                        startOnLoad: false,
                        theme: 'default',
                        securityLevel: 'loose',
                    });
                    
                    // Generate a unique ID for this render
                    const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
                    
                    // mermaid.render returns { svg } in newer versions
                    const { svg } = await mermaid.render(id, code);
                    
                    if (isMounted) {
                        setContent(svg);
                    }
                } else if (language === 'plantuml') {
                    // PlantUML
                    const encoded = plantumlEncoder.encode(code);
                    const url = `https://www.plantuml.com/plantuml/svg/${encoded}`;
                    if (isMounted) {
                        setContent(url);
                    }
                }
            } catch (err: any) {
                console.error('Diagram render error:', err);
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
        let svgString = '';
        setIsDownloading(true);

        try {
            if (language === 'mermaid') {
                svgString = content;
            } else if (language === 'plantuml') {
                // Fetch SVG content from URL
                const response = await fetch(content);
                svgString = await response.text();
            }

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
            console.error('Download failed:', e);
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
                <div className="p-4 flex justify-center overflow-auto w-full min-h-[100px] bg-white">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-400 animate-pulse">
                            <Loader2 className="animate-spin mb-2" size={24} />
                            <span className="text-sm">Rendering...</span>
                        </div>
                    ) : error ? (
                         <div className="w-full bg-red-50 border border-red-100 rounded p-4 text-sm text-red-600">
                            <div className="flex items-center gap-2 font-semibold mb-2">
                                <AlertTriangle size={16} />
                                <span>Render Error</span>
                            </div>
                            <pre className="whitespace-pre-wrap font-mono text-xs overflow-x-auto">{error}</pre>
                        </div>
                    ) : language === 'mermaid' ? (
                        <div 
                            className="mermaid-diagram w-full flex justify-center cursor-zoom-in"
                            dangerouslySetInnerHTML={{ __html: content }} 
                            onClick={() => setViewerOpen(true)}
                        />
                    ) : (
                        content ? (
                            <img 
                                src={content} 
                                alt="PlantUML Diagram" 
                                className="max-w-full h-auto object-contain cursor-zoom-in" 
                                onClick={() => setViewerOpen(true)}
                            />
                        ) : null
                    )}
                </div>
            ) : (
                <div className="bg-[#f6f8fa] text-[#1f2937] p-0 overflow-hidden">
                     <ReactMarkdown
                        components={{
                            pre: ({node, children, ...props}: any) => (
                                <pre {...props} className="!p-4 !m-0 !bg-transparent !border-0 !shadow-none font-mono text-sm overflow-auto max-h-[500px]">
                                    {children}
                                </pre>
                            ),
                            code: ({node, inline, className, children, ...props}: any) => (
                                <code className={className} {...props}>
                                    {children}
                                </code>
                            )
                        }}
                     >
                        {`\`\`\`${language}\n${code}\n\`\`\``}
                     </ReactMarkdown>
                </div>
            )}
            
            <ImageViewer 
                isOpen={viewerOpen}
                onClose={() => setViewerOpen(false)}
                content={content}
                type={language === 'mermaid' ? 'svg' : 'image'}
            />
        </CodeBlock>
    );
};
