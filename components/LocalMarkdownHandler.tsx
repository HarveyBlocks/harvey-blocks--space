import React, { useRef } from 'react';
import { FileText } from 'lucide-react';

interface LocalMarkdownHandlerProps {
  onLocalRender: (content: string, fileName: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export const LocalMarkdownHandler: React.FC<LocalMarkdownHandlerProps> = ({ onLocalRender, className, children }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check for .md extension or markdown/plain text mime types
      const isMarkdown = file.name.toLowerCase().endsWith('.md') || 
                        file.type === 'text/markdown' || 
                        file.type === 'text/plain';
      
      if (isMarkdown) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          onLocalRender(content, file.name);
        };
        reader.readAsText(file);
      } else {
        alert('Please select a valid Markdown (.md) file to render.');
      }
    }
    // Reset the input so the same file can be selected again if needed
    if (event.target) {
      event.target.value = '';
    }
  };

  return (
    <div className="flex items-center">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".md,text/markdown,text/plain"
        className="hidden"
      />
      <button
        onClick={handleButtonClick}
        title="Render Local Markdown"
        className={className || "p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"}
      >
        {children || <FileText size={20} />}
      </button>
    </div>
  );
};
