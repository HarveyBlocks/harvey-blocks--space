import React, { useState } from 'react';
import { ChevronRight, ChevronDown, FileText, Folder, FolderOpen } from 'lucide-react';
import { FileNode, TreeItemProps } from '../types';

export const FileTreeItem: React.FC<TreeItemProps> = ({ 
  node, 
  pathPrefix, 
  level, 
  onSelectFile, 
  selectedPath 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Construct full path for this node
  const currentPath = pathPrefix ? `${pathPrefix}/${node.name}` : node.name;
  
  const isFolder = node.children !== null;
  const isMarkdown = !isFolder && node.name.toLowerCase().endsWith('.md');
  const isSelected = selectedPath === currentPath;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMarkdown) {
      onSelectFile(currentPath);
    } else if (isFolder) {
      setIsOpen(!isOpen);
    }
  };

  // Skip rendering non-markdown files if strict filtering is desired, 
  // but usually in a file tree we want to see everything or at least structure.
  // We will visually disable non-md files.
  const isDisabled = !isFolder && !isMarkdown;

  if (isDisabled) return null; // Hide non-md files for cleaner blog view

  const paddingLeft = `${level * 1.25}rem`;

  return (
    <div className="select-none">
      <div 
        onClick={handleSelect}
        className={`
          group flex items-center py-2 pr-3 text-sm cursor-pointer transition-colors duration-200 ease-in-out
          ${isSelected ? 'bg-primary-50 text-primary-700 font-medium border-r-4 border-primary-500' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-r-4 border-transparent'}
        `}
        style={{ paddingLeft }}
      >
        <span className="mr-2 opacity-70 group-hover:opacity-100 transition-opacity">
          {isFolder ? (
            isOpen ? <FolderOpen size={16} className="text-primary-500" /> : <Folder size={16} className="text-slate-400" />
          ) : (
            <FileText size={16} className={isSelected ? 'text-primary-500' : 'text-slate-400'} />
          )}
        </span>
        
        <span className="truncate flex-1">
          {node.name}
        </span>

        {isFolder && (
          <span className="ml-auto opacity-50">
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        )}
      </div>

      {isFolder && isOpen && node.children && (
        <div className="flex flex-col">
          {node.children.map((child, index) => (
            <FileTreeItem
              key={`${currentPath}-${child.name}-${index}`}
              node={child}
              pathPrefix={currentPath}
              level={level + 1}
              onSelectFile={onSelectFile}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </div>
  );
};