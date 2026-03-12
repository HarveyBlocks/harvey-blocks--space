import React, { useMemo } from 'react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { BlogApp } from './components/blog/BlogApp';

const App: React.FC = () => {
    const isSandbox = typeof window !== 'undefined' && window.location.protocol === 'blob:';
    const baseName = useMemo(() => {
        if (import.meta.env.DEV) return '/';
        const path = window.location.pathname;
        const firstSegment = path.split('/').filter(Boolean)[0] || '';
        const repoName = firstSegment && !firstSegment.match(/\.(html|php|js|css)$/) ? firstSegment : '';
        return repoName ? '/' + repoName : '/';
    }, []);

    if (isSandbox) {
        return (
            <MemoryRouter>
                <BlogApp />
            </MemoryRouter>
        );
    }

    return (
        <BrowserRouter basename={baseName}>
            <BlogApp />
        </BrowserRouter>
    );
};

export default App;
