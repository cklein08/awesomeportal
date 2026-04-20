import { useCallback, useEffect, useState } from 'react';
import type { AppBuilderDropIn, GridEditConfig, GridTopBanner, PortalPersonaId, SlotBlockDescriptor } from '../types';
import { getAppBuilderDropIns, setAppBuilderDropIns, setSelectedPersona } from '../utils/config';
import { buildGridConfigForPersona, ensureSlots24, persistPersonaGrid } from '../utils/gridSlots';

const MAX_BANNER_FILE_SIZE = 400 * 1024; // 400 KB

export type UseGridEditorOptions = {
    /** When true, changing "layout for" persona updates the global portal persona (impersonation for admins). */
    syncGlobalPersona?: boolean;
};

export function useGridEditor(initialPersona: PortalPersonaId, options?: UseGridEditorOptions) {
    const syncGlobalPersona = options?.syncGlobalPersona === true;
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
        if (!syncGlobalPersona) return;
        setSelectedPersona(editingPersona);
    }, [editingPersona, syncGlobalPersona]);

    useEffect(() => {
        setSaved(false);
    }, [config, appBuilderApps, editingPersona]);

    const updateConfig = useCallback((patch: Partial<GridEditConfig>) => {
        setConfig((prev) => {
            const next = { ...prev, ...patch };
            if (patch.slotBlocks != null) {
                next.slotBlocks = ensureSlots24(patch.slotBlocks);
            }
            return next;
        });
    }, []);

    const handleSave = useCallback(() => {
        persistPersonaGrid(editingPersona, config);
        setAppBuilderDropIns(appBuilderApps);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    }, [config, appBuilderApps, editingPersona]);

    const handleReset = useCallback(() => {
        const defaults = ensureSlots24([
            { id: 'firefly', title: 'Adobe Firefly', description: 'Generate images using AI', slotType: 'application', appId: 'firefly' },
            { id: 'experience-hub', title: 'Experience Hub', description: 'Manage content experiences', slotType: 'application', appId: 'experience-hub' },
            { id: 'ai-agents', title: 'AI Agents', description: 'Interact with intelligent agents', slotType: 'application', appId: 'ai-agents' },
        ]);
        setConfig({
            slotBlocks: defaults,
            gridTopContent: '',
            gridTopBanners: [],
            slotHeight: 120,
            slotWidth: 140,
        });
    }, []);

    const setSlotBlocks = useCallback(
        (blocks: (SlotBlockDescriptor | null)[]) => {
            updateConfig({ slotBlocks: ensureSlots24(blocks) });
        },
        [updateConfig]
    );

    const addSlotAs = useCallback(
        (slotType: 'application' | 'da-content') => {
            const slots = ensureSlots24(config.slotBlocks);
            const emptyIdx = slots.findIndex((s) => s == null);
            if (emptyIdx < 0) {
                setShowAddSlotChoice(false);
                return;
            }
            const base = { id: `slot-${Date.now()}`, title: 'New Slot', description: '' };
            const next = [...slots];
            if (slotType === 'da-content') {
                next[emptyIdx] = { ...base, slotType: 'da-content', daContentUrl: '' };
            } else {
                next[emptyIdx] = { ...base, slotType: 'application', appId: '', href: '' };
            }
            setSlotBlocks(next);
            setShowAddSlotChoice(false);
        },
        [config.slotBlocks, setSlotBlocks]
    );

    const updateSlot = useCallback(
        (index: number, patch: Partial<SlotBlockDescriptor>) => {
            const blocks = ensureSlots24(config.slotBlocks);
            const cur = blocks[index];
            if (!cur) return;
            blocks[index] = { ...cur, ...patch };
            setSlotBlocks(blocks);
        },
        [config.slotBlocks, setSlotBlocks]
    );

    const removeSlot = useCallback(
        (index: number) => {
            const blocks = ensureSlots24(config.slotBlocks);
            blocks[index] = null;
            setSlotBlocks(blocks);
        },
        [config.slotBlocks, setSlotBlocks]
    );

    const moveSlot = useCallback(
        (index: number, direction: 'up' | 'down') => {
            const blocks = ensureSlots24(config.slotBlocks);
            const target = direction === 'up' ? index - 1 : index + 1;
            if (target < 0 || target >= blocks.length) return;
            const a = blocks[index];
            const b = blocks[target];
            blocks[index] = b;
            blocks[target] = a;
            setSlotBlocks(blocks);
        },
        [config.slotBlocks, setSlotBlocks]
    );

    const setBanners = useCallback(
        (banners: GridTopBanner[]) => {
            updateConfig({ gridTopBanners: banners });
        },
        [updateConfig]
    );

    const addBanner = useCallback(() => {
        setBanners([...(config.gridTopBanners ?? []), { url: '', alt: '' }]);
    }, [config.gridTopBanners, setBanners]);

    const updateBanner = useCallback(
        (index: number, patch: Partial<GridTopBanner>) => {
            const banners = [...(config.gridTopBanners ?? [])];
            banners[index] = { ...banners[index], ...patch };
            setBanners(banners);
        },
        [config.gridTopBanners, setBanners]
    );

    const removeBanner = useCallback(
        (index: number) => {
            setBanners((config.gridTopBanners ?? []).filter((_, i) => i !== index));
        },
        [config.gridTopBanners, setBanners]
    );

    const handleBannerFileSelect = useCallback(
        (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
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
        },
        [config.gridTopBanners, updateBanner]
    );

    /** Persist current slot grid to storage without touching other hook state (used by Admin Activities drag/drop). */
    const persistSlotsFrom24 = useCallback(
        (blocks24: (SlotBlockDescriptor | null)[]) => {
            const normalized = ensureSlots24(blocks24);
            setConfig((prev) => {
                const next = { ...prev, slotBlocks: normalized };
                persistPersonaGrid(editingPersona, next);
                return next;
            });
        },
        [editingPersona]
    );

    const slotBlocks24 = ensureSlots24(config.slotBlocks);

    return {
        editingPersona,
        setEditingPersona,
        saved,
        bannerFileError,
        showAddSlotChoice,
        setShowAddSlotChoice,
        config,
        appBuilderApps,
        setAppBuilderApps,
        updateConfig,
        handleSave,
        handleReset,
        setSlotBlocks,
        addSlotAs,
        updateSlot,
        removeSlot,
        moveSlot,
        addBanner,
        updateBanner,
        removeBanner,
        handleBannerFileSelect,
        slotBlocks24,
        persistSlotsFrom24,
    };
}
