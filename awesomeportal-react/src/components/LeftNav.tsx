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
}

const LeftNav: React.FC<LeftNavProps> = ({ apps, selectedAppId, onAppSelect }) => {
    return (
        <div className="left-nav">
            <div className="left-nav-header">
                <h2>Applications</h2>
            </div>
            <nav className="left-nav-list">
                {apps.map((app) => (
                    <button
                        key={app.id}
                        className={`left-nav-item ${selectedAppId === app.id ? 'active' : ''}`}
                        onClick={() => onAppSelect(app.id)}
                    >
                        {app.icon && <span className="left-nav-icon">{app.icon}</span>}
                        <span className="left-nav-label">{app.name}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
};

export default LeftNav;

