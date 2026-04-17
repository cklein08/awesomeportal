import React, { useEffect } from 'react';
import { useAppConfig } from '../hooks/useAppConfig.js';
import type { CartItem } from '../types/index.js';
// import type { HeaderBarProps } from '../types'; // COMMENTED OUT
import { getProfilePictureUrl } from '../utils/profileImage.js';
import AdobeSignInButton from './AdobeSignInButton.js';
import { PersonaGlyph } from './PersonaGlyph';
// import CartPanel from './CartPanel'; // REMOVED - moved to MainApp
import './HeaderBar.css';

// Extend window interface for cart badge function
declare global {
    interface Window {
        updateCartBadge?: (numItems: number) => void;
    }
}

// Simplified HeaderBar props interface
interface HeaderBarPropsSimplified {
    cartItems: CartItem[];
    handleAuthenticated: (token: string) => void;
    handleSignOut: () => void;
    profile?: any;
    /** Drives auth button: signed in vs sign in (includes cookie-only sessions when true). */
    sessionActive?: boolean;
    /** When true with sessionActive, sign-out label is "Sign Out with Adobe". */
    imsSession?: boolean;
    /** Shown top-right when an admin is viewing the portal as another persona. */
    personaImpersonation?: { personaLabel: string; onEndPersona: () => void } | null;
}

const HeaderBar: React.FC<HeaderBarPropsSimplified> = ({
    cartItems, // Keep for window.updateCartBadge
    // setCartItems, // Removed - cart moved to MainApp
    // isCartOpen, // Removed - cart moved to MainApp  
    // setIsCartOpen, // Removed - cart moved to MainApp
    // handleRemoveFromCart, // Removed - cart moved to MainApp
    // handleApproveAssets, // Removed - cart moved to MainApp
    // handleDownloadAssets, // Removed - cart moved to MainApp
    handleAuthenticated,
    handleSignOut,
    profile,
    sessionActive,
    imsSession,
    personaImpersonation,
}) => {
    // Get external params and skin from context
    const { externalParams, skinConfig } = useAppConfig();
    const isBlockIntegration = externalParams?.isBlockIntegration;
    const logoUrl = skinConfig?.logoUrl || `${import.meta.env.BASE_URL}icons/info.svg`;

    useEffect(() => {
        if (window.updateCartBadge && typeof window.updateCartBadge === 'function') {
            window.updateCartBadge(cartItems.length);
        }
    }, [cartItems.length]);

    const handleLogoClick = () => {
        window.location.assign('/');
    };

    const handleHomeClick = () => {
        window.location.assign('/');
    };

    const handleProfileClick = () => {
        // If we have a profile, open Adobe account; otherwise fallback to a console log
        if (profile) {
            try {
                window.open('https://account.adobe.com', '_blank', 'noopener');
                return;
            } catch (err) {
                console.warn('Failed to open Adobe account URL', err);
            }
        }

        // no profile available — placeholder for sign-in behavior
        console.log('Profile clicked (no profile)');
    };

    return (
        <div className="app-header">
            {/* Home icon on far left */}
            <button 
                className="home-icon-btn" 
                onClick={handleHomeClick}
                aria-label="Home"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
            </button>

            {!isBlockIntegration && (
                <img
                    className="app-logo"
                    src={logoUrl}
                    alt="Portal Logo"
                    onClick={handleLogoClick}
                />
            )}

            {/* Header right controls: impersonation strip, Sign In, Profile */}
            <div className="header-controls">
                {personaImpersonation ? (
                    <div className="header-persona-impersonation" role="status">
                        <span className="header-persona-impersonation-icon" aria-hidden>
                            <PersonaGlyph size={20} />
                        </span>
                        <span className="header-persona-impersonation-name">{personaImpersonation.personaLabel}</span>
                        <button type="button" className="header-persona-impersonation-end" onClick={personaImpersonation.onEndPersona}>
                            End Persona
                        </button>
                    </div>
                ) : null}
                <div className="auth-container">
                    <AdobeSignInButton
                        onAuthenticated={handleAuthenticated}
                        onSignOut={handleSignOut}
                        sessionActive={sessionActive}
                        imsSession={imsSession}
                    />
                </div>
                {/* Profile icon — same source as account.adobe.com (IMS picture or Gravatar) */}
                {(() => {
                    const pictureUrl = getProfilePictureUrl(profile);
                    if (pictureUrl) {
                        return (
                            <button className="profile-icon-btn" onClick={handleProfileClick} aria-label="Profile">
                                <img src={pictureUrl} alt="Profile" className="profile-avatar account-profile-image" />
                            </button>
                        );
                    }

                    return (
                        <button 
                            className="profile-icon-btn" 
                            onClick={handleProfileClick}
                            aria-label="Profile"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </button>
                    );
                })()}
            </div>
        </div>
    );
};

export default HeaderBar; 