import mermaid from 'mermaid';
// @ts-ignore
import plantumlEncoder from 'plantuml-encoder';

const normalizeSvgSize = (svg: string) =>
    svg.replace(/\b(width|height)\s*=\s*"-\d+[^"]*"/g, (_, prop) =>
        prop === 'width' ? 'width="100%"' : 'height="auto"'
    );

const captureMermaidErrorSvg = (id: string) => {
    const errorEl = document.getElementById(id) || document.getElementById(`d${id}`);
    if (!errorEl) return null;
    const svgContent = normalizeSvgSize(errorEl.outerHTML);
    errorEl.remove();
    return svgContent;
};

export const renderDiagramContent = async (
    language: 'mermaid' | 'plantuml',
    code: string
) => {
    if (language === 'mermaid') {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
            suppressErrorRendering: false
        });

        const id = `mermaid-${Math.random().toString(36).substring(2, 11)}`;
        try {
            const { svg } = await mermaid.render(id, code);
            return { content: normalizeSvgSize(svg), error: null };
        } catch (err: any) {
            const fallbackSvg = captureMermaidErrorSvg(id);
            if (fallbackSvg) {
                return { content: fallbackSvg, error: err.message || 'Mermaid Syntax Error' };
            }
            return { content: '', error: err.message || 'Mermaid Syntax Error' };
        } finally {
            const el = document.getElementById(id) || document.getElementById(`d${id}`);
            if (el) el.remove();
        }
    }

    const encoded = plantumlEncoder.encode(code);
    const url = `https://www.plantuml.com/plantuml/svg/${encoded}`;

    try {
        const response = await fetch(url);
        const svgText = await response.text();
        return { content: svgText, error: null };
    } catch {
        return { content: '', error: 'Network error: Failed to fetch PlantUML diagram' };
    }
};
