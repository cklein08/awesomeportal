import React, { useLayoutEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSelectedPersona } from '../utils/config';
import { isPortalAdminFromToken } from '../utils/imsPersona';
import './AdminHub.css';

function isLegacyCookieAuthenticatedHost(): boolean {
    if (typeof window === 'undefined') return false;
    return (
        window.location.origin.endsWith('adobeaem.workers.dev') || window.location.origin === 'http://localhost:8787'
    );
}

/**
 * Single entry for org admins: links to grid editor, branding (opens main app with skin modal), and room for future settings.
 */
const AdminHub: React.FC = () => {
    const navigate = useNavigate();
    const persona = useMemo(() => getSelectedPersona(), []);

    const allowed = useMemo(() => {
        try {
            const token = localStorage.getItem('accessToken');
            if (token && isPortalAdminFromToken(token)) return true;
        } catch {
            /* ignore */
        }
        return isLegacyCookieAuthenticatedHost();
    }, []);

    useLayoutEffect(() => {
        if (!allowed) {
            navigate('/', { replace: true });
        }
    }, [allowed, navigate]);

    if (!allowed) {
        return null;
    }

    return (
        <div className="admin-hub">
            <header className="admin-hub-header">
                <h1 className="admin-hub-title">Admin</h1>
                <p className="admin-hub-lede">Shortcuts for portal layout, branding, and future org settings.</p>
            </header>
            <ul className="admin-hub-cards">
                <li>
                    <Link className="admin-hub-card" to={`/admin/grid-edit?persona=${encodeURIComponent(persona)}`}>
                        <span className="admin-hub-card-title">Portal layout</span>
                        <span className="admin-hub-card-desc">Edit the tile grid for each persona.</span>
                    </Link>
                </li>
                <li>
                    <Link className="admin-hub-card" to="/" state={{ openSkinEditor: true }}>
                        <span className="admin-hub-card-title">Brand &amp; theme</span>
                        <span className="admin-hub-card-desc">Open the portal home and skin editor.</span>
                    </Link>
                </li>
                <li>
                    <span className="admin-hub-card admin-hub-card--muted">
                        <span className="admin-hub-card-title">Org settings</span>
                        <span className="admin-hub-card-desc">Reserved for future IMS/org configuration.</span>
                    </span>
                </li>
            </ul>
            <p className="admin-hub-footer">
                <Link to="/">← Back to portal</Link>
            </p>
        </div>
    );
};

export default AdminHub;
