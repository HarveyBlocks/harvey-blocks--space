import React from 'react';
import { Link } from 'react-router-dom';
import { FileNode } from '../types';
import { Folder, FileText } from 'lucide-react';

interface SourceTreeViewProps {
  nodes: FileNode[];
}

const TreeNode: React.FC<{ node: FileNode; pathPrefix: string }> = ({ node, pathPrefix }) => {
  const currentPath = pathPrefix ? `${pathPrefix}/${node.name}` : node.name;
  const isFolder = node.children !== null;

  if (isFolder) {
    return (
      <div className="ml-4 my-2">
        <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 select-none">
          <Folder size={20} className="text-yellow-500" /> {node.name}
        </div>
        <div className="border-l-2 border-slate-100 dark:border-slate-700 ml-2 pl-2">
          {node.children?.map((child, idx) => (
            <TreeNode key={`${currentPath}-${idx}`} node={child} pathPrefix={currentPath} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="ml-4 my-1">
      <Link 
        to={`/${currentPath}`}
        className="text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-300 hover:underline flex items-center gap-3 transition-colors decoration-slate-300 dark:decoration-slate-600 hover:decoration-primary-300 underline-offset-4 py-1"
      >
        <FileText size={20} className="text-slate-400 dark:text-slate-500" /> {node.name}
      </Link>
    </div>
  );
};

export const SourceTreeView: React.FC<SourceTreeViewProps> = ({ nodes }) => {
  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Source Tree</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Complete directory structure</p>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm overflow-x-auto">
        {nodes.map((node, idx) => (
          <TreeNode key={`root-${idx}`} node={node} pathPrefix="" />
        ))}
      </div>
    </div>
  );
};
