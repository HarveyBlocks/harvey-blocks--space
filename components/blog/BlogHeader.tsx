import React from 'react';
import { Menu, Github, Download, List, Moon, Sun, Eye, Code2 } from 'lucide-react';
import { BLOG_REPO_URL } from '../../services/blogService';

interface BlogHeaderProps {
    localRenderName?: string | null;
    activePath: string | null;
    isTocOpen: boolean;
    viewMode: 'render' | 'source';
    canToggleView: boolean;
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
    onToggleSidebar: () => void;
    onToggleToc: () => void;
    onToggleViewMode: () => void;
    onDownload: () => void;
}

export const BlogHeader: React.FC<BlogHeaderProps> = ({
    localRenderName,
    activePath,
    isTocOpen,
    viewMode,
    canToggleView,
    theme,
    onToggleTheme,
    onToggleSidebar,
    onToggleToc,
    onToggleViewMode,
    onDownload
}) => {
    const currentTitle = localRenderName || (activePath ? activePath.split('/').pop() : 'Home');
    const canShowTools = !!((activePath && !['source_tree', 'local-render'].includes(activePath)) || localRenderName);

    return (
        <header className="bg-white/80 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 h-16 flex items-center px-4 lg:px-8 justify-between sticky top-0 z-10 shrink-0">
            <div className="flex items-center gap-4">
                <button onClick={onToggleSidebar} className="p-2 -ml-2 text-slate-500 dark:text-slate-300 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <Menu size={24} />
                </button>
                <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        {localRenderName ? 'Viewing Local File' : 'Currently Reading'}
                    </span>
                    <h2 className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate max-w-[200px] sm:max-w-md" style={{ margin: '2px' }}>
                        {currentTitle}
                    </h2>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button onClick={onToggleTheme} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:text-slate-300 dark:hover:text-primary-400 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                {canShowTools && (
                    <>
                        <button
                            onClick={onToggleViewMode}
                            title={viewMode === 'source' ? 'Switch to rendered mode' : 'Switch to source mode'}
                            disabled={!canToggleView}
                            className={`p-2 rounded-lg transition-colors hidden sm:block ${viewMode === 'source'
                                ? 'text-primary-600 dark:text-primary-300 bg-primary-50 dark:bg-slate-800'
                                : 'text-slate-400 dark:text-slate-300 hover:text-primary-600 hover:bg-primary-50 dark:hover:text-primary-400 dark:hover:bg-slate-800'
                                } ${!canToggleView ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {viewMode === 'source' ? <Eye size={20} /> : <Code2 size={20} />}
                        </button>
                        <button onClick={onDownload} title="Download Markdown" className="p-2 text-slate-400 dark:text-slate-300 hover:text-primary-600 hover:bg-primary-50 dark:hover:text-primary-400 dark:hover:bg-slate-800 rounded-lg transition-colors hidden sm:block">
                            <Download size={20} />
                        </button>
                        <button onClick={onToggleToc} title={isTocOpen ? 'Hide Directory' : 'Show Directory'} className={`p-2 rounded-lg transition-colors hidden lg:block ${isTocOpen ? 'text-primary-600 bg-primary-50 dark:text-primary-300 dark:bg-slate-800' : 'text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                            <List size={20} />
                        </button>
                    </>
                )}

                <a href={BLOG_REPO_URL} target="_blank" rel="noreferrer" title="Visit Repository" className="p-2 text-slate-400 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <Github size={20} />
                </a>
            </div>
        </header>
    );
};
