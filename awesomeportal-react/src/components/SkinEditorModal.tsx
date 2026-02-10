import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAppConfig } from '../hooks/useAppConfig';
import type { PortalSkinConfig } from '../types';
import './SkinEditorModal.css';

interface SkinEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
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

const SkinEditorModal: React.FC<SkinEditorModalProps> = ({ isOpen, onClose }) => {
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
        if (!isOpen) return;
        document.addEventListener('keydown', handleEscape, { capture: true });
        return () => document.removeEventListener('keydown', handleEscape, { capture: true });
    }, [isOpen, handleEscape]);

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
        setSkinConfig(Object.keys(config).length > 0 ? config : null);
        onClose();
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
        onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="skin-editor-modal-overlay portal-modal" onClick={handleOverlayClick} role="presentation">
            <div className="skin-editor-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="skin-editor-modal-title">
                <div className="skin-editor-modal-header">
                    <h3 id="skin-editor-modal-title" className="skin-editor-modal-title">Customize portal</h3>
                    <button type="button" className="skin-editor-modal-close" onClick={onClose} aria-label="Close">
                        ×
                    </button>
                </div>
                <div className="skin-editor-modal-body">
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
                            placeholder="e.g. Open Sans, sans-serif"
                        />
                    </div>
                    <div className="skin-editor-field">
                        <label htmlFor="skin-font-heading">Heading font (Google Font name or family from stylesheet)</label>
                        <input
                            id="skin-font-heading"
                            type="text"
                            value={fontFamilyHeading}
                            onChange={(e) => setFontFamilyHeading(e.target.value)}
                            placeholder="e.g. Roboto, sans-serif"
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
                </div>
                <div className="skin-editor-modal-footer">
                    <button type="button" className="skin-editor-btn skin-editor-btn-secondary" onClick={handleReset}>
                        Reset to default
                    </button>
                    <button type="button" className="skin-editor-btn skin-editor-btn-primary" onClick={handleSave}>
                        Save
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default SkinEditorModal;
