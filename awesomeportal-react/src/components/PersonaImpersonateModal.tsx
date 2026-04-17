import React from 'react';
import { PORTAL_PERSONA_LABELS, PORTAL_PERSONA_ORDER } from '../constants/portalPersonas';
import type { PortalPersonaId } from '../types';
import './PersonaImpersonateModal.css';

export type PersonaImpersonateModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSelectPersona: (persona: PortalPersonaId) => void;
    /** When set, that option is shown as current (optional hint). */
    currentPersona?: PortalPersonaId | null;
};

const PersonaImpersonateModal: React.FC<PersonaImpersonateModalProps> = ({
    isOpen,
    onClose,
    onSelectPersona,
    currentPersona,
}) => {
    if (!isOpen) return null;

    return (
        <div
            className="persona-impersonate-overlay"
            role="presentation"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className="persona-impersonate-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="persona-impersonate-title"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 id="persona-impersonate-title" className="persona-impersonate-title">
                    View portal as
                </h2>
                <p className="persona-impersonate-lede">
                    Choose a persona to load the portal with that role&apos;s navigation and grid. Use End Persona in the header when finished.
                </p>
                <div className="persona-impersonate-list">
                    {PORTAL_PERSONA_ORDER.map((id) => (
                        <button
                            key={id}
                            type="button"
                            className="persona-impersonate-option"
                            onClick={() => onSelectPersona(id)}
                        >
                            <span>{PORTAL_PERSONA_LABELS[id]}</span>
                            {currentPersona === id ? <span className="persona-impersonate-current">Current</span> : null}
                        </button>
                    ))}
                </div>
                <button type="button" className="persona-impersonate-cancel" onClick={onClose}>
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default PersonaImpersonateModal;
