import type { SlotBlockDescriptor } from '../types';

/** How a hosted tile opens its target URL (see docs/HOSTED_TILES.md). */
export type TileOpenMode = NonNullable<SlotBlockDescriptor['openMode']>;

/**
 * Resolves open behavior for a slot block. Default matches previous app behavior: iframe shell for href/da URLs.
 */
export function resolveTileOpenMode(block: Pick<SlotBlockDescriptor, 'openMode' | 'href' | 'daContentUrl' | 'slotType'>): TileOpenMode {
    if (block.openMode) return block.openMode;
    if (block.daContentUrl || block.slotType === 'da-content') return 'iframe';
    return 'iframe';
}
