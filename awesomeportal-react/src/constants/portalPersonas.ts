import type { AppItem } from '../components/LeftNav';
import type { PortalPersonaId } from '../types';

/** Highest power first (stacking / IMS resolution order). */
export const PORTAL_PERSONA_POWER_ORDER: PortalPersonaId[] = [
    'portal_admin',
    'org_admin',
    'developer',
    'creative',
    'marketeer',
    'content_creator',
    'approver',
    'reviewer',
    'editor',
    'agent',
];

/** Modals and pickers: same as power order (most privileged listed first). */
export const PORTAL_PERSONA_ORDER: PortalPersonaId[] = [...PORTAL_PERSONA_POWER_ORDER];

const ALL_PERSONA_IDS = new Set<PortalPersonaId>(PORTAL_PERSONA_POWER_ORDER);

export const PORTAL_PERSONA_LABELS: Record<PortalPersonaId, string> = {
    portal_admin: 'Admin',
    /** Same product surface as portal_admin (admin activities, grid chrome, rail). */
    org_admin: 'Admin',
    developer: 'Developer',
    creative: 'Creative',
    marketeer: 'Marketeer',
    content_creator: 'Content Creator',
    approver: 'Approver',
    reviewer: 'Reviewer',
    editor: 'Editor',
    agent: 'Agent',
};

/** Single-letter mark in the Admin activities top bar (persona-colored tile). */
export const PORTAL_PERSONA_TOPBAR_MARK: Record<PortalPersonaId, string> = {
    portal_admin: 'A',
    org_admin: 'A',
    developer: 'D',
    creative: 'C',
    marketeer: 'M',
    content_creator: 'T',
    approver: 'P',
    reviewer: 'R',
    editor: 'E',
    agent: 'G',
};

/**
 * CSS modifier: `admin-shell-topbar-brand--persona-${slug}`.
 * Org admin uses the same chrome as portal admin (single “Admin” experience).
 */
export function portalPersonaCssSlug(persona: PortalPersonaId): string {
    if (persona === 'org_admin') return 'portal-admin';
    return persona.replace(/_/g, '-');
}

export function sortPersonasByPower(ids: PortalPersonaId[]): PortalPersonaId[] {
    const rank = new Map<PortalPersonaId, number>();
    PORTAL_PERSONA_POWER_ORDER.forEach((id, i) => rank.set(id, i));
    return [...ids].sort((a, b) => (rank.get(a) ?? 99) - (rank.get(b) ?? 99));
}

/** Strict: canonical ids only (use `parsePortalPersonaId` for URL / legacy `admin`). */
export function isPortalPersonaId(v: string): v is PortalPersonaId {
    return ALL_PERSONA_IDS.has(v as PortalPersonaId);
}

/** URL query and legacy storage: `admin` → `org_admin`. */
export function parsePortalPersonaId(v: string): PortalPersonaId | null {
    const n = v.trim();
    if (n === 'admin') return 'org_admin';
    if (isPortalPersonaId(n)) return n;
    return null;
}

export function activitiesTitleForPersona(persona: PortalPersonaId): string {
    return `${PORTAL_PERSONA_LABELS[persona]} Activities`;
}

/**
 * Left navigation entries per persona. IDs are handled in MainApp.handleAppSelect
 * (e.g. portal-activities → Admin activities, settings → Adobe account).
 */
export function getLeftNavAppsForPersona(persona: PortalPersonaId): AppItem[] {
    const orgStyleAdmin = (): AppItem[] => [
        { id: 'dashboard', name: 'Dashboard' },
        { id: 'portal-activities', name: 'Admin activities' },
        { id: 'assets-browser', name: 'Assets browser' },
        { id: 'portal-brand', name: 'Brand & theme' },
        { id: 'analytics', name: 'Analytics' },
        { id: 'settings', name: 'Adobe account' },
    ];

    if (persona === 'portal_admin' || persona === 'org_admin') {
        return orgStyleAdmin();
    }
    if (persona === 'developer') {
        return [
            { id: 'dashboard', name: 'Dashboard' },
            { id: 'assets-browser', name: 'Assets browser' },
            { id: 'portal-activities', name: 'Admin activities' },
            { id: 'analytics', name: 'Analytics' },
            { id: 'settings', name: 'Adobe account' },
        ];
    }
    if (persona === 'editor' || persona === 'reviewer' || persona === 'approver') {
        return [
            { id: 'dashboard', name: 'Dashboard' },
            { id: 'assets-browser', name: 'Assets browser' },
            { id: 'portal-activities', name: 'Admin activities' },
            { id: 'analytics', name: 'Analytics' },
            { id: 'settings', name: 'Adobe account' },
        ];
    }
    // creative, marketeer, content_creator, agent — default contributor rail
    return [
        { id: 'dashboard', name: 'Dashboard' },
        { id: 'assets-browser', name: 'Assets browser' },
        { id: 'analytics', name: 'Analytics' },
        { id: 'settings', name: 'Adobe account' },
    ];
}

/** Personas that see grid customize / admin chrome on the home app grid. */
export function personaHasPortalGridAdminChrome(persona: PortalPersonaId): boolean {
    return persona === 'portal_admin' || persona === 'org_admin';
}
