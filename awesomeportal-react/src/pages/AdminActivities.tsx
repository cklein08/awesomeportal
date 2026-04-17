import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ADOBE_ENTITLEMENTS } from '../constants/adobeEntitlements';
import { PORTAL_AGENT_MODEL_PROMPTS } from '../constants/portalAgentPrompts';
import {
    getLeftNavAppsForPersona,
    PORTAL_PERSONA_LABELS,
    PORTAL_PERSONA_ORDER,
    PORTAL_PERSONA_TOPBAR_MARK,
} from '../constants/portalPersonas';
import type { EntitlementPayload, ExternalParams, PortalPersonaId, SlotBlockDescriptor } from '../types';
import { AppConfigProvider } from '../components/AppConfigProvider';
import AppGrid, { DRAG_TYPE_ENTITLEMENT } from '../components/AppGrid';
import GridEditForm from '../components/GridEditForm';
import PersonaImpersonateModal from '../components/PersonaImpersonateModal';
import { PersonaGlyph } from '../components/PersonaGlyph';
import { useGridEditor } from '../hooks/useGridEditor';
import { previewAppTilesFromSlotBlocks } from '../hooks/useSlotBlocks';
import {
    appBuilderDropInsToEntitlements,
    getExternalParams,
    getSelectedPersona,
    isPortalPersonaId,
    setSelectedPersona,
} from '../utils/config';
import { canAccessPortalSetup, canImpersonatePortalPersonas, setSkipAdminLandingRedirect } from '../utils/portalAccess';
import './AdminActivities.css';

function readAccessToken(): string {
    try {
        return localStorage.getItem('accessToken') || '';
    } catch {
        return '';
    }
}

type WorkspaceTabId = 'grid' | 'layout' | 'persona';

const AdminActivities: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [storedPersona, setStoredPersona] = useState<PortalPersonaId>(() => getSelectedPersona());
    const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTabId>('grid');
    const [agentPrompt, setAgentPrompt] = useState('');

    const [banner, setBanner] = useState<{ kind: 'success' | 'error' | 'warning'; text: string } | null>(null);
    const [personaImpersonateModalOpen, setPersonaImpersonateModalOpen] = useState(false);
    const [externalParams, setExternalParams] = useState<ExternalParams>(() => getExternalParams());

    const initialPersona = useMemo((): PortalPersonaId => {
        const q = searchParams.get('persona');
        if (q && isPortalPersonaId(q)) return q;
        return getSelectedPersona();
    }, [searchParams]);

    /** When set, header shows "{Persona} Activities" and layout is scoped to that URL (does not follow the in-form picker). */
    const personaFromUrl = useMemo((): PortalPersonaId | null => {
        const q = searchParams.get('persona');
        if (q && isPortalPersonaId(q)) return q;
        return null;
    }, [searchParams]);

    const editor = useGridEditor(initialPersona, { syncGlobalPersona: false });
    const {
        persistSlotsFrom24,
        slotBlocks24,
        setEditingPersona,
        appBuilderApps,
        saved,
        bannerFileError,
        editingPersona,
    } = editor;

    useEffect(() => {
        const q = searchParams.get('persona');
        if (q && isPortalPersonaId(q)) {
            setEditingPersona(q);
        } else {
            setEditingPersona(getSelectedPersona());
        }
    }, [searchParams, setEditingPersona]);

    const allowed = canAccessPortalSetup(readAccessToken(), getSelectedPersona());
    const canImpersonate = allowed && canImpersonatePortalPersonas(readAccessToken());

    useLayoutEffect(() => {
        if (!allowed) {
            navigate('/', { replace: true });
        }
    }, [allowed, navigate]);

    useEffect(() => {
        setExternalParams(getExternalParams());
    }, [editor.config, editor.editingPersona, appBuilderApps]);

    const previewTiles = useMemo(() => previewAppTilesFromSlotBlocks(slotBlocks24), [slotBlocks24]);

    useEffect(() => {
        if (saved) {
            setBanner({
                kind: 'success',
                text: `Layout saved for ${PORTAL_PERSONA_LABELS[editingPersona]}.`,
            });
        }
    }, [saved, editingPersona]);

    useEffect(() => {
        if (bannerFileError) {
            setBanner({ kind: 'error', text: bannerFileError });
        }
    }, [bannerFileError]);

    const handleDropSlot = useCallback(
        (index: number, payload: EntitlementPayload) => {
            const slots = [...slotBlocks24];
            if (slots[index] != null) return;
            if (slots.every((s) => s != null)) return;
            const newBlock: SlotBlockDescriptor = {
                id: payload.id,
                title: payload.title,
                description: payload.description,
                href: payload.href,
                iconUrl: payload.iconUrl,
                openMode: payload.openMode,
                slotType: 'application',
            };
            const next = [...slots];
            next[index] = newBlock;
            persistSlotsFrom24(next);
            setBanner({ kind: 'success', text: `Added "${payload.title}" to the grid.` });
        },
        [persistSlotsFrom24, slotBlocks24]
    );

    const handleRequestDeleteSlot = useCallback(
        (index: number) => {
            const next = [...slotBlocks24];
            next[index] = null;
            persistSlotsFrom24(next);
            setBanner({ kind: 'success', text: 'Removed tile from slot.' });
        },
        [persistSlotsFrom24, slotBlocks24]
    );

    const handleEntitlementDragStart = useCallback((e: React.DragEvent, payload: EntitlementPayload) => {
        e.dataTransfer.setData(DRAG_TYPE_ENTITLEMENT, JSON.stringify(payload));
        e.dataTransfer.effectAllowed = 'copy';
    }, []);

    const navPreview = useMemo(() => getLeftNavAppsForPersona(editor.editingPersona), [editor.editingPersona]);

    const catalogEntitlements = useMemo(
        () => [...ADOBE_ENTITLEMENTS, ...appBuilderDropInsToEntitlements(appBuilderApps)],
        [appBuilderApps]
    );

    const availableEntitlements = useMemo(() => {
        const addedIds = new Set(
            slotBlocks24.filter((b): b is SlotBlockDescriptor => b != null && typeof b === 'object').map((b) => b!.id)
        );
        return catalogEntitlements.filter((ent) => !addedIds.has(ent.id));
    }, [catalogEntitlements, slotBlocks24]);

    const backToPortal = useCallback(() => {
        setSkipAdminLandingRedirect(true);
        navigate('/');
    }, [navigate]);

    if (!allowed) {
        return null;
    }

    const workspaceTabs: { id: WorkspaceTabId; label: string }[] = [
        { id: 'grid', label: 'Grid' },
        { id: 'layout', label: 'Layout & URLs' },
        { id: 'persona', label: 'Persona' },
    ];

    return (
        <AppConfigProvider externalParams={externalParams} dynamicMediaClient={null}>
            <div className={`admin-shell${banner ? ' admin-shell--banner-visible' : ''}`}>
                <header className="admin-shell-topbar">
                    <div
                        className={`admin-shell-topbar-brand${
                            personaFromUrl ? ` admin-shell-topbar-brand--persona-${personaFromUrl}` : ' admin-shell-topbar-brand--persona-admin'
                        }`}
                        aria-label={personaFromUrl ? `${PORTAL_PERSONA_LABELS[personaFromUrl]} activities` : 'Admin activities'}
                    >
                        <span className="admin-shell-logo-mark" aria-hidden>
                            {personaFromUrl ? PORTAL_PERSONA_TOPBAR_MARK[personaFromUrl] : 'A'}
                        </span>
                        <span className="admin-shell-brand-text">
                            {personaFromUrl ? `${PORTAL_PERSONA_LABELS[personaFromUrl]} Activities` : 'Admin activities'}
                        </span>
                    </div>
                    <div className="admin-shell-search" role="search">
                        <span className="admin-shell-search-icon" aria-hidden>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
                            </svg>
                        </span>
                        <input type="search" placeholder="Search admin tools (coming soon)" className="admin-shell-search-input" disabled />
                    </div>
                    <div className="admin-shell-topbar-actions">
                        <button type="button" className="admin-shell-pill" onClick={backToPortal}>
                            Back to portal
                        </button>
                        <button
                            type="button"
                            className="admin-shell-icon-btn admin-shell-icon-btn--header-actions"
                            title="Notifications"
                            aria-label="Notifications"
                        >
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            className="admin-shell-icon-btn admin-shell-icon-btn--header-actions"
                            title="Help"
                            aria-label="Help"
                        >
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                        </button>
                    </div>
                </header>

                <div className="admin-shell-body">
                    <aside className="admin-shell-rail" aria-label="Primary navigation">
                        <Link to="/" className="admin-shell-rail-item" title="Home">
                            <span className="admin-shell-rail-icon">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                    <polyline points="9 22 9 12 15 12 15 22" />
                                </svg>
                            </span>
                            <span className="admin-shell-rail-label">Home</span>
                        </Link>
                        <Link to="/" className="admin-shell-rail-item" title="Apps">
                            <span className="admin-shell-rail-icon">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="7" height="7" rx="1" />
                                    <rect x="14" y="3" width="7" height="7" rx="1" />
                                    <rect x="14" y="14" width="7" height="7" rx="1" />
                                    <rect x="3" y="14" width="7" height="7" rx="1" />
                                </svg>
                            </span>
                            <span className="admin-shell-rail-label">Apps</span>
                        </Link>
                        <div className="admin-shell-rail-files-stack">
                            <Link to="/" className="admin-shell-rail-item" title="Files — open portal">
                                <span className="admin-shell-rail-icon">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                    </svg>
                                </span>
                                <span className="admin-shell-rail-label">Files</span>
                            </Link>
                            {canImpersonate ? (
                                <button
                                    type="button"
                                    className="admin-shell-rail-persona-btn"
                                    title="View portal as a persona"
                                    aria-label="View portal as a persona"
                                    onClick={() => setPersonaImpersonateModalOpen(true)}
                                >
                                    <PersonaGlyph size={20} />
                                </button>
                            ) : null}
                        </div>
                        <div className="admin-shell-rail-divider" aria-hidden />
                    </aside>

                    <main className="admin-shell-main">
                        <section className="admin-shell-agent" aria-label="Agent prompt (coming soon)">
                            <div className="admin-shell-agent-label">Prompt</div>
                            <textarea
                                className="admin-shell-agent-input"
                                placeholder="Describe what you want to change or generate for the portal. A top-level agent will run here later."
                                value={agentPrompt}
                                onChange={(e) => setAgentPrompt(e.target.value)}
                                rows={3}
                            />
                            <div className="admin-shell-agent-footer">
                                <span className="admin-shell-agent-chip">Portal</span>
                                <span className="admin-shell-agent-chip">Auto</span>
                                <button type="button" className="admin-shell-agent-generate" disabled>
                                    Generate
                                </button>
                            </div>
                            <div className="admin-shell-agent-prompts" aria-label="Starter prompts (coming soon)">
                                <span className="admin-shell-agent-prompts-label">Starter prompts</span>
                                <div className="admin-shell-agent-prompts-row">
                                    {PORTAL_AGENT_MODEL_PROMPTS.map((label) => (
                                        <button
                                            key={label}
                                            type="button"
                                            className="admin-shell-agent-prompt-chip"
                                            disabled
                                            title="Coming soon: insert into prompt and run agent"
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                                <p className="admin-shell-agent-prompts-hint">
                                    Drag apps from the right into empty slots on the <strong>Grid</strong> tab. Status messages appear in the bar at the bottom of the screen when something completes or fails.
                                </p>
                            </div>
                        </section>

                        <div className="admin-shell-tabs" role="tablist" aria-label="Workspace">
                            {workspaceTabs.map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={workspaceTab === t.id}
                                    className={`admin-shell-tab ${workspaceTab === t.id ? 'active' : ''}`}
                                    onClick={() => setWorkspaceTab(t.id)}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        <div className="admin-shell-workspace">
                            {workspaceTab === 'grid' ? (
                                <div className="admin-shell-grid-wrap">
                                    <div className="admin-shell-grid-persona" role="status">
                                        <span className="admin-shell-grid-persona-label">Drop-ins apply to</span>
                                        <span className="admin-shell-grid-persona-name">
                                            {PORTAL_PERSONA_LABELS[editor.editingPersona]}
                                        </span>
                                        <span className="admin-shell-grid-persona-hint">
                                            Change persona on the Layout &amp; URLs tab (&quot;Layout for&quot;).
                                        </span>
                                    </div>
                                    <AppGrid
                                        tiles={previewTiles}
                                        topContent={editor.config.gridTopContent ?? ''}
                                        topBanners={editor.config.gridTopBanners}
                                        slotHeight={editor.config.slotHeight}
                                        slotWidth={editor.config.slotWidth}
                                        onDropSlot={handleDropSlot}
                                        inlineSlotRemove
                                        onRequestDeleteSlot={handleRequestDeleteSlot}
                                    />
                                </div>
                            ) : null}
                            {workspaceTab === 'layout' ? (
                                <div className="admin-shell-layout-panel">
                                    <GridEditForm {...editor} showPersonaPicker />
                                </div>
                            ) : null}
                            {workspaceTab === 'persona' ? (
                                <div className="admin-shell-persona-panel">
                                    <p className="admin-shell-muted">
                                        Layout and grid apply to <strong>{PORTAL_PERSONA_LABELS[editor.editingPersona]}</strong>. Use the
                                        persona control inside Layout &amp; URLs for finer grid fields, or switch default persona below.
                                    </p>
                                    <label className="admin-shell-field">
                                        <span>Default persona (stored)</span>
                                        <select
                                            value={storedPersona}
                                            onChange={(e) => {
                                                const v = e.target.value as PortalPersonaId;
                                                if (PORTAL_PERSONA_ORDER.includes(v)) {
                                                    setSelectedPersona(v);
                                                    setStoredPersona(v);
                                                    setExternalParams(getExternalParams());
                                                }
                                            }}
                                        >
                                            {PORTAL_PERSONA_ORDER.map((id) => (
                                                <option key={id} value={id}>
                                                    {PORTAL_PERSONA_LABELS[id]}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <p className="admin-shell-muted">Left nav for this persona:</p>
                                    <ul className="admin-shell-nav-preview">
                                        {navPreview.map((a) => (
                                            <li key={a.id}>{a.name}</li>
                                        ))}
                                    </ul>
                                    <Link className="admin-shell-btn-primary" to="/" state={{ openSkinEditor: true }}>
                                        Open skin editor
                                    </Link>
                                </div>
                            ) : null}
                        </div>

                        <section className="admin-shell-bottom-slot" aria-label="Reserved for future content">
                            <p className="admin-shell-bottom-placeholder">Content area reserved for documentation, activity feed, or embeds.</p>
                        </section>
                    </main>

                    <aside className="admin-shell-right" aria-label="Drop-ins and catalog">
                        <div className="admin-shell-right-header">
                            <h2 className="admin-shell-right-title">Drop-ins</h2>
                            <span className="admin-shell-right-sub">Entitled apps</span>
                        </div>
                        <p className="admin-shell-muted admin-shell-right-lede">
                            Drag into an empty slot on the Grid tab. App Builder URLs from Layout appear here after save.
                        </p>
                        <div className="admin-shell-entitlement-list">
                            {availableEntitlements.length === 0 ? (
                                <p className="admin-shell-muted">All catalog apps are on the grid for this persona.</p>
                            ) : null}
                            {availableEntitlements.map((ent) => (
                                <div
                                    key={ent.id}
                                    className="admin-shell-entitlement-tile"
                                    draggable
                                    onDragStart={(e) => handleEntitlementDragStart(e, ent)}
                                >
                                    <div className="admin-shell-entitlement-icon">
                                        {ent.iconUrl ? (
                                            <img src={ent.iconUrl} alt="" width={36} height={36} />
                                        ) : (
                                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                <polyline points="15 3 21 3 21 9" />
                                                <line x1="10" y1="14" x2="21" y2="3" />
                                            </svg>
                                        )}
                                    </div>
                                    <div>
                                        <div className="admin-shell-entitlement-title">{ent.title}</div>
                                        {ent.description ? <div className="admin-shell-entitlement-desc">{ent.description}</div> : null}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>
                </div>

                {banner ? (
                    <div
                        className={`admin-shell-banner admin-shell-banner--${banner.kind}`}
                        role="status"
                        aria-live="polite"
                    >
                        <div className="admin-shell-banner-msg">{banner.text}</div>
                        <button type="button" className="admin-shell-banner-dismiss" onClick={() => setBanner(null)} aria-label="Dismiss">
                            ×
                        </button>
                    </div>
                ) : null}

                {personaImpersonateModalOpen &&
                    createPortal(
                        <PersonaImpersonateModal
                            isOpen
                            onClose={() => setPersonaImpersonateModalOpen(false)}
                            onSelectPersona={(p) => {
                                setSelectedPersona(p);
                                setSkipAdminLandingRedirect(true);
                                setPersonaImpersonateModalOpen(false);
                                navigate('/');
                            }}
                            currentPersona={getSelectedPersona()}
                        />,
                        document.body
                    )}
            </div>
        </AppConfigProvider>
    );
};

export default AdminActivities;
