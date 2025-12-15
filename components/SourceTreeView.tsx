import React from 'react';
import { Link } from 'react-router-dom';
import { FileNode } from '../types';

interface SourceTreeViewProps {
  nodes: FileNode[];
}

const TreeNode: React.FC<{ node: FileNode; pathPrefix: string }> = ({ node, pathPrefix }) => {
  const currentPath = pathPrefix ? `${pathPrefix}/${node.name}` : node.name;
  const isFolder = node.children !== null;

  if (isFolder) {
    return (
      <div className="ml-4 my-2">
        <div className="font-semibold text-slate-800 flex items-center gap-2 select-none">
          <span className="text-yellow-500">📁</span> {node.name}
        </div>
        <div className="border-l-2 border-slate-100 ml-2 pl-2">
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
        className="text-slate-600 hover:text-primary-600 hover:underline flex items-center gap-2 transition-colors decoration-slate-300 hover:decoration-primary-300 underline-offset-4"
      >
        <span className="text-slate-400">📄</span> {node.name}
      </Link>
    </div>
  );
};

export const SourceTreeView: React.FC<SourceTreeViewProps> = ({ nodes }) => {
  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6 border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-bold text-slate-900">Source Tree</h1>
        <p className="text-slate-500 mt-2">Complete directory structure</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm overflow-x-auto">
        {nodes.map((node, idx) => (
          <TreeNode key={`root-${idx}`} node={node} pathPrefix="" />
        ))}
      </div>
    </div>
  );
};
