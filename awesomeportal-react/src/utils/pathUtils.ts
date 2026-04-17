/**
 * Prefix a site-root path with Vite `base` so public assets work under a subdirectory (e.g. `/portal/`).
 * @param absoluteFromSiteRoot - Path beginning with `/`, e.g. `/icons/info.svg`
 */
export function withBase(absoluteFromSiteRoot: string): string {
    const path = absoluteFromSiteRoot.startsWith('/') ? absoluteFromSiteRoot : `/${absoluteFromSiteRoot}`;
    const rawBase = import.meta.env.BASE_URL || '/';
    const base = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;
    return `${base}${path}`;
}

/** True when `pathname` is the built SPA entry (e.g. `/portal/index.html`) for the current Vite `base`. */
export function isSpaIndexPathname(pathname: string): boolean {
    const rawBase = import.meta.env.BASE_URL || '/';
    const base = rawBase.replace(/\/+$/, '');
    if (!base) {
        return pathname === '/index.html' || pathname.endsWith('/index.html');
    }
    return pathname === `${base}/index.html` || pathname.endsWith(`${base}/index.html`);
}

function normalizeImageSrcCore(raw: string): string {
    let u = String(raw).trim();
    if (!u) return '';
    u = u.replace(/&amp;/gi, '&');
    if (u.includes('images.unsplash.com/photo-1518176258769')) {
        return withBase('/brand-demos/heineken/coachella-banner.png');
    }
    return u;
}

/**
 * Fixes URLs saved with HTML entities (e.g. `&amp;` in query strings) and swaps a known-broken
 * legacy Heineken demo Unsplash URL for the bundled marketing banner asset.
 */
export function normalizeImageSrcForDisplay(url: string | undefined | null): string {
    if (url == null) return '';
    return normalizeImageSrcCore(String(url));
}

/**
 * Same normalization as {@link normalizeImageSrcForDisplay}; use when persisting grid/skin URLs
 * so localStorage stays free of HTML entities and broken legacy demo links.
 */
export function normalizePersistedImageUrl(url: string): string {
    return normalizeImageSrcCore(url);
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
