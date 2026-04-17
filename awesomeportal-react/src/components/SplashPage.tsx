import React from 'react';
import './SplashPage.css';

export type SplashPageProps = {
    onContinue: () => void;
};

const SplashPage: React.FC<SplashPageProps> = ({ onContinue }) => {
    return (
        <div className="splash-page" role="dialog" aria-modal="true" aria-labelledby="splash-title">
            <div className="splash-page-inner">
                <p className="splash-page-kicker">Adobe</p>
                <h1 id="splash-title" className="splash-page-title">
                    Awesome Portal
                </h1>
                <p className="splash-page-lede">
                    Continue to open the portal. This screen is shown once per browser tab session.
                </p>
                <button type="button" className="splash-page-cta" onClick={onContinue}>
                    Continue to portal
                </button>
            </div>
        </div>
    );
};

export default SplashPage;
