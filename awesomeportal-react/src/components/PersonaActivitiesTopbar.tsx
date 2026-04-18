import React from 'react';
import { PORTAL_PERSONA_LABELS, PORTAL_PERSONA_TOPBAR_MARK } from '../constants/portalPersonas';
import type { PortalPersonaId } from '../types';
import AdminShellTopbarHelpAuth, { type AdminShellTopbarHelpAuthProps } from './AdminShellTopbarHelpAuth';

export type PersonaActivitiesTopbarProps = {
    personaId: PortalPersonaId;
    /** Help (?), Sign out of Adobe, and profile — same as Admin activities top bar. */
    authChrome?: AdminShellTopbarHelpAuthProps;
};

/**
 * Same chrome as Admin activities top bar (mark + "{Persona} Activities" + disabled search), for MainApp while impersonating.
 */
const PersonaActivitiesTopbar: React.FC<PersonaActivitiesTopbarProps> = ({ personaId, authChrome }) => (
    <header className="admin-shell-topbar portal-persona-activities-topbar" aria-label={`${PORTAL_PERSONA_LABELS[personaId]} activities`}>
        <div className={`admin-shell-topbar-brand admin-shell-topbar-brand--persona-${personaId}`}>
            <span className="admin-shell-logo-mark" aria-hidden>
                {PORTAL_PERSONA_TOPBAR_MARK[personaId]}
            </span>
            <span className="admin-shell-brand-text">{`${PORTAL_PERSONA_LABELS[personaId]} Activities`}</span>
        </div>
        <div className="admin-shell-search" role="search">
            <span className="admin-shell-search-icon" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                </svg>
            </span>
            <input type="search" placeholder="Search admin tools (coming soon)" className="admin-shell-search-input" disabled />
        </div>
        {authChrome ? (
            <div className="admin-shell-topbar-actions portal-persona-activities-topbar-actions">
                <AdminShellTopbarHelpAuth {...authChrome} />
            </div>
        ) : null}
    </header>
);

export default PersonaActivitiesTopbar;
