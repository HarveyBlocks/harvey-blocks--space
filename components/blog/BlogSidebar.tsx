import React from 'react';
import { BookOpen, X } from 'lucide-react';
import { FileNode } from '../../types';
import { FileTreeItem } from '../FileTree';

interface BlogSidebarProps {
    isSidebarOpen: boolean;
    isLoadingTree: boolean;
    treeError: string | null;
    tree: FileNode[];
    activePath: string | null;
    onNavigate: (path: string) => void;
    onHomeClick: () => void;
    onToggleSidebar: () => void;
}

export const BlogSidebar: React.FC<BlogSidebarProps> = ({
    isSidebarOpen,
    isLoadingTree,
    treeError,
    tree,
    activePath,
    onNavigate,
    onHomeClick,
    onToggleSidebar
}) => (
    <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30
          w-72 bg-white border-r border-slate-200 shadow-xl lg:shadow-none dark:bg-slate-900 dark:border-slate-800
          transform transition-transform duration-300 ease-in-out flex flex-col
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:border-none lg:overflow-hidden'}
        `}
    >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/40 rounded-lg text-primary-700 dark:text-primary-300 cursor-pointer" onClick={onHomeClick}>
                    <BookOpen size={20} />
                </div>
                <h1 className="font-bold text-lg tracking-tight text-slate-800 dark:text-slate-100 cursor-pointer border-none font-sans" onClick={onHomeClick}>
                    Harvey Blocks' Space
                </h1>
            </div>
            <button onClick={onToggleSidebar} className="lg:hidden p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={20} />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
            {isLoadingTree ? (
                <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : treeError ? (
                <div className="p-6 text-sm text-red-500 text-center">{treeError}</div>
            ) : (
                <div className="flex flex-col">
                    {tree.map((node, index) => (
                        <FileTreeItem
                            key={`root-${node.name}-${index}`}
                            node={node}
                            pathPrefix=""
                            level={1}
                            onNavigate={onNavigate}
                            activePath={activePath}
                        />
                    ))}
                    {tree.length === 0 && (
                        <p className="px-6 text-sm text-slate-400 dark:text-slate-500 italic">No files found.</p>
                    )}
                </div>
            )}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500 text-center">
            <p>Powered by React & Tailwind</p>
        </div>
    </aside>
);
