// Utility to get configuration values at runtime
// This checks window.APP_CONFIG first (runtime), then falls back to build-time env vars

import { PORTAL_PERSONA_ORDER } from '../constants/portalPersonas';
import type { AppBuilderDropIn, EntitlementPayload, ExternalParams, GridEditConfig, PortalPersonaId, PortalSkinConfig } from '../types';
import { normalizePersistedImageUrl } from './pathUtils';

function sanitizeGridEditConfig(config: GridEditConfig): GridEditConfig {
    if (!config.gridTopBanners?.length) {
        return { ...config };
    }
    return {
        ...config,
        gridTopBanners: config.gridTopBanners.map((b) => ({
            ...b,
            url: normalizePersistedImageUrl(b.url ?? ''),
        })),
    };
}

function sanitizePortalSkinConfig(config: PortalSkinConfig): PortalSkinConfig {
    const next: PortalSkinConfig = { ...config };
    const urlKeys: (keyof PortalSkinConfig)[] = [
        'logoUrl',
        'heroImageUrl',
        'fontStylesheetUrl',
        'fontFileUrlBody',
        'fontFileUrlHeading',
    ];
    for (const key of urlKeys) {
        const v = next[key];
        if (typeof v === 'string' && v.length > 0) {
            (next as Record<string, string>)[key as string] = normalizePersistedImageUrl(v);
        }
    }
    return next;
}

function persistRoleGridsIfChanged(all: RoleGridsState): void {
    localStorage.setItem(ROLE_GRIDS_STORAGE_KEY, JSON.stringify(all));
}

/** Normalize image URLs in every saved persona layout (one pass per app load). */
export function sanitizeAllStoredRoleGridsImageUrls(): void {
    migrateLegacyGridToRoleGrids();
    try {
        const raw = localStorage.getItem(ROLE_GRIDS_STORAGE_KEY);
        if (!raw) return;
        const all = JSON.parse(raw) as RoleGridsState;
        let changed = false;
        for (const persona of PORTAL_PERSONA_ORDER) {
            const entry = all[persona];
            if (!entry || typeof entry !== 'object') continue;
            const cleaned = sanitizeGridEditConfig(entry);
            if (JSON.stringify(cleaned) !== JSON.stringify(entry)) {
                all[persona] = cleaned;
                changed = true;
            }
        }
        if (changed) persistRoleGridsIfChanged(all);
    } catch (e) {
        console.warn('sanitizeAllStoredRoleGridsImageUrls failed', e);
    }
}

function maybeRewriteGridForPersona(all: RoleGridsState, persona: PortalPersonaId): GridEditConfig | null {
    const raw = all[persona];
    if (!raw || typeof raw !== 'object') return null;
    const cleaned = sanitizeGridEditConfig(raw);
    if (JSON.stringify(cleaned) !== JSON.stringify(raw)) {
        all[persona] = cleaned;
        persistRoleGridsIfChanged(all);
    }
    return cleaned;
}

const GRID_EDIT_STORAGE_KEY = 'awesomeportal_gridEditConfig';
/** Per-persona grid layouts (marketeer / developer / admin). */
const ROLE_GRIDS_STORAGE_KEY = 'awesomeportal_roleGrids';
const PERSONA_STORAGE_KEY = 'awesomeportal_selectedPersona';
const APP_BUILDER_STORAGE_KEY = 'awesomeportal_appBuilderApps';

export const SKIN_STORAGE_KEY = 'awesomeportal_skinConfig';
export const AEM_PROGRAM_STORAGE_KEY = 'awesomeportal_selectedAemProgram';

export interface AemProgramOption {
    id: string;
    name: string;
    tenantId?: string;
    imsOrgId?: string;
    status?: string;
    type?: string;
}

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


type RoleGridsState = Partial<Record<PortalPersonaId, GridEditConfig>>;

export function isPortalPersonaId(v: string): v is PortalPersonaId {
    return v === 'marketeer' || v === 'developer' || v === 'admin';
}

/** Window-only external params (no merged grid). Used when editing a persona layout other than the live selection. */
export const getStaticExternalParams = (): ExternalParams => {
    try {
        return window.awesomeportalConfig?.externalParams || {};
    } catch {
        return {};
    }
};

function migrateLegacyGridToRoleGrids(): void {
    try {
        const existingRoles = localStorage.getItem(ROLE_GRIDS_STORAGE_KEY);
        if (existingRoles) {
            const parsed = JSON.parse(existingRoles) as RoleGridsState;
            if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
                return;
            }
        }
        const legacyRaw = localStorage.getItem(GRID_EDIT_STORAGE_KEY);
        if (!legacyRaw) return;
        const legacy = JSON.parse(legacyRaw) as GridEditConfig;
        const initial: RoleGridsState = {
            marketeer: legacy,
            developer: legacy,
            admin: legacy,
        };
        localStorage.setItem(ROLE_GRIDS_STORAGE_KEY, JSON.stringify(initial));
    } catch (e) {
        console.warn('Failed to migrate legacy grid config', e);
    }
}

/** Layout saved for a specific persona (independent of the current persona switcher). */
export const getGridLayout = (persona: PortalPersonaId): GridEditConfig | null => {
    migrateLegacyGridToRoleGrids();
    try {
        const raw = localStorage.getItem(ROLE_GRIDS_STORAGE_KEY);
        if (raw) {
            const all = JSON.parse(raw) as RoleGridsState;
            const migrated = maybeRewriteGridForPersona(all, persona);
            if (migrated) return migrated;
        }
        const legacyRaw = localStorage.getItem(GRID_EDIT_STORAGE_KEY);
        if (legacyRaw) {
            const legacy = JSON.parse(legacyRaw) as GridEditConfig;
            const cleaned = sanitizeGridEditConfig(legacy);
            if (JSON.stringify(cleaned) !== JSON.stringify(legacy)) {
                localStorage.setItem(GRID_EDIT_STORAGE_KEY, JSON.stringify(cleaned));
            }
            return cleaned;
        }
    } catch {
        return null;
    }
    return null;
};

/** Persist layout for one persona (others unchanged). */
export const setGridLayout = (persona: PortalPersonaId, config: GridEditConfig): void => {
    migrateLegacyGridToRoleGrids();
    try {
        const raw = localStorage.getItem(ROLE_GRIDS_STORAGE_KEY);
        const all: RoleGridsState = raw ? (JSON.parse(raw) as RoleGridsState) : {};
        all[persona] = sanitizeGridEditConfig(config);
        localStorage.setItem(ROLE_GRIDS_STORAGE_KEY, JSON.stringify(all));
    } catch (e) {
        console.warn('Failed to save role grid config', e);
    }
};

export const getSelectedPersona = (): PortalPersonaId => {
    try {
        const v = localStorage.getItem(PERSONA_STORAGE_KEY);
        if (v && isPortalPersonaId(v)) return v;
    } catch {
        /* ignore */
    }
    return 'marketeer';
};

export const setSelectedPersona = (persona: PortalPersonaId): void => {
    try {
        localStorage.setItem(PERSONA_STORAGE_KEY, persona);
    } catch (e) {
        console.warn('Failed to save selected persona', e);
    }
};

/** URL `?persona=marketeer|developer|admin` overrides for the grid editor; otherwise current switcher value. */
export const readPersonaFromLocation = (): PortalPersonaId => {
    try {
        const q = new URLSearchParams(window.location.search).get('persona');
        if (q && isPortalPersonaId(q)) return q;
    } catch {
        /* ignore */
    }
    return getSelectedPersona();
};

export const getAppBuilderDropIns = (): AppBuilderDropIn[] => {
    try {
        const raw = localStorage.getItem(APP_BUILDER_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as unknown;
        return Array.isArray(parsed) ? (parsed as AppBuilderDropIn[]) : [];
    } catch {
        return [];
    }
};

export const setAppBuilderDropIns = (apps: AppBuilderDropIn[]): void => {
    try {
        localStorage.setItem(APP_BUILDER_STORAGE_KEY, JSON.stringify(apps));
    } catch (e) {
        console.warn('Failed to save App Builder drop-ins', e);
    }
};

/** Map registered App Builder URLs to entitlement payloads for the drag panel. */
export const appBuilderDropInsToEntitlements = (apps: AppBuilderDropIn[]): EntitlementPayload[] =>
    apps
        .filter((a) => a.id && a.title && a.url)
        .map((a) => ({
            id: `appbuilder-${a.id}`,
            title: a.title,
            description: a.description ?? `App Builder · ${a.title}`,
            href: a.url,
            iconUrl: a.iconUrl,
        }));

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

/** Grid for the currently selected persona (used by main grid + drag/drop persistence). */
export const getGridEditConfig = (): GridEditConfig | null => getGridLayout(getSelectedPersona());

/** Save grid for the currently selected persona. */
export const setGridEditConfig = (config: GridEditConfig): void => {
    setGridLayout(getSelectedPersona(), config);
};

/** Load portal skin config from localStorage. */
export const getSkinConfig = (): PortalSkinConfig | null => {
    try {
        const raw = localStorage.getItem(SKIN_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as PortalSkinConfig;
        const cleaned = sanitizePortalSkinConfig(parsed);
        if (JSON.stringify(cleaned) !== JSON.stringify(parsed)) {
            localStorage.setItem(SKIN_STORAGE_KEY, JSON.stringify(cleaned));
        }
        return cleaned;
    } catch {
        return null;
    }
};

/** Save portal skin config to localStorage. */
export const setSkinConfig = (config: PortalSkinConfig): void => {
    try {
        localStorage.setItem(SKIN_STORAGE_KEY, JSON.stringify(sanitizePortalSkinConfig(config)));
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

/** Load selected AEM program from localStorage (for Assets Browser instance selector). */
export const getSelectedAemProgram = (): AemProgramOption | null => {
    try {
        const raw = localStorage.getItem(AEM_PROGRAM_STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as AemProgramOption;
    } catch {
        return null;
    }
};

/** Save selected AEM program to localStorage. */
export const setSelectedAemProgram = (program: AemProgramOption | null): void => {
    try {
        if (program == null) {
            localStorage.removeItem(AEM_PROGRAM_STORAGE_KEY);
        } else {
            localStorage.setItem(AEM_PROGRAM_STORAGE_KEY, JSON.stringify(program));
        }
    } catch (e) {
        console.warn('Failed to save selected AEM program', e);
    }
}; 