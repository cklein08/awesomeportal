import React, { useCallback, useEffect } from 'react';
import AdobeSignInButton from './AdobeSignInButton';
import { createPortal } from 'react-dom';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSignOut: () => void;
    isAuthenticated?: boolean;
    onSignIn?: (token: string) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onSignOut, isAuthenticated = false, onSignIn }) => {
    const handleEscape = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            onClose();
        }
    }, [onClose]);

    useEffect(() => {
        if (!isOpen) return;
        document.addEventListener('keydown', handleEscape, { capture: true });
        return () => document.removeEventListener('keydown', handleEscape, { capture: true });
    }, [isOpen, handleEscape]);

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    if (!isOpen) return null;

    // If authenticated, show profile info; otherwise show a sign-in prompt
    const user = (window as any).user;
    const displayName = user?.name || user?.email || user?.profile?.email || 'Signed in';

    return createPortal(
        <div className="profile-modal-overlay portal-modal" onClick={handleOverlayClick}>
            <div className="profile-modal">
                <div className="modal-header">
                    <h3 className="modal-title">{isAuthenticated ? 'Profile' : 'Sign in'}</h3>
                    <button className="modal-close-button" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    {isAuthenticated ? (
                        <>
                            <p className="modal-description">{displayName}</p>
                            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                <a className="modal-action-link" href="https://account.adobe.com" target="_blank" rel="noopener noreferrer">View Adobe Account</a>
                                <button className="modal-action-button" onClick={() => { onSignOut(); onClose(); }}>Sign out</button>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="modal-description">Please sign in to access your Adobe account and profile settings.</p>
                            <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
                                <AdobeSignInButton onAuthenticated={(token: string) => { if (onSignIn) onSignIn(token); onClose(); }} onSignOut={() => { /* noop */ }} />
                                <button className="modal-action-button" onClick={onClose}>Cancel</button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ProfileModal;
