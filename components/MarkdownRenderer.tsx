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
import {DiagramRenderer} from './DiagramRenderer';
import {CodeBlock} from './CodeBlock';

interface MarkdownRendererProps {
    content: string;
    filePath: string;
    isFolder?: boolean;
}

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

    // 1. Decode the URL first (handle encoded characters like Chinese or spaces)
    let decodedUrl = relativeUrl;
    try {
        decodedUrl = decodeURIComponent(relativeUrl);
    } catch (e) {
        console.warn('Failed to decode relative URL:', relativeUrl);
    }

    // 2. Normalize slashes: replace backslash with forward slash
    let normalizedUrl = decodedUrl.replace(/\\/g, '/');

    // 3. Collapse multiple slashes into one
    normalizedUrl = normalizedUrl.replace(/\/+/g, '/');

    // 4. Handle leading slash: treat as relative to current directory per specific requirement
    // "/aaa/bbb.md" -> "aaa/bbb.md" (relative to base)
    if (normalizedUrl.startsWith('/')) {
        normalizedUrl = normalizedUrl.slice(1);
    }

    // Split base path into parts
    // Filter boolean removes empty strings from double slashes or start/end
    const baseDirParts = baseFile.split('/').filter(Boolean);

    if (!isFolder) {
        // If it's a file path (e.g. a/b/c.md), the context is the folder (a/b)
        baseDirParts.pop();
    }

    const relativeParts = normalizedUrl.split('/').filter(Boolean);

    for (const part of relativeParts) {
        if (part === '.') {
            // Current directory, do nothing
            continue;
        }
        if (part === '..') {
            // Parent directory, pop from base
            if (baseDirParts.length > 0) {
                baseDirParts.pop();
            }
        } else {
            // Normal path segment
            baseDirParts.push(part);
        }
    }

    return baseDirParts.join('/');
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
        // 1. 定义前后缀
        let visitor = visitorFactory('==', 'mark');
        visit(tree, 'text', visitor);
    };
};

const remarkSup: () => (tree: any) => void = (): (any) => void => {
    return (tree: any): void => {
        // 1. 定义前后缀
        let visitor = visitorFactory('^', 'sup');
        visit(tree, 'text', visitor);
    };
};

const remarkDel: () => (tree: any) => void = (): (any) => void => {
    return (tree: any): void => {
        // 1. 定义前后缀
        let visitor = visitorFactory('~~', 'del');
        visit(tree, 'text', visitor);
    };
};

import {TableOfContents} from './TableOfContents';
import {ImageViewer} from './ImageViewer';
import {useState} from 'react';

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
        img: ({src, alt, ...props}: any) => (
            <img 
               src={src} 
               alt={alt} 
               {...props} 
               className="cursor-zoom-in max-w-full h-auto transition-transform hover:scale-[1.02]"
               onClick={(e) => {
                   e.stopPropagation();
                   handleImageClick(src);
               }}
           />
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
                    <pre {...props} className="!bg-transparent !border-0 !shadow-none !m-0 !p-4 font-mono text-sm overflow-auto max-h-[600px]">
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

            // 2. Anchors (within same page)
            if (href.startsWith('#')) {
                const handleClick = (e: React.MouseEvent) => {
                    e.preventDefault();
                    const id = href.slice(1);
                    const el = document.getElementById(id);
                    if (el) {
                        el.scrollIntoView({behavior: 'smooth'});
                    }
                };
                return (
                    <a href={href} onClick={handleClick} {...props}>
                        {children}
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
                    {children}
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
                rehypePlugins={[rehypeRaw, rehypeKatex, rehypeHighlight, rehypeSlug]}
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