import React from 'react';
import { PersonaGlyph } from './PersonaGlyph';
import './HeaderBar.css';

export type PersonaImpersonationStripProps = {
    personaLabel: string;
    onEndPersona: () => void;
};

/** Glyph + persona label + End Persona (shared by HeaderBar and Admin activities). */
const PersonaImpersonationStrip: React.FC<PersonaImpersonationStripProps> = ({ personaLabel, onEndPersona }) => (
    <div className="header-persona-impersonation" role="status">
        <span className="header-persona-impersonation-icon" aria-hidden>
            <PersonaGlyph size={20} />
        </span>
        <span className="header-persona-impersonation-name">{personaLabel}</span>
        <button type="button" className="header-persona-impersonation-end" onClick={onEndPersona}>
            End Persona
        </button>
    </div>
);

export default PersonaImpersonationStrip;
