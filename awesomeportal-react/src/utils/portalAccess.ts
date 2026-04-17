import type { PortalPersonaId } from '../types';
import { getSelectedPersona } from './config';
import { isPortalAdminFromToken, resolvePersonaFromAccessToken } from './imsPersona';

export const SKIP_ADMIN_LANDING_SESSION_KEY = 'awesomeportal_skip_admin_landing';

export function isLegacyCookiePortalHost(): boolean {
    if (typeof window === 'undefined') return false;
    return (
        window.location.origin.endsWith('adobeaem.workers.dev') || window.location.origin === 'http://localhost:8787'
    );
}

/**
 * Users who may open Admin activities (layout, skin entry, entitlements drag): IMS org admins,
 * developer or admin persona from the token, or legacy cookie hosts. Marketeer-only users do not.
 */
export function canAccessPortalSetup(accessToken: string | null | undefined, storedPersona: PortalPersonaId): boolean {
    if (isLegacyCookiePortalHost()) return true;
    if (!accessToken?.trim()) return false;
    if (isPortalAdminFromToken(accessToken)) return true;
    const fromToken = resolvePersonaFromAccessToken(accessToken);
    if (fromToken === 'developer' || fromToken === 'admin') return true;
    if (storedPersona === 'developer' || storedPersona === 'admin') return true;
    return false;
}

export function readSkipAdminLandingRedirect(): boolean {
    try {
        return sessionStorage.getItem(SKIP_ADMIN_LANDING_SESSION_KEY) === '1';
    } catch {
        return false;
    }
}

export function setSkipAdminLandingRedirect(skip: boolean): void {
    try {
        if (skip) sessionStorage.setItem(SKIP_ADMIN_LANDING_SESSION_KEY, '1');
        else sessionStorage.removeItem(SKIP_ADMIN_LANDING_SESSION_KEY);
    } catch {
        /* ignore */
    }
}

/** Whether first load on `/` after IMS sign-in should send the user to Admin activities. */
export function shouldOpenAdminActivitiesAfterSignIn(accessToken: string | null | undefined): boolean {
    if (isLegacyCookiePortalHost()) return false;
    if (!accessToken?.trim()) return false;
    if (readSkipAdminLandingRedirect()) return false;
    return canAccessPortalSetup(accessToken, getSelectedPersona());
}
