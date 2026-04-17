import React from 'react';

/** Compact rail icon for a portal left-nav app id. */
export function PortalAppRailIcon({ appId }: { appId: string }): React.JSX.Element {
    switch (appId) {
        case 'dashboard':
            return (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <rect x="3" y="3" width="7" height="9" rx="1" />
                    <rect x="14" y="3" width="7" height="5" rx="1" />
                    <rect x="14" y="12" width="7" height="9" rx="1" />
                    <rect x="3" y="16" width="7" height="5" rx="1" />
                </svg>
            );
        case 'assets-browser':
            /* Image-frame glyph (distinct from Files folder in the rail). */
            return (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <circle cx="8.5" cy="9.5" r="1.5" />
                    <path d="M3 17 7.5 12.5l3 3L15 9l6 8" />
                </svg>
            );
        case 'portal-activities':
        case 'portal-admin':
        case 'portal-grid':
            return (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m6.28 6.28l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m6.28-6.28l4.24-4.24" />
                </svg>
            );
        case 'portal-brand':
            return (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                    <path d="M2 22h20" />
                </svg>
            );
        case 'analytics':
            return (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M3 3v18h18" />
                    <path d="M7 16l4-4 4 4 6-6" />
                </svg>
            );
        case 'settings':
            return (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
            );
        default:
            return (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                </svg>
            );
    }
}
