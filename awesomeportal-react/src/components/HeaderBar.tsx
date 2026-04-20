import React, { useEffect } from 'react';
import { useAppConfig } from '../hooks/useAppConfig.js';
import type { CartItem } from '../types/index.js';
// import type { HeaderBarProps } from '../types'; // COMMENTED OUT
import { getPortalSpaRootHref } from '../utils/portalSession';
import { getProfilePictureUrl } from '../utils/profileImage.js';
import AdobeSignInButton from './AdobeSignInButton.js';
import PersonaImpersonationStrip from './PersonaImpersonationStrip';
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
    /** Full page load of the SPA entry (current stored persona); used for the header home control. */
    onReloadPortalHome?: () => void;
    /**
     * Global portal chrome between logo and account controls: persona Activities + search
     * (same strip on home and Admin activities).
     */
    portalContextSlot?: React.ReactNode;
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
    onReloadPortalHome,
    portalContextSlot,
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
        if (onReloadPortalHome) {
            onReloadPortalHome();
        } else {
            window.location.assign(getPortalSpaRootHref());
        }
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
            {!isBlockIntegration && (
                <img
                    className="app-logo"
                    src={logoUrl}
                    alt="Portal Logo"
                    onClick={handleLogoClick}
                />
            )}

            {portalContextSlot ? <div className="app-header-portal-context">{portalContextSlot}</div> : null}

            {/* Header right controls: impersonation strip, Sign In, Profile */}
            <div className="header-controls">
                {personaImpersonation ? (
                    <PersonaImpersonationStrip
                        personaLabel={personaImpersonation.personaLabel}
                        onEndPersona={personaImpersonation.onEndPersona}
                    />
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