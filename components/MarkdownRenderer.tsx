import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import {visit} from 'unist-util-visit';
import {useNavigate} from 'react-router-dom';
import {ImageOff, AlertCircle, Folder, FileText, ArrowLeft} from 'lucide-react';
import {DiagramRenderer} from './DiagramRenderer';
import {CodeBlock} from './CodeBlock';
import {useState} from 'react';
import {TableOfContents} from './TableOfContents';
import {ImageViewer} from './ImageViewer';
import ReactDOMServer from 'react-dom/server';

/**
 * Helper to resolve relative paths
 * Requirements:
 * 1. Decode URL (handle %20, etc.)
 * 2. "\" converts to "/"
 * 3. Multiple "/" merge into one
 * 4. Handle "./" (current dir) and "../" (parent dir)
 * 5. Leading "/" is treated as relative to the current context, not root.
 */
const resolveRelativePath = (baseFile: string, relativeUrl: string, isFolder: boolean = false) => {
    if (!relativeUrl) return '';

    // 1. Decode the URL first
    let decodedUrl = relativeUrl;
    try {
        decodedUrl = decodeURIComponent(relativeUrl);
    } catch (e) {
        console.warn('Failed to decode relative URL:', relativeUrl);
    }

    // 2. Separate path from hash
    const hashIndex = decodedUrl.indexOf('#');
    let pathPart = hashIndex !== -1 ? decodedUrl.slice(0, hashIndex) : decodedUrl;
    const hashPart = hashIndex !== -1 ? decodedUrl.slice(hashIndex) : '';

    // 3. Normalize slashes
    let normalizedUrl = pathPart.replace(/\\/g, '/');

    // 4. Collapse multiple slashes
    normalizedUrl = normalizedUrl.replace(/\/+/g, '/');

    // 5. Handle leading slash: treat as relative to current directory
    if (normalizedUrl.startsWith('/')) {
        normalizedUrl = normalizedUrl.slice(1);
    }

    // Split base path into parts
    const baseDirParts = baseFile.split('/').filter(Boolean);

    if (!isFolder) {
        // If it's a file path, the context is the folder
        baseDirParts.pop();
    }

    const relativeParts = normalizedUrl.split('/').filter(Boolean);

    for (const part of relativeParts) {
        if (part === '.') {
            continue;
        }
        if (part === '..') {
            if (baseDirParts.length > 0) {
                baseDirParts.pop();
            }
        } else {
            baseDirParts.push(part);
        }
    }

    // 6. Reconstruct path and append hash
    return baseDirParts.join('/') + hashPart;
};

/**
 * Custom Remark plugin to handle ==text== highlighting.
 */
function visitorFactory(supMark: string, supHtmlTag: string) {
    let inMark = false;
    return (node: any, index: number | undefined, parent: any) => {
        const value: string = node.value;
        let preIndex = 0;
        const newNodes = [];
        while (true) {
            const markIndex = value.indexOf(supMark, preIndex);
            if (markIndex === -1) break;
            const text = value.slice(preIndex, markIndex);
            if (text.length > 0) {
                if (inMark) {
                    newNodes.push({type: 'html', value: `<${supHtmlTag}>${text}</${supHtmlTag}>`});
                } else {
                    newNodes.push({type: 'text', value: text});
                }
            }
            inMark = !inMark;
            preIndex = markIndex + supMark.length;
        }
        const text = value.slice(preIndex);
        if (text.length > 0) {
            if (inMark) {
                newNodes.push({type: 'html', value: `<${supHtmlTag}>${text}</${supHtmlTag}>`});
            } else {
                newNodes.push({type: 'text', value: text});
            }
        }
        if (parent && index !== undefined) {
            parent.children.splice(index, 1, ...newNodes);
            return index + newNodes.length;
        }
    };
}

const remarkMark: () => (tree: any) => void = (): (any) => void => {
    return (tree: any): void => {
        // 1. Define prefix and suffix
        let visitor = visitorFactory('==', 'mark');
        visit(tree, 'text', visitor);
    };
};

const remarkSup: () => (tree: any) => void = (): (any) => void => {
    return (tree: any): void => {
        // 1. Define prefix and suffix
        let visitor = visitorFactory('^', 'sup');
        visit(tree, 'text', visitor);
    };
};

const remarkDel: () => (tree: any) => void = (): (any) => void => {
    return (tree: any): void => {
        // 1. Define prefix and suffix
        let visitor = visitorFactory('~~', 'del');
        visit(tree, 'text', visitor);
    };
};

interface MarkdownRendererProps {
    content: string;
    filePath: string;
    isFolder?: boolean;
}

/**
 * Image component with error handling fallback.
 */
const SafeImage: React.FC<{ src?: string; alt: string; onClick?: (src: string) => void }> = ({ src, alt, onClick }) => {
    const [hasError, setHasError] = useState(false);

    if (!src) {
        return null;
    }

    if (hasError) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 dark:text-slate-500 my-4">
                <ImageOff size={48} className="mb-2 opacity-50" />
                <span className="text-sm font-medium">Image failed to load</span>
                {alt && <span className="text-xs mt-1 italic">"{alt}"</span>}
            </div>
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

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({content, filePath, isFolder = false}) => {
    const navigate = useNavigate();
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerContent, setViewerContent] = useState('');
    const [viewerType, setViewerType] = useState<'image' | 'svg'>('image');

    const handleImageClick = (src: string) => {
        setViewerContent(src);
        setViewerType('image');
        setViewerOpen(true);
    };

    const components = {
        h1: ({children, ...props}: any) => {
            if (isFolder) {
                return (
                    <h1 {...props} className="flex items-center gap-2">
                        <Folder className="text-primary-500" size={28} />
                        {children}
                    </h1>
                );
            }
            return <h1 {...props}>{children}</h1>;
        },
        img: ({src, alt, ...props}: any) => (
            <SafeImage src={src} alt={alt} onClick={handleImageClick} />
       ),
        p: ({children, ...props}: any) => {
            if (typeof children === 'string' && children.trim().toUpperCase() === '[TOC]') {
                return <TableOfContents content={content} />;
            }
            return <p {...props}>{children}</p>;
        },
        pre: ({node, children, ...props}: any) => {
            const childArray = React.Children.toArray(children);
            
            // Find the code element to extract language and content
            // We look for a child that is either a 'code' element or has a language class
            const codeElement = childArray.find((child: any) => {
                if (!React.isValidElement(child)) return false;
                const type = child.type;
                const childProps = child.props as any;
                return type === 'code' || (childProps?.className && typeof childProps.className === 'string' && childProps.className.includes('language-'));
            }) as React.ReactElement<any> | undefined;

            let language = '';
            let rawCode = '';
            let codeContent: React.ReactNode = children;

            if (codeElement) {
                codeContent = codeElement;
                const className = (codeElement.props as any).className || '';
                // Robust regex to capture any non-whitespace language identifier
                const match = /language-([^\s]+)/i.exec(className);
                language = match ? match[1].toLowerCase() : '';
                
                // Helper to extract raw text
                const getCodeText = (nodes: any): string => {
                        if (!nodes) return '';
                        if (typeof nodes === 'string') return nodes;
                        if (Array.isArray(nodes)) return nodes.map(getCodeText).join('');
                        if (React.isValidElement(nodes)) {
                            return getCodeText((nodes as any).props.children);
                        }
                        // Type guard for object with children
                        if (typeof nodes === 'object' && 'props' in nodes) {
                            return getCodeText((nodes as any).props.children);
                        }
                        return '';
                };
                rawCode = getCodeText((codeElement.props as any).children);
            } else {
                // Fallback: treat all children as raw text
                 const getCodeText = (nodes: any): string => {
                        if (!nodes) return '';
                        if (typeof nodes === 'string') return nodes;
                        if (Array.isArray(nodes)) return nodes.map(getCodeText).join('');
                        if (React.isValidElement(nodes)) {
                            return getCodeText((nodes as any).props.children);
                        }
                        // Type guard for object with children
                        if (typeof nodes === 'object' && 'props' in nodes) {
                             return getCodeText((nodes as any).props.children);
                        }
                        return '';
                };
                rawCode = getCodeText(children);
            }

            // Special handling for Diagram languages
            if (language === 'mermaid' || language === 'plantuml') {
                return <DiagramRenderer code={rawCode.trim()} language={language as 'mermaid' | 'plantuml'} />;
            }

            // Standard Code Block
            return (
                <CodeBlock language={language} code={rawCode}>
                    <pre {...props} className="!bg-transparent !border-0 !shadow-none !m-0 !p-4 font-mono text-sm overflow-auto max-h-[600px] !text-slate-800 dark:!text-slate-100 !leading-relaxed">
                        {codeContent}
                    </pre>
                </CodeBlock>
            );
        },
        code({node, inline, className, children, ...props}: any) {
            // Simple code component that just renders the code
            // We rely on 'pre' to handle the block rendering and Diagram logic
            return (
                <code className={className} {...props}>
                    {children}
                </code>
            );
        },
        a: ({href, children, ...props}: any) => {
            // 1. External Links
            // Note: We check for protocol. If it has a protocol, we treat it as external.
            if (!href || href.startsWith('http') || href.startsWith('https') || href.startsWith('mailto:')) {
                return (
                    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                        {children}
                    </a>
                );
            }

            // Custom Folder UI logic
            let icon: React.ReactNode = null;
            let label = children;

            if (isFolder) {
                if (href === '..') {
                    icon = <ArrowLeft size={18} className="inline mr-2 text-primary-500" />;
                } else {
                    // Check if it's a folder link we generated in App.tsx
                    // Note: This is a bit brittle as it depends on the text content
                    // But for the generated folder view, it works.
                    const isParentFolder = children && Array.isArray(children) && children.some((c: any) => c?.props?.children === 'Back to parent');
                    
                    if (isParentFolder) {
                        icon = <ArrowLeft size={18} className="inline mr-2 text-primary-500" />;
                    } else {
                        // For other links in folder view, we assume they are children
                        // We'll use FileText for files and maybe detect folders if possible
                        // In App.tsx we didn't pass enough info, but we can check if it looks like a file
                        icon = <FileText size={18} className="inline mr-2 text-slate-400 dark:text-slate-500" />;
                    }
                }
            }

            // 2. Anchors (within same page)
            if (href.startsWith('#')) {
                const handleClick = (e: React.MouseEvent) => {
                    e.preventDefault();
                    // Decode the ID to handle Chinese characters and other symbols correctly
                    const id = decodeURIComponent(href.slice(1));
                    const el = document.getElementById(id);
                    if (el) {
                        el.scrollIntoView({behavior: 'smooth'});
                        // Update URL hash without jumping the page instantly
                        window.history.pushState(null, '', `#${id}`);
                    } else {
                        // Fallback: if decoded ID fails, try the raw ID
                        const rawId = href.slice(1);
                        const rawEl = document.getElementById(rawId);
                        if (rawEl) {
                            rawEl.scrollIntoView({behavior: 'smooth'});
                            window.history.pushState(null, '', `#${rawId}`);
                        }
                    }
                };
                return (
                    <a href={href} onClick={handleClick} {...props}>
                        {icon}{label}
                    </a>
                );
            }

            // 3. Internal Relative Links
            const handleClick = (e: React.MouseEvent) => {
                e.preventDefault();
                const targetPath = resolveRelativePath(filePath, href, isFolder);
                navigate('/' + targetPath);

                // Scroll to top on navigation
                const scrollContainer = document.getElementById('scroll-container');
                if (scrollContainer) {
                    scrollContainer.scrollTop = 0;
                }
            };

            return (
                <a href={href} onClick={handleClick} {...props}>
                    {icon}{label}
                </a>
            );
        },
        // Wrap tables in a div to handle overflow (responsiveness) while keeping margins managed by wrapper
        table: ({children, ...props}: any) => (
            <div className="overflow-x-auto my-6">
                <table {...props}>
                    {children}
                </table>
            </div>
        )
    };

    return (
        // Removed custom id="write" to rely purely on standard class
        <div className="markdown-body">
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath, remarkMark, remarkDel, remarkSup]}
                rehypePlugins={[
                    rehypeRaw, 
                    [rehypeKatex, { 
                        throwOnError: false, 
                        strict: (errorCode: string, errorMsg: string) => {
                            // console.error(`[LaTeX] Syntax ERROR: ${errorMsg}`);
                            return 'ignore';
                        }
                    }], 
                    rehypeHighlight, 
                    rehypeSlug
                ]}
                components={components}
            >
                {content}
            </ReactMarkdown>

            <ImageViewer 
                isOpen={viewerOpen} 
                onClose={() => setViewerOpen(false)} 
                content={viewerContent} 
                type={viewerType} 
            />
        </div>
    );
};
