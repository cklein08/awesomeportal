import React, { useCallback, useState } from 'react';
import { useAppConfig } from '../hooks/useAppConfig';
import type { EntitlementPayload, GridTopBanner } from '../types';
import { normalizeImageSrcForDisplay } from '../utils/pathUtils';
import './AppGrid.css';

export interface AppTile {
    id: string;
    title: string;
    description?: string;
    icon?: React.ReactNode;
    onClick?: () => void;
}

interface AppGridProps {
    /** Grid tiles; null = empty slot. Length 24 when using slot-blocks; empty slots honor existing content. */
    tiles: (AppTile | null)[];
    onTileClick?: (tileId: string) => void;
    /** Optional text/HTML content shown above the grid. */
    topContent?: string;
    /** Optional banners/images above the grid. */
    topBanners?: GridTopBanner[];
    /** Optional slot tile min-height in pixels. */
    slotHeight?: number;
    /** Optional slot min-width in pixels (affects grid column size). */
    slotWidth?: number;
    /** When true, only render filled tiles (no empty slot placeholders). */
    hideEmptySlots?: boolean;
    /** When set, slots accept drops from entitlements panel; called with slot index and payload. */
    onDropSlot?: (index: number, payload: EntitlementPayload) => void;
    /** When true, filled slots shake and show delete (X) button. */
    deleteMode?: boolean;
    /** When in delete mode, called when user clicks X on a slot (parent shows confirm then removes). */
    onRequestDeleteSlot?: (index: number) => void;
}

/** MIME type for drag-and-drop payload from entitlements panel to grid. */
export const DRAG_TYPE_ENTITLEMENT = 'application/x-awesomeportal-entitlement';

const AppGrid: React.FC<AppGridProps> = ({
    tiles,
    onTileClick,
    topContent,
    topBanners,
    slotHeight,
    slotWidth,
    hideEmptySlots = false,
    onDropSlot,
    deleteMode = false,
    onRequestDeleteSlot,
}) => {
    const { skinConfig } = useAppConfig();
    const heroImageUrl = skinConfig?.heroImageUrl ? normalizeImageSrcForDisplay(skinConfig.heroImageUrl) : undefined;
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const gridTiles = hideEmptySlots
        ? tiles.filter((t): t is AppTile => t != null)
        : Array.from({ length: 24 }, (_, index) => tiles[index] ?? null);

    const isEmptySlot = useCallback((index: number) => gridTiles[index] === null, [gridTiles]);

    const handleTileClick = (tile: AppTile | null, index: number) => {
        if (deleteMode && tile && onRequestDeleteSlot) return;
        if (tile && (tile.onClick || onTileClick)) {
            if (tile.onClick) {
                tile.onClick();
            } else if (onTileClick) {
                onTileClick(tile.id);
            }
        }
    };

    const handleDragOver = useCallback(
        (e: React.DragEvent, index: number) => {
            if (!onDropSlot || !isEmptySlot(index)) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            setDragOverIndex(index);
        },
        [onDropSlot, isEmptySlot]
    );

    const handleDragLeave = useCallback((e: React.DragEvent, index: number) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setDragOverIndex((prev) => (prev === index ? null : prev));
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent, index: number) => {
            if (!onDropSlot || !isEmptySlot(index)) return;
            e.preventDefault();
            setDragOverIndex(null);
            const raw = e.dataTransfer.getData(DRAG_TYPE_ENTITLEMENT);
            if (!raw) return;
            try {
                const payload = JSON.parse(raw) as EntitlementPayload;
                if (payload.id && payload.title && payload.href) {
                    onDropSlot(index, payload);
                }
            } catch {
                // ignore invalid payload
            }
        },
        [onDropSlot, isEmptySlot]
    );

    const handleDeleteClick = useCallback(
        (e: React.MouseEvent, index: number) => {
            e.stopPropagation();
            onRequestDeleteSlot?.(index);
        },
        [onRequestDeleteSlot]
    );

    const style: React.CSSProperties = {};
    if (slotHeight != null) style['--app-tile-min-height' as string] = `${slotHeight}px`;
    if (slotWidth != null) style['--app-tile-min-width' as string] = `${slotWidth}px`;

    return (
        <div className="app-grid-container" style={Object.keys(style).length ? style : undefined}>
            {(heroImageUrl || topContent || (topBanners && topBanners.length > 0)) && (
                <div className="app-grid-top">
                    {heroImageUrl && (
                        <img
                            src={heroImageUrl}
                            alt="Hero"
                            className="app-grid-hero"
                        />
                    )}
                    {topBanners && topBanners.length > 0 && (
                        <div className="app-grid-top-banners">
                            {topBanners.map((b, i) => {
                                const bannerSrc = normalizeImageSrcForDisplay(b.url);
                                const key = `top-banner-${i}`;
                                if (!bannerSrc) {
                                    return <span key={key} className="app-grid-top-banner-missing" aria-hidden />;
                                }
                                const img = <img src={bannerSrc} alt={b.alt ?? ''} className="app-grid-top-banner-img" />;
                                return b.href ? (
                                    <a key={key} href={b.href} target="_blank" rel="noopener noreferrer" className="app-grid-top-banner-link">
                                        {img}
                                    </a>
                                ) : (
                                    <span key={key} className="app-grid-top-banner-wrap">{img}</span>
                                );
                            })}
                        </div>
                    )}
                    {topContent && (
                        <div className="app-grid-top-content" dangerouslySetInnerHTML={{ __html: topContent }} />
                    )}
                </div>
            )}
            <div className={`app-grid${hideEmptySlots ? ' hide-empty-slots' : ''}`}>
                {gridTiles.map((tile, index) => (
                    <div
                        key={tile?.id || `empty-${index}`}
                        className={`app-grid-tile ${tile ? 'filled' : 'empty'}${dragOverIndex === index ? ' drag-over' : ''}${deleteMode && tile ? ' shake' : ''}`}
                        onClick={() => handleTileClick(tile, index)}
                        onDragOver={onDropSlot ? (e) => handleDragOver(e, index) : undefined}
                        onDragLeave={onDropSlot ? (e) => handleDragLeave(e, index) : undefined}
                        onDrop={onDropSlot ? (e) => handleDrop(e, index) : undefined}
                    >
                        {deleteMode && tile && onRequestDeleteSlot && (
                            <button
                                type="button"
                                className="slot-delete-btn"
                                onClick={(e) => handleDeleteClick(e, index)}
                                aria-label={`Remove ${tile.title} from grid`}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        )}
                        {tile ? (
                            <>
                                {tile.icon && <div className="app-tile-icon">{tile.icon}</div>}
                                <div className="app-tile-content">
                                    <h3 className="app-tile-title">{tile.title}</h3>
                                    {tile.description && (
                                        <p className="app-tile-description">{tile.description}</p>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="app-tile-placeholder">
                                <span>Empty Slot</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AppGrid;

