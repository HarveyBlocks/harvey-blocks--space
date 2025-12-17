import React, {useEffect, useState, useCallback, useMemo} from 'react';
import {HashRouter, MemoryRouter, Routes, Route, useLocation, useNavigate} from 'react-router-dom';
import {Menu, X, BookOpen, Github, Download, List, FolderTree} from 'lucide-react';
import {fetchFileTree, fetchMarkdownContent, findNodeByPath, BLOG_REPO_URL} from './services/blogService';
import {FileNode} from './types';
import {FileTreeItem} from './components/FileTree';
import {MarkdownRenderer} from './components/MarkdownRenderer';
import {LoadingSpinner} from './components/LoadingSpinner';
import {TableOfContents} from './components/TableOfContents';
import {SourceTreeView} from './components/SourceTreeView';

const BlogApp: React.FC = () => {
    const [tree, setTree] = useState<FileNode[]>([]);
    const [isLoadingTree, setIsLoadingTree] = useState(true);
    const [treeError, setTreeError] = useState<string | null>(null);

    const [markdownContent, setMarkdownContent] = useState<string | null>(null);
    const [isContentLoading, setIsContentLoading] = useState(false);

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isTocOpen, setIsTocOpen] = useState(true);

    const location = useLocation();
    const navigate = useNavigate();

    // Derived state from URL
    const activePath = location.pathname.slice(1) ? decodeURIComponent(location.pathname.slice(1)) : null;

    // 1. Responsive Sidebar Defaults
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsSidebarOpen(false);
                setIsTocOpen(false);
            } else {
                setIsSidebarOpen(true);
                setIsTocOpen(true);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 2. Fetch Tree
    useEffect(() => {
        const loadTree = async () => {
            try {
                const data = await fetchFileTree();
                setTree(data);
            } catch (err) {
                setTreeError("Failed to load blog directory.");
            } finally {
                setIsLoadingTree(false);
            }
        };
        loadTree();
    }, []);

    // Calculate if current path is a folder directly from tree to ensure prop consistency
    const currentNode = useMemo(() => {
        if (!tree.length || !activePath) return null;
        if (activePath === 'source_tree') return null; // Source tree view is special
        return findNodeByPath(tree, activePath);
    }, [tree, activePath]);

    const isCurrentPathFolder = currentNode ? currentNode.children !== null : false;

    // 3. Handle Route Changes (Load Content)
    useEffect(() => {
        const loadContent = async () => {
            if (!activePath) {
                setMarkdownContent(null); // Home state
                return;
            }

            if (activePath === 'source_tree') {
                // Clear content for source tree view
                setMarkdownContent(null);
                return;
            }

            if (isLoadingTree) return; // Wait for tree

            if (!currentNode) {
                // Path doesn't exist in tree
                setMarkdownContent(`# 404 Not Found\n\nThe path **${activePath}** does not exist.`);
                return;
            }

            if (isCurrentPathFolder) {
                // Render a simple folder view
                // We could look for a README.md inside, but for now we list children
                const childrenList = currentNode.children?.map(child =>
                    `- [${child.name}](${child.name})` // Relative link
                ).join('\n');

                // Add back link. Since we implemented ".." support in MarkdownRenderer, we can use it here.
                const backLink = `[⬅️ Back to parent](..)\n\n`;

                setMarkdownContent(`# 📂 ${currentNode.name}\n\n${backLink}Select a file from this folder:\n\n${childrenList}`);
                return;
            }

            // It's a file, fetch it
            setIsContentLoading(true);
            try {
                const content = await fetchMarkdownContent(activePath);
                setMarkdownContent(content);

                // Mobile UX: Close sidebar on selection
                if (window.innerWidth < 1024) {
                    setIsSidebarOpen(false);
                }
            } catch (err) {
                setMarkdownContent("# Error\nCould not load this post.");
            } finally {
                setIsContentLoading(false);
            }
        };

        loadContent();
    }, [activePath, tree, isLoadingTree, currentNode, isCurrentPathFolder]);

    // Navigate handler for FileTree
    const handleNavigate = useCallback((path: string) => {
        navigate('/' + path);
        // Scroll to top
        const scrollContainer = document.getElementById('scroll-container');
        if (scrollContainer) {
            scrollContainer.scrollTop = 0;
        }
    }, [navigate]);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const toggleToc = () => setIsTocOpen(!isTocOpen);

    const handleDownload = () => {
        if (!markdownContent || !activePath) return;
        const blob = new Blob([markdownContent], {type: 'text/markdown'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = activePath.split('/').pop() || 'download.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed lg:static inset-y-0 left-0 z-30
          w-72 bg-white border-r border-slate-200 shadow-xl lg:shadow-none
          transform transition-transform duration-300 ease-in-out flex flex-col
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:border-none lg:overflow-hidden'}
        `}
            >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="p-2 bg-primary-100 rounded-lg text-primary-700 cursor-pointer"
                            onClick={() => navigate('/')}
                        >
                            <BookOpen size={20}/>
                        </div>
                        {/* Added border-none and font-sans to override potentially conflicting github.css globals */}
                        <h1
                            className="font-bold text-lg tracking-tight text-slate-800 cursor-pointer border-none font-sans"
                            onClick={() => navigate('/')}
                        >
                            Harvey Blocks' Space
                        </h1>
                    </div>
                    <button
                        onClick={toggleSidebar}
                        className="lg:hidden p-2 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
                    >
                        <X size={20}/>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto py-4">
                    {isLoadingTree ? (
                        <div className="flex justify-center py-8">
                            <div
                                className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : treeError ? (
                        <div className="p-6 text-sm text-red-500 text-center">
                            {treeError}
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {tree.map((node, index) => (
                                <FileTreeItem
                                    key={`root-${node.name}-${index}`}
                                    node={node}
                                    pathPrefix=""
                                    level={1}
                                    onNavigate={handleNavigate}
                                    activePath={activePath}
                                />
                            ))}
                            {tree.length === 0 && (
                                <p className="px-6 text-sm text-slate-400 italic">No files found.</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-100 text-xs text-slate-400 text-center">
                    <p>Powered by React & Tailwind</p>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                <header
                    className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 flex items-center px-4 lg:px-8 justify-between sticky top-0 z-10 shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleSidebar}
                            className="p-2 -ml-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                            <Menu size={24}/>
                        </button>
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Currently Reading</span>
                            <h2 className="text-sm font-medium text-slate-700 truncate max-w-[200px] sm:max-w-md"
                                style={{margin: "2px"}}>
                                {activePath ? activePath.split('/').pop() : 'Home'}
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {activePath && activePath !== 'source_tree' && (
                            <>
                                <button
                                    onClick={handleDownload}
                                    title="Download Markdown"
                                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors hidden sm:block"
                                >
                                    <Download size={20}/>
                                </button>
                                <button
                                    onClick={toggleToc}
                                    title={isTocOpen ? "Hide Directory" : "Show Directory"}
                                    className={`p-2 rounded-lg transition-colors hidden lg:block ${isTocOpen ? 'text-primary-600 bg-primary-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                                >
                                    <List size={20}/>
                                </button>
                            </>
                        )}
                        <a
                            href={BLOG_REPO_URL}
                            target="_blank"
                            rel="noreferrer"
                            title="Visit Repository"
                            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <Github size={20}/>
                        </a>
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden">
                    <div className="flex-1 overflow-y-auto scroll-smooth" id="scroll-container">
                        <div className="max-w-4xl mx-auto px-4 py-8 lg:px-12 lg:py-12">
                            {!activePath ? (
                                <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
                                    <div
                                        className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mb-6 text-primary-300">
                                        <BookOpen size={40}/>
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome to Harvey Blocks'
                                        Space</h2>
                                    <p className="text-slate-500 max-w-md mb-8">
                                        Select a document from the sidebar to explore Harvey's thoughts.
                                    </p>
                                    <button
                                        onClick={() => navigate('/source_tree')}
                                        className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-lg hover:border-primary-300 hover:text-primary-600 hover:shadow-md transition-all duration-200 group"
                                    >
                                        <FolderTree size={20}
                                                    className="text-slate-400 group-hover:text-primary-500 transition-colors"/>
                                        <span className="font-medium">View Source Tree</span>
                                    </button>
                                </div>
                            ) : activePath === 'source_tree' ? (
                                <SourceTreeView nodes={tree}/>
                            ) : isContentLoading ? (
                                <LoadingSpinner/>
                            ) : (
                                <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
                                    {markdownContent &&
                                        <MarkdownRenderer content={markdownContent} filePath={activePath}
                                                          isFolder={isCurrentPathFolder}/>}
                                </div>
                            )}
                            <div className="h-20"></div>
                        </div>
                    </div>

                    {/* Right TOC Sidebar (only for markdown files that are loaded) */}
                    {activePath && activePath !== 'source_tree' && markdownContent && isTocOpen && !isCurrentPathFolder && (
                        <div className="w-64 flex-shrink-0 border-l border-slate-200 bg-slate-50/50 hidden lg:block">
                            <TableOfContents content={markdownContent}/>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

const App: React.FC = () => {
    // Check if we are running in a restricted environment (like a blob sandbox)
    // where modifying location (HashRouter) might cause "Location.assign" access denied errors.
    const isSandbox = typeof window !== 'undefined' && window.location.protocol === 'blob:';

    return (
        isSandbox ? (
            <MemoryRouter>
                <BlogApp/>
            </MemoryRouter>
        ) : (
            <HashRouter>
                <BlogApp/>
            </HashRouter>
        )
    );
};

export default App;