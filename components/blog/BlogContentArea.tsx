import React from 'react';
import { BookOpen, FileText, FolderTree } from 'lucide-react';
import { FileNode } from '../../types';
import { LocalMarkdownHandler } from '../LocalMarkdownHandler';
import { LoadingSpinner } from '../LoadingSpinner';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { SourceTreeView } from '../SourceTreeView';
import { TableOfContents } from '../TableOfContents';

interface BlogContentAreaProps {
    activePath: string | null;
    tree: FileNode[];
    markdownContent: string | null;
    isCurrentPathFolder: boolean;
    isContentLoading: boolean;
    isTocOpen: boolean;
    localRenderInfo: { name: string; content: string } | null;
    onOpenSourceTree: () => void;
    onLocalRender: (content: string, name: string) => void;
}

export const BlogContentArea: React.FC<BlogContentAreaProps> = ({
    activePath,
    tree,
    markdownContent,
    isCurrentPathFolder,
    isContentLoading,
    isTocOpen,
    localRenderInfo,
    onOpenSourceTree,
    onLocalRender
}) => (
    <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto scroll-smooth" id="scroll-container">
            <div className="max-w-4xl mx-auto px-4 py-8 lg:px-12 lg:py-12">
                {localRenderInfo && activePath === 'local-render' ? (
                    <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
                        <MarkdownRenderer content={localRenderInfo.content} filePath={localRenderInfo.name} isFolder={false} />
                    </div>
                ) : !activePath ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
                        <div className="w-20 h-20 bg-primary-50 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-6 text-primary-300 dark:text-primary-400">
                            <BookOpen size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Welcome to Harvey Blocks' Space</h2>
                        <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">Select a document from the sidebar to explore Harvey's thoughts.</p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button onClick={onOpenSourceTree} className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:border-primary-300 hover:text-primary-600 dark:hover:text-primary-300 hover:shadow-md transition-all duration-200 group">
                                <FolderTree size={20} className="text-slate-400 group-hover:text-primary-500 transition-colors" />
                                <span className="font-medium">View Source Tree</span>
                            </button>
                            <LocalMarkdownHandler onLocalRender={onLocalRender} className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:border-primary-300 hover:text-primary-600 dark:hover:text-primary-300 hover:shadow-md transition-all duration-200 group w-full sm:w-auto">
                                <FileText size={20} className="text-slate-400 group-hover:text-primary-500 transition-colors" />
                                <span className="font-medium">Render Local Markdown</span>
                            </LocalMarkdownHandler>
                        </div>
                        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">Or choose a local file to preview it instantly here.</p>
                    </div>
                ) : activePath === 'source_tree' ? (
                    <SourceTreeView nodes={tree} />
                ) : isContentLoading ? (
                    <LoadingSpinner />
                ) : (
                    <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
                        {markdownContent && <MarkdownRenderer content={markdownContent} filePath={activePath} isFolder={isCurrentPathFolder} />}
                    </div>
                )}
                <div className="h-20"></div>
            </div>
        </div>

        {((activePath && !['source_tree', 'local-render'].includes(activePath) && markdownContent && !isCurrentPathFolder) ||
            (localRenderInfo && activePath === 'local-render')) &&
            isTocOpen && (
                <div className="w-64 flex-shrink-0 border-l border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hidden lg:block overflow-y-auto h-full">
                    <div className="p-4">
                        <TableOfContents content={localRenderInfo ? localRenderInfo.content : markdownContent || ''} />
                    </div>
                </div>
            )}
    </div>
);
