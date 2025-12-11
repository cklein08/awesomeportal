import React from 'react';
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
}

const AppGrid: React.FC<AppGridProps> = ({ tiles, onTileClick }) => {
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

    return (
        <div className="app-grid-container">
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

