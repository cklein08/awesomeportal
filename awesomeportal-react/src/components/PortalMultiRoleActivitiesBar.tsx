import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    activitiesTitleForPersona,
    PORTAL_PERSONA_TOPBAR_MARK,
    portalPersonaCssSlug,
    sortPersonasByPower,
} from '../constants/portalPersonas';
import type { PortalPersonaId } from '../types';
import { setSelectedPersona } from '../utils/config';
import { setSkipAdminLandingRedirect } from '../utils/portalAccess';
import { setPortalPersonaPreviewStripActive } from '../utils/portalSession';

export type PortalMultiRoleActivitiesBarProps = {
    activePersona: PortalPersonaId;
    matchedRoles: PortalPersonaId[];
    /** When true (default), renders as a slot inside {@link HeaderBar} `portalContextSlot` (no outer `<header>`). */
    embedded?: boolean;
    searchPlaceholder?: string;
    /**
     * Route to use when switching entitled roles (default `/` = main portal grid).
     * Admin activities must use `/admin/activities` so the workspace stays mounted and persona URL state stays in sync.
     */
    personaSwitchPathname?: string;
};

/**
 * Stacked “{Persona} Activities” + search — used inside the global {@link HeaderBar} on home and admin.
 */
const PortalMultiRoleActivitiesBar: React.FC<PortalMultiRoleActivitiesBarProps> = ({
    activePersona,
    matchedRoles,
    embedded = true,
    searchPlaceholder = 'Search portal (coming soon)',
    personaSwitchPathname = '/',
}) => {
    const navigate = useNavigate();
    const inactiveRoleLinks = useMemo(
        () => sortPersonasByPower(matchedRoles.filter((id) => id !== activePersona)),
        [matchedRoles, activePersona]
    );

    const switchPersona = (p: PortalPersonaId): void => {
        setSkipAdminLandingRedirect(true);
        setPortalPersonaPreviewStripActive(false);
        setSelectedPersona(p);
        navigate({
            pathname: personaSwitchPathname || '/',
            search: `?persona=${encodeURIComponent(p)}`,
            hash: '',
        });
    };

    const inner = (
        <>
            <div
                className={`admin-shell-topbar-brand-stack admin-shell-topbar-brand admin-shell-topbar-brand--persona-${portalPersonaCssSlug(activePersona)}`}
            >
                <div className="admin-shell-brand-active-row">
                    <span className="admin-shell-logo-mark" aria-hidden>
                        {PORTAL_PERSONA_TOPBAR_MARK[activePersona]}
                    </span>
                    <span className="admin-shell-brand-text">{activitiesTitleForPersona(activePersona)}</span>
                </div>
                {inactiveRoleLinks.map((pid) => (
                    <button
                        key={pid}
                        type="button"
                        className={`admin-shell-brand-link-row admin-shell-brand-link-row--persona-${portalPersonaCssSlug(pid)}`}
                        onClick={() => switchPersona(pid)}
                    >
                        {activitiesTitleForPersona(pid)}
                    </button>
                ))}
            </div>
            <div className="admin-shell-search" role="search">
                <span className="admin-shell-search-icon" aria-hidden>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                    </svg>
                </span>
                <input
                    type="search"
                    placeholder={searchPlaceholder}
                    className="admin-shell-search-input"
                    disabled
                    aria-disabled="true"
                />
            </div>
        </>
    );

    if (embedded) {
        return (
            <div className="portal-persona-activities-embedded" aria-label={activitiesTitleForPersona(activePersona)}>
                {inner}
            </div>
        );
    }

    return (
        <header
            className="admin-shell-topbar portal-persona-activities-topbar"
            aria-label={activitiesTitleForPersona(activePersona)}
        >
            {inner}
        </header>
    );
};

export default PortalMultiRoleActivitiesBar;
