export interface FileNode {
  name: string;
  children: FileNode[] | null;
}

export interface TreeItemProps {
  node: FileNode;
  pathPrefix: string;
  level: number;
  onSelectFile: (path: string) => void;
  selectedPath: string | null;
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}