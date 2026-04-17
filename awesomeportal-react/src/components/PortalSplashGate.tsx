import React, { useCallback, useState } from 'react';
import { isLegacyCookiePortalHost } from '../utils/portalAccess';
import { PORTAL_SPLASH_SESSION_KEY } from '../utils/portalSession';
import SplashPage from './SplashPage';

function isSplashSkippedByEnv(): boolean {
    return import.meta.env.VITE_SKIP_SPLASH === 'true';
}

function readSplashAcked(): boolean {
    if (isSplashSkippedByEnv()) return true;
    try {
        return typeof sessionStorage !== 'undefined' && sessionStorage.getItem(PORTAL_SPLASH_SESSION_KEY) === '1';
    } catch {
        return false;
    }
}

/**
 * Full-screen splash before routes: primary entry is Adobe IMS sign-in (once per tab).
 */
const PortalSplashGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [acknowledged, setAcknowledged] = useState(() => readSplashAcked());

    const openPortalAfterSplash = useCallback(() => {
        try {
            sessionStorage.setItem(PORTAL_SPLASH_SESSION_KEY, '1');
        } catch {
            // ignore (e.g. storage disabled)
        }
        setAcknowledged(true);
    }, []);

    const handleSplashAuthenticated = useCallback(
        (_token: string) => {
            openPortalAfterSplash();
        },
        [openPortalAfterSplash]
    );

    const handleDevContinue = useCallback(() => {
        openPortalAfterSplash();
    }, [openPortalAfterSplash]);

    if (!acknowledged) {
        return (
            <SplashPage
                onAuthenticated={handleSplashAuthenticated}
                onDevContinue={isLegacyCookiePortalHost() ? handleDevContinue : undefined}
            />
        );
    }

    return <>{children}</>;
};

export default PortalSplashGate;
