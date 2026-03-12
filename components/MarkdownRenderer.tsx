import React, { useMemo, useState } from 'react';
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
import { useNavigate } from 'react-router-dom';
import { ImageViewer } from './ImageViewer';
import { createMarkdownComponents } from './markdown/createMarkdownComponents';
import {
    remarkPandocMark,
    remarkSupersubAcrossNodes,
    remarkSupersubInlineMix
} from './markdown/plugins/syntaxPlugins';
import { createRemarkInjectToc } from './markdown/plugins/tocPlugins';

interface MarkdownRendererProps {
    content: string;
    filePath: string;
    isFolder?: boolean;
}

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

    const components = useMemo(
        () => createMarkdownComponents({
            content,
            filePath,
            isFolder,
            navigate,
            onImageClick: handleImageClick
        }),
        [content, filePath, isFolder, navigate]
    );

    return (
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
                    [rehypeKatex, { throwOnError: false, strict: () => 'ignore' }],
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
