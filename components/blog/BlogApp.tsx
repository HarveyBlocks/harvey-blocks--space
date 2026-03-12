import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchFileTree, fetchMarkdownContent, findNodeByPath } from '../../services/blogService';
import { FileNode } from '../../types';
import { useThemeMode } from '../../hooks/useThemeMode';
import { BlogSidebar } from './BlogSidebar';
import { BlogHeader } from './BlogHeader';
import { BlogContentArea } from './BlogContentArea';

const buildFolderMarkdown = (node: FileNode) => {
    const childrenList = node.children?.map((child) => `- [${child.name}](${child.name})`).join('\n') || '*(Empty folder)*';
    return `# ${node.name}\n\n[Back to parent](..)\n\nSelect a file from this folder:\n\n${childrenList}`;
};

export const BlogApp: React.FC = () => {
    const [tree, setTree] = useState<FileNode[]>([]);
    const [isLoadingTree, setIsLoadingTree] = useState(true);
    const [treeError, setTreeError] = useState<string | null>(null);
    const [markdownContent, setMarkdownContent] = useState<string | null>(null);
    const [isContentLoading, setIsContentLoading] = useState(false);
    const [localRenderInfo, setLocalRenderInfo] = useState<{ name: string; content: string } | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isTocOpen, setIsTocOpen] = useState(true);
    const { theme, setTheme } = useThemeMode();

    const location = useLocation();
    const navigate = useNavigate();
    const activePath = useMemo(() => {
        const path = location.pathname.slice(1);
        return path ? decodeURIComponent(path) : null;
    }, [location.pathname]);

    const currentNode = useMemo(() => {
        if (!tree.length || !activePath || ['source_tree', 'local-render'].includes(activePath)) return null;
        return findNodeByPath(tree, activePath);
    }, [tree, activePath]);

    const isCurrentPathFolder = !!currentNode?.children;

    useEffect(() => {
        const p = new URLSearchParams(location.search).get('p');
        if (p) navigate(decodeURIComponent(p), { replace: true });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const handleResize = () => {
            const isMobile = window.innerWidth < 1024;
            setIsSidebarOpen(!isMobile);
            setIsTocOpen(!isMobile);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        (async () => {
            try {
                setTree(await fetchFileTree());
            } catch {
                setTreeError('Failed to load blog directory.');
            } finally {
                setIsLoadingTree(false);
            }
        })();
    }, []);

    useEffect(() => {
        if (activePath !== 'local-render') setLocalRenderInfo(null);
        else if (!localRenderInfo) navigate('/', { replace: true });
    }, [activePath, localRenderInfo, navigate]);

    useEffect(() => {
        (async () => {
            if (!activePath || activePath === 'source_tree' || activePath === 'local-render') {
                setMarkdownContent(null);
                return;
            }
            if (isLoadingTree) return;

            if (!currentNode) {
                setMarkdownContent(`# 404 Not Found\n\nThe path **${activePath}** does not exist.`);
                return;
            }
            if (isCurrentPathFolder) {
                setMarkdownContent(buildFolderMarkdown(currentNode));
                return;
            }

            setIsContentLoading(true);
            try {
                const { content, actualPath } = await fetchMarkdownContent(activePath);
                setMarkdownContent(content);
                if (actualPath !== activePath) navigate('/' + actualPath + location.hash, { replace: true });
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
            } catch {
                setMarkdownContent('# Error\nCould not load this post.');
            } finally {
                setIsContentLoading(false);
            }
        })();
    }, [activePath, currentNode, isCurrentPathFolder, isLoadingTree, location.hash, navigate]);

    useEffect(() => {
        if (isContentLoading || !markdownContent || !location.hash) return;
        const id = decodeURIComponent(location.hash.slice(1));
        const timer = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 500);
        return () => clearTimeout(timer);
    }, [isContentLoading, markdownContent, location.hash]);

    const handleHomeClick = useCallback(() => {
        setLocalRenderInfo(null);
        navigate('/');
    }, [navigate]);

    const handleNavigate = useCallback((path: string) => {
        navigate('/' + path);
        document.getElementById('scroll-container')?.scrollTo({ top: 0 });
    }, [navigate]);

    const handleDownload = useCallback(() => {
        const content = localRenderInfo ? localRenderInfo.content : markdownContent;
        const name = localRenderInfo ? localRenderInfo.name : activePath?.split('/').pop() || 'download.md';
        if (!content) return;
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [activePath, localRenderInfo, markdownContent]);

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans dark:bg-slate-950 dark:text-slate-100">
            {isSidebarOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

            <BlogSidebar
                isSidebarOpen={isSidebarOpen}
                isLoadingTree={isLoadingTree}
                treeError={treeError}
                tree={tree}
                activePath={activePath}
                onNavigate={handleNavigate}
                onHomeClick={handleHomeClick}
                onToggleSidebar={() => setIsSidebarOpen((v) => !v)}
            />

            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                <BlogHeader
                    localRenderName={localRenderInfo?.name || null}
                    activePath={activePath}
                    isTocOpen={isTocOpen}
                    theme={theme}
                    onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
                    onToggleSidebar={() => setIsSidebarOpen((v) => !v)}
                    onToggleToc={() => setIsTocOpen((v) => !v)}
                    onDownload={handleDownload}
                />
                <BlogContentArea
                    activePath={activePath}
                    tree={tree}
                    markdownContent={markdownContent}
                    isCurrentPathFolder={isCurrentPathFolder}
                    isContentLoading={isContentLoading}
                    isTocOpen={isTocOpen}
                    localRenderInfo={localRenderInfo}
                    onOpenSourceTree={() => navigate('/source_tree')}
                    onLocalRender={(content, name) => {
                        setLocalRenderInfo({ content, name });
                        navigate('/local-render');
                    }}
                />
            </main>
        </div>
    );
};
