import React, { useEffect } from 'react';
import { useAppConfig } from '../hooks/useAppConfig.js';
import type { CartItem } from '../types/index.js';
// import type { HeaderBarProps } from '../types'; // COMMENTED OUT
import AdobeSignInButton from './AdobeSignInButton.js';
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
    handleSignOut
}) => {
    // Get external params from context
    const { externalParams } = useAppConfig();
    const isBlockIntegration = externalParams?.isBlockIntegration;

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
        // TODO: Implement profile menu/dropdown
        console.log('Profile clicked');
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
                    src={`${import.meta.env.BASE_URL}ko-assets-logo.png`}
                    alt="KO Assets Logo"
                    onClick={handleLogoClick}
                />
            )}

            {/* Header right controls: Sign In and Profile */}
            <div className="header-controls">
                <div className="auth-container">
                    <AdobeSignInButton
                        onAuthenticated={handleAuthenticated}
                        onSignOut={handleSignOut}
                    />
                </div>
                {/* Profile icon */}
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
            </div>
        </div>
    );
};

export default HeaderBar; 