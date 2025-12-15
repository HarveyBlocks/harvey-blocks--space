export interface FileNode {
  name: string;
  children: FileNode[] | null;
}

export interface TreeItemProps {
  node: FileNode;
  pathPrefix: string;
  level: number;
  onNavigate: (path: string) => void;
  activePath: string | null;
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}