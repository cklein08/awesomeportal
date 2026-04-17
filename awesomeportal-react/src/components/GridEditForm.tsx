import React from 'react';
import { PORTAL_PERSONA_LABELS, PORTAL_PERSONA_ORDER } from '../constants/portalPersonas';
import type { AppBuilderDropIn, GridEditConfig, GridTopBanner, PortalPersonaId, SlotBlockDescriptor } from '../types';
import { normalizeImageSrcForDisplay } from '../utils/pathUtils';
import '../pages/GridEdit.css';

const KNOWN_APP_IDS = ['firefly', 'experience-hub', 'ai-agents'];

export type GridEditorFormProps = {
    editingPersona: PortalPersonaId;
    setEditingPersona: (p: PortalPersonaId) => void;
    showPersonaPicker?: boolean;
    bannerFileError: string | null;
    showAddSlotChoice: boolean;
    setShowAddSlotChoice: (v: boolean) => void;
    config: GridEditConfig;
    appBuilderApps: AppBuilderDropIn[];
    setAppBuilderApps: React.Dispatch<React.SetStateAction<AppBuilderDropIn[]>>;
    updateConfig: (patch: Partial<GridEditConfig>) => void;
    handleSave: () => void;
    handleReset: () => void;
    saved: boolean;
    addSlotAs: (t: 'application' | 'da-content') => void;
    updateSlot: (index: number, patch: Partial<SlotBlockDescriptor>) => void;
    removeSlot: (index: number) => void;
    moveSlot: (index: number, direction: 'up' | 'down') => void;
    addBanner: () => void;
    updateBanner: (index: number, patch: Partial<GridTopBanner>) => void;
    removeBanner: (index: number) => void;
    handleBannerFileSelect: (index: number, event: React.ChangeEvent<HTMLInputElement>) => void;
    slotBlocks24: (SlotBlockDescriptor | null)[];
};

const GridEditForm: React.FC<GridEditorFormProps> = ({
    editingPersona,
    setEditingPersona,
    showPersonaPicker = true,
    bannerFileError,
    showAddSlotChoice,
    setShowAddSlotChoice,
    config,
    appBuilderApps,
    setAppBuilderApps,
    updateConfig,
    handleSave,
    handleReset,
    saved,
    addSlotAs,
    updateSlot,
    removeSlot,
    moveSlot,
    addBanner,
    updateBanner,
    removeBanner,
    handleBannerFileSelect,
    slotBlocks24,
}) => {
    const banners = config.gridTopBanners ?? [];
    const filledCount = slotBlocks24.filter(Boolean).length;

    return (
        <div className="grid-edit-form-root">
            {showPersonaPicker ? (
                <section className="grid-edit-section grid-edit-section--persona">
                    <h2>Persona layout</h2>
                    <p className="grid-edit-hint">Grid slots below are for this persona (24 positions). Empty positions show on the portal as empty slots.</p>
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
                </section>
            ) : null}

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
                    Register hosted URLs (ExC Shell, AEM UI extension, etc.). They appear in the entitled-apps list so you can drag them onto the grid.
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
                <p className="grid-edit-hint">
                    Fixed {slotBlocks24.length} positions (same as the portal grid). Filled slots can be reordered; use the preview on the right to drag entitled apps into empty positions. Use appId for built-in apps: firefly, experience-hub, ai-agents, or Link URL / DA content.
                </p>
                <p className="grid-edit-hint grid-edit-hint--meta">{filledCount} filled · {slotBlocks24.length - filledCount} empty</p>
                <div className="grid-edit-slots">
                    {slotBlocks24.map((block, i) =>
                        block ? (
                            <div key={block.id || `slot-${i}`} className="grid-edit-slot-card">
                                <div className="grid-edit-slot-head">
                                    <span className="grid-edit-slot-num">#{i + 1}</span>
                                    <span className="grid-edit-slot-type-badge">{block.slotType === 'da-content' ? 'DA Content' : 'Application'}</span>
                                    <div className="grid-edit-slot-move">
                                        <button type="button" className="grid-edit-btn small" onClick={() => moveSlot(i, 'up')} disabled={i === 0}>
                                            ↑
                                        </button>
                                        <button
                                            type="button"
                                            className="grid-edit-btn small"
                                            onClick={() => moveSlot(i, 'down')}
                                            disabled={i === slotBlocks24.length - 1}
                                        >
                                            ↓
                                        </button>
                                    </div>
                                    <button type="button" className="grid-edit-btn small danger" onClick={() => removeSlot(i)}>
                                        Clear
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
                                                    <option key={aid} value={aid}>
                                                        {aid}
                                                    </option>
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
                        ) : (
                            <div key={`empty-${i}`} className="grid-edit-slot-card grid-edit-slot-card--empty">
                                <div className="grid-edit-slot-head">
                                    <span className="grid-edit-slot-num">#{i + 1}</span>
                                    <span className="grid-edit-slot-type-badge">Empty</span>
                                </div>
                                <p className="grid-edit-hint">Drag an entitled app here from the preview, or add a new block into the first empty slot below.</p>
                            </div>
                        )
                    )}
                </div>
                {showAddSlotChoice ? (
                    <div className="grid-edit-add-slot-choice">
                        <span className="grid-edit-add-slot-choice-label">Fill next empty slot as:</span>
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
                        + Add slot (next empty)
                    </button>
                )}
            </section>

            <div className="grid-edit-footer">
                <button type="button" className="grid-edit-btn secondary" onClick={handleReset}>
                    Reset to defaults
                </button>
                <button type="button" className="grid-edit-btn primary" onClick={handleSave}>
                    {saved ? 'Saved!' : 'Save changes'}
                </button>
            </div>
        </div>
    );
};

export default GridEditForm;
