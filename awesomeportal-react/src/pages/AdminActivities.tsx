import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import type { AppItem } from '../components/LeftNav';
import SkinEditorModal from '../components/SkinEditorModal';
import { ADOBE_ENTITLEMENTS } from '../constants/adobeEntitlements';
import { PORTAL_AGENT_MODEL_PROMPTS } from '../constants/portalAgentPrompts';
import { PORTAL_EMBED_ADOBE_FILES_APP_ID } from '../constants/adobeFilesEmbed';
import {
    PORTAL_PERSONA_LABELS,
    PORTAL_PERSONA_ORDER,
    personaHasPortalGridAdminChrome,
} from '../constants/portalPersonas';
import type { CartItem, EntitlementPayload, ExternalParams, PortalPersonaId, SlotBlockDescriptor } from '../types';
import { AppConfigProvider } from '../components/AppConfigProvider';
import AppGrid, { DRAG_TYPE_ENTITLEMENT } from '../components/AppGrid';
import GridEditForm from '../components/GridEditForm';
import HeaderBar from '../components/HeaderBar';
import PersonaActivitiesTopbar from '../components/PersonaActivitiesTopbar';
import PersonaImpersonateModal from '../components/PersonaImpersonateModal';
import PortalMultiRoleActivitiesBar from '../components/PortalMultiRoleActivitiesBar';
import { PersonaGlyph } from '../components/PersonaGlyph';
import { PortalAppRailIcon } from '../components/PortalAppRailIcon';
import { useGridEditor } from '../hooks/useGridEditor';
import { previewAppTilesFromSlotBlocks, stripAppBuilderSlotsForViewer } from '../hooks/useSlotBlocks';
import {
    appBuilderDropInsToEntitlements,
    clearEphemeralLocalStorageOnSignOut,
    clearPersonaLeftNavOverride,
    getEffectiveLeftNavForPersona,
    getExternalParams,
    getSelectedPersona,
    parsePortalPersonaId,
    PERSONA_LEFT_NAV_STORAGE_KEY,
    PERSONA_LEFT_NAV_UPDATED_EVENT,
    setPersonaLeftNavForPersona,
    setSelectedPersona,
} from '../utils/config';
import { ensureSlots24 } from '../utils/gridSlots';
import { decodeImsAccessTokenPayload, resolvePersonaFromAccessToken, resolvePersonasFromAccessToken } from '../utils/imsPersona';
import { endPersonaImpersonationPersist, getPortalPersonaImpersonationUi } from '../utils/portalPersonaImpersonation';
import { canAccessPortalSetup, canImpersonatePortalPersonas, setSkipAdminLandingRedirect } from '../utils/portalAccess';
import { getPortalSpaRootHref, setPortalPersonaPreviewStripActive } from '../utils/portalSession';
import './AdminActivities.css';

function readAccessToken(): string {
    try {
        return localStorage.getItem('accessToken') || '';
    } catch {
        return '';
    }
}

function isCookieAuth(): boolean {
    return (
        window.location.origin.endsWith('adobeaem.workers.dev') || window.location.origin === 'http://localhost:8787'
    );
}

type WorkspaceTabId = 'grid' | 'layout' | 'personas' | 'skin';

const AdminActivities: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [impersonationUiRev, setImpersonationUiRev] = useState(0);
    const [storedPersona, setStoredPersona] = useState<PortalPersonaId>(() => getSelectedPersona());
    const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTabId>('grid');
    const [agentPrompt, setAgentPrompt] = useState('');

    const [banner, setBanner] = useState<{ kind: 'success' | 'error' | 'warning'; text: string } | null>(null);
    const [personaImpersonateModalOpen, setPersonaImpersonateModalOpen] = useState(false);
    const [externalParams, setExternalParams] = useState<ExternalParams>(() => getExternalParams());
    const [headerEpoch, setHeaderEpoch] = useState(0);
    const [cartItems] = useState<CartItem[]>(() => {
        try {
            const stored = localStorage.getItem('cartItems');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    const adminProfile = useMemo(() => {
        void headerEpoch;
        const t = readAccessToken();
        if (!t.trim()) return null;
        const payload = decodeImsAccessTokenPayload(t);
        const pic =
            (payload && typeof payload.picture === 'string' && payload.picture) ||
            (payload &&
            typeof (payload as Record<string, unknown>).avatar === 'string' &&
                ((payload as Record<string, unknown>).avatar as string)) ||
            '';
        return pic ? { picture: pic } : null;
    }, [headerEpoch]);

    const handleAdminAuthenticated = useCallback((token: string) => {
        try {
            localStorage.setItem('accessToken', token);
        } catch {
            /* ignore */
        }
        setHeaderEpoch((n) => n + 1);
    }, []);

    const handleAdminSignOut = useCallback(() => {
        setSkipAdminLandingRedirect(false);
        try {
            localStorage.removeItem('accessToken');
        } catch {
            /* ignore */
        }
        try {
            clearEphemeralLocalStorageOnSignOut();
            sessionStorage.clear();
        } catch {
            /* ignore */
        }
        window.location.assign(getPortalSpaRootHref());
    }, []);

    const initialPersona = useMemo((): PortalPersonaId => {
        void impersonationUiRev;
        const q = searchParams.get('persona');
        const parsed = q ? parsePortalPersonaId(q) : null;
        if (parsed) return parsed;
        return getSelectedPersona();
    }, [searchParams, impersonationUiRev]);

    /** When set, header shows "{Persona} Activities" and layout is scoped to that URL (does not follow the in-form picker). */
    const personaFromUrl = useMemo((): PortalPersonaId | null => {
        const q = searchParams.get('persona');
        return q ? parsePortalPersonaId(q) : null;
    }, [searchParams]);

    const impersonationUi = useMemo(() => {
        void impersonationUiRev;
        void searchParams;
        const token = readAccessToken();
        return getPortalPersonaImpersonationUi(token, getSelectedPersona());
    }, [searchParams, impersonationUiRev]);

    const topbarScopePersona = useMemo((): PortalPersonaId | null => {
        if (personaFromUrl) return personaFromUrl;
        if (impersonationUi) return impersonationUi.effectivePersonaId;
        return null;
    }, [personaFromUrl, impersonationUi]);

    const handleEndPersonaImpersonationAdmin = useCallback(() => {
        const token = readAccessToken();
        const ims = resolvePersonaFromAccessToken(token);
        if (ims == null) return;
        endPersonaImpersonationPersist(ims);
        setStoredPersona(ims);
        setImpersonationUiRev((n) => n + 1);
        const primary = resolvePersonaFromAccessToken(token) ?? 'marketeer';
        navigate(`/admin/activities?persona=${encodeURIComponent(primary)}`, { replace: true });
    }, [navigate]);

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

    const [leftNavRev, setLeftNavRev] = useState(0);
    useEffect(() => {
        const bump = (): void => setLeftNavRev((n) => n + 1);
        window.addEventListener(PERSONA_LEFT_NAV_UPDATED_EVENT, bump);
        const onStorage = (e: StorageEvent): void => {
            if (e.key === PERSONA_LEFT_NAV_STORAGE_KEY) bump();
        };
        window.addEventListener('storage', onStorage);
        return () => {
            window.removeEventListener(PERSONA_LEFT_NAV_UPDATED_EVENT, bump);
            window.removeEventListener('storage', onStorage);
        };
    }, []);

    const showPortalAdminChrome = personaHasPortalGridAdminChrome(editor.editingPersona);
    const personaRailApps = useMemo(
        () => getEffectiveLeftNavForPersona(editor.editingPersona).filter((a) => a.id !== 'assets-browser'),
        [editor.editingPersona, leftNavRev]
    );

    useEffect(() => {
        if (!showPortalAdminChrome) {
            setWorkspaceTab('grid');
        }
    }, [showPortalAdminChrome, editor.editingPersona]);

    useEffect(() => {
        const q = searchParams.get('persona');
        const parsed = q ? parsePortalPersonaId(q) : null;
        if (parsed) {
            setEditingPersona(parsed);
        } else {
            setEditingPersona(getSelectedPersona());
        }
    }, [searchParams, setEditingPersona]);

    const matchedRoles = resolvePersonasFromAccessToken(readAccessToken());

    useEffect(() => {
        const p = parsePortalPersonaId(searchParams.get('persona') ?? '');
        if (!p) return;
        setSelectedPersona(p);
        setStoredPersona(p);
    }, [searchParams]);

    const allowed = canAccessPortalSetup(readAccessToken(), getSelectedPersona());
    const canImpersonate = allowed && canImpersonatePortalPersonas(readAccessToken());

    /** Default Admin activities scope to the user’s highest entitled persona. */
    useEffect(() => {
        if (!allowed) return;
        if (impersonationUi) return;
        const raw = searchParams.get('persona');
        if (raw && parsePortalPersonaId(raw)) return;
        const primary = matchedRoles[0];
        if (!primary) return;
        navigate(`/admin/activities?persona=${encodeURIComponent(primary)}`, { replace: true });
    }, [allowed, impersonationUi, searchParams, matchedRoles, navigate]);

    useLayoutEffect(() => {
        if (!allowed) {
            navigate('/', { replace: true });
        }
    }, [allowed, navigate]);

    useEffect(() => {
        setExternalParams(getExternalParams());
    }, [editor.config, editor.editingPersona, appBuilderApps]);

    const previewTiles = useMemo(() => {
        const stripped = stripAppBuilderSlotsForViewer(ensureSlots24(slotBlocks24), editor.editingPersona);
        return previewAppTilesFromSlotBlocks(stripped);
    }, [slotBlocks24, editor.editingPersona]);

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

    const [navDraft, setNavDraft] = useState<AppItem[]>(() => getEffectiveLeftNavForPersona(getSelectedPersona()));

    useEffect(() => {
        setNavDraft(getEffectiveLeftNavForPersona(storedPersona));
    }, [storedPersona]);

    const updateNavRow = useCallback((index: number, patch: Partial<AppItem>) => {
        setNavDraft((rows) => {
            const next = [...rows];
            const cur = next[index];
            if (!cur) return rows;
            next[index] = { ...cur, ...patch };
            return next;
        });
    }, []);

    const addNavRow = useCallback(() => {
        const id =
            typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
                ? `nav-${crypto.randomUUID()}`
                : `nav-${Date.now()}`;
        setNavDraft((rows) => [...rows, { id, name: 'New item', href: '' }]);
    }, []);

    const removeNavRow = useCallback((index: number) => {
        setNavDraft((rows) => rows.filter((_, i) => i !== index));
    }, []);

    const saveNavDraft = useCallback(() => {
        const cleaned = navDraft
            .map((r) => ({
                id: r.id.trim(),
                name: r.name.trim(),
                href: r.href?.trim() ? r.href.trim() : undefined,
            }))
            .filter((r) => r.id.length > 0 && r.name.length > 0);
        if (cleaned.length === 0) {
            setBanner({ kind: 'error', text: 'Add at least one nav row with an id and label.' });
            return;
        }
        setPersonaLeftNavForPersona(storedPersona, cleaned);
        setNavDraft(cleaned);
        setBanner({
            kind: 'success',
            text: `Saved left nav for ${PORTAL_PERSONA_LABELS[storedPersona]}.`,
        });
    }, [storedPersona, navDraft]);

    const resetNavToDefaults = useCallback(() => {
        clearPersonaLeftNavOverride(storedPersona);
        setNavDraft(getEffectiveLeftNavForPersona(storedPersona));
        setBanner({
            kind: 'success',
            text: `Left nav reset to defaults for ${PORTAL_PERSONA_LABELS[storedPersona]}.`,
        });
    }, [storedPersona]);

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

    if (!allowed) {
        return null;
    }

    const activeBrandPersona = topbarScopePersona ?? editingPersona;
    const showMultiRoleStack = !impersonationUi && matchedRoles.length > 1;
    const adminAuthToken = readAccessToken();
    const adminSessionActive = Boolean(adminAuthToken.trim()) || isCookieAuth();

    const workspaceTabs: { id: WorkspaceTabId; label: string }[] = [
        { id: 'grid', label: 'Grid' },
        { id: 'layout', label: 'Layout & URLs' },
        { id: 'personas', label: 'Personas' },
        { id: 'skin', label: 'Skin' },
    ];

    const adminSearchPlaceholder = 'Search admin tools (coming soon)';

    return (
        <AppConfigProvider externalParams={externalParams} dynamicMediaClient={null}>
            <div className={`admin-shell${banner ? ' admin-shell--banner-visible' : ''}`}>
                <HeaderBar
                    cartItems={cartItems}
                    handleAuthenticated={handleAdminAuthenticated}
                    handleSignOut={handleAdminSignOut}
                    profile={adminProfile}
                    sessionActive={adminSessionActive}
                    imsSession={Boolean(adminAuthToken.trim())}
                    personaImpersonation={
                        impersonationUi
                            ? {
                                  personaLabel: impersonationUi.personaLabel,
                                  onEndPersona: handleEndPersonaImpersonationAdmin,
                              }
                            : undefined
                    }
                    onReloadPortalHome={() => window.location.assign(getPortalSpaRootHref())}
                    portalContextSlot={
                        <>
                            {showMultiRoleStack ? (
                                <PortalMultiRoleActivitiesBar
                                    embedded
                                    activePersona={activeBrandPersona}
                                    matchedRoles={matchedRoles}
                                    searchPlaceholder={adminSearchPlaceholder}
                                    personaSwitchPathname="/admin/activities"
                                />
                            ) : (
                                <PersonaActivitiesTopbar
                                    embedded
                                    personaId={activeBrandPersona}
                                    searchPlaceholder={adminSearchPlaceholder}
                                />
                            )}
                            <div className="admin-shell-topbar-actions">
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
                                <button
                                    type="button"
                                    className="admin-shell-icon-btn admin-shell-icon-btn--header-actions"
                                    title="Help"
                                    aria-label="Help"
                                >
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                        <line x1="12" y1="17" x2="12.01" y2="17" />
                                    </svg>
                                </button>
                            </div>
                        </>
                    }
                />

                <div className="admin-shell-body">
                    <aside className="admin-shell-rail" aria-label="Primary navigation">
                        <Link
                            to={{ pathname: '/', search: `?persona=${encodeURIComponent(editor.editingPersona)}` }}
                            className="admin-shell-rail-item"
                            title="Home"
                        >
                            <span className="admin-shell-rail-icon">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                    <polyline points="9 22 9 12 15 12 15 22" />
                                </svg>
                            </span>
                            <span className="admin-shell-rail-label">Home</span>
                        </Link>
                        <Link
                            to={{ pathname: '/', search: `?persona=${encodeURIComponent(editor.editingPersona)}` }}
                            className={`admin-shell-rail-item${location.pathname === '/' ? ' active' : ''}`}
                            title={`Apps — portal grid (${PORTAL_PERSONA_LABELS[editor.editingPersona]})`}
                        >
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
                            <button
                                type="button"
                                className="admin-shell-rail-item"
                                title="Files — Adobe cloud storage (in portal)"
                                aria-label="Files — Adobe cloud storage (in portal)"
                                onClick={() => {
                                    setSkipAdminLandingRedirect(true);
                                    navigate(
                                        { pathname: '/', search: `?persona=${encodeURIComponent(editor.editingPersona)}` },
                                        { state: { openApp: PORTAL_EMBED_ADOBE_FILES_APP_ID } }
                                    );
                                }}
                            >
                                <span className="admin-shell-rail-icon">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                    </svg>
                                </span>
                                <span className="admin-shell-rail-label">Files</span>
                            </button>
                            <button
                                type="button"
                                className="admin-shell-rail-item"
                                title="Assets — browse and search"
                                aria-label="Assets — browse and search"
                                onClick={() => {
                                    setSkipAdminLandingRedirect(true);
                                    navigate(
                                        { pathname: '/', search: `?persona=${encodeURIComponent(editor.editingPersona)}` },
                                        { state: { openApp: 'assets-browser' } }
                                    );
                                }}
                            >
                                <span className="admin-shell-rail-icon">
                                    <PortalAppRailIcon appId="assets-browser" />
                                </span>
                                <span className="admin-shell-rail-label">Assets</span>
                            </button>
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
                        {showPortalAdminChrome ? null : (
                            <>
                                {personaRailApps.map((app) => {
                                    const onActivities =
                                        location.pathname === '/admin/activities' &&
                                        app.id === 'portal-activities' &&
                                        parsePortalPersonaId(searchParams.get('persona') ?? '') === editor.editingPersona;
                                    const railClass = `admin-shell-rail-item${onActivities ? ' active' : ''}`;
                                    const railInner = (
                                        <>
                                            <span className="admin-shell-rail-icon">
                                                <PortalAppRailIcon appId={app.id} />
                                            </span>
                                            <span className="admin-shell-rail-label">{app.name}</span>
                                        </>
                                    );
                                    const href = app.href?.trim();
                                    if (app.id === 'portal-activities') {
                                        return (
                                            <Link
                                                key={app.id}
                                                to={{
                                                    pathname: '/admin/activities',
                                                    search: `?persona=${encodeURIComponent(editor.editingPersona)}`,
                                                }}
                                                className={railClass}
                                                title={app.name}
                                                aria-label={app.name}
                                            >
                                                {railInner}
                                            </Link>
                                        );
                                    }
                                    if (href) {
                                        return (
                                            <a key={app.id} href={href} className={railClass} title={app.name} aria-label={app.name}>
                                                {railInner}
                                            </a>
                                        );
                                    }
                                    return (
                                        <button
                                            key={app.id}
                                            type="button"
                                            className={railClass}
                                            title={app.name}
                                            aria-label={app.name}
                                            onClick={() => {
                                                setSkipAdminLandingRedirect(true);
                                                navigate(
                                                    { pathname: '/', search: `?persona=${encodeURIComponent(editor.editingPersona)}` },
                                                    { state: { openApp: app.id } }
                                                );
                                            }}
                                        >
                                            {railInner}
                                        </button>
                                    );
                                })}
                            </>
                        )}
                    </aside>

                    <main className="admin-shell-main">
                        {showPortalAdminChrome ? (
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
                        ) : null}

                        {showPortalAdminChrome ? (
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
                        ) : null}

                        <div className="admin-shell-workspace">
                            {(showPortalAdminChrome && workspaceTab === 'grid') || !showPortalAdminChrome ? (
                                <div className="admin-shell-grid-wrap">
                                    <div className="admin-shell-grid-persona" role="status">
                                        <span className="admin-shell-grid-persona-label">
                                            {showPortalAdminChrome ? 'Applications apply to' : 'Your applications'}
                                        </span>
                                        <span className="admin-shell-grid-persona-name">
                                            {PORTAL_PERSONA_LABELS[editor.editingPersona]}
                                        </span>
                                        <span className="admin-shell-grid-persona-hint">
                                            {showPortalAdminChrome ? (
                                                <>
                                                    Change persona on the Layout &amp; URLs tab (&quot;Layout for&quot;).
                                                </>
                                            ) : (
                                                <>Tiles shown here match the portal home grid for this persona.</>
                                            )}
                                        </span>
                                    </div>
                                    <AppGrid
                                        tiles={previewTiles}
                                        topContent={editor.config.gridTopContent ?? ''}
                                        topBanners={editor.config.gridTopBanners}
                                        slotHeight={editor.config.slotHeight}
                                        slotWidth={editor.config.slotWidth}
                                        hideEmptySlots={!showPortalAdminChrome}
                                        onDropSlot={showPortalAdminChrome ? handleDropSlot : undefined}
                                        inlineSlotRemove={showPortalAdminChrome}
                                        onRequestDeleteSlot={showPortalAdminChrome ? handleRequestDeleteSlot : undefined}
                                    />
                                </div>
                            ) : null}
                            {showPortalAdminChrome && workspaceTab === 'layout' ? (
                                <div className="admin-shell-layout-panel">
                                    <GridEditForm {...editor} showPersonaPicker lockPersonaSelect={personaFromUrl != null} />
                                </div>
                            ) : null}
                            {showPortalAdminChrome && workspaceTab === 'personas' ? (
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
                                    <p className="admin-shell-muted">
                                        Left nav for <strong>{PORTAL_PERSONA_LABELS[storedPersona]}</strong> (the persona selected above).
                                        Leave link empty to use the portal&apos;s built-in screen for that id (dashboard, analytics, etc.).
                                        Set a URL to send that row to an external or absolute path instead.
                                    </p>
                                    <div className="admin-shell-nav-editor">
                                        <div className="admin-shell-nav-editor-head" aria-hidden>
                                            <span>Id</span>
                                            <span>Label</span>
                                            <span>Link (optional)</span>
                                            <span />
                                        </div>
                                        {navDraft.map((row, index) => (
                                            <div key={index} className="admin-shell-nav-editor-row">
                                                <input
                                                    type="text"
                                                    className="admin-shell-nav-input"
                                                    value={row.id}
                                                    onChange={(e) => updateNavRow(index, { id: e.target.value })}
                                                    aria-label={`Nav id ${index + 1}`}
                                                />
                                                <input
                                                    type="text"
                                                    className="admin-shell-nav-input"
                                                    value={row.name}
                                                    onChange={(e) => updateNavRow(index, { name: e.target.value })}
                                                    aria-label={`Nav label ${index + 1}`}
                                                />
                                                <input
                                                    type="url"
                                                    className="admin-shell-nav-input"
                                                    value={row.href ?? ''}
                                                    onChange={(e) => updateNavRow(index, { href: e.target.value })}
                                                    placeholder="https://…"
                                                    aria-label={`Nav link ${index + 1}`}
                                                />
                                                <button
                                                    type="button"
                                                    className="admin-shell-nav-remove"
                                                    onClick={() => removeNavRow(index)}
                                                    aria-label={`Remove nav row ${index + 1}`}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="admin-shell-nav-editor-actions">
                                        <button type="button" className="admin-shell-btn-secondary" onClick={addNavRow}>
                                            Add row
                                        </button>
                                        <button type="button" className="admin-shell-btn-secondary" onClick={resetNavToDefaults}>
                                            Reset to defaults
                                        </button>
                                        <button type="button" className="admin-shell-btn-primary" onClick={saveNavDraft}>
                                            Save nav
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                            {showPortalAdminChrome && workspaceTab === 'skin' ? (
                                <div className="admin-shell-layout-panel">
                                    <SkinEditorModal embedded isOpen onClose={() => {}} />
                                </div>
                            ) : null}
                        </div>

                        <section className="admin-shell-bottom-slot" aria-label="Reserved for future content">
                            <p className="admin-shell-bottom-placeholder">Content area reserved for documentation, activity feed, or embeds.</p>
                        </section>
                    </main>

                    {showPortalAdminChrome ? (
                    <aside className="admin-shell-right" aria-label="Applications catalog">
                        <div className="admin-shell-right-header">
                            <h2 className="admin-shell-right-title">Applications</h2>
                            <p className="admin-shell-right-sub">Entitled apps</p>
                        </div>
                        <p className="admin-shell-right-lede">
                            Drag into an empty slot on the Grid tab. App Builder URLs from Layout appear here after save.
                        </p>
                        <div className="admin-shell-entitlement-list">
                            {availableEntitlements.length === 0 ? (
                                <p className="admin-shell-right-empty">All catalog apps are on the grid for this persona.</p>
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
                    ) : null}
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
                                const entitled = new Set(resolvePersonasFromAccessToken(readAccessToken()));
                                if (entitled.has(p)) {
                                    setPortalPersonaPreviewStripActive(false);
                                } else {
                                    setPortalPersonaPreviewStripActive(true);
                                }
                                setSkipAdminLandingRedirect(true);
                                setPersonaImpersonateModalOpen(false);
                                navigate({
                                    pathname: '/',
                                    search: `?persona=${encodeURIComponent(p)}`,
                                    hash: '',
                                });
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
