/**
 * Local-only Heineken-inspired portal demo (colors, type, hero, grid strip).
 * Not affiliated with Heineken N.V.; for UI demonstration only.
 * Enable with VITE_HEINEKEN_DEMO=true or use the Skin Editor dev action.
 */

import type { GridEditConfig, GridTopBanner, PortalSkinConfig } from '../types';
import { getGridLayout, setGridLayout, setSkinConfig } from '../utils/config';
import { getDefaultSlotBlocks } from '../hooks/useSlotBlocks';
import { PORTAL_PERSONA_ORDER } from './portalPersonas';

/** Wordmark (Wikimedia Commons). */
const HEINEKEN_LOGO =
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Heineken.svg/320px-Heineken.svg.png';

/** Green barley / brand mood (Unsplash, free to use). */
const HEINEKEN_HERO =
    'https://images.unsplash.com/photo-1518176258769-fd99f815d3e0?auto=format&fit=crop&w=1800&q=80';

export const HEINEKEN_SKIN: PortalSkinConfig = {
    logoUrl: HEINEKEN_LOGO,
    primaryColor: '#007C31',
    primaryColorHover: '#005F26',
    primaryColorActive: '#004A1E',
    primaryColorDisabled: '#8CB89A',
    backgroundColor: '#F7F4EE',
    accentColor: '#E60012',
    fontFamilyBody: 'Source Sans 3',
    fontFamilyHeading: 'Oswald',
    heroImageUrl: HEINEKEN_HERO,
};

/** Marketing-style strip above the tile grid (heineken.marketing–style editorial bar). */
export const HEINEKEN_GRID_TOP_HTML = `
<div style="margin:0 0 12px 0;padding:14px 18px;border-radius:8px;background:linear-gradient(105deg,#00381A 0%,#007C31 42%,#00A651 100%);color:#fff;box-shadow:0 2px 12px rgba(0,60,30,0.18);">
  <div style="font-family:Oswald,Impact,sans-serif;font-size:1.35rem;letter-spacing:0.06em;line-height:1.2;">GOOD TIMES</div>
  <div style="margin-top:6px;font-family:'Source Sans 3',system-ui,sans-serif;font-size:0.95rem;opacity:0.95;max-width:52rem;">
    Heineken brand portal preview — green world of <strong>heineken.com</strong> meets the clean editorial feel of Heineken marketing sites.
  </div>
</div>
`.trim();

export const HEINEKEN_TOP_BANNERS: GridTopBanner[] = [
    {
        url: HEINEKEN_HERO,
        alt: 'Green hops / barley mood',
        href: 'https://www.heineken.com/',
    },
];

/** Merge Heineken strip + default hero banner into each persona layout (preserves existing tiles). */
export function applyHeinekenGridLayouts(): void {
    for (const persona of PORTAL_PERSONA_ORDER) {
        const current = getGridLayout(persona);
        const raw = current?.slotBlocks;
        const hasAnySlot = raw?.some((b) => b != null);
        const slotBlocks = hasAnySlot && raw ? raw : getDefaultSlotBlocks();
        const next: GridEditConfig = {
            slotBlocks,
            gridTopContent: HEINEKEN_GRID_TOP_HTML,
            gridTopBanners:
                current?.gridTopBanners && current.gridTopBanners.length > 0 ? current.gridTopBanners : HEINEKEN_TOP_BANNERS,
            slotHeight: current?.slotHeight ?? 120,
            slotWidth: current?.slotWidth ?? 140,
        };
        setGridLayout(persona, next);
    }
}

/** Persist Heineken skin + grid strip/banner for all personas (call before React root mounts for first paint). */
export function applyHeinekenLocalDemo(): void {
    setSkinConfig(HEINEKEN_SKIN);
    applyHeinekenGridLayouts();
}
