import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkSupersub from 'remark-supersub';
import remarkFlexibleToc, { type TocItem } from 'remark-flexible-toc';
import { remarkAlert } from 'remark-github-blockquote-alert';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import { visit } from 'unist-util-visit';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfm as micromarkGfm } from 'micromark-extension-gfm';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { pandocMark } from 'micromark-extension-mark';
import { pandocMarkFromMarkdown } from 'mdast-util-mark';
import type { Plugin } from 'unified';
import { useNavigate } from 'react-router-dom';
import { ImageOff, Folder, FileText, ArrowLeft } from 'lucide-react';
import { DiagramRenderer } from './DiagramRenderer';
import { CodeBlock } from './CodeBlock';
import { useState } from 'react';
import { ImageViewer } from './ImageViewer';

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

const remarkPandocMark: Plugin = function () {
    const data = this.data() as {
        micromarkExtensions?: unknown[];
        fromMarkdownExtensions?: unknown[];
    };

    if (!data.micromarkExtensions) data.micromarkExtensions = [];
    if (!data.fromMarkdownExtensions) data.fromMarkdownExtensions = [];

    data.micromarkExtensions.push(pandocMark());
    data.fromMarkdownExtensions.push(pandocMarkFromMarkdown);
};

const parseInlineMarkdown = (value: string) => {
    const tree = fromMarkdown(value, {
        extensions: [micromarkGfm(), pandocMark()],
        mdastExtensions: [gfmFromMarkdown(), pandocMarkFromMarkdown]
    });

    const paragraph = tree.children.find((node: any) => node.type === 'paragraph');
    if (paragraph && Array.isArray((paragraph as any).children)) {
        return (paragraph as any).children;
    }

    return [{ type: 'text', value }];
};

const remarkSupersubInlineMix: Plugin = function () {
    return (tree: any) => {
        visit(tree, ['superscript', 'subscript'], (node: any) => {
            if (!Array.isArray(node.children) || node.children.length === 0) return;

            const allText = node.children.every((child: any) => child.type === 'text');
            if (!allText) return;

            const raw = node.children.map((child: any) => String(child.value || '')).join('');
            if (!raw.trim()) return;

            node.children = parseInlineMarkdown(raw);
        });
    };
};

const remarkSupersubAcrossNodes: Plugin = function () {
    const delimiters: Array<'~' | '^'> = ['~', '^'];

    const isTextNode = (node: any) => node && node.type === 'text' && typeof node.value === 'string';

    const hasOpenDelimiterAtEnd = (value: string, delimiter: '~' | '^') =>
        value.endsWith(delimiter) && !value.endsWith(`\\${delimiter}`);

    const hasCloseDelimiterAtStart = (value: string, delimiter: '~' | '^') =>
        value.startsWith(delimiter) && !value.startsWith(`\\${delimiter}`);

    return (tree: any) => {
        visit(tree, (node: any) => Array.isArray(node?.children), (parent: any) => {
            if (!Array.isArray(parent.children) || parent.children.length < 3) return;

            for (let i = 0; i < parent.children.length; i++) {
                const openNode = parent.children[i];
                if (!isTextNode(openNode)) continue;

                for (const delimiter of delimiters) {
                    const openValue = openNode.value as string;
                    if (!hasOpenDelimiterAtEnd(openValue, delimiter)) continue;

                    let closeIndex = -1;
                    for (let j = i + 1; j < parent.children.length; j++) {
                        const candidate = parent.children[j];
                        if (!isTextNode(candidate)) continue;
                        if (hasCloseDelimiterAtStart(candidate.value as string, delimiter)) {
                            closeIndex = j;
                            break;
                        }
                    }

                    if (closeIndex === -1 || closeIndex <= i + 1) continue;

                    const closeNode = parent.children[closeIndex];
                    const innerNodes = parent.children.slice(i + 1, closeIndex);
                    if (innerNodes.length === 0) continue;

                    openNode.value = (openNode.value as string).slice(0, -1);
                    closeNode.value = (closeNode.value as string).slice(1);

                    const supersubNode = {
                        type: delimiter === '^' ? 'superscript' : 'subscript',
                        data: { hName: delimiter === '^' ? 'sup' : 'sub' },
                        children: innerNodes
                    };

                    parent.children.splice(i + 1, closeIndex - i - 1, supersubNode);

                    if (isTextNode(parent.children[i]) && (parent.children[i].value as string).length === 0) {
                        parent.children.splice(i, 1);
                        i -= 1;
                    }

                    const closeNodeNext = parent.children[i + 2];
                    if (isTextNode(closeNodeNext) && (closeNodeNext.value as string).length === 0) {
                        parent.children.splice(i + 2, 1);
                    }

                    break;
                }
            }
        });
    };
};

const TOC_HEADING_PATTERN = /^(toc|contents|table[ -]of[ -]contents)$/i;
const TOC_INLINE_PATTERN = /^\[toc\]$/i;

const getNodeText = (node: any): string => {
    if (!node) return '';
    if (node.type === 'text') return String(node.value || '');
    if (!Array.isArray(node.children)) return '';
    return node.children.map(getNodeText).join('');
};

const createTocListNode = (tocItems: TocItem[]) => {
    const filtered = tocItems.filter((item) => !TOC_HEADING_PATTERN.test(item.value.trim()));

    return {
        type: 'list',
        ordered: false,
        spread: false,
        children: filtered.map((item) => ({
            type: 'listItem',
            spread: false,
            children: [
                {
                    type: 'paragraph',
                    children: [
                        {
                            type: 'link',
                            url: item.href,
                            children: [{ type: 'text', value: item.value }]
                        }
                    ]
                }
            ]
        }))
    };
};

const createTocHeadingNode = (depth: number = 2) => ({
    type: 'heading',
    depth,
    children: [{ type: 'text', value: 'TOC' }]
});

const createRemarkInjectToc = (tocItems: TocItem[]): Plugin => function () {
    return (tree: any) => {
        visit(tree, 'root', (root: any) => {
            if (!Array.isArray(root.children)) return;

            for (let i = 0; i < root.children.length; i++) {
                const node = root.children[i];

                if (node.type === 'paragraph' && TOC_INLINE_PATTERN.test(getNodeText(node).trim())) {
                    root.children.splice(i, 1, createTocHeadingNode(2), createTocListNode(tocItems));
                    i += 1;
                    continue;
                }

                if (node.type === 'heading' && TOC_HEADING_PATTERN.test(getNodeText(node).trim())) {
                    const nextNode = root.children[i + 1];
                    if (!nextNode || nextNode.type !== 'list') {
                        root.children.splice(i + 1, 0, createTocListNode(tocItems));
                    }
                }
            }
        });
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
            <span className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 dark:text-slate-500 my-4">
                <ImageOff size={48} className="mb-2 opacity-50" />
                <span className="text-sm font-medium">Image failed to load</span>
                {alt && <span className="text-xs mt-1 italic">"{alt}"</span>}
            </span>
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

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, filePath, isFolder = false }) => {
    const navigate = useNavigate();
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerContent, setViewerContent] = useState('');
    const [viewerType, setViewerType] = useState<'image' | 'svg'>('image');
    const tocRef: TocItem[] = [];

    const handleImageClick = (src: string) => {
        setViewerContent(src);
        setViewerType('image');
        setViewerOpen(true);
    };

    const components = {
        h1: ({ children, ...props }: any) => {
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
        img: ({ src, alt, ...props }: any) => (
            <SafeImage src={src} alt={alt} onClick={handleImageClick} />
        ),
        pre: ({ node, children, ...props }: any) => {
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
        code({ node, inline, className, children, ...props }: any) {
            // Simple code component that just renders the code
            // We rely on 'pre' to handle the block rendering and Diagram logic
            return (
                <code className={className} {...props}>
                    {children}
                </code>
            );
        },
        mark: ({ children, ...props }: any) => (
            <mark {...props}>{children}</mark>
        ),
        a: ({ href, children, ...props }: any) => {
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
                        el.scrollIntoView({ behavior: 'smooth' });
                        // Update URL hash without jumping the page instantly
                        window.history.pushState(null, '', `#${id}`);
                    } else {
                        // Fallback: if decoded ID fails, try the raw ID
                        const rawId = href.slice(1);
                        const rawEl = document.getElementById(rawId);
                        if (rawEl) {
                            rawEl.scrollIntoView({ behavior: 'smooth' });
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
        table: ({ children, ...props }: any) => (
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
                remarkPlugins={[
                    [remarkGfm, { singleTilde: false }],
                    remarkMath,
                    remarkSupersubAcrossNodes,
                    remarkSupersub,
                    remarkAlert,
                    remarkPandocMark,
                    remarkSupersubInlineMix,
                    [remarkFlexibleToc, { tocRef, skipLevels: [] }],
                    createRemarkInjectToc(tocRef)
                ]}
                remarkRehypeOptions={{
                    handlers: {
                        mark: (state: any, node: any) => ({
                            type: 'element',
                            tagName: 'mark',
                            properties: {},
                            children: state.all(node)
                        })
                    }
                }}
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
