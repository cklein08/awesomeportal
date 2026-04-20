import React from 'react';
import {
    PORTAL_PERSONA_LABELS,
    PORTAL_PERSONA_TOPBAR_MARK,
    activitiesTitleForPersona,
    portalPersonaCssSlug,
} from '../constants/portalPersonas';
import type { PortalPersonaId } from '../types';

export type PersonaActivitiesTopbarProps = {
    personaId: PortalPersonaId;
    /**
     * When true, renders as a fragment for {@link HeaderBar} `portalContextSlot` (no outer `<header>`).
     * When false, full-width bar below the main header (legacy).
     */
    embedded?: boolean;
    searchPlaceholder?: string;
};

/**
 * Same chrome as Admin activities (mark + "{Persona} Activities" + disabled search).
 * Use `embedded` inside the global HeaderBar; standalone for legacy layouts.
 */
const PersonaActivitiesTopbar: React.FC<PersonaActivitiesTopbarProps> = ({
    personaId,
    embedded = false,
    searchPlaceholder = 'Search portal (coming soon)',
}) => {
    const inner = (
        <>
            <div className={`admin-shell-topbar-brand admin-shell-topbar-brand--persona-${portalPersonaCssSlug(personaId)}`}>
                <span className="admin-shell-logo-mark" aria-hidden>
                    {PORTAL_PERSONA_TOPBAR_MARK[personaId]}
                </span>
                <span className="admin-shell-brand-text">{activitiesTitleForPersona(personaId)}</span>
            </div>
            <div className="admin-shell-search" role="search">
                <span className="admin-shell-search-icon" aria-hidden>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                    </svg>
                </span>
                <input type="search" placeholder={searchPlaceholder} className="admin-shell-search-input" disabled />
            </div>
        </>
    );

    if (embedded) {
        return (
            <div className="portal-persona-activities-embedded" aria-label={`${PORTAL_PERSONA_LABELS[personaId]} activities`}>
                {inner}
            </div>
        );
    }

    return (
        <header className="admin-shell-topbar portal-persona-activities-topbar" aria-label={`${PORTAL_PERSONA_LABELS[personaId]} activities`}>
            {inner}
        </header>
    );
};

export default PersonaActivitiesTopbar;
