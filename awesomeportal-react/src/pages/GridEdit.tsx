import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PORTAL_PERSONA_LABELS, PORTAL_PERSONA_ORDER } from '../constants/portalPersonas';
import type { AppBuilderDropIn, GridEditConfig, GridTopBanner, PortalPersonaId, SlotBlockDescriptor } from '../types';
import {
    getAppBuilderDropIns,
    getGridLayout,
    getStaticExternalParams,
    readPersonaFromLocation,
    setAppBuilderDropIns,
    setGridLayout,
} from '../utils/config';
import { normalizeImageSrcForDisplay } from '../utils/pathUtils';
import './GridEdit.css';

const KNOWN_APP_IDS = ['firefly', 'experience-hub', 'ai-agents'];

const MAX_BANNER_FILE_SIZE = 400 * 1024; // 400 KB

function slotBlocksFromStaticBase(): SlotBlockDescriptor[] {
    const base = getStaticExternalParams();
    const raw = base.slotBlocks;
    if (raw && Array.isArray(raw) && raw.length > 0) {
        const dense = raw.filter((b): b is SlotBlockDescriptor => b != null && typeof b === 'object');
        if (dense.length > 0) return dense;
    }
    return [
        { id: 'firefly', title: 'Adobe Firefly', description: 'Generate images using AI', slotType: 'application', appId: 'firefly' },
        { id: 'experience-hub', title: 'Experience Hub', description: 'Manage content experiences', slotType: 'application', appId: 'experience-hub' },
        { id: 'ai-agents', title: 'AI Agents', description: 'Interact with intelligent agents', slotType: 'application', appId: 'ai-agents' },
    ];
}

function buildGridConfigForPersona(persona: PortalPersonaId): GridEditConfig {
    const savedConfig = getGridLayout(persona);
    const base = getStaticExternalParams();
    const fromBase =
        base.slotBlocks?.filter((b): b is SlotBlockDescriptor => b != null && typeof b === 'object') ?? [];
    const slotBlocks = savedConfig?.slotBlocks ?? (fromBase.length > 0 ? fromBase : slotBlocksFromStaticBase());
    return {
        slotBlocks,
        gridTopContent: savedConfig?.gridTopContent ?? base.gridTopContent ?? '',
        gridTopBanners: savedConfig?.gridTopBanners ?? base.gridTopBanners ?? [],
        slotHeight: savedConfig?.slotHeight ?? base.slotHeight ?? 120,
        slotWidth: savedConfig?.slotWidth ?? base.slotWidth ?? 140,
    };
}

const GridEdit: React.FC = () => {
    const navigate = useNavigate();
    const initialPersona = readPersonaFromLocation();
    const [editingPersona, setEditingPersona] = useState<PortalPersonaId>(initialPersona);
    const [saved, setSaved] = useState(false);
    const [bannerFileError, setBannerFileError] = useState<string | null>(null);
    const [showAddSlotChoice, setShowAddSlotChoice] = useState(false);
    const [config, setConfig] = useState<GridEditConfig>(() => buildGridConfigForPersona(initialPersona));
    const [appBuilderApps, setAppBuilderApps] = useState<AppBuilderDropIn[]>(() => getAppBuilderDropIns());

    useEffect(() => {
        setConfig(buildGridConfigForPersona(editingPersona));
    }, [editingPersona]);

    useEffect(() => {
        setSaved(false);
    }, [config, appBuilderApps, editingPersona]);

    const updateConfig = useCallback((patch: Partial<GridEditConfig>) => {
        setConfig((prev) => ({ ...prev, ...patch }));
    }, []);

    const handleSave = useCallback(() => {
        setGridLayout(editingPersona, config);
        setAppBuilderDropIns(appBuilderApps);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    }, [config, appBuilderApps, editingPersona]);

    const handleReset = useCallback(() => {
        setConfig({
            slotBlocks: slotBlocksFromStaticBase(),
            gridTopContent: '',
            gridTopBanners: [],
            slotHeight: 120,
            slotWidth: 140,
        });
    }, []);

    // Slots
    const setSlotBlocks = useCallback((blocks: SlotBlockDescriptor[]) => {
        updateConfig({ slotBlocks: blocks });
    }, [updateConfig]);

    const addSlotAs = useCallback((slotType: 'application' | 'da-content') => {
        const base = { id: `slot-${Date.now()}`, title: 'New Slot', description: '' };
        if (slotType === 'da-content') {
            setSlotBlocks([...(config.slotBlocks ?? []), { ...base, slotType: 'da-content', daContentUrl: '' }]);
        } else {
            setSlotBlocks([...(config.slotBlocks ?? []), { ...base, slotType: 'application', appId: '', href: '' }]);
        }
        setShowAddSlotChoice(false);
    }, [config.slotBlocks, setSlotBlocks]);

    const updateSlot = useCallback((index: number, patch: Partial<SlotBlockDescriptor>) => {
        const blocks = [...(config.slotBlocks ?? [])];
        blocks[index] = { ...blocks[index], ...patch };
        setSlotBlocks(blocks);
    }, [config.slotBlocks, setSlotBlocks]);

    const removeSlot = useCallback((index: number) => {
        setSlotBlocks((config.slotBlocks ?? []).filter((_, i) => i !== index));
    }, [config.slotBlocks, setSlotBlocks]);

    const moveSlot = useCallback((index: number, direction: 'up' | 'down') => {
        const blocks = [...(config.slotBlocks ?? [])];
        const target = direction === 'up' ? index - 1 : index + 1;
        if (target < 0 || target >= blocks.length) return;
        [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
        setSlotBlocks(blocks);
    }, [config.slotBlocks, setSlotBlocks]);

    // Banners
    const setBanners = useCallback((banners: GridTopBanner[]) => {
        updateConfig({ gridTopBanners: banners });
    }, [updateConfig]);

    const addBanner = useCallback(() => {
        setBanners([...(config.gridTopBanners ?? []), { url: '', alt: '' }]);
    }, [config.gridTopBanners, setBanners]);

    const updateBanner = useCallback((index: number, patch: Partial<GridTopBanner>) => {
        const banners = [...(config.gridTopBanners ?? [])];
        banners[index] = { ...banners[index], ...patch };
        setBanners(banners);
    }, [config.gridTopBanners, setBanners]);

    const removeBanner = useCallback((index: number) => {
        setBanners((config.gridTopBanners ?? []).filter((_, i) => i !== index));
    }, [config.gridTopBanners, setBanners]);

    const handleBannerFileSelect = useCallback((index: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setBannerFileError(null);
        if (!file.type.startsWith('image/')) {
            setBannerFileError('Please choose an image file.');
            event.target.value = '';
            return;
        }
        if (file.size > MAX_BANNER_FILE_SIZE) {
            setBannerFileError('Image must be under 400 KB.');
            event.target.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            const banners = [...(config.gridTopBanners ?? [])];
            const current = banners[index];
            const alt = current?.alt?.trim() ? current.alt : file.name.replace(/\.[^.]+$/, '');
            updateBanner(index, { url: dataUrl, alt: alt || undefined });
        };
        reader.readAsDataURL(file);
        event.target.value = '';
    }, [config.gridTopBanners, updateBanner]);

    const slotBlocks = config.slotBlocks ?? [];
    const banners = config.gridTopBanners ?? [];

    return (
        <div className="grid-edit-page">
            <header className="grid-edit-header">
                <h1>Edit Grid (Admin)</h1>
                <div className="grid-edit-actions">
                    <label className="grid-edit-persona-inline">
                        <span className="grid-edit-persona-inline-label">Layout for</span>
                        <select
                            className="grid-edit-persona-select"
                            value={editingPersona}
                            onChange={(e) => setEditingPersona(e.target.value as PortalPersonaId)}
                            aria-label="Persona layout to edit"
                        >
                            {PORTAL_PERSONA_ORDER.map((id) => (
                                <option key={id} value={id}>
                                    {PORTAL_PERSONA_LABELS[id]}
                                </option>
                            ))}
                        </select>
                    </label>
                    <button type="button" className="grid-edit-btn secondary" onClick={() => navigate('/')}>
                        Back to Grid
                    </button>
                    <button type="button" className="grid-edit-btn secondary" onClick={handleReset}>
                        Reset to defaults
                    </button>
                    <button type="button" className="grid-edit-btn primary" onClick={handleSave}>
                        {saved ? 'Saved!' : 'Save changes'}
                    </button>
                </div>
            </header>

            <section className="grid-edit-section">
                <h2>Slot dimensions</h2>
                <div className="grid-edit-dimensions">
                    <label>
                        Slot height (px)
                        <input
                            type="number"
                            min={80}
                            max={400}
                            value={config.slotHeight ?? 120}
                            onChange={(e) => updateConfig({ slotHeight: e.target.value ? Number(e.target.value) : undefined })}
                        />
                    </label>
                    <label>
                        Slot width (px)
                        <input
                            type="number"
                            min={80}
                            max={400}
                            value={config.slotWidth ?? 140}
                            onChange={(e) => updateConfig({ slotWidth: e.target.value ? Number(e.target.value) : undefined })}
                        />
                    </label>
                </div>
            </section>

            <section className="grid-edit-section">
                <h2>Content above grid</h2>
                <p className="grid-edit-hint">Plain text or simple HTML (e.g. &lt;p&gt;Welcome&lt;/p&gt;). Shown at the top of the grid.</p>
                <textarea
                    className="grid-edit-textarea"
                    rows={4}
                    placeholder="Optional intro text or HTML..."
                    value={config.gridTopContent ?? ''}
                    onChange={(e) => updateConfig({ gridTopContent: e.target.value })}
                />
            </section>

            <section className="grid-edit-section">
                <h2>Banners / images above grid</h2>
                <p className="grid-edit-hint">Images displayed at the top of the grid. Paste an image URL or choose a file from your computer (max 400 KB per image). Optional link URL for each.</p>
                {bannerFileError ? <p className="grid-edit-banner-error" role="alert">{bannerFileError}</p> : null}
                {banners.map((b, i) => (
                    <div key={`banner-${i}`} className="grid-edit-banner-row">
                        <div className="grid-edit-banner-url-and-file">
                            <input
                                type="url"
                                placeholder="Image URL"
                                value={b.url}
                                onChange={(e) => updateBanner(i, { url: e.target.value })}
                            />
                            <label className="grid-edit-banner-file-label">
                                <span className="grid-edit-btn small secondary">Choose file</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="grid-edit-banner-file-input"
                                    onChange={(e) => handleBannerFileSelect(i, e)}
                                />
                            </label>
                        </div>
                        {b.url ? (
                            <div className="grid-edit-banner-preview-wrap">
                                <img src={normalizeImageSrcForDisplay(b.url)} alt="" className="grid-edit-banner-preview" />
                            </div>
                        ) : null}
                        <input
                            type="text"
                            placeholder="Alt text"
                            value={b.alt ?? ''}
                            onChange={(e) => updateBanner(i, { alt: e.target.value })}
                        />
                        <input
                            type="url"
                            placeholder="Link URL (optional)"
                            value={b.href ?? ''}
                            onChange={(e) => updateBanner(i, { href: e.target.value || undefined })}
                        />
                        <button type="button" className="grid-edit-btn small danger" onClick={() => removeBanner(i)}>
                            Remove
                        </button>
                    </div>
                ))}
                <button type="button" className="grid-edit-btn secondary" onClick={addBanner}>
                    + Add banner
                </button>
            </section>

            <section className="grid-edit-section">
                <h2>App Builder drop-ins</h2>
                <p className="grid-edit-hint">
                    Register hosted URLs (ExC Shell, AEM UI extension, etc.). They appear in the main portal sidebar under Adobe apps so admins can drag them onto the grid for any persona.
                </p>
                {appBuilderApps.map((app, i) => (
                    <div key={`${app.id}-${i}`} className="grid-edit-appbuilder-row">
                        <input
                            type="text"
                            placeholder="Stable id (e.g. my-extension)"
                            value={app.id}
                            onChange={(e) => {
                                const next = [...appBuilderApps];
                                next[i] = { ...next[i], id: e.target.value };
                                setAppBuilderApps(next);
                            }}
                            aria-label={`App Builder id ${i + 1}`}
                        />
                        <input
                            type="text"
                            placeholder="Title"
                            value={app.title}
                            onChange={(e) => {
                                const next = [...appBuilderApps];
                                next[i] = { ...next[i], title: e.target.value };
                                setAppBuilderApps(next);
                            }}
                            aria-label={`App Builder title ${i + 1}`}
                        />
                        <input
                            type="url"
                            placeholder="https://…"
                            value={app.url}
                            onChange={(e) => {
                                const next = [...appBuilderApps];
                                next[i] = { ...next[i], url: e.target.value };
                                setAppBuilderApps(next);
                            }}
                            aria-label={`App Builder URL ${i + 1}`}
                        />
                        <button type="button" className="grid-edit-btn small danger" onClick={() => setAppBuilderApps(appBuilderApps.filter((_, j) => j !== i))}>
                            Remove
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    className="grid-edit-btn secondary"
                    onClick={() => setAppBuilderApps([...appBuilderApps, { id: `app-${Date.now()}`, title: '', url: '' }])}
                >
                    + Add App Builder URL
                </button>
            </section>

            <section className="grid-edit-section">
                <h2>Slots (grid tiles)</h2>
                <p className="grid-edit-hint">Order = display order. Use appId for built-in apps: firefly, experience-hub, ai-agents. Otherwise use Link URL. For DA content blocks use DA Content URL.</p>
                <div className="grid-edit-slots">
                    {slotBlocks.map((block, i) => (
                        <div key={block.id} className="grid-edit-slot-card">
                            <div className="grid-edit-slot-head">
                                <span className="grid-edit-slot-num">#{i + 1}</span>
                                <span className="grid-edit-slot-type-badge">{block.slotType === 'da-content' ? 'DA Content' : 'Application'}</span>
                                <div className="grid-edit-slot-move">
                                    <button type="button" className="grid-edit-btn small" onClick={() => moveSlot(i, 'up')} disabled={i === 0}>
                                        ↑
                                    </button>
                                    <button type="button" className="grid-edit-btn small" onClick={() => moveSlot(i, 'down')} disabled={i === slotBlocks.length - 1}>
                                        ↓
                                    </button>
                                </div>
                                <button type="button" className="grid-edit-btn small danger" onClick={() => removeSlot(i)}>
                                    Remove
                                </button>
                            </div>
                            <label>
                                ID
                                <input
                                    type="text"
                                    value={block.id}
                                    onChange={(e) => updateSlot(i, { id: e.target.value })}
                                    placeholder="e.g. firefly"
                                />
                            </label>
                            <label>
                                Title
                                <input
                                    type="text"
                                    value={block.title}
                                    onChange={(e) => updateSlot(i, { title: e.target.value })}
                                    placeholder="Tile title"
                                />
                            </label>
                            <label>
                                Description
                                <input
                                    type="text"
                                    value={block.description ?? ''}
                                    onChange={(e) => updateSlot(i, { description: e.target.value || undefined })}
                                    placeholder="Optional"
                                />
                            </label>
                            <label>
                                Icon URL
                                <input
                                    type="url"
                                    value={block.iconUrl ?? ''}
                                    onChange={(e) => updateSlot(i, { iconUrl: e.target.value || undefined })}
                                    placeholder="Optional image URL"
                                />
                            </label>
                            {block.slotType === 'da-content' ? (
                                <label>
                                    DA Content URL
                                    <input
                                        type="url"
                                        value={block.daContentUrl ?? ''}
                                        onChange={(e) => updateSlot(i, { daContentUrl: e.target.value || undefined })}
                                        placeholder="e.g. https://da.live/..."
                                    />
                                </label>
                            ) : (
                                <>
                                    <label>
                                        App ID
                                        <select
                                            value={block.appId ?? ''}
                                            onChange={(e) => updateSlot(i, { appId: e.target.value || undefined })}
                                        >
                                            <option value="">— None (use link) —</option>
                                            {KNOWN_APP_IDS.map((aid) => (
                                                <option key={aid} value={aid}>{aid}</option>
                                            ))}
                                        </select>
                                    </label>
                                    <label>
                                        Link URL
                                        <input
                                            type="url"
                                            value={block.href ?? ''}
                                            onChange={(e) => updateSlot(i, { href: e.target.value || undefined })}
                                            placeholder="If no App ID, open this URL"
                                        />
                                    </label>
                                </>
                            )}
                        </div>
                    ))}
                </div>
                {showAddSlotChoice ? (
                    <div className="grid-edit-add-slot-choice">
                        <span className="grid-edit-add-slot-choice-label">Add as:</span>
                        <button type="button" className="grid-edit-btn secondary" onClick={() => addSlotAs('application')}>
                            Application
                        </button>
                        <button type="button" className="grid-edit-btn secondary" onClick={() => addSlotAs('da-content')}>
                            Content block (DA)
                        </button>
                        <button type="button" className="grid-edit-btn small" onClick={() => setShowAddSlotChoice(false)}>
                            Cancel
                        </button>
                    </div>
                ) : (
                    <button type="button" className="grid-edit-btn secondary" onClick={() => setShowAddSlotChoice(true)}>
                        + Add slot
                    </button>
                )}
            </section>

            <div className="grid-edit-footer">
                <button type="button" className="grid-edit-btn primary" onClick={handleSave}>
                    {saved ? 'Saved!' : 'Save changes'}
                </button>
            </div>
        </div>
    );
};

export default GridEdit;
