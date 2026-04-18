import React from 'react';
import AdobeSignInButton from './AdobeSignInButton';
import './SplashPage.css';
import { isLegacyCookiePortalHost } from '../utils/portalAccess';
import { getPortalTitle } from '../utils/portalBranding';
import { withBase } from '../utils/pathUtils';

export type SplashPageProps = {
    /** Called after IMS stores a token (splash gate then opens the app). */
    onAuthenticated: (token: string) => void;
    /** Legacy cookie dev hosts only: enter portal without Adobe sign-in. */
    onDevContinue?: () => void;
};

const isHeinekenDemo = import.meta.env.VITE_HEINEKEN_DEMO === 'true';

const SplashPage: React.FC<SplashPageProps> = ({ onAuthenticated, onDevContinue }) => {
    const portalTitle = getPortalTitle();
    const showDevSkip = Boolean(onDevContinue) && isLegacyCookiePortalHost();

    return (
        <div
            className={`splash-page${isHeinekenDemo ? ' splash-page--heineken' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="splash-title"
        >
            <div className="splash-page-inner">
                <div className="splash-page-card">
                    {isHeinekenDemo ? (
                        <img className="splash-page-logo" src={withBase('/brand-demos/heineken/logo.svg')} alt="Heineken" />
                    ) : (
                        <p className="splash-page-kicker">Adobe</p>
                    )}
                    <h1 id="splash-title" className="splash-page-title">
                        {portalTitle}
                    </h1>
                    <p className="splash-page-lede">
                        Sign in with your Adobe ID. After Adobe returns you here, we wait briefly so you can confirm your profile or organization before opening the
                        portal. This screen is shown once per browser tab until you sign in (or continue on a supported dev host).
                    </p>
                    <div className="splash-page-auth">
                        <AdobeSignInButton
                            onAuthenticated={onAuthenticated}
                            onSignOut={() => {
                                try {
                                    localStorage.removeItem('accessToken');
                                    localStorage.removeItem('tokenExpiresAt');
                                } catch {
                                    /* ignore */
                                }
                            }}
                        />
                    </div>
                    {showDevSkip ? (
                        <p className="splash-page-dev-wrap">
                            <button type="button" className="splash-page-dev-link" onClick={() => onDevContinue?.()}>
                                Continue without Adobe (local cookie host)
                            </button>
                        </p>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default SplashPage;
