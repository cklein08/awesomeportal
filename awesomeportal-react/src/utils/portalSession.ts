/** Session flag: user acknowledged splash for this tab (see `PortalSplashGate`). */
export const PORTAL_SPLASH_SESSION_KEY = 'awesomeportal_splash_ack';

export function clearPortalSplashAck(): void {
    try {
        sessionStorage.removeItem(PORTAL_SPLASH_SESSION_KEY);
    } catch {
        /* ignore */
    }
}

/**
 * When set, the header shows "End Persona" even if the chosen portal persona matches the IMS-derived
 * persona (e.g. org admin previewing the Admin layout after explicitly picking Admin in the modal).
 */
export const PORTAL_PERSONA_PREVIEW_STRIP_SESSION_KEY = 'awesomeportal_persona_preview_strip';

export function setPortalPersonaPreviewStripActive(active: boolean): void {
    try {
        if (active) sessionStorage.setItem(PORTAL_PERSONA_PREVIEW_STRIP_SESSION_KEY, '1');
        else sessionStorage.removeItem(PORTAL_PERSONA_PREVIEW_STRIP_SESSION_KEY);
    } catch {
        /* ignore */
    }
}

export function readPortalPersonaPreviewStripActive(): boolean {
    try {
        return sessionStorage.getItem(PORTAL_PERSONA_PREVIEW_STRIP_SESSION_KEY) === '1';
    } catch {
        return false;
    }
}

/**
 * Full URL of the SPA root including Vite `base` (e.g. `https://localhost:5173/portal/`).
 * Use after sign-out so the next load shows the splash gate and a clean entry URL (not `index.html`).
 */
export function getPortalSpaRootHref(): string {
    if (typeof window === 'undefined') return '/';
    const base = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
    return `${window.location.origin}${base}`;
}

/** After IMS redirect with tokens in URL, wait this many ms before `location.replace` so users can read Adobe UI. Set `VITE_POST_IMS_RETURN_SETTLE_MS=0` to skip. */
export function readPostImsReturnSettleMs(): number {
    const raw = import.meta.env.VITE_POST_IMS_RETURN_SETTLE_MS;
    if (raw === '0' || raw === '') return 0;
    const n = parseInt(raw || '2500', 10);
    return Number.isFinite(n) && n >= 0 ? n : 2500;
}

/** Delay before auto-navigating eligible users to Admin activities after landing on `/` (ms). Set `0` to go immediately. */
export function readPostLoginAdminRedirectDelayMs(): number {
    const raw = import.meta.env.VITE_POST_LOGIN_ADMIN_REDIRECT_DELAY_MS;
    if (raw === '0' || raw === '') return 0;
    const n = parseInt(raw || '3500', 10);
    return Number.isFinite(n) && n >= 0 ? n : 3500;
}
