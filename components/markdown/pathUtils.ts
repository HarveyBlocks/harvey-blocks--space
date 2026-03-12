export const resolveRelativePath = (
    baseFile: string,
    relativeUrl: string,
    isFolder: boolean = false
) => {
    if (!relativeUrl) return '';

    let decodedUrl = relativeUrl;
    try {
        decodedUrl = decodeURIComponent(relativeUrl);
    } catch {
        decodedUrl = relativeUrl;
    }

    const hashIndex = decodedUrl.indexOf('#');
    const pathPart = hashIndex !== -1 ? decodedUrl.slice(0, hashIndex) : decodedUrl;
    const hashPart = hashIndex !== -1 ? decodedUrl.slice(hashIndex) : '';

    let normalizedUrl = pathPart.replace(/\\/g, '/').replace(/\/+/g, '/');
    if (normalizedUrl.startsWith('/')) {
        normalizedUrl = normalizedUrl.slice(1);
    }

    const baseDirParts = baseFile.split('/').filter(Boolean);
    if (!isFolder) {
        baseDirParts.pop();
    }

    const relativeParts = normalizedUrl.split('/').filter(Boolean);
    for (const part of relativeParts) {
        if (part === '.') continue;
        if (part === '..') {
            if (baseDirParts.length > 0) {
                baseDirParts.pop();
            }
            continue;
        }
        baseDirParts.push(part);
    }

    return baseDirParts.join('/') + hashPart;
};
