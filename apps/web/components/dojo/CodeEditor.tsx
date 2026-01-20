'use client';

import Editor from '@monaco-editor/react';

interface CodeEditorProps {
    language?: string;
    value: string;
    onChange: (value: string | undefined) => void;
    theme?: 'vs-dark' | 'light';
}

export function CodeEditor({
    language = 'javascript',
    value,
    onChange,
    theme = 'vs-dark'
}: CodeEditorProps) {
    return (
        <div className="h-full rounded-lg overflow-hidden border border-white/10 bg-[#1e1e1e]">
            <Editor
                height="100%"
                defaultLanguage={language}
                language={language}
                value={value}
                onChange={onChange}
                theme={theme}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                    scrollBeyondLastLine: false,
                    padding: { top: 16, bottom: 16 },
                    automaticLayout: true,
                    cursorBlinking: 'smooth',
                    cursorSmoothCaretAnimation: 'on',
                    smoothScrolling: true,
                }}
            />
        </div>
    );
}
