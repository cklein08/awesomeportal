import React from 'react';
import { useAppConfig } from '../hooks/useAppConfig';
import type { GridTopBanner } from '../types';
import './AppGrid.css';

export interface AppTile {
    id: string;
    title: string;
    description?: string;
    icon?: React.ReactNode;
    onClick?: () => void;
}

interface AppGridProps {
    tiles: AppTile[];
    onTileClick?: (tileId: string) => void;
    /** Optional text/HTML content shown above the grid. */
    topContent?: string;
    /** Optional banners/images above the grid. */
    topBanners?: GridTopBanner[];
    /** Optional slot tile min-height in pixels. */
    slotHeight?: number;
    /** Optional slot min-width in pixels (affects grid column size). */
    slotWidth?: number;
}

const AppGrid: React.FC<AppGridProps> = ({
    tiles,
    onTileClick,
    topContent,
    topBanners,
    slotHeight,
    slotWidth,
}) => {
    const { skinConfig } = useAppConfig();
    const heroImageUrl = skinConfig?.heroImageUrl;

    // Ensure we have exactly 24 tiles (4x6 grid)
    const gridTiles = Array.from({ length: 24 }, (_, index) => tiles[index] || null);

    const handleTileClick = (tile: AppTile | null) => {
        if (tile && (tile.onClick || onTileClick)) {
            if (tile.onClick) {
                tile.onClick();
            } else if (onTileClick) {
                onTileClick(tile.id);
            }
        }
    };

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
                                const key = b.url ? `top-banner-${i}-${b.url}` : `top-banner-${i}`;
                                const img = <img src={b.url} alt={b.alt ?? ''} className="app-grid-top-banner-img" />;
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
            <div className="app-grid">
                {gridTiles.map((tile, index) => (
                    <div
                        key={tile?.id || `empty-${index}`}
                        className={`app-grid-tile ${tile ? 'filled' : 'empty'}`}
                        onClick={() => handleTileClick(tile)}
                    >
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

