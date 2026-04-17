import React, { useCallback, useState } from 'react';
import SplashPage from './SplashPage';

const SPLASH_SESSION_KEY = 'awesomeportal_splash_ack';

function readSplashAcked(): boolean {
    try {
        return typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SPLASH_SESSION_KEY) === '1';
    } catch {
        return false;
    }
}

/**
 * Full-screen splash shown once per browser tab session until the user continues.
 * Wraps the router tree in {@link App}.
 */
const PortalSplashGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [acknowledged, setAcknowledged] = useState(readSplashAcked);

    const handleContinue = useCallback(() => {
        try {
            sessionStorage.setItem(SPLASH_SESSION_KEY, '1');
        } catch {
            // ignore (e.g. storage disabled)
        }
        setAcknowledged(true);
    }, []);

    if (!acknowledged) {
        return <SplashPage onContinue={handleContinue} />;
    }

    return <>{children}</>;
};

export default PortalSplashGate;
