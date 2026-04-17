import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAppConfig } from '../hooks/useAppConfig';
import type { PortalSkinConfig } from '../types';
import { applyHeinekenGridLayouts, HEINEKEN_SKIN } from '../constants/heinekenDemoPreset';
import './SkinEditorModal.css';
import '../pages/GridEdit.css';

interface SkinEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** When true, render inline (no portal or dimmed overlay). Used on Admin → Skin tab. */
    embedded?: boolean;
}

const DEFAULT_PRIMARY = '#ed0000';
const DEFAULT_BACKGROUND = '#f8f8f8';
const DEFAULT_ACCENT = '#582ddc';

const FONT_DATA_URL_SIZE_WARN = 2 * 1024 * 1024; // 2 MB

function toHex(color: string): string {
    if (!color) return '';
    if (/^#[0-9A-Fa-f]{3,8}$/.test(color)) return color;
    const match = color.match(/\d+/g);
    if (match && match.length >= 3) {
    const r = Number.parseInt(match[0], 10).toString(16).padStart(2, '0');
    const g = Number.parseInt(match[1], 10).toString(16).padStart(2, '0');
    const b = Number.parseInt(match[2], 10).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
    }
    return color;
}

const SkinEditorModal: React.FC<SkinEditorModalProps> = ({ isOpen, onClose, embedded = false }) => {
    const { skinConfig, setSkinConfig } = useAppConfig();
    const [logoUrl, setLogoUrl] = useState(skinConfig?.logoUrl ?? '');
    const [primaryColor, setPrimaryColor] = useState(skinConfig?.primaryColor ?? DEFAULT_PRIMARY);
    const [backgroundColor, setBackgroundColor] = useState(skinConfig?.backgroundColor ?? DEFAULT_BACKGROUND);
    const [accentColor, setAccentColor] = useState(skinConfig?.accentColor ?? DEFAULT_ACCENT);
    const [fontFamilyBody, setFontFamilyBody] = useState(skinConfig?.fontFamilyBody ?? '');
    const [fontFamilyHeading, setFontFamilyHeading] = useState(skinConfig?.fontFamilyHeading ?? '');
    const [fontStylesheetUrl, setFontStylesheetUrl] = useState(skinConfig?.fontStylesheetUrl ?? '');
    const [fontFileUrlBody, setFontFileUrlBody] = useState(skinConfig?.fontFileUrlBody ?? '');
    const [fontFileUrlHeading, setFontFileUrlHeading] = useState(skinConfig?.fontFileUrlHeading ?? '');
    const [fontBodyDataUrl, setFontBodyDataUrl] = useState(skinConfig?.fontBodyDataUrl ?? '');
    const [fontHeadingDataUrl, setFontHeadingDataUrl] = useState(skinConfig?.fontHeadingDataUrl ?? '');
    const [bodyFileName, setBodyFileName] = useState('');
    const [headingFileName, setHeadingFileName] = useState('');
    const [heroImageUrl, setHeroImageUrl] = useState(skinConfig?.heroImageUrl ?? '');
    const [pageBackgroundColor, setPageBackgroundColor] = useState(skinConfig?.pageBackgroundColor ?? '');
    const [panelBackgroundColor, setPanelBackgroundColor] = useState(skinConfig?.panelBackgroundColor ?? '');
    const [elevatedSurfaceColor, setElevatedSurfaceColor] = useState(skinConfig?.elevatedSurfaceColor ?? '');
    const [searchBarBackgroundColor, setSearchBarBackgroundColor] = useState(skinConfig?.searchBarBackgroundColor ?? '');
    const [searchBarForegroundColor, setSearchBarForegroundColor] = useState(skinConfig?.searchBarForegroundColor ?? '');
    const [borderSubtleColor, setBorderSubtleColor] = useState(skinConfig?.borderSubtleColor ?? '');
    const [portalTextColor, setPortalTextColor] = useState(skinConfig?.portalTextColor ?? '');
    const [portalTextMutedColor, setPortalTextMutedColor] = useState(skinConfig?.portalTextMutedColor ?? '');

    const syncFromConfig = useCallback(() => {
        if (skinConfig) {
            setLogoUrl(skinConfig.logoUrl ?? '');
            setPrimaryColor(skinConfig.primaryColor ?? DEFAULT_PRIMARY);
            setBackgroundColor(skinConfig.backgroundColor ?? DEFAULT_BACKGROUND);
            setAccentColor(skinConfig.accentColor ?? DEFAULT_ACCENT);
            setFontFamilyBody(skinConfig.fontFamilyBody ?? '');
            setFontFamilyHeading(skinConfig.fontFamilyHeading ?? '');
            setFontStylesheetUrl(skinConfig.fontStylesheetUrl ?? '');
            setFontFileUrlBody(skinConfig.fontFileUrlBody ?? '');
            setFontFileUrlHeading(skinConfig.fontFileUrlHeading ?? '');
            setFontBodyDataUrl(skinConfig.fontBodyDataUrl ?? '');
            setFontHeadingDataUrl(skinConfig.fontHeadingDataUrl ?? '');
            setBodyFileName(skinConfig.fontBodyDataUrl ? 'Custom font uploaded' : '');
            setHeadingFileName(skinConfig.fontHeadingDataUrl ? 'Custom font uploaded' : '');
            setHeroImageUrl(skinConfig.heroImageUrl ?? '');
            setPageBackgroundColor(skinConfig.pageBackgroundColor ?? '');
            setPanelBackgroundColor(skinConfig.panelBackgroundColor ?? '');
            setElevatedSurfaceColor(skinConfig.elevatedSurfaceColor ?? '');
            setSearchBarBackgroundColor(skinConfig.searchBarBackgroundColor ?? '');
            setSearchBarForegroundColor(skinConfig.searchBarForegroundColor ?? '');
            setBorderSubtleColor(skinConfig.borderSubtleColor ?? '');
            setPortalTextColor(skinConfig.portalTextColor ?? '');
            setPortalTextMutedColor(skinConfig.portalTextMutedColor ?? '');
        } else {
            setLogoUrl('');
            setPrimaryColor(DEFAULT_PRIMARY);
            setBackgroundColor(DEFAULT_BACKGROUND);
            setAccentColor(DEFAULT_ACCENT);
            setFontFamilyBody('');
            setFontFamilyHeading('');
            setFontStylesheetUrl('');
            setFontFileUrlBody('');
            setFontFileUrlHeading('');
            setFontBodyDataUrl('');
            setFontHeadingDataUrl('');
            setBodyFileName('');
            setHeadingFileName('');
            setHeroImageUrl('');
            setPageBackgroundColor('');
            setPanelBackgroundColor('');
            setElevatedSurfaceColor('');
            setSearchBarBackgroundColor('');
            setSearchBarForegroundColor('');
            setBorderSubtleColor('');
            setPortalTextColor('');
            setPortalTextMutedColor('');
        }
    }, [skinConfig]);

    useEffect(() => {
        if (isOpen) syncFromConfig();
    }, [isOpen, syncFromConfig]);

    const handleEscape = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                onClose();
            }
        },
        [onClose]
    );

    useEffect(() => {
        if (!isOpen || embedded) return;
        document.addEventListener('keydown', handleEscape, { capture: true });
        return () => document.removeEventListener('keydown', handleEscape, { capture: true });
    }, [isOpen, embedded, handleEscape]);

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    const handleSave = () => {
        const config: PortalSkinConfig = {};
        if (logoUrl.trim()) config.logoUrl = logoUrl.trim();
        if (primaryColor) config.primaryColor = toHex(primaryColor) || primaryColor;
        if (backgroundColor) config.backgroundColor = toHex(backgroundColor) || backgroundColor;
        if (accentColor) config.accentColor = toHex(accentColor) || accentColor;
        if (fontFamilyBody.trim()) config.fontFamilyBody = fontFamilyBody.trim();
        if (fontFamilyHeading.trim()) config.fontFamilyHeading = fontFamilyHeading.trim();
        if (fontStylesheetUrl.trim()) config.fontStylesheetUrl = fontStylesheetUrl.trim();
        if (fontFileUrlBody.trim()) config.fontFileUrlBody = fontFileUrlBody.trim();
        if (fontFileUrlHeading.trim()) config.fontFileUrlHeading = fontFileUrlHeading.trim();
        if (fontBodyDataUrl) config.fontBodyDataUrl = fontBodyDataUrl;
        if (fontHeadingDataUrl) config.fontHeadingDataUrl = fontHeadingDataUrl;
        if (heroImageUrl.trim()) config.heroImageUrl = heroImageUrl.trim();
        if (pageBackgroundColor.trim()) config.pageBackgroundColor = toHex(pageBackgroundColor) || pageBackgroundColor.trim();
        if (panelBackgroundColor.trim()) config.panelBackgroundColor = toHex(panelBackgroundColor) || panelBackgroundColor.trim();
        if (elevatedSurfaceColor.trim()) config.elevatedSurfaceColor = toHex(elevatedSurfaceColor) || elevatedSurfaceColor.trim();
        if (searchBarBackgroundColor.trim()) config.searchBarBackgroundColor = toHex(searchBarBackgroundColor) || searchBarBackgroundColor.trim();
        if (searchBarForegroundColor.trim()) config.searchBarForegroundColor = searchBarForegroundColor.trim();
        if (borderSubtleColor.trim()) config.borderSubtleColor = toHex(borderSubtleColor) || borderSubtleColor.trim();
        if (portalTextColor.trim()) config.portalTextColor = toHex(portalTextColor) || portalTextColor.trim();
        if (portalTextMutedColor.trim()) config.portalTextMutedColor = toHex(portalTextMutedColor) || portalTextMutedColor.trim();
        if (skinConfig?.primaryColorHover?.trim()) config.primaryColorHover = skinConfig.primaryColorHover.trim();
        if (skinConfig?.primaryColorActive?.trim()) config.primaryColorActive = skinConfig.primaryColorActive.trim();
        if (skinConfig?.primaryColorDisabled?.trim()) config.primaryColorDisabled = skinConfig.primaryColorDisabled.trim();
        setSkinConfig(Object.keys(config).length > 0 ? config : null);
        if (!embedded) onClose();
    };

    const dataUrlWithFontMime = (dataUrl: string, filename: string): string => {
        const lower = filename.toLowerCase();
        let mime = 'font/ttf';
        if (lower.endsWith('.woff2')) mime = 'font/woff2';
        else if (lower.endsWith('.woff')) mime = 'font/woff';
        const re = /^data:[^;]+;/;
        if (re.test(dataUrl)) return dataUrl.replace(re, `data:${mime};`);
        return dataUrl;
    };

    const handleBodyFontFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setBodyFileName(file.name);
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            if (typeof result === 'string') setFontBodyDataUrl(dataUrlWithFontMime(result, file.name));
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleHeadingFontFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setHeadingFileName(file.name);
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            if (typeof result === 'string') setFontHeadingDataUrl(dataUrlWithFontMime(result, file.name));
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleReset = () => {
        setSkinConfig(null);
        setLogoUrl('');
        setPrimaryColor(DEFAULT_PRIMARY);
        setBackgroundColor(DEFAULT_BACKGROUND);
        setAccentColor(DEFAULT_ACCENT);
        setFontFamilyBody('');
        setFontFamilyHeading('');
        setFontStylesheetUrl('');
        setFontFileUrlBody('');
        setFontFileUrlHeading('');
        setFontBodyDataUrl('');
        setFontHeadingDataUrl('');
        setBodyFileName('');
        setHeadingFileName('');
        setHeroImageUrl('');
        setPageBackgroundColor('');
        setPanelBackgroundColor('');
        setElevatedSurfaceColor('');
        setSearchBarBackgroundColor('');
        setSearchBarForegroundColor('');
        setBorderSubtleColor('');
        setPortalTextColor('');
        setPortalTextMutedColor('');
        if (!embedded) onClose();
    };

    function skinFields(): React.ReactNode {
        return (
            <>
                    <div className="skin-editor-field">
                        <label htmlFor="skin-logo">Logo URL</label>
                        <input
                            id="skin-logo"
                            type="url"
                            value={logoUrl}
                            onChange={(e) => setLogoUrl(e.target.value)}
                            placeholder="https://example.com/logo.png"
                        />
                    </div>
                    <div className="skin-editor-field">
                        <label htmlFor="skin-primary">Primary color</label>
                        <div className="skin-editor-color-row">
                            <input
                                id="skin-primary"
                                type="color"
                                value={primaryColor.startsWith('#') ? primaryColor : DEFAULT_PRIMARY}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                className="skin-editor-color-input"
                            />
                            <input
                                type="text"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                placeholder="#ed0000"
                                className="skin-editor-color-hex"
                            />
                        </div>
                    </div>
                    <div className="skin-editor-field">
                        <label htmlFor="skin-background">Background color</label>
                        <div className="skin-editor-color-row">
                            <input
                                id="skin-background"
                                type="color"
                                value={backgroundColor.startsWith('#') ? backgroundColor : DEFAULT_BACKGROUND}
                                onChange={(e) => setBackgroundColor(e.target.value)}
                                className="skin-editor-color-input"
                            />
                            <input
                                type="text"
                                value={backgroundColor}
                                onChange={(e) => setBackgroundColor(e.target.value)}
                                placeholder="#f8f8f8"
                                className="skin-editor-color-hex"
                            />
                        </div>
                    </div>
                    <div className="skin-editor-field">
                        <label htmlFor="skin-accent">Accent / link color</label>
                        <div className="skin-editor-color-row">
                            <input
                                id="skin-accent"
                                type="color"
                                value={accentColor.startsWith('#') ? accentColor : DEFAULT_ACCENT}
                                onChange={(e) => setAccentColor(e.target.value)}
                                className="skin-editor-color-input"
                            />
                            <input
                                type="text"
                                value={accentColor}
                                onChange={(e) => setAccentColor(e.target.value)}
                                placeholder="#582ddc"
                                className="skin-editor-color-hex"
                            />
                        </div>
                    </div>
                    <div className="skin-editor-field">
                        <label htmlFor="skin-font-body">Body font (Google Font name or family from stylesheet)</label>
                        <input
                            id="skin-font-body"
                            type="text"
                            value={fontFamilyBody}
                            onChange={(e) => setFontFamilyBody(e.target.value)}
                            placeholder="e.g. Source Sans 3:wght@400;600"
                        />
                    </div>
                    <div className="skin-editor-field">
                        <label htmlFor="skin-font-heading">Heading font (Google Font name or family from stylesheet)</label>
                        <input
                            id="skin-font-heading"
                            type="text"
                            value={fontFamilyHeading}
                            onChange={(e) => setFontFamilyHeading(e.target.value)}
                            placeholder="e.g. Barlow Semi Condensed:wght@500;700"
                        />
                    </div>
                    <div className="skin-editor-field">
                        <label htmlFor="skin-font-stylesheet">Font stylesheet URL</label>
                        <input
                            id="skin-font-stylesheet"
                            type="url"
                            value={fontStylesheetUrl}
                            onChange={(e) => setFontStylesheetUrl(e.target.value)}
                            placeholder="https://fonts.googleapis.com/css2?family=... or any CSS URL"
                        />
                    </div>
                    <div className="skin-editor-field">
                        <label htmlFor="skin-font-file-body">Body font file URL</label>
                        <input
                            id="skin-font-file-body"
                            type="url"
                            value={fontFileUrlBody}
                            onChange={(e) => setFontFileUrlBody(e.target.value)}
                            placeholder="https://example.com/font.woff2"
                        />
                    </div>
                    <div className="skin-editor-field">
                        <label htmlFor="skin-font-file-heading">Heading font file URL</label>
                        <input
                            id="skin-font-file-heading"
                            type="url"
                            value={fontFileUrlHeading}
                            onChange={(e) => setFontFileUrlHeading(e.target.value)}
                            placeholder="https://example.com/font.woff2"
                        />
                    </div>
                    <div className="skin-editor-field">
                        <label htmlFor="skin-upload-body">Upload body font (TTF, WOFF2, WOFF)</label>
                        <div className="skin-editor-file-row">
                            <input
                                id="skin-upload-body"
                                type="file"
                                accept=".ttf,.woff2,.woff"
                                onChange={handleBodyFontFile}
                                className="skin-editor-file-input"
                            />
                            {bodyFileName && (
                                <span className="skin-editor-file-name">{bodyFileName}</span>
                            )}
                            {fontBodyDataUrl && (
                                <button type="button" className="skin-editor-clear-file" onClick={() => { setFontBodyDataUrl(''); setBodyFileName(''); }}>
                                    Clear
                                </button>
                            )}
                        </div>
                        {fontBodyDataUrl.length > FONT_DATA_URL_SIZE_WARN && (
                            <p className="skin-editor-field-note">Large file may not save (localStorage limit ~5MB).</p>
                        )}
                    </div>
                    <div className="skin-editor-field">
                        <label htmlFor="skin-upload-heading">Upload heading font (TTF, WOFF2, WOFF)</label>
                        <div className="skin-editor-file-row">
                            <input
                                id="skin-upload-heading"
                                type="file"
                                accept=".ttf,.woff2,.woff"
                                onChange={handleHeadingFontFile}
                                className="skin-editor-file-input"
                            />
                            {headingFileName && (
                                <span className="skin-editor-file-name">{headingFileName}</span>
                            )}
                            {fontHeadingDataUrl && (
                                <button type="button" className="skin-editor-clear-file" onClick={() => { setFontHeadingDataUrl(''); setHeadingFileName(''); }}>
                                    Clear
                                </button>
                            )}
                        </div>
                        {fontHeadingDataUrl.length > FONT_DATA_URL_SIZE_WARN && (
                            <p className="skin-editor-field-note">Large file may not save (localStorage limit ~5MB).</p>
                        )}
                    </div>
                    <div className="skin-editor-field">
                        <label htmlFor="skin-hero">Hero / background image URL</label>
                        <input
                            id="skin-hero"
                            type="url"
                            value={heroImageUrl}
                            onChange={(e) => setHeroImageUrl(e.target.value)}
                            placeholder="https://example.com/hero.jpg"
                        />
                    </div>
                    <details className="skin-editor-advanced">
                        <summary className="skin-editor-advanced-summary">Panels, search strip & text</summary>
                        <p className="skin-editor-field-note">Optional. Page background overrides the main canvas only; leave blank to use Background color for the full page.</p>
                        <div className="skin-editor-field">
                            <label htmlFor="skin-page-bg">Page background (optional)</label>
                            <input
                                id="skin-page-bg"
                                type="text"
                                value={pageBackgroundColor}
                                onChange={(e) => setPageBackgroundColor(e.target.value)}
                                placeholder="#f2ede4"
                            />
                        </div>
                        <div className="skin-editor-field">
                            <label htmlFor="skin-panel-bg">Side panels (nav, facets, entitlements)</label>
                            <input
                                id="skin-panel-bg"
                                type="text"
                                value={panelBackgroundColor}
                                onChange={(e) => setPanelBackgroundColor(e.target.value)}
                                placeholder="#e4dfd4"
                            />
                        </div>
                        <div className="skin-editor-field">
                            <label htmlFor="skin-elevated">Cards / elevated surfaces</label>
                            <input
                                id="skin-elevated"
                                type="text"
                                value={elevatedSurfaceColor}
                                onChange={(e) => setElevatedSurfaceColor(e.target.value)}
                                placeholder="#ffffff"
                            />
                        </div>
                        <div className="skin-editor-field">
                            <label htmlFor="skin-search-bg">Search strip background</label>
                            <input
                                id="skin-search-bg"
                                type="text"
                                value={searchBarBackgroundColor}
                                onChange={(e) => setSearchBarBackgroundColor(e.target.value)}
                                placeholder="#00381a"
                            />
                        </div>
                        <div className="skin-editor-field">
                            <label htmlFor="skin-search-fg">Search strip foreground (icons / links)</label>
                            <input
                                id="skin-search-fg"
                                type="text"
                                value={searchBarForegroundColor}
                                onChange={(e) => setSearchBarForegroundColor(e.target.value)}
                                placeholder="rgba(255,255,255,0.92)"
                            />
                        </div>
                        <div className="skin-editor-field">
                            <label htmlFor="skin-border">Hairline borders</label>
                            <input
                                id="skin-border"
                                type="text"
                                value={borderSubtleColor}
                                onChange={(e) => setBorderSubtleColor(e.target.value)}
                                placeholder="#cfc8ba"
                            />
                        </div>
                        <div className="skin-editor-field">
                            <label htmlFor="skin-portal-text">Panel text</label>
                            <input
                                id="skin-portal-text"
                                type="text"
                                value={portalTextColor}
                                onChange={(e) => setPortalTextColor(e.target.value)}
                                placeholder="#1a1a1a"
                            />
                        </div>
                        <div className="skin-editor-field">
                            <label htmlFor="skin-portal-muted">Muted text</label>
                            <input
                                id="skin-portal-muted"
                                type="text"
                                value={portalTextMutedColor}
                                onChange={(e) => setPortalTextMutedColor(e.target.value)}
                                placeholder="#4a4a4a"
                            />
                        </div>
                    </details>
            </>
        );
    }

    if (!isOpen) return null;

    const devDemoPresets =
        import.meta.env.DEV ? (
            <div className="skin-editor-demo-presets">
                <span className="skin-editor-demo-presets-label">Local demos</span>
                <button
                    type="button"
                    className="skin-editor-demo-preset-btn"
                    onClick={() => {
                        applyHeinekenGridLayouts();
                        setSkinConfig(HEINEKEN_SKIN);
                        onClose();
                        window.location.reload();
                    }}
                >
                    Apply Heineken-style skin
                </button>
            </div>
        ) : null;

    if (embedded) {
        return (
            <div className="skin-editor-form-root grid-edit-form-root">
                {devDemoPresets}
                <section className="grid-edit-section">
                    <h2>Portal skin</h2>
                    <p className="grid-edit-hint">
                        Colors, logo, fonts, and optional panel and search strip styling. Changes apply after Save.
                    </p>
                    {skinFields()}
                </section>
                <div className="grid-edit-footer">
                    <button type="button" className="grid-edit-btn secondary" onClick={handleReset}>
                        Reset to default
                    </button>
                    <button type="button" className="grid-edit-btn primary" onClick={handleSave}>
                        Save changes
                    </button>
                </div>
            </div>
        );
    }

    const dialog = (
        <div
            className="skin-editor-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="skin-editor-modal-title"
        >
            <div className="skin-editor-modal-header">
                <h3 id="skin-editor-modal-title" className="skin-editor-modal-title">
                    Customize portal
                </h3>
                <button type="button" className="skin-editor-modal-close" onClick={onClose} aria-label="Close">
                    ×
                </button>
            </div>
            {devDemoPresets}
            <div className="skin-editor-modal-body">{skinFields()}</div>
            <div className="skin-editor-modal-footer">
                <button type="button" className="skin-editor-btn skin-editor-btn-secondary" onClick={handleReset}>
                    Reset to default
                </button>
                <button type="button" className="skin-editor-btn skin-editor-btn-primary" onClick={handleSave}>
                    Save
                </button>
            </div>
        </div>
    );

    return createPortal(
        <div className="skin-editor-modal-overlay portal-modal" onClick={handleOverlayClick} role="presentation">
            {dialog}
        </div>,
        document.body
    );
};

export default SkinEditorModal;
