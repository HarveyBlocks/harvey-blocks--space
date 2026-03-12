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
    const slugger = new GithubSlugger();
    const lines = content.split('\n');
    const items: TocItem[] = [];
    let inCodeBlock = false;
    let fenceMarker: '```' | '~~~' | null = null;

    const normalizeHeadingText = (rawText: string) =>
      rawText
        .trim()
        .replace(/\s+#+\s*$/, '') // strip closing hashes in ATX headings
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[*_`~]/g, '')
        .trim();

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const trimmed = line.trim();

      const fenceMatch = trimmed.match(/^(```+|~~~+)/);
      if (fenceMatch) {
        const marker = fenceMatch[1].startsWith('```') ? '```' : '~~~';
        if (!inCodeBlock) {
          inCodeBlock = true;
          fenceMarker = marker;
        } else if (fenceMarker === marker) {
          inCodeBlock = false;
          fenceMarker = null;
        }
        continue;
      }

      if (inCodeBlock) continue;

      // ATX headings: up to 3 leading spaces + #..###### + space + text
      const atxMatch = line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*$/);
      if (atxMatch) {
        const level = atxMatch[1].length;
        const plainText = normalizeHeadingText(atxMatch[2]);
        if (plainText) {
          items.push({ id: slugger.slug(plainText), text: plainText, level });
        }
        continue;
      }

      // Setext headings:
      // Heading text
      // ==== (h1) or ---- (h2)
      const nextLine = lines[i + 1];
      if (!nextLine) continue;
      const setextMatch = nextLine.match(/^\s{0,3}(=+|-+)\s*$/);
      if (!setextMatch) continue;

      const plainText = normalizeHeadingText(line);
      if (!plainText) continue;
      const level = setextMatch[1].startsWith('=') ? 1 : 2;
      items.push({ id: slugger.slug(plainText), text: plainText, level });
      i += 1; // consume underline marker line
    }
    
    return items;
  }, [content]);

  return (
    <nav className={`my-8 ${className}`}>
      <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4 px-2">
        Table of Contents
      </h3>
      {headings.length === 0 ? (
        <p className="px-2 text-sm text-slate-400 dark:text-slate-500">
          No headings found in this document.
        </p>
      ) : (
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
                hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-teal-700 dark:hover:text-teal-300
                ${heading.level === 1 ? 'font-semibold text-gray-800 dark:text-slate-200 text-base' : ''}
                ${heading.level === 2 ? 'font-medium text-gray-700 dark:text-slate-300 text-[15px]' : ''}
                ${heading.level >= 3 ? 'text-gray-500 dark:text-slate-500 text-sm' : ''}
              `}
              style={{
                paddingLeft: `${(heading.level - 1) * 1.25 + 0.5}rem`
              }}
            >
              {heading.text}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
};
