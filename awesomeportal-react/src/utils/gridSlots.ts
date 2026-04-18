import type { GridEditConfig, PortalPersonaId, SlotBlockDescriptor } from '../types';
import { getGridLayout, getStaticExternalParams, setGridLayout } from './config';

export const GRID_SLOT_COUNT = 24;

function slotBlocksFromStaticBase(): SlotBlockDescriptor[] {
    const base = getStaticExternalParams();
    const raw = base.slotBlocks;
    if (raw && Array.isArray(raw) && raw.length > 0) {
        const dense = raw.filter((b): b is SlotBlockDescriptor => b != null && typeof b === 'object');
        if (dense.length > 0) return dense;
    }
    return [
        { id: 'firefly', title: 'Adobe Firefly', description: 'Generate images using AI', slotType: 'application', appId: 'firefly' },
        { id: 'experience-hub', title: 'Experience Hub', description: 'Manage content experiences', slotType: 'application', appId: 'experience-hub' },
        { id: 'ai-agents', title: 'AI Agents', description: 'Interact with intelligent agents', slotType: 'application', appId: 'ai-agents' },
    ];
}

/** Fixed 24 visual slots; index maps to grid position (same as main portal). */
export function ensureSlots24(raw: (SlotBlockDescriptor | null)[] | undefined): (SlotBlockDescriptor | null)[] {
    return Array.from({ length: GRID_SLOT_COUNT }, (_, i) => {
        const b = raw?.[i];
        return b != null && typeof b === 'object' ? (b as SlotBlockDescriptor) : null;
    });
}

export function buildGridConfigForPersona(persona: PortalPersonaId): GridEditConfig {
    const savedConfig = getGridLayout(persona);
    const base = getStaticExternalParams();
    const fromBase =
        base.slotBlocks?.filter((b): b is SlotBlockDescriptor => b != null && typeof b === 'object') ?? [];
    const mergedDense = savedConfig?.slotBlocks ?? (fromBase.length > 0 ? fromBase : slotBlocksFromStaticBase());
    const slotBlocks = ensureSlots24(mergedDense);
    return {
        slotBlocks,
        gridTopContent: savedConfig?.gridTopContent ?? base.gridTopContent ?? '',
        gridTopBanners: savedConfig?.gridTopBanners ?? base.gridTopBanners ?? [],
        slotHeight: savedConfig?.slotHeight ?? base.slotHeight ?? 120,
        slotWidth: savedConfig?.slotWidth ?? base.slotWidth ?? 140,
    };
}

export function persistPersonaGrid(persona: PortalPersonaId, config: GridEditConfig): void {
    setGridLayout(persona, {
        ...config,
        slotBlocks: ensureSlots24(config.slotBlocks),
    });
}
