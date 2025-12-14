import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import {visit} from 'unist-util-visit';
import "../style/github.css";
import "../style/MarkdownStyles.css";

interface MarkdownRendererProps {
    content: string;
}

/**
 * Custom Remark plugin to handle ==text== highlighting.
 * It transforms text nodes containing ==...== into HTML <mark> tags.
 * Since we use rehype-raw, these tags are preserved and rendered.
 */
const remarkMark = () => {
    return (tree: any) => {
        visit(tree, 'text', (node: any, index: number | undefined, parent: any) => {
            const value = node.value;

            // Fast check if the node contains the marker
            if (!value.includes('==')) return;

            // Split by the delimiter, keeping the delimiter in the result to identify it
            // Regex matches: ==(content inside)==
            const regex = /(==[^=]+==)/g;
            const parts = value.split(regex);

            // If no split happened, nothing to replace
            if (parts.length <= 1) return;

            const newNodes = parts.map((part: string) => {
                if (part.startsWith('==') && part.endsWith('==') && part.length > 4) {
                    return {
                        type: 'html', // Use 'html' type so rehype-raw picks it up
                        value: `<mark>${part.slice(2, -2)}</mark>`
                    };
                }
                return {type: 'text', value: part};
            });

            // Replace the original text node with the new array of nodes
            if (parent && index !== undefined) {
                parent.children.splice(index, 1, ...newNodes);
                // Advance index to skip the newly inserted nodes
                return index + newNodes.length;
            }
        });
    };
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({content}) => {
    return (
        <article
            className="prose prose-slate prose-lg max-w-none prose-headings:font-sans prose-headings:font-bold prose-headings:text-slate-800 prose-p:font-serif prose-p:text-slate-600 prose-p:leading-relaxed prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-primary-500 prose-blockquote:bg-slate-50 prose-blockquote:py-1 prose-blockquote:px-4 prose-img:rounded-xl prose-img:shadow-md">
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath, remarkMark]}
                rehypePlugins={[rehypeRaw, rehypeKatex, rehypeHighlight, rehypeSlug]}
            >
                {content}
            </ReactMarkdown>
        </article>
    );
};