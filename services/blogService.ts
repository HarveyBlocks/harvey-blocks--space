import { FileNode } from '../types';

const BASE_URL = 'https://raw.githubusercontent.com/HarveyBlocks/blog/refs/heads/main';
const TREE_URL = 'source_tree.json';
export const BLOG_REPO_URL = 'https://github.com/HarveyBlocks/blog';

// Fallback data to ensure the app works even if the remote JSON is missing or CORS fails
const FALLBACK_TREE: FileNode[] = [
  {
    name: "getting-started",
    children: [
      { name: "welcome.md", children: null },
      { name: "installation.md", children: null }
    ]
  },
  {
    name: "tech",
    children: [
      { name: "react.md", children: null },
      { name: "typescript.md", children: null }
    ]
  },
  { name: "about.md", children: null }
];

const FALLBACK_CONTENT: Record<string, string> = {
  "welcome.md": "# Welcome to Harvey Blocks' Space\n\n> **Note:** You are seeing this fallback content because the remote source tree (`source_tree.json`) could not be fetched.\n\nThis is HarveyBlocks' personal digital garden, designed to fetch markdown files dynamically from GitHub Pages.\n\n## Features\n- **Dynamic Tree**: Automatically renders folder structures.\n- **Markdown Support**: Renders standard Markdown with GFM.\n- **Responsive**: Optimized for both desktop and mobile reading.",
  "installation.md": "# Installation\n\nTo use this with your own blog:\n\n1. Host your `.md` files on a static server.\n2. Create a `source_tree.json` that maps your directory.\n3. Update `BASE_URL` in `services/blogService.ts`.\n\n```json\n[\n  { \"name\": \"my-post.md\", \"children\": null }\n]\n```",
  "react.md": "# React\n\nReact is the library for web and native user interfaces. Build user interfaces out of individual pieces called components written in JavaScript.",
  "typescript.md": "# TypeScript\n\nTypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale.",
  "about.md": "# About\n\nHarvey Blocks' Space is a clean, modern implementation of a markdown viewer using React and Tailwind CSS."
};

export const fetchFileTree = async (): Promise<FileNode[]> => {
  try {
    const response = await fetch(TREE_URL);
    if (!response.ok) {
      // Silent fallback
      return FALLBACK_TREE;
    }
    const data: FileNode[] = await response.json();
    return data;
  } catch (error) {
    // Silent fallback
    return FALLBACK_TREE;
  }
};

export const fetchMarkdownContent = async (path: string): Promise<string> => {
  try {
    // Ensure path doesn't start with / to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const url = `${BASE_URL}/${cleanPath}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Status: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    // Check for fallback content first before logging error
    const filename = path.split('/').pop() || "";
    if (filename in FALLBACK_CONTENT) {
      // Return fallback silently
      return FALLBACK_CONTENT[filename];
    }
    
    console.error(`Error fetching markdown for ${path}:`, error);
    
    // Generic error message in markdown format
    return `# Error Loading Content\n\nCould not fetch content for **${path}**.\n\nThis may happen if the file doesn't exist on the remote server or if you are viewing the fallback tree but the content map is missing this file.`;
  }
};

export const findNodeByPath = (nodes: FileNode[], path: string): FileNode | null => {
  const parts = path.split('/').filter(Boolean);
  
  let currentNodes = nodes;
  let result: FileNode | null = null;

  for (const part of parts) {
    const found = currentNodes.find(n => n.name === part);
    if (!found) return null;
    result = found;
    if (found.children) {
      currentNodes = found.children;
    } else {
      currentNodes = [];
    }
  }
  return result;
};