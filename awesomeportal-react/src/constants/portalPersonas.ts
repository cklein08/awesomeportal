import type { AppItem } from '../components/LeftNav';
import type { PortalPersonaId } from '../types';

export const PORTAL_PERSONA_LABELS: Record<PortalPersonaId, string> = {
    marketeer: 'Marketeer',
    developer: 'Developer',
    admin: 'Org admin',
};

export const PORTAL_PERSONA_ORDER: PortalPersonaId[] = ['marketeer', 'developer', 'admin'];

/** Single-letter mark in the Admin activities top bar (persona-colored tile). */
export const PORTAL_PERSONA_TOPBAR_MARK: Record<PortalPersonaId, string> = {
    marketeer: 'M',
    developer: 'D',
    admin: 'A',
};

/**
 * Left navigation entries per persona. IDs are handled in MainApp.handleAppSelect
 * (e.g. portal-activities → Admin activities, settings → Adobe account).
 */
export function getLeftNavAppsForPersona(persona: PortalPersonaId): AppItem[] {
    if (persona === 'marketeer') {
        return [
            { id: 'dashboard', name: 'Dashboard' },
            { id: 'assets-browser', name: 'Assets browser' },
            { id: 'analytics', name: 'Analytics' },
            { id: 'settings', name: 'Adobe account' },
        ];
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
    // admin — org tooling, unified admin screen, and brand entry point
    return [
        { id: 'dashboard', name: 'Dashboard' },
        { id: 'portal-activities', name: 'Admin activities' },
        { id: 'assets-browser', name: 'Assets browser' },
        { id: 'portal-brand', name: 'Brand & theme' },
        { id: 'analytics', name: 'Analytics' },
        { id: 'settings', name: 'Adobe account' },
    ];
}
