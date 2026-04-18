import React from 'react';
import AdobeSignInButton from './AdobeSignInButton';
import { getProfilePictureUrl } from '../utils/profileImage';
import type { ProfileWithImage } from '../utils/profileImage';
import './HeaderBar.css';
import '../pages/AdminActivities.css';

export type AdminShellTopbarHelpAuthProps = {
    sessionActive: boolean;
    imsSession: boolean;
    onAuthenticated: (token: string) => void;
    onSignOut: () => void;
    profile?: ProfileWithImage;
};

/**
 * Shared right cluster: notifications (bell), help (? in circle), Adobe sign-out / sign-in, profile (person) icon.
 */
const AdminShellTopbarHelpAuth: React.FC<AdminShellTopbarHelpAuthProps> = ({
    sessionActive,
    imsSession,
    onAuthenticated,
    onSignOut,
    profile,
}) => {
    const pictureUrl = getProfilePictureUrl(profile);

    const handleProfileClick = () => {
        try {
            window.open('https://account.adobe.com', '_blank', 'noopener');
        } catch {
            /* ignore */
        }
    };

    return (
        <>
            <button
                type="button"
                className="admin-shell-icon-btn admin-shell-icon-btn--header-actions"
                title="Notifications"
                aria-label="Notifications"
            >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
            </button>
            <button type="button" className="admin-shell-help-q-btn" title="Help" aria-label="Help">
                <span className="admin-shell-help-q-btn-ring" aria-hidden>
                    <span className="admin-shell-help-q-char">?</span>
                </span>
            </button>
            <div className="admin-shell-topbar-auth">
                <AdobeSignInButton
                    onAuthenticated={onAuthenticated}
                    onSignOut={onSignOut}
                    sessionActive={sessionActive}
                    imsSession={imsSession}
                    imsBearerSignOutLabel="Sign out of Adobe"
                />
                {pictureUrl ? (
                    <button type="button" className="profile-icon-btn" onClick={handleProfileClick} aria-label="Profile" title="Adobe account">
                        <img src={pictureUrl} alt="" className="profile-avatar account-profile-image" width={24} height={24} />
                    </button>
                ) : (
                    <button type="button" className="profile-icon-btn" onClick={handleProfileClick} aria-label="Profile" title="Adobe account">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </button>
                )}
            </div>
        </>
    );
};

export default AdminShellTopbarHelpAuth;
