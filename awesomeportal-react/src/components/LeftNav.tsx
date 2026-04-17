import React from 'react';
import './LeftNav.css';

export interface AppItem {
    id: string;
    name: string;
    /** When set, selecting this item navigates the browser to this URL (same tab). */
    href?: string;
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
                    const active = selectedAppId === app.id;
                    const className = `left-nav-item${active ? ' active' : ''}`;
                    const label = (
                        <>
                            {app.icon && <span className="left-nav-icon">{app.icon}</span>}
                            <span className="left-nav-label">{app.name}</span>
                        </>
                    );
                    const row =
                        app.href && app.href.trim() ? (
                            <a
                                key={app.id}
                                href={app.href.trim()}
                                className={className}
                                onClick={(e) => {
                                    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return;
                                    e.preventDefault();
                                    onAppSelect(app.id);
                                }}
                            >
                                {label}
                            </a>
                        ) : (
                            <button key={app.id} type="button" className={className} onClick={() => onAppSelect(app.id)}>
                                {label}
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
