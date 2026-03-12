import React from 'react';

export const extractCodeText = (nodes: any): string => {
    if (!nodes) return '';
    if (typeof nodes === 'string') return nodes;
    if (Array.isArray(nodes)) return nodes.map(extractCodeText).join('');
    if (React.isValidElement(nodes)) {
        return extractCodeText((nodes as any).props.children);
    }
    if (typeof nodes === 'object' && 'props' in nodes) {
        return extractCodeText((nodes as any).props.children);
    }
    return '';
};

export const extractCodeBlockData = (children: React.ReactNode) => {
    const childArray = React.Children.toArray(children);
    const codeElement = childArray.find((child: any) => {
        if (!React.isValidElement(child)) return false;
        const childProps = child.props as any;
        return child.type === 'code' || (
            childProps?.className &&
            typeof childProps.className === 'string' &&
            childProps.className.includes('language-')
        );
    }) as React.ReactElement<any> | undefined;

    const codeContent: React.ReactNode = codeElement || children;
    const className = codeElement ? (codeElement.props as any).className || '' : '';
    const languageMatch = /language-([^\s]+)/i.exec(className);
    const language = languageMatch ? languageMatch[1].toLowerCase() : '';

    const rawCode = codeElement
        ? extractCodeText((codeElement.props as any).children)
        : extractCodeText(children);

    return { language, rawCode, codeContent };
};
