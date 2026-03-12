import React from 'react';
import { ArrowLeft, FileText, Folder } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DiagramRenderer } from '../DiagramRenderer';
import { CodeBlock } from '../CodeBlock';
import { SafeImage } from './SafeImage';
import { extractCodeBlockData } from './codeUtils';
import { resolveRelativePath } from './pathUtils';

interface CreateMarkdownComponentsParams {
    content: string;
    filePath: string;
    isFolder: boolean;
    navigate: ReturnType<typeof useNavigate>;
    onImageClick: (src: string) => void;
}

export const createMarkdownComponents = ({
    content,
    filePath,
    isFolder,
    navigate,
    onImageClick
}: CreateMarkdownComponentsParams) => ({
    h1: ({ children, ...props }: any) => {
        if (!isFolder) return <h1 {...props}>{children}</h1>;
        return (
            <h1 {...props} className="flex items-center gap-2">
                <Folder className="text-primary-500" size={28} />
                {children}
            </h1>
        );
    },
    img: ({ src, alt }: any) => (
        <SafeImage src={src} alt={alt} onClick={onImageClick} />
    ),
    pre: ({ children, ...props }: any) => {
        const { language, rawCode, codeContent } = extractCodeBlockData(children);
        if (language === 'mermaid' || language === 'plantuml') {
            return <DiagramRenderer code={rawCode.trim()} language={language as 'mermaid' | 'plantuml'} />;
        }

        const normalizedCodeContent = React.isValidElement(codeContent)
            ? React.cloneElement(codeContent as React.ReactElement<any>, {
                className: ['hljs', (codeContent.props as any)?.className]
                    .filter(Boolean)
                    .join(' ')
            })
            : codeContent;

        return (
            <CodeBlock language={language} code={rawCode}>
                <pre {...props} className="!bg-transparent !border-0 !shadow-none !m-0 !p-4 font-mono text-sm overflow-auto max-h-[600px] !text-slate-800 dark:!text-slate-100 !leading-relaxed">
                    {normalizedCodeContent}
                </pre>
            </CodeBlock>
        );
    },
    code({ className, children, ...props }: any) {
        return (
            <code className={className} {...props}>
                {children}
            </code>
        );
    },
    mark: ({ children, ...props }: any) => <mark {...props}>{children}</mark>,
    a: ({ href, children, ...props }: any) => {
        if (!href || href.startsWith('http') || href.startsWith('https') || href.startsWith('mailto:')) {
            return (
                <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                    {children}
                </a>
            );
        }

        let icon: React.ReactNode = null;
        if (isFolder) {
            if (href === '..') {
                icon = <ArrowLeft size={18} className="inline mr-2 text-primary-500" />;
            } else {
                const isParentFolder = children && Array.isArray(children) && children.some((c: any) => c?.props?.children === 'Back to parent');
                icon = isParentFolder
                    ? <ArrowLeft size={18} className="inline mr-2 text-primary-500" />
                    : <FileText size={18} className="inline mr-2 text-slate-400 dark:text-slate-500" />;
            }
        }

        if (href.startsWith('#')) {
            const handleClick = (e: React.MouseEvent) => {
                e.preventDefault();
                const id = decodeURIComponent(href.slice(1));
                const el = document.getElementById(id) || document.getElementById(href.slice(1));
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                    window.history.pushState(null, '', `#${id}`);
                }
            };
            return <a href={href} onClick={handleClick} {...props}>{icon}{children}</a>;
        }

        const handleClick = (e: React.MouseEvent) => {
            e.preventDefault();
            const targetPath = resolveRelativePath(filePath, href, isFolder);
            navigate('/' + targetPath);
            const scrollContainer = document.getElementById('scroll-container');
            if (scrollContainer) scrollContainer.scrollTop = 0;
        };

        return <a href={href} onClick={handleClick} {...props}>{icon}{children}</a>;
    },
    table: ({ children, ...props }: any) => (
        <div className="overflow-x-auto my-6">
            <table {...props}>{children}</table>
        </div>
    )
});
