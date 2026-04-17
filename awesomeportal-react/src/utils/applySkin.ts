/**
 * Applies portal skin config to the document: CSS variable overrides, optional Google Fonts,
 * stylesheet URL, and font file URLs / uploaded font data URLs.
 * Call on app init and after user saves skin in the editor.
 */

import { getSkinConfig } from './config';
import type { PortalSkinConfig } from '../types';

const GOOGLE_FONTS_LINK_ID = 'awesomeportal-skin-fonts';
const SKIN_FONT_STYLESHEET_ID = 'awesomeportal-skin-font-stylesheet';
const SKIN_FONTFACE_STYLE_ID = 'awesomeportal-skin-fontface';

const PORTAL_SKIN_BODY_FAMILY = 'PortalSkinBody';
const PORTAL_SKIN_HEADING_FAMILY = 'PortalSkinHeading';

/** CSS variables we override from skin (skin key -> CSS custom property name) */
const SKIN_TO_CSS_VARS: Array<{ key: keyof PortalSkinConfig; varName: string }> = [
    { key: 'primaryColor', varName: '--primary-color' },
    { key: 'backgroundColor', varName: '--background-color' },
    { key: 'accentColor', varName: '--link-color' },
    { key: 'accentColor', varName: '--focus-ring-color' },
    { key: 'accentColor', varName: '--highlight-background' },
    { key: 'fontFamilyBody', varName: '--font-body' },
    { key: 'fontFamilyHeading', varName: '--font-heading' },
];

/**
 * Removes skin overrides from document.documentElement and any skin-injected link/style nodes.
 * Used when resetting to defaults.
 */
const EXTRA_SKIN_VARS = [
    '--primary-color-hover',
    '--primary-color-active',
    '--primary-color-disabled',
] as const;

const PORTAL_CHROME_VARS = [
    '--portal-chrome-bg',
    '--portal-panel-bg',
    '--portal-elevated-bg',
    '--portal-search-bg',
    '--portal-search-fg',
    '--portal-border',
    '--portal-text',
    '--portal-text-muted',
] as const;

function clearSkinOverrides(): void {
    const root = document.documentElement;
    const varNames = new Set(SKIN_TO_CSS_VARS.map(({ varName }) => varName));
    varNames.forEach((varName) => root.style.removeProperty(varName));
    EXTRA_SKIN_VARS.forEach((varName) => root.style.removeProperty(varName));
    PORTAL_CHROME_VARS.forEach((varName) => root.style.removeProperty(varName));
    [GOOGLE_FONTS_LINK_ID, SKIN_FONT_STYLESHEET_ID, SKIN_FONTFACE_STYLE_ID].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });
}

/**
 * Injects a stylesheet link for the given URL (e.g. custom font CSS).
 */
function injectStylesheet(url: string): void {
    let link = document.getElementById(SKIN_FONT_STYLESHEET_ID) as HTMLLinkElement | null;
    if (link) {
        link.href = url;
        return;
    }
    link = document.createElement('link');
    link.id = SKIN_FONT_STYLESHEET_ID;
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
}

/**
 * Escapes a string for safe use inside CSS url("...").
 */
function escapeForCssUrl(url: string): string {
    return url.replace(/\\/g, '\\\\').replace(/"/g, '\\22');
}

/**
 * Returns a format() hint for @font-face from a data URL MIME or file URL extension.
 */
function fontFormatHint(url: string): string {
    if (url.startsWith('data:')) {
        const mime = url.slice(0, url.indexOf(';')).replace('data:', '').toLowerCase();
        if (mime.includes('woff2')) return " format('woff2')";
        if (mime.includes('woff')) return " format('woff')";
        if (mime.includes('ttf') || mime.includes('truetype')) return " format('truetype')";
    } else {
        const lower = url.toLowerCase();
        if (lower.endsWith('.woff2')) return " format('woff2')";
        if (lower.endsWith('.woff')) return " format('woff')";
        if (lower.endsWith('.ttf') || lower.endsWith('.otf')) return " format('truetype')";
    }
    return '';
}

/**
 * Injects a single <style> with @font-face rules for body and/or heading.
 * Handles both font file URLs and uploaded font data URLs.
 */
function injectFontFace(config: {
    fontFileUrlBody?: string;
    fontFileUrlHeading?: string;
    fontBodyDataUrl?: string;
    fontHeadingDataUrl?: string;
}): void {
    const rules: string[] = [];
    if (config.fontFileUrlBody || config.fontBodyDataUrl) {
        const url = config.fontBodyDataUrl ?? config.fontFileUrlBody ?? '';
        const safe = escapeForCssUrl(url);
        const format = fontFormatHint(url);
        rules.push(`@font-face{font-family:'${PORTAL_SKIN_BODY_FAMILY}';src:url("${safe}")${format};}`);
    }
    if (config.fontFileUrlHeading || config.fontHeadingDataUrl) {
        const url = config.fontHeadingDataUrl ?? config.fontFileUrlHeading ?? '';
        const safe = escapeForCssUrl(url);
        const format = fontFormatHint(url);
        rules.push(`@font-face{font-family:'${PORTAL_SKIN_HEADING_FAMILY}';src:url("${safe}")${format};}`);
    }
    let styleEl = document.getElementById(SKIN_FONTFACE_STYLE_ID) as HTMLStyleElement | null;
    if (rules.length === 0) {
        if (styleEl) styleEl.remove();
        return;
    }
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = SKIN_FONTFACE_STYLE_ID;
        document.head.appendChild(styleEl);
    }
    styleEl.textContent = rules.join('\n');
}

/**
 * Injects a Google Fonts stylesheet for the given font families.
 * Replaces any existing skin fonts link.
 */
function injectGoogleFonts(fontFamilies: string[]): void {
    const existing = document.getElementById(GOOGLE_FONTS_LINK_ID);
    if (existing) existing.remove();

    const trimmed = fontFamilies.map((f) => f.trim()).filter(Boolean);
    if (trimmed.length === 0) return;

    const familyParam = trimmed
        .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}`)
        .join('&');
    const href = `https://fonts.googleapis.com/css2?${familyParam}&display=swap`;

    const link = document.createElement('link');
    link.id = GOOGLE_FONTS_LINK_ID;
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
}

/**
 * Applies the given skin config (or loads from localStorage if not passed).
 * If config is null or empty, clears overrides so defaults apply.
 * Font priority: font file URL or data URL overrides family name (Google Fonts or stylesheet name).
 */
export function applySkin(config: PortalSkinConfig | null = getSkinConfig()): void {
    const root = document.documentElement;

    if (!config || Object.keys(config).length === 0) {
        clearSkinOverrides();
        return;
    }

    // Apply color CSS variables (only for keys present in config)
    const accentColor = config.accentColor;
    SKIN_TO_CSS_VARS.forEach(({ key, varName }) => {
        if (key === 'fontFamilyBody' || key === 'fontFamilyHeading') return;
        const value = key === 'accentColor' ? accentColor : config[key];
        const strValue = typeof value === 'string' ? value : undefined;
        if (strValue) root.style.setProperty(varName, strValue);
    });

    if (config.primaryColorHover?.trim()) {
        root.style.setProperty('--primary-color-hover', config.primaryColorHover.trim());
    }
    if (config.primaryColorActive?.trim()) {
        root.style.setProperty('--primary-color-active', config.primaryColorActive.trim());
    }
    if (config.primaryColorDisabled?.trim()) {
        root.style.setProperty('--primary-color-disabled', config.primaryColorDisabled.trim());
    }

    // Stylesheet URL: inject link so custom font CSS is loaded
    const fontStylesheetUrl = config.fontStylesheetUrl?.trim();
    if (fontStylesheetUrl) {
        injectStylesheet(fontStylesheetUrl);
    } else {
        const sheetEl = document.getElementById(SKIN_FONT_STYLESHEET_ID);
        if (sheetEl) sheetEl.remove();
    }

    // Font file URL or data URL: inject @font-face and set --font-body / --font-heading
    const hasBodyFontFile = Boolean(config.fontFileUrlBody?.trim() || config.fontBodyDataUrl);
    const hasHeadingFontFile = Boolean(config.fontFileUrlHeading?.trim() || config.fontHeadingDataUrl);

    injectFontFace({
        fontFileUrlBody: config.fontFileUrlBody?.trim(),
        fontFileUrlHeading: config.fontFileUrlHeading?.trim(),
        fontBodyDataUrl: config.fontBodyDataUrl,
        fontHeadingDataUrl: config.fontHeadingDataUrl
    });

    if (hasBodyFontFile) root.style.setProperty('--font-body', `'${PORTAL_SKIN_BODY_FAMILY}'`);
    if (hasHeadingFontFile) root.style.setProperty('--font-heading', `'${PORTAL_SKIN_HEADING_FAMILY}'`);

    // When not using file/data URL for a slot, use fontFamilyBody/fontFamilyHeading (Google Fonts or stylesheet name)
    const fontFamilies: string[] = [];
    if (!hasBodyFontFile && config.fontFamilyBody?.trim()) fontFamilies.push(config.fontFamilyBody.trim());
    if (!hasHeadingFontFile && config.fontFamilyHeading?.trim()) fontFamilies.push(config.fontFamilyHeading.trim());

    if (fontFamilies.length > 0) {
        injectGoogleFonts([...new Set(fontFamilies)]);
    } else {
        const existing = document.getElementById(GOOGLE_FONTS_LINK_ID);
        if (existing) existing.remove();
    }
    if (!hasBodyFontFile && config.fontFamilyBody?.trim()) {
        root.style.setProperty('--font-body', `'${config.fontFamilyBody.trim()}'`);
    }
    if (!hasHeadingFontFile && config.fontFamilyHeading?.trim()) {
        root.style.setProperty('--font-heading', `'${config.fontFamilyHeading.trim()}'`);
    }

    // Portal chrome (panels, search strip, borders) — optional keys
    const chromeBg = config.pageBackgroundColor?.trim() || config.backgroundColor?.trim();
    if (chromeBg) {
        root.style.setProperty('--portal-chrome-bg', chromeBg);
    }
    if (config.panelBackgroundColor?.trim()) {
        root.style.setProperty('--portal-panel-bg', config.panelBackgroundColor.trim());
    }
    if (config.elevatedSurfaceColor?.trim()) {
        root.style.setProperty('--portal-elevated-bg', config.elevatedSurfaceColor.trim());
    }
    if (config.searchBarBackgroundColor?.trim()) {
        root.style.setProperty('--portal-search-bg', config.searchBarBackgroundColor.trim());
    }
    if (config.searchBarForegroundColor?.trim()) {
        root.style.setProperty('--portal-search-fg', config.searchBarForegroundColor.trim());
    }
    if (config.borderSubtleColor?.trim()) {
        root.style.setProperty('--portal-border', config.borderSubtleColor.trim());
    }
    if (config.portalTextColor?.trim()) {
        root.style.setProperty('--portal-text', config.portalTextColor.trim());
    }
    if (config.portalTextMutedColor?.trim()) {
        root.style.setProperty('--portal-text-muted', config.portalTextMutedColor.trim());
    }
}
