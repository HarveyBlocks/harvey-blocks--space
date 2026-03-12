import React, { useEffect, useMemo, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { oneDark } from '@codemirror/theme-one-dark';
import { languages } from '@codemirror/language-data';

interface AdvancedSourceModeViewProps {
    content: string;
    editable: boolean;
    onChange?: (nextContent: string) => void;
}

const lightEditorTheme = EditorView.theme({
    '&': {
        backgroundColor: 'transparent !important',
        color: '#334155',
        fontSize: '14px'
    },
    '.cm-editor': { backgroundColor: 'transparent !important' },
    '.cm-content': {
        fontFamily: '"Fira Code", monospace',
        lineHeight: '1.7',
        padding: '16px',
        caretColor: '#0f172a'
    },
    '.cm-gutters': {
        display: 'none'
    },
    '.cm-scroller': {
        overflowX: 'hidden',
        backgroundColor: 'transparent !important'
    },
    '.cm-focused': {
        outline: 'none'
    },
    '&.cm-focused .cm-cursor': {
        borderLeftColor: '#0f172a'
    },
    '.cm-selectionBackground, .cm-content ::selection': {
        backgroundColor: '#bae6fd !important'
    }
}, { dark: false });

const darkEditorTheme = EditorView.theme({
    '&': {
        backgroundColor: 'transparent !important',
        color: '#cbd5e1',
        fontSize: '14px'
    },
    '.cm-editor': { backgroundColor: 'transparent !important' },
    '.cm-content': {
        fontFamily: '"Fira Code", monospace',
        lineHeight: '1.7',
        padding: '16px',
        caretColor: '#f8fafc'
    },
    '.cm-gutters': {
        display: 'none'
    },
    '.cm-scroller': {
        overflowX: 'hidden',
        backgroundColor: 'transparent !important'
    },
    '.cm-focused': {
        outline: 'none'
    },
    '&.cm-focused .cm-cursor': {
        borderLeftColor: '#f8fafc'
    },
    '.cm-selectionBackground, .cm-content ::selection': {
        backgroundColor: '#334155 !important'
    }
}, { dark: true });

const detectDarkMode = () =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

export const AdvancedSourceModeView: React.FC<AdvancedSourceModeViewProps> = ({
    content,
    editable,
    onChange
}) => {
    const [isDark, setIsDark] = useState(detectDarkMode);

    useEffect(() => {
        if (typeof document === 'undefined') return;

        const root = document.documentElement;
        const observer = new MutationObserver(() => setIsDark(root.classList.contains('dark')));
        observer.observe(root, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const extensions = useMemo(
        () => [
            markdown({ codeLanguages: languages }),
            EditorView.lineWrapping,
            isDark ? darkEditorTheme : lightEditorTheme,
            syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
            ...(isDark ? [oneDark] : [])
        ],
        [isDark]
    );

    return (
        <div className="min-h-[420px] max-h-[70vh] overflow-hidden">
            <CodeMirror
                value={content}
                height="70vh"
                extensions={extensions}
                theme="none"
                editable={editable}
                readOnly={!editable}
                basicSetup={{
                    foldGutter: false,
                    lineNumbers: false,
                    highlightActiveLine: false,
                    highlightActiveLineGutter: false
                }}
                onChange={(value) => {
                    if (!editable) return;
                    onChange?.(value);
                }}
            />
        </div>
    );
};
