import { PORTAL_PERSONA_LABELS } from '../constants/portalPersonas';
import type { PortalPersonaId } from '../types';
import { setSelectedPersona } from './config';
import { resolvePersonaFromAccessToken } from './imsPersona';
import { canImpersonatePortalPersonas, setSkipAdminLandingRedirect } from './portalAccess';
import { readPortalPersonaPreviewStripActive, setPortalPersonaPreviewStripActive } from './portalSession';

export type PortalPersonaImpersonationUi = {
    effectivePersonaId: PortalPersonaId;
    personaLabel: string;
};

/**
 * When non-null, the user is viewing the portal as another persona (or explicit admin preview)
 * and should see End Persona + persona-scoped Activities chrome.
 */
export function getPortalPersonaImpersonationUi(
    accessToken: string | null | undefined,
    activeStoredPersona: PortalPersonaId
): PortalPersonaImpersonationUi | null {
    if (!accessToken?.trim()) return null;
    if (!canImpersonatePortalPersonas(accessToken)) return null;
    const imsPersona = resolvePersonaFromAccessToken(accessToken);
    if (imsPersona == null) return null;
    const tokenMismatch = activeStoredPersona !== imsPersona;
    const explicitPreview = readPortalPersonaPreviewStripActive();
    if (!tokenMismatch && !explicitPreview) return null;
    return {
        effectivePersonaId: activeStoredPersona,
        personaLabel: PORTAL_PERSONA_LABELS[activeStoredPersona],
    };
}

/** Persist end of persona preview (storage + session flags). Caller should update React state / navigate. */
export function endPersonaImpersonationPersist(imsPersona: PortalPersonaId): void {
    setPortalPersonaPreviewStripActive(false);
    setSkipAdminLandingRedirect(true);
    setSelectedPersona(imsPersona);
}
