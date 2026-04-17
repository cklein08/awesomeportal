import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ADOBE_ENTITLEMENTS } from '../constants/adobeEntitlements';
import { getLeftNavAppsForPersona, PORTAL_PERSONA_LABELS, PORTAL_PERSONA_ORDER } from '../constants/portalPersonas';
import type { EntitlementPayload, ExternalParams, PortalPersonaId, SlotBlockDescriptor } from '../types';
import { AppConfigProvider } from '../components/AppConfigProvider';
import AppGrid, { DRAG_TYPE_ENTITLEMENT } from '../components/AppGrid';
import GridEditForm from '../components/GridEditForm';
import { useGridEditor } from '../hooks/useGridEditor';
import { previewAppTilesFromSlotBlocks } from '../hooks/useSlotBlocks';
import {
    appBuilderDropInsToEntitlements,
    getExternalParams,
    getSelectedPersona,
    isPortalPersonaId,
    setSelectedPersona,
} from '../utils/config';
import { canAccessPortalSetup, setSkipAdminLandingRedirect } from '../utils/portalAccess';
import './AdminActivities.css';

function readAccessToken(): string {
    try {
        return localStorage.getItem('accessToken') || '';
    } catch {
        return '';
    }
}

const AdminActivities: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [storedPersona, setStoredPersona] = useState<PortalPersonaId>(() => getSelectedPersona());
    const initialPersona = useMemo((): PortalPersonaId => {
        const q = searchParams.get('persona');
        if (q && isPortalPersonaId(q)) return q;
        return getSelectedPersona();
    }, [searchParams]);

    const editor = useGridEditor(initialPersona, { syncGlobalPersona: true });
    const { persistSlotsFrom24, slotBlocks24, setEditingPersona, appBuilderApps } = editor;

    useEffect(() => {
        const q = searchParams.get('persona');
        if (q && isPortalPersonaId(q)) {
            setEditingPersona(q);
        }
    }, [searchParams, setEditingPersona]);

    const allowed = canAccessPortalSetup(readAccessToken(), getSelectedPersona());

    useLayoutEffect(() => {
        if (!allowed) {
            navigate('/', { replace: true });
        }
    }, [allowed, navigate]);

    const [externalParams, setExternalParams] = useState<ExternalParams>(() => getExternalParams());

    useEffect(() => {
        setExternalParams(getExternalParams());
    }, [editor.config, editor.editingPersona, appBuilderApps]);

    const previewTiles = useMemo(() => previewAppTilesFromSlotBlocks(slotBlocks24), [slotBlocks24]);

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
        },
        [persistSlotsFrom24, slotBlocks24]
    );

    const handleRequestDeleteSlot = useCallback(
        (index: number) => {
            const next = [...slotBlocks24];
            next[index] = null;
            persistSlotsFrom24(next);
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

    return (
        <AppConfigProvider externalParams={externalParams} dynamicMediaClient={null}>
            <div className="admin-activities">
                <header className="admin-activities-header">
                    <div>
                        <h1 className="admin-activities-title">Admin activities</h1>
                        <p className="admin-activities-lede">
                            After signing in with Adobe, configure the portal for your org: navigation preview by persona, branding, persona layouts, detailed grid fields, and drag entitled apps into empty slots. Changing <strong>Layout for</strong> here updates the global &quot;View as&quot; persona so the home grid matches what you are setting up (impersonation for admins and developers).
                        </p>
                    </div>
                    <div className="admin-activities-header-actions">
                        <button type="button" className="admin-activities-btn secondary" onClick={backToPortal}>
                            Back to portal
                        </button>
                    </div>
                </header>

                <section className="admin-activities-toolbar">
                    <div className="admin-activities-toolbar-block">
                        <h2 className="admin-activities-h2">Persona &amp; navigation</h2>
                        <p className="admin-activities-muted">
                            Layout and tiles below apply to <strong>{PORTAL_PERSONA_LABELS[editor.editingPersona]}</strong>. Switch persona in the form to edit another layout.
                        </p>
                        <p className="admin-activities-muted">Left nav for this persona (code-defined):</p>
                        <ul className="admin-activities-nav-preview">
                            {navPreview.map((a) => (
                                <li key={a.id}>{a.name}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="admin-activities-toolbar-block">
                        <h2 className="admin-activities-h2">Brand &amp; theme</h2>
                        <p className="admin-activities-muted">Opens the main portal with the skin editor.</p>
                        <Link className="admin-activities-btn primary" to="/" state={{ openSkinEditor: true }}>
                            Open skin editor
                        </Link>
                    </div>
                    <div className="admin-activities-toolbar-block">
                        <h2 className="admin-activities-h2">Persona switcher (stored)</h2>
                        <p className="admin-activities-muted">Updates the persona saved for the main portal (same as the home header when your role allows).</p>
                        <label className="admin-activities-persona-store">
                            <span>Default persona</span>
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
                    </div>
                </section>

                <div className="admin-activities-split">
                    <div className="admin-activities-left">
                        <h2 className="admin-activities-h2">Grid customizer</h2>
                        <p className="admin-activities-muted">Dimensions, banners, App Builder URLs, and per-slot fields. Save applies this persona&apos;s layout to storage.</p>
                        <GridEditForm {...editor} showPersonaPicker />
                    </div>
                    <div className="admin-activities-right">
                        <h2 className="admin-activities-h2">Entitled apps (IMS catalog)</h2>
                        <p className="admin-activities-muted">Drag a tile into an empty slot on the preview. Remove with the × on a placed tile. App Builder URLs you add on the left appear here after save.</p>
                        <div className="admin-activities-entitlements">
                            <h3 className="admin-activities-h3">Available to drag</h3>
                            <div className="admin-activities-entitlement-tiles">
                                {availableEntitlements.length === 0 ? (
                                    <p className="admin-activities-muted">All catalog apps are already on the grid for this persona.</p>
                                ) : null}
                                {availableEntitlements.map((ent) => (
                                    <div
                                        key={ent.id}
                                        className="admin-activities-entitlement-tile"
                                        draggable
                                        onDragStart={(e) => handleEntitlementDragStart(e, ent)}
                                    >
                                        <div className="admin-activities-entitlement-icon">
                                            {ent.iconUrl ? (
                                                <img src={ent.iconUrl} alt="" width={40} height={40} />
                                            ) : (
                                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                    <polyline points="15 3 21 3 21 9" />
                                                    <line x1="10" y1="14" x2="21" y2="3" />
                                                </svg>
                                            )}
                                        </div>
                                        <div>
                                            <div className="admin-activities-entitlement-title">{ent.title}</div>
                                            {ent.description ? <div className="admin-activities-entitlement-desc">{ent.description}</div> : null}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <h3 className="admin-activities-h3">Live preview (24 slots)</h3>
                        <div className="admin-activities-grid-wrap">
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
                    </div>
                </div>
            </div>
        </AppConfigProvider>
    );
};

export default AdminActivities;
