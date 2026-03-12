import { visit } from 'unist-util-visit';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfm as micromarkGfm } from 'micromark-extension-gfm';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { pandocMark } from 'micromark-extension-mark';
import { pandocMarkFromMarkdown } from 'mdast-util-mark';
import type { Plugin } from 'unified';

export const remarkPandocMark: Plugin = function () {
    const data = this.data() as {
        micromarkExtensions?: unknown[];
        fromMarkdownExtensions?: unknown[];
    };

    if (!data.micromarkExtensions) data.micromarkExtensions = [];
    if (!data.fromMarkdownExtensions) data.fromMarkdownExtensions = [];
    data.micromarkExtensions.push(pandocMark());
    data.fromMarkdownExtensions.push(pandocMarkFromMarkdown);
};

const parseInlineMarkdown = (value: string) => {
    const tree = fromMarkdown(value, {
        extensions: [micromarkGfm(), pandocMark()],
        mdastExtensions: [gfmFromMarkdown(), pandocMarkFromMarkdown]
    });
    const paragraph = tree.children.find((node: any) => node.type === 'paragraph');
    return paragraph && Array.isArray((paragraph as any).children)
        ? (paragraph as any).children
        : [{ type: 'text', value }];
};

export const remarkSupersubInlineMix: Plugin = function () {
    return (tree: any) => {
        visit(tree, ['superscript', 'subscript'], (node: any) => {
            if (!Array.isArray(node.children) || node.children.length === 0) return;
            if (!node.children.every((child: any) => child.type === 'text')) return;

            const raw = node.children.map((child: any) => String(child.value || '')).join('');
            if (!raw.trim()) return;
            node.children = parseInlineMarkdown(raw);
        });
    };
};

export const remarkSupersubAcrossNodes: Plugin = function () {
    const delimiters: Array<'~' | '^'> = ['~', '^'];
    const isTextNode = (node: any) => node && node.type === 'text' && typeof node.value === 'string';
    const hasOpen = (value: string, d: '~' | '^') => value.endsWith(d) && !value.endsWith(`\\${d}`);
    const hasClose = (value: string, d: '~' | '^') => value.startsWith(d) && !value.startsWith(`\\${d}`);

    return (tree: any) => {
        visit(tree, (node: any) => Array.isArray(node?.children), (parent: any) => {
            if (!Array.isArray(parent.children) || parent.children.length < 3) return;

            for (let i = 0; i < parent.children.length; i++) {
                const openNode = parent.children[i];
                if (!isTextNode(openNode)) continue;

                for (const delimiter of delimiters) {
                    if (!hasOpen(openNode.value as string, delimiter)) continue;
                    let closeIndex = -1;

                    for (let j = i + 1; j < parent.children.length; j++) {
                        const candidate = parent.children[j];
                        if (isTextNode(candidate) && hasClose(candidate.value as string, delimiter)) {
                            closeIndex = j;
                            break;
                        }
                    }

                    if (closeIndex === -1 || closeIndex <= i + 1) continue;

                    const closeNode = parent.children[closeIndex];
                    const innerNodes = parent.children.slice(i + 1, closeIndex);
                    if (innerNodes.length === 0) continue;

                    openNode.value = (openNode.value as string).slice(0, -1);
                    closeNode.value = (closeNode.value as string).slice(1);

                    const supersubNode = {
                        type: delimiter === '^' ? 'superscript' : 'subscript',
                        data: { hName: delimiter === '^' ? 'sup' : 'sub' },
                        children: innerNodes
                    };

                    parent.children.splice(i + 1, closeIndex - i - 1, supersubNode);

                    if (isTextNode(parent.children[i]) && (parent.children[i].value as string).length === 0) {
                        parent.children.splice(i, 1);
                        i -= 1;
                    }

                    const closeNodeNext = parent.children[i + 2];
                    if (isTextNode(closeNodeNext) && (closeNodeNext.value as string).length === 0) {
                        parent.children.splice(i + 2, 1);
                    }
                    break;
                }
            }
        });
    };
};
