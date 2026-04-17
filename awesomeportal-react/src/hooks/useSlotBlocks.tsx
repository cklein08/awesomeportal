import React, { useMemo } from 'react';
import type { AppTile } from '../components/AppGrid';
import type { SlotBlockDescriptor } from '../types';
import { getExternalParams } from '../utils/config';
import { resolveTileOpenMode } from '../utils/tileNavigation';

const GRID_SLOT_COUNT = 24;

/**
 * Global set by DA (or embedding host) after SDK context is ready.
 * When the app is iframed at da.live, the parent can set this before the app mounts.
 */
declare global {
    interface Window {
        __AWESOMEPORTAL_DA_BLOCKS__?: SlotBlockDescriptor[];
    }
}

/** Default placeholder icon when block has no iconUrl and no known appId */
function DefaultSlotIcon(): React.ReactNode {
    return (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
        </svg>
    );
}

/** Application icons for known appIds when slot block has no iconUrl */
const APP_ICONS: Record<string, React.ReactNode> = {
    firefly: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
    ),
    'experience-hub': (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
            <path d="M7 13h10" />
            <path d="M7 17h10" />
        </svg>
    ),
    'ai-agents': (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
        </svg>
    ),
};

/** Map a slot block descriptor to AppTile (icon from iconUrl, app icon for known appId, or default placeholder). */
function slotBlockToAppTile(
    block: SlotBlockDescriptor,
    onSelectTileId: (tileId: string) => void,
    onSelectDaContentUrl?: (url: string) => void
): AppTile {
    let icon: React.ReactNode;
    if (block.iconUrl) {
        icon = <img src={block.iconUrl} alt="" width={48} height={48} className="app-tile-icon-img" />;
    } else if (block.appId && APP_ICONS[block.appId]) {
        icon = APP_ICONS[block.appId];
    } else {
        icon = DefaultSlotIcon();
    }

    let onClick: (() => void) | undefined;
    if (block.daContentUrl) {
        onClick = () => {
            if (onSelectDaContentUrl) {
                onSelectDaContentUrl(block.daContentUrl!);
            } else {
                window.location.href = block.daContentUrl!;
            }
        };
    } else if (block.appId) {
        onClick = () => onSelectTileId(block.appId!);
    } else if (block.href) {
        const mode = resolveTileOpenMode(block);
        onClick = () => {
            if (mode === 'new-tab') {
                try {
                    window.open(block.href!, '_blank', 'noopener');
                } catch {
                    window.location.assign(block.href!);
                }
                return;
            }
            if (mode === 'navigate') {
                window.location.assign(block.href!);
                return;
            }
            if (onSelectDaContentUrl) {
                onSelectDaContentUrl(block.href!);
            } else {
                try {
                    window.open(block.href!, '_blank', 'noopener');
                } catch {
                    window.location.assign(block.href!);
                }
            }
        };
    }

    return {
        id: block.id,
        title: block.title,
        description: block.description,
        icon,
        onClick,
    };
}

/** Default tiles when no DA or external slot blocks are provided. */
function getDefaultTiles(onSelectTileId: (tileId: string) => void): AppTile[] {
    return [
        { id: 'firefly', title: 'Adobe Firefly', description: 'Generate images using AI', icon: APP_ICONS.firefly, onClick: () => onSelectTileId('firefly') },
        { id: 'experience-hub', title: 'Experience Hub', description: 'Manage content experiences', icon: APP_ICONS['experience-hub'], onClick: () => onSelectTileId('experience-hub') },
        { id: 'ai-agents', title: 'AI Agents', description: 'Interact with intelligent agents', icon: APP_ICONS['ai-agents'], onClick: () => onSelectTileId('ai-agents') },
    ];
}

/** Default slot blocks (same 3 as default tiles). Used so first drop from sidebar preserves existing slots. */
export function getDefaultSlotBlocks(): SlotBlockDescriptor[] {
    return [
        { id: 'firefly', title: 'Adobe Firefly', description: 'Generate images using AI', slotType: 'application', appId: 'firefly' },
        { id: 'experience-hub', title: 'Experience Hub', description: 'Manage content experiences', slotType: 'application', appId: 'experience-hub' },
        { id: 'ai-agents', title: 'AI Agents', description: 'Interact with intelligent agents', slotType: 'application', appId: 'ai-agents' },
    ];
}

/** Normalize raw slot blocks to 24 slots; null = empty. Handles dense arrays (no nulls) from legacy config. */
function normalizeTo24Slots(raw: SlotBlockDescriptor[] | (SlotBlockDescriptor | null)[] | undefined): (SlotBlockDescriptor | null)[] {
    if (!raw || !Array.isArray(raw)) return Array.from({ length: GRID_SLOT_COUNT }, () => null);
    return Array.from({ length: GRID_SLOT_COUNT }, (_, i) => {
        const b = raw[i];
        return b != null && typeof b === 'object' ? (b as SlotBlockDescriptor) : null;
    });
}

/**
 * Resolves grid slot tiles from DA live (window.__AWESOMEPORTAL_DA_BLOCKS__),
 * externalParams.slotBlocks, or default tiles.
 * Always returns 24 slots (AppTile | null) so empty slots are honored and drag-and-drop only targets empty slots.
 */
export function useSlotBlocks(
    onSelectTileId: (tileId: string) => void,
    onSelectDaContentUrl?: (url: string) => void,
    configVersion?: number
): (AppTile | null)[] {
    return useMemo(() => {
        const daBlocks = typeof window !== 'undefined' ? window.__AWESOMEPORTAL_DA_BLOCKS__ : undefined;
        const externalParams = getExternalParams();
        const externalBlocks = externalParams.slotBlocks;

        let slots: (SlotBlockDescriptor | null)[];
        if (Array.isArray(daBlocks) && daBlocks.length > 0) {
            slots = normalizeTo24Slots(daBlocks);
        } else if (externalBlocks != null && externalBlocks.length > 0) {
            slots = normalizeTo24Slots(externalBlocks);
        } else {
            const defaultTiles = getDefaultTiles(onSelectTileId);
            return Array.from({ length: GRID_SLOT_COUNT }, (_, i) => defaultTiles[i] ?? null);
        }

        // If saved config has no blocks (all empty slots), show default apps so the grid is not blank
        if (slots.every((s) => s == null)) {
            const defaultTiles = getDefaultTiles(onSelectTileId);
            return Array.from({ length: GRID_SLOT_COUNT }, (_, i) => defaultTiles[i] ?? null);
        }

        return slots.map((block) =>
            block ? slotBlockToAppTile(block, onSelectTileId, onSelectDaContentUrl) : null
        );
    }, [onSelectTileId, onSelectDaContentUrl, configVersion]);
}
