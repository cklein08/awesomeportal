import type { PortalPersonaId } from '../types';

/**
 * Decode JWT payload (no signature verification — UI hints only).
 */
export function decodeImsAccessTokenPayload(token: string): Record<string, unknown> | null {
    try {
        const raw = token.replace(/^Bearer\s+/i, '').trim();
        const parts = raw.split('.');
        if (parts.length < 2) return null;
        let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) base64 += '=';
        const binary = atob(base64);
        const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
        const json = new TextDecoder('utf-8').decode(bytes);
        return JSON.parse(json) as Record<string, unknown>;
    } catch {
        return null;
    }
}

function haystackFromPayload(payload: Record<string, unknown>): string {
    try {
        return JSON.stringify(payload).toLowerCase();
    } catch {
        return '';
    }
}

function envListMatches(hay: string, envVar: string | undefined): boolean {
    if (!envVar?.trim()) return false;
    return envVar
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .some((frag) => frag.length > 0 && hay.includes(frag));
}

/**
 * Whether the signed-in user may override portal persona via the UI (org admins).
 * When VITE_IMS_ADMIN_GROUP_SUBSTRINGS is unset, defaults to true so existing demos keep the persona switcher.
 */
export function isPortalAdminFromToken(accessToken: string | null | undefined): boolean {
    if (!accessToken) return false;
    if (import.meta.env.VITE_PORTAL_ALL_USERS_ARE_ADMINS === 'true') return true;
    const sub = import.meta.env.VITE_IMS_ADMIN_GROUP_SUBSTRINGS;
    if (!sub?.trim()) return true;
    const payload = decodeImsAccessTokenPayload(accessToken);
    if (!payload) return false;
    return envListMatches(haystackFromPayload(payload), sub);
}

/**
 * Map IMS access token claims to a portal persona. Heuristics + optional env substring lists.
 * Returns null only if the token cannot be decoded (caller should keep stored persona).
 */
export function resolvePersonaFromAccessToken(accessToken: string): PortalPersonaId | null {
    const forced = import.meta.env.VITE_PORTAL_PERSONA_AFTER_SIGNIN?.trim();
    if (forced === 'marketeer' || forced === 'developer' || forced === 'admin') {
        return forced;
    }

    const payload = decodeImsAccessTokenPayload(accessToken);
    if (!payload) return null;

    const hay = haystackFromPayload(payload);

    if (envListMatches(hay, import.meta.env.VITE_IMS_PERSONA_ADMIN_SUBSTRINGS)) {
        return 'admin';
    }
    if (envListMatches(hay, import.meta.env.VITE_IMS_PERSONA_DEVELOPER_SUBSTRINGS)) {
        return 'developer';
    }

    const ppc = payload.projectedProductContext ?? payload['projectedProductContext'];
    if (typeof ppc === 'string') {
        const s = ppc.toLowerCase();
        if (s.includes('admin')) return 'admin';
        if (s.includes('developer') || s.includes('engineer')) return 'developer';
    }

    return 'marketeer';
}
