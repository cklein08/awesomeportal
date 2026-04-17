/**
 * Prefix a site-root path with Vite `base` so public assets work under e.g. `/tools/assets-browser/`.
 * @param absoluteFromSiteRoot - Path beginning with `/`, e.g. `/icons/info.svg`
 */
export function withBase(absoluteFromSiteRoot: string): string {
    const path = absoluteFromSiteRoot.startsWith('/') ? absoluteFromSiteRoot : `/${absoluteFromSiteRoot}`;
    const rawBase = import.meta.env.BASE_URL || '/';
    const base = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;
    return `${base}${path}`;
}

/**
 * Resolves image paths based on the current URL location
 * Handles both root domain and subdirectory deployments
 *
 * @param imagePath - The image path to resolve (e.g., "/icons/info.svg")
 * @returns The resolved image path
 */
export const resolveImagePath = (imagePath: string): string => {
    if (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) {
        return withBase(imagePath);
    }
    const currentUrl = window.location.href;
    const lastSlashIndex = currentUrl.lastIndexOf('/');

    // If we're in a subdirectory (not at domain root)
    if (lastSlashIndex > currentUrl.indexOf('://') + 2) {
        const basePath = currentUrl.substring(0, lastSlashIndex + 1);
        const cleanImagePath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
        return `${basePath}${cleanImagePath}`;
    }

    return imagePath;
};
