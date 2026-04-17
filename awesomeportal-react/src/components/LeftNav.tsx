import React from 'react';
import './LeftNav.css';

export interface AppItem {
    id: string;
    name: string;
    icon?: React.ReactNode;
}

interface LeftNavProps {
    apps: AppItem[];
    selectedAppId: string | null;
    onAppSelect: (appId: string) => void;
    /** When set, `afterAppSlot` is rendered directly under that app row (e.g. under Assets / “files”). */
    afterAppId?: string;
    afterAppSlot?: React.ReactNode;
}

const LeftNav: React.FC<LeftNavProps> = ({ apps, selectedAppId, onAppSelect, afterAppId, afterAppSlot }) => {
    const afterSlotPlaced = Boolean(afterAppId && afterAppSlot && apps.some((a) => a.id === afterAppId));
    const trailingPersonaSlot = Boolean(afterAppSlot && afterAppId && !afterSlotPlaced);

    return (
        <div className="left-nav">
            <div className="left-nav-header">
                <h2>Applications</h2>
            </div>
            <nav className="left-nav-list">
                {apps.flatMap((app) => {
                    const row = (
                        <button
                            key={app.id}
                            className={`left-nav-item ${selectedAppId === app.id ? 'active' : ''}`}
                            onClick={() => onAppSelect(app.id)}
                        >
                            {app.icon && <span className="left-nav-icon">{app.icon}</span>}
                            <span className="left-nav-label">{app.name}</span>
                        </button>
                    );
                    if (afterAppId === app.id && afterAppSlot) {
                        return [
                            row,
                            <div key={`${app.id}-after-slot`} className="left-nav-insert">
                                {afterAppSlot}
                            </div>,
                        ];
                    }
                    return [row];
                })}
                {trailingPersonaSlot ? (
                    <div key="left-nav-after-slot-trailing" className="left-nav-insert">
                        {afterAppSlot}
                    </div>
                ) : null}
            </nav>
        </div>
    );
};

export default LeftNav;
