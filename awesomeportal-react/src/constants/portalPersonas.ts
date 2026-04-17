import type { AppItem } from '../components/LeftNav';
import type { PortalPersonaId } from '../types';

export const PORTAL_PERSONA_LABELS: Record<PortalPersonaId, string> = {
    marketeer: 'Marketeer',
    developer: 'Developer',
    admin: 'Org admin',
};

export const PORTAL_PERSONA_ORDER: PortalPersonaId[] = ['marketeer', 'developer', 'admin'];

/**
 * Left navigation entries per persona. IDs are handled in MainApp.handleAppSelect
 * (e.g. portal-grid → grid editor, settings → Adobe account).
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
            { id: 'portal-grid', name: 'Portal layout' },
            { id: 'analytics', name: 'Analytics' },
            { id: 'settings', name: 'Adobe account' },
        ];
    }
    // admin — full org tooling + layout and brand entry points
    return [
        { id: 'dashboard', name: 'Dashboard' },
        { id: 'assets-browser', name: 'Assets browser' },
        { id: 'portal-grid', name: 'Portal layout' },
        { id: 'portal-brand', name: 'Brand & theme' },
        { id: 'analytics', name: 'Analytics' },
        { id: 'settings', name: 'Adobe account' },
    ];
}
