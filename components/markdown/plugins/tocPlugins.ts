import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { TocItem } from 'remark-flexible-toc';

const TOC_HEADING_PATTERN = /^(toc|contents|table[ -]of[ -]contents)$/i;
const TOC_INLINE_PATTERN = /^\[toc\]$/i;

const getNodeText = (node: any): string => {
    if (!node) return '';
    if (node.type === 'text') return String(node.value || '');
    if (!Array.isArray(node.children)) return '';
    return node.children.map(getNodeText).join('');
};

const createTocListNode = (tocItems: TocItem[]) => {
    const filtered = tocItems.filter((item) => !TOC_HEADING_PATTERN.test(item.value.trim()));
    const createList = () => ({ type: 'list', ordered: false, spread: false as const, children: [] as any[] });
    const createListItem = (item: TocItem) => ({
        type: 'listItem',
        spread: false as const,
        children: [{
            type: 'paragraph',
            children: [{ type: 'link', url: item.href, children: [{ type: 'text', value: item.value }] }]
        }] as any[]
    });

    const rootList = createList();
    const stack: Array<{ level: number; list: any; lastItem: any | null }> = [{ level: 0, list: rootList, lastItem: null }];

    for (const item of filtered) {
        const level = Math.max(1, item.numbering?.length || item.depth || 1);
        while (stack.length > 1 && level < stack[stack.length - 1].level) stack.pop();

        while (level > stack[stack.length - 1].level) {
            const current = stack[stack.length - 1];
            if (!current.lastItem) break;

            let nestedList = current.lastItem.children.find((child: any) => child.type === 'list');
            if (!nestedList) {
                nestedList = createList();
                current.lastItem.children.push(nestedList);
            }

            stack.push({ level: stack[stack.length - 1].level + 1, list: nestedList, lastItem: null });
        }

        const listItem = createListItem(item);
        stack[stack.length - 1].list.children.push(listItem);
        stack[stack.length - 1].lastItem = listItem;
    }

    return rootList;
};

const createTocHeadingNode = (depth: number = 2) => ({
    type: 'heading',
    depth,
    children: [{ type: 'text', value: 'TOC' }]
});

export const createRemarkInjectToc = (tocItems: TocItem[]): Plugin => function () {
    return (tree: any) => {
        visit(tree, 'root', (root: any) => {
            if (!Array.isArray(root.children)) return;

            for (let i = 0; i < root.children.length; i++) {
                const node = root.children[i];

                if (node.type === 'paragraph' && TOC_INLINE_PATTERN.test(getNodeText(node).trim())) {
                    root.children.splice(i, 1, createTocHeadingNode(2), createTocListNode(tocItems));
                    i += 1;
                    continue;
                }

                if (node.type === 'heading' && TOC_HEADING_PATTERN.test(getNodeText(node).trim())) {
                    const nextNode = root.children[i + 1];
                    if (!nextNode || nextNode.type !== 'list') {
                        root.children.splice(i + 1, 0, createTocListNode(tocItems));
                    }
                }
            }
        });
    };
};
