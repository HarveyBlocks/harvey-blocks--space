import React, { useMemo } from 'react';
import GithubSlugger from 'github-slugger';

interface TableOfContentsProps {
  content: string;
  className?: string;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ content, className = '' }) => {
  const headings = useMemo(() => {
    // Initialize GithubSlugger to handle duplicates and special characters
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
    <nav className={`my-8 ${className}`}>
      <h3 className="text-xl font-bold text-gray-900 mb-4 px-2">
        Table of Contents
      </h3>
      <div className="flex flex-col space-y-1">
        {headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            onClick={(e) => {
              e.preventDefault();
              const element = document.getElementById(heading.id);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
                window.history.pushState(null, '', `#${heading.id}`);
              }
            }}
            className={`
              block py-1.5 pr-4 rounded-md transition-colors duration-200
              hover:bg-gray-100 hover:text-teal-700
              ${heading.level === 1 ? 'font-semibold text-gray-800 text-base' : ''}
              ${heading.level === 2 ? 'font-medium text-gray-700 text-[15px]' : ''}
              ${heading.level >= 3 ? 'text-gray-500 text-sm' : ''}
            `}
            style={{
              paddingLeft: `${(heading.level - 1) * 1.25 + 0.5}rem`
            }}
          >
            {heading.text}
          </a>
        ))}
      </div>
    </nav>
  );
};