/**
 * Display name for the portal (e.g. client or program). Shown in splash title as "{name} Portal".
 * Set `VITE_PORTAL_CLIENT_NAME` per deployment; defaults to "Client" when unset.
 */
export function getPortalClientName(): string {
    const v = import.meta.env.VITE_PORTAL_CLIENT_NAME?.trim();
    return v && v.length > 0 ? v : 'Client';
}

export function getPortalTitle(): string {
    return `${getPortalClientName()} Portal`;
}
