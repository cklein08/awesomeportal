// Utility to get configuration values at runtime
// This checks window.APP_CONFIG first (runtime), then falls back to build-time env vars

import type { ExternalParams, GridEditConfig, PortalSkinConfig } from '../types';

const GRID_EDIT_STORAGE_KEY = 'awesomeportal_gridEditConfig';
export const SKIN_STORAGE_KEY = 'awesomeportal_skinConfig';

declare global {
    interface Window {
        APP_CONFIG?: {
            ADOBE_CLIENT_ID?: string;
            BUCKET?: string;
        };
        awesomeportalConfig?: {
            externalParams?: ExternalParams;
        };
    }
}

export const getConfig = () => {
    // Runtime config from window.APP_CONFIG (loaded from config.js)
    const runtimeConfig = window.APP_CONFIG || {};

    return {
        ADOBE_CLIENT_ID: runtimeConfig.ADOBE_CLIENT_ID || import.meta.env.VITE_ADOBE_CLIENT_ID || '',
        BUCKET: runtimeConfig.BUCKET || import.meta.env.VITE_BUCKET || '',
    };
};

// Convenience functions for specific config values
export const getAdobeClientId = (): string => getConfig().ADOBE_CLIENT_ID;
export const getBucket = (): string => getConfig().BUCKET;


// Utility to get external parameters from awesomeportalConfig
export const getExternalParams = (): ExternalParams => {
    try {
        const base = window.awesomeportalConfig?.externalParams || {};
        const saved = getGridEditConfig();
        if (!saved) return base;
        return {
            ...base,
            ...(saved.slotBlocks != null && saved.slotBlocks.length > 0 && { slotBlocks: saved.slotBlocks }),
            ...(saved.gridTopContent != null && { gridTopContent: saved.gridTopContent }),
            ...(saved.gridTopBanners != null && saved.gridTopBanners.length > 0 && { gridTopBanners: saved.gridTopBanners }),
            ...(saved.slotHeight != null && { slotHeight: saved.slotHeight }),
            ...(saved.slotWidth != null && { slotWidth: saved.slotWidth }),
        };
    } catch {
        return {};
    }
};

/** Load admin grid edit config from localStorage. */
export const getGridEditConfig = (): GridEditConfig | null => {
    try {
        const raw = localStorage.getItem(GRID_EDIT_STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as GridEditConfig;
    } catch {
        return null;
    }
};

/** Save admin grid edit config to localStorage. */
export const setGridEditConfig = (config: GridEditConfig): void => {
    try {
        localStorage.setItem(GRID_EDIT_STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
        console.warn('Failed to save grid edit config', e);
    }
};

/** Load portal skin config from localStorage. */
export const getSkinConfig = (): PortalSkinConfig | null => {
    try {
        const raw = localStorage.getItem(SKIN_STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as PortalSkinConfig;
    } catch {
        return null;
    }
};

/** Save portal skin config to localStorage. */
export const setSkinConfig = (config: PortalSkinConfig): void => {
    try {
        localStorage.setItem(SKIN_STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
        console.warn('Failed to save skin config', e);
    }
};

/** Clear portal skin config from localStorage (reset to defaults). */
export const clearSkinConfig = (): void => {
    try {
        localStorage.removeItem(SKIN_STORAGE_KEY);
    } catch (e) {
        console.warn('Failed to clear skin config', e);
    }
}; 