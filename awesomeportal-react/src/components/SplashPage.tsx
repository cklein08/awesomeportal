import React from 'react';
import './SplashPage.css';
import { withBase } from '../utils/pathUtils';

export type SplashPageProps = {
    onContinue: () => void;
};

const isHeinekenDemo = import.meta.env.VITE_HEINEKEN_DEMO === 'true';

const SplashPage: React.FC<SplashPageProps> = ({ onContinue }) => {
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
                        Awesome Portal
                    </h1>
                    <p className="splash-page-lede">
                        Continue to open the portal. This screen is shown once per browser tab session.
                    </p>
                    <button type="button" className="splash-page-cta" onClick={onContinue}>
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SplashPage;
