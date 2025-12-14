import React, { useMemo } from 'react';
import GithubSlugger from 'github-slugger';

interface TableOfContentsProps {
  content: string;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ content }) => {
  const headings = useMemo(() => {
    // Initialize GithubSlugger to handle duplicates and special characters (like Chinese)
    // exactly how rehype-slug does it.
    const slugger = new GithubSlugger();
    const lines = content.split('\n');
    const items: TocItem[] = [];

    let inCodeBlock = false;

    lines.forEach((line) => {
      // Toggle code block status to avoid parsing comments inside code blocks
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        return;
      }
      if (inCodeBlock) return;

      // Match headings: # Heading
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const rawText = match[2].trim();
        
        // Clean up markdown syntax to get "plain text" which is what rehype-slug uses for ID generation.
        // This regex removes:
        // 1. Links [Text](url) -> Text
        // 2. Bold/Italic **Text**, *Text* -> Text
        // 3. Code `Text` -> Text
        const plainText = rawText
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/[*_`~]/g, '');

        const id = slugger.slug(plainText);
        items.push({ id, text: plainText, level });
      }
    });
    
    return items;
  }, [content]);

  if (headings.length === 0) return null;

  return (
    <nav className="h-full overflow-y-auto pl-2 py-4">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 pl-2">
        On this page
      </h3>
      <ul className="space-y-1">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              onClick={(e) => {
                e.preventDefault();
                const element = document.getElementById(heading.id);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                  // Optionally update URL hash
                  // window.history.pushState(null, '', `#${heading.id}`);
                }
              }}
              className={`
                block text-sm py-1 pr-2 transition-colors border-l-2 border-transparent hover:border-slate-300
                ${heading.level === 1 ? 'pl-2 font-medium text-slate-800' : ''}
                ${heading.level === 2 ? 'pl-4 text-slate-600 hover:text-slate-900' : ''}
                ${heading.level >= 3 ? 'pl-6 text-slate-500 hover:text-slate-800' : ''}
              `}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};