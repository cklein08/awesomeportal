import {
    PORTAL_PERSONA_POWER_ORDER,
    parsePortalPersonaId,
    sortPersonasByPower,
} from '../constants/portalPersonas';
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

function roleEnvKey(persona: PortalPersonaId): keyof ImportMetaEnv | null {
    const map: Record<PortalPersonaId, keyof ImportMetaEnv> = {
        portal_admin: 'VITE_IMS_PERSONA_PORTAL_ADMIN_SUBSTRINGS',
        org_admin: 'VITE_IMS_PERSONA_ORG_ADMIN_SUBSTRINGS',
        developer: 'VITE_IMS_PERSONA_DEVELOPER_SUBSTRINGS',
        creative: 'VITE_IMS_PERSONA_CREATIVE_SUBSTRINGS',
        marketeer: 'VITE_IMS_PERSONA_MARKETEER_SUBSTRINGS',
        content_creator: 'VITE_IMS_PERSONA_CONTENT_CREATOR_SUBSTRINGS',
        approver: 'VITE_IMS_PERSONA_APPROVER_SUBSTRINGS',
        reviewer: 'VITE_IMS_PERSONA_REVIEWER_SUBSTRINGS',
        editor: 'VITE_IMS_PERSONA_EDITOR_SUBSTRINGS',
        agent: 'VITE_IMS_PERSONA_AGENT_SUBSTRINGS',
    };
    return map[persona] ?? null;
}

function tokenMatchesPersona(hay: string, persona: PortalPersonaId, payload: Record<string, unknown>): boolean {
    const key = roleEnvKey(persona);
    const envVal = key ? (import.meta.env[key] as string | undefined) : undefined;
    if (envListMatches(hay, envVal)) return true;

    // Legacy: single VITE_IMS_PERSONA_ADMIN_SUBSTRINGS used for org admin when ORG_ADMIN env unset
    if (persona === 'org_admin' && envListMatches(hay, import.meta.env.VITE_IMS_PERSONA_ADMIN_SUBSTRINGS)) {
        return true;
    }

    // Heuristic fallback for developer / org_admin from projected product context (no env)
    const ppc = payload.projectedProductContext ?? payload['projectedProductContext'];
    if (typeof ppc === 'string') {
        const s = ppc.toLowerCase();
        if (persona === 'org_admin' && s.includes('admin')) return true;
        if (persona === 'developer' && (s.includes('developer') || s.includes('engineer'))) return true;
    }

    return false;
}

/**
 * Dev / demo: comma-separated persona ids, e.g. `org_admin,developer`.
 * When set, replaces token-derived roles (still sorted by power).
 */
function parseSimulatedRolesFromEnv(): PortalPersonaId[] | null {
    const raw = import.meta.env.VITE_PORTAL_SIMULATED_ROLES?.trim();
    if (!raw) return null;
    const parts = raw.split(',').map((s) => s.trim());
    const ids: PortalPersonaId[] = [];
    for (const p of parts) {
        const id = parsePortalPersonaId(p);
        if (id) ids.push(id);
    }
    return ids.length > 0 ? sortPersonasByPower(ids) : null;
}

/**
 * All portal personas implied by the access token (and optional env simulators),
 * sorted **highest power first**.
 */
export function resolvePersonasFromAccessToken(accessToken: string): PortalPersonaId[] {
    const simulated = parseSimulatedRolesFromEnv();
    if (simulated) return simulated;

    const forced = import.meta.env.VITE_PORTAL_PERSONA_AFTER_SIGNIN?.trim();
    if (forced) {
        const single = parsePortalPersonaId(forced);
        if (single) return [single];
    }

    const payload = decodeImsAccessTokenPayload(accessToken);
    if (!payload) return ['marketeer'];

    const hay = haystackFromPayload(payload);
    const matched: PortalPersonaId[] = [];
    for (const persona of PORTAL_PERSONA_POWER_ORDER) {
        if (tokenMatchesPersona(hay, persona, payload)) {
            matched.push(persona);
        }
    }

    if (matched.length === 0) {
        if (isPortalAdminFromToken(accessToken) && !dualRoleOrgAdminDeveloperDisabled()) {
            return sortPersonasByPower(['org_admin', 'developer']);
        }
        return ['marketeer'];
    }
    return expandOrgAdminDeveloperPair(accessToken, matched);
}

/** When false, do not auto-pair org admin + developer (see `expandOrgAdminDeveloperPair`). */
function dualRoleOrgAdminDeveloperDisabled(): boolean {
    return import.meta.env.VITE_PORTAL_DUAL_ROLE_ORG_ADMIN_DEVELOPER === 'false';
}

/**
 * If IMS considers the user an org admin (`isPortalAdminFromToken`) and the token already shows
 * org admin and/or developer, ensure **both** are present so Admin activities can stack the two
 * contexts (typical for technical org admins). No-op when not an IMS org admin gate match.
 */
function expandOrgAdminDeveloperPair(accessToken: string, matched: PortalPersonaId[]): PortalPersonaId[] {
    if (dualRoleOrgAdminDeveloperDisabled()) {
        return sortPersonasByPower(matched);
    }
    if (!isPortalAdminFromToken(accessToken)) {
        return sortPersonasByPower(matched);
    }
    const out = new Set(matched);
    const adminLike = out.has('portal_admin') || out.has('org_admin');
    const hasDev = out.has('developer');
    if (adminLike && !hasDev) {
        out.add('developer');
    }
    if (hasDev && !adminLike) {
        out.add('org_admin');
    }
    return sortPersonasByPower([...out]);
}

/** Highest-power persona the token (or sim env) implies. */
export function resolvePersonaFromAccessToken(accessToken: string): PortalPersonaId | null {
    const list = resolvePersonasFromAccessToken(accessToken);
    return list[0] ?? null;
}
