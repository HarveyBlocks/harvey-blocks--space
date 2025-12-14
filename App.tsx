import React, {useEffect, useState, useCallback} from 'react';
import {Menu, X, BookOpen, Github, Download, List} from 'lucide-react';
import {fetchFileTree, fetchMarkdownContent, BLOG_REPO_URL} from './services/blogService';
import {FileNode} from './types';
import {FileTreeItem} from './components/FileTree';
import {MarkdownRenderer} from './components/MarkdownRenderer';
import {LoadingSpinner} from './components/LoadingSpinner';
import {TableOfContents} from './components/TableOfContents';

const App: React.FC = () => {
    const [tree, setTree] = useState<FileNode[]>([]);
    const [isLoadingTree, setIsLoadingTree] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedPath, setSelectedPath] = useState<string | null>(null);
    const [markdownContent, setMarkdownContent] = useState<string | null>(null);
    const [isContentLoading, setIsContentLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default open on desktop
    const [isTocOpen, setIsTocOpen] = useState(true); // Default TOC open

    // Handle responsive sidebar defaults
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsSidebarOpen(false);
                setIsTocOpen(false); // Hide TOC on mobile by default
            } else {
                setIsSidebarOpen(true);
                setIsTocOpen(true);
            }
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch Tree on Mount
    useEffect(() => {
        const loadTree = async () => {
            try {
                const data = await fetchFileTree();
                setTree(data);
            } catch (err) {
                setError("Failed to load blog directory. Please try again later.");
            } finally {
                setIsLoadingTree(false);
            }
        };
        loadTree();
    }, []);

    // Fetch Content when selectedPath changes
    useEffect(() => {
        if (!selectedPath) return;

        const loadContent = async () => {
            setIsContentLoading(true);
            setMarkdownContent(null);
            try {
                const content = await fetchMarkdownContent(selectedPath);
                setMarkdownContent(content);

                // On mobile, close sidebar after selection
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
    }, [selectedPath]);

    const handleSelectFile = useCallback((path: string) => {
        setSelectedPath(path);
        // Scroll to top of content
        const scrollContainer = document.getElementById('scroll-container');
        if (scrollContainer) {
            scrollContainer.scrollTop = 0;
        }
    }, []);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const toggleToc = () => setIsTocOpen(!isTocOpen);

    const handleDownload = () => {
        if (!markdownContent || !selectedPath) return;

        const blob = new Blob([markdownContent], {type: 'text/markdown'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = selectedPath.split('/').pop() || 'download.md';
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
                        <div className="p-2 bg-primary-100 rounded-lg text-primary-700">
                            <BookOpen size={20}/>
                        </div>
                        <h1 className="font-bold text-lg tracking-tight text-slate-800">Harvey Blocks' Space</h1>
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
                    ) : error ? (
                        <div className="p-6 text-sm text-red-500 text-center">
                            {error}
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {tree.map((node, index) => (
                                <FileTreeItem
                                    key={`root-${node.name}-${index}`}
                                    node={node}
                                    pathPrefix=""
                                    level={1}
                                    onSelectFile={handleSelectFile}
                                    selectedPath={selectedPath}
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

            {/* Main Content Area Wrapper */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Header */}
                <header
                    className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 flex items-center px-4 lg:px-8 justify-between sticky top-0 z-10 shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleSidebar}
                            className="p-2 -ml-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            aria-label="Toggle sidebar"
                        >
                            <Menu size={24}/>
                        </button>
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Currently Reading</span>
                            <h2 className="text-sm font-medium text-slate-700 truncate max-w-[200px] sm:max-w-md"
                                style={{margin : '2px'}}>
                                {selectedPath ? selectedPath.split('/').pop() : 'Select an article'}
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {selectedPath && (
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

                {/* Flex container for Content + TOC */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Scrollable Article Content */}
                    <div className="flex-1 overflow-y-auto scroll-smooth" id="scroll-container">
                        <div className="max-w-4xl mx-auto px-4 py-8 lg:px-12 lg:py-12">
                            {!selectedPath ? (
                                <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
                                    <div
                                        className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mb-6 text-primary-300">
                                        <BookOpen size={40}/>
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome to Harvey Blocks'
                                        Space</h2>
                                    <p className="text-slate-500 max-w-md">
                                        Select a document from the sidebar to explore Harvey's thoughts.
                                    </p>
                                </div>
                            ) : isContentLoading ? (
                                <LoadingSpinner/>
                            ) : (
                                <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
                                    {markdownContent && <MarkdownRenderer content={markdownContent}/>}
                                </div>
                            )}

                            {/* Footer spacer */}
                            <div className="h-20"></div>
                        </div>
                    </div>

                    {/* Right TOC Sidebar (Desktop only or conditional) */}
                    {selectedPath && markdownContent && isTocOpen && (
                        <div className="w-64 flex-shrink-0 border-l border-slate-200 bg-slate-50/50 hidden lg:block">
                            <TableOfContents content={markdownContent}/>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default App;