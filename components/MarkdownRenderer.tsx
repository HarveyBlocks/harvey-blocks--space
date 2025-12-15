import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import { visit } from 'unist-util-visit';
import { useNavigate } from 'react-router-dom';
import "../style/MarkdownStyles.css"

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
const remarkMark = () => {
  return (tree: any) => {
    visit(tree, 'text', (node: any, index: number | undefined, parent: any) => {
      const value = node.value;
      if (!value.includes('==')) return;

      const regex = /(==[^=]+==)/g;
      const parts = value.split(regex);

      if (parts.length <= 1) return;

      const newNodes = parts.map((part: string) => {
        if (part.startsWith('==') && part.endsWith('==') && part.length > 4) {
          return {
            type: 'html',
            value: `<mark>${part.slice(2, -2)}</mark>`
          };
        }
        return { type: 'text', value: part };
      });

      if (parent && index !== undefined) {
        parent.children.splice(index, 1, ...newNodes);
        return index + newNodes.length;
      }
    });
  };
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, filePath, isFolder = false }) => {
  const navigate = useNavigate();

  const components = {
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

      // 2. Anchors (within same page)
      if (href.startsWith('#')) {
        const handleClick = (e: React.MouseEvent) => {
          e.preventDefault();
          const id = href.slice(1);
          const el = document.getElementById(id);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
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
    }
  };

  return (
      // Use id="write" to trigger github.css styles, and markdown-body for standard scoping
      <div id="write" className="markdown-body">
        <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath, remarkMark]}
            rehypePlugins={[rehypeRaw, rehypeKatex, rehypeHighlight, rehypeSlug]}
            components={components}
        >
          {content}
        </ReactMarkdown>
      </div>
  );
};