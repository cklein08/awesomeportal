import type { PortalSkinConfig } from '../types';

/** Public read-only proxy so browser fetches can read third-party HTML/CSS (subject to proxy availability). */
function proxiedRawUrl(target: string): string {
    return `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`;
}

function expandShortHex(hex: string): string {
    const h = hex.toLowerCase();
    if (h.length === 4 && h.startsWith('#')) {
        return `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
    }
    return h;
}

function collectHexColors(text: string): string[] {
    const found = new Set<string>();
    const re = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
        found.add(expandShortHex(m[0]));
    }
    return [...found];
}

function luminance(hex: string): number {
    const h = expandShortHex(hex);
    const r = Number.parseInt(h.slice(1, 3), 16) / 255;
    const g = Number.parseInt(h.slice(3, 5), 16) / 255;
    const b = Number.parseInt(h.slice(5, 7), 16) / 255;
    const a = [r, g, b].map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function isGrayish(hex: string): boolean {
    const h = expandShortHex(hex);
    const r = Number.parseInt(h.slice(1, 3), 16);
    const g = Number.parseInt(h.slice(3, 5), 16);
    const b = Number.parseInt(h.slice(5, 7), 16);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    return max - min < 18;
}

function absUrl(base: URL, href: string): string | null {
    try {
        return new URL(href, base).href;
    } catch {
        return null;
    }
}

export type SkinSiteImportResult = {
    config: Partial<PortalSkinConfig>;
    notes: string[];
};

/**
 * Fetches a public page (via allorigins), scans HTML + linked CSS for colors, fonts, icons, and hero imagery,
 * and returns partial skin config. Many sites block embedding or return minimal HTML to bots; notes explain gaps.
 */
export async function importSkinHintsFromSite(siteInput: string): Promise<SkinSiteImportResult> {
    const notes: string[] = [];
    let pageUrl: URL;
    try {
        pageUrl = new URL(siteInput.trim());
    } catch {
        throw new Error('Enter a valid URL including https://');
    }
    if (pageUrl.protocol !== 'http:' && pageUrl.protocol !== 'https:') {
        throw new Error('Only http and https URLs are supported.');
    }

    const html = await fetch(proxiedRawUrl(pageUrl.href), { method: 'GET' }).then(async (r) => {
        if (!r.ok) throw new Error(`Could not read the page (${r.status}).`);
        return r.text();
    });

    if (!html || html.length < 80) {
        throw new Error('The page returned almost no content (it may block automated fetches).');
    }

    const doc = new DOMParser().parseFromString(html, 'text/html');
    const combinedCssText: string[] = [];

    for (const style of Array.from(doc.querySelectorAll('style'))) {
        combinedCssText.push(style.textContent ?? '');
    }

    const sheetHrefs: string[] = [];
    for (const link of Array.from(doc.querySelectorAll('link[rel="stylesheet"][href]'))) {
        const href = link.getAttribute('href');
        if (href) {
            const abs = absUrl(pageUrl, href);
            if (abs) sheetHrefs.push(abs);
        }
    }

    const maxSheets = 6;
    for (const href of sheetHrefs.slice(0, maxSheets)) {
        try {
            const css = await fetch(proxiedRawUrl(href), { method: 'GET' }).then((r) => (r.ok ? r.text() : ''));
            if (css.length > 0) combinedCssText.push(css);
        } catch {
            /* skip blocked sheet */
        }
    }

    const blob = [html, ...combinedCssText].join('\n');
    const hexes = collectHexColors(blob);
    const nonGray = hexes.filter((h) => !isGrayish(h));
    const unique = [...new Set(nonGray.length > 0 ? nonGray : hexes)];

    const config: Partial<PortalSkinConfig> = {};

    const theme = doc.querySelector('meta[name="theme-color"]')?.getAttribute('content')?.trim();
    if (theme && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(theme)) {
        config.primaryColor = expandShortHex(theme);
        notes.push('Used meta theme-color for primary.');
    }

    const ogImage =
        doc.querySelector('meta[property="og:image"]')?.getAttribute('content')?.trim() ??
        doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content')?.trim();
    if (ogImage) {
        const hero = absUrl(pageUrl, ogImage) ?? ogImage;
        config.heroImageUrl = hero;
        notes.push('Set hero image from social preview meta.');
    }

    let icon: string | null | undefined;
    for (const link of Array.from(doc.querySelectorAll('link[rel][href]'))) {
        const rel = (link.getAttribute('rel') ?? '').toLowerCase();
        if (rel.includes('apple-touch-icon') || rel === 'icon' || rel === 'shortcut icon') {
            icon = link.getAttribute('href') ?? undefined;
            if (icon) break;
        }
    }
    if (icon) {
        const logo = absUrl(pageUrl, icon) ?? icon;
        config.logoUrl = logo;
        notes.push('Set logo URL from favicon / touch icon.');
    }

    for (const link of Array.from(doc.querySelectorAll('link[href]'))) {
        const href = link.getAttribute('href');
        if (!href || !href.toLowerCase().includes('fonts.googleapis.com')) continue;
        const abs = absUrl(pageUrl, href);
        if (abs) {
            config.fontStylesheetUrl = abs;
            const fam = abs.match(/[?&]family=([^&]+)/);
            if (fam) {
                const decoded = decodeURIComponent(fam[1].replace(/\+/g, ' '));
                const first = decoded.split('|')[0]?.trim();
                if (first) {
                    config.fontFamilyBody = first;
                    config.fontFamilyHeading = first;
                    notes.push('Detected Google Fonts link; applied first family to body and heading.');
                }
            } else {
                notes.push('Detected Google Fonts stylesheet URL.');
            }
            break;
        }
    }

    if (unique.length > 0) {
        const byLum = [...unique].sort((a, b) => luminance(b) - luminance(a));
        const lightest = byLum[0];
        const darkest = byLum[byLum.length - 1];
        if (!config.backgroundColor) {
            config.backgroundColor = luminance(lightest) > 0.55 ? lightest : expandShortHex('#f8f8f8');
            notes.push('Picked a light color for background (from page palette).');
        }
        if (!config.primaryColor) {
            const mid = byLum[Math.floor(byLum.length / 2)] ?? darkest;
            config.primaryColor = mid;
            notes.push('Picked a mid-tone accent from the page palette as primary.');
        }
        const accentCandidate = byLum.find((h) => h !== config.primaryColor && h !== config.backgroundColor) ?? darkest;
        if (!config.accentColor) {
            config.accentColor = accentCandidate;
            notes.push('Set accent from a second palette color.');
        }
        if (!config.portalTextColor && darkest) {
            config.portalTextColor = luminance(darkest) < 0.4 ? darkest : '#1a1a1a';
        }
        if (!config.portalTextMutedColor) {
            config.portalTextMutedColor = '#4a4a4a';
        }
        if (!config.borderSubtleColor) {
            const midGray = hexes.find((h) => isGrayish(h) && luminance(h) > 0.5);
            if (midGray) config.borderSubtleColor = midGray;
        }
    }

    notes.push(
        'Extraction uses a public CORS proxy; some sites return empty or minimal markup. Review fields and Save when satisfied.'
    );

    return { config, notes };
}
