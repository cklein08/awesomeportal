/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { ToastQueue } from '@react-spectrum/toast';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DateValue } from 'react-aria-components';
import '../MainApp.css';
import '../pages/AdminActivities.css';
import { ADOBE_FILES_WEB_URL, PORTAL_EMBED_ADOBE_FILES_APP_ID } from '../constants/adobeFilesEmbed';
import { PORTAL_AGENT_MODEL_PROMPTS } from '../constants/portalAgentPrompts';

import { DynamicMediaClient } from '../clients/dynamicmedia-client';
import { DEFAULT_FACETS, type ExcFacets } from '../constants/facets';
import { PORTAL_PERSONA_LABELS, PORTAL_PERSONA_ORDER } from '../constants/portalPersonas';
import type {
    Asset,
    CartItem,
    Collection,
    CurrentView,
    ExternalParams,
    LoadingState,
    PortalPersonaId,
    Rendition,
    RightsData,
    SearchResult,
    SearchResults,
    SlotBlockDescriptor
} from '../types';
import { CURRENT_VIEW, LOADING, QUERY_TYPES } from '../types';
import { populateAssetFromHit } from '../utils/assetTransformers';
import { fetchOptimizedDeliveryBlob, removeBlobFromCache } from '../utils/blobCache';
import { getDefaultSlotBlocks, useSlotBlocks } from '../hooks/useSlotBlocks';
import {
    clearEphemeralLocalStorageOnSignOut,
    getAdobeClientId,
    getBucket,
    getEffectiveLeftNavForPersona,
    getExternalParams,
    getGridEditConfig,
    getSelectedAemProgram,
    getSelectedPersona,
    isPortalPersonaId,
    PERSONA_LEFT_NAV_STORAGE_KEY,
    PERSONA_LEFT_NAV_UPDATED_EVENT,
    setGridEditConfig,
    setSelectedAemProgram,
    setSelectedPersona,
    type AemProgramOption,
} from '../utils/config';
import { decodeImsAccessTokenPayload, isPortalAdminFromToken, resolvePersonaFromAccessToken } from '../utils/imsPersona';
import { canImpersonatePortalPersonas, setSkipAdminLandingRedirect, shouldOpenAdminActivitiesAfterSignIn } from '../utils/portalAccess';
import { endPersonaImpersonationPersist, getPortalPersonaImpersonationUi } from '../utils/portalPersonaImpersonation';
import { getPortalSpaRootHref, readPostLoginAdminRedirectDelayMs, setPortalPersonaPreviewStripActive } from '../utils/portalSession';
import { isSpaIndexPathname } from '../utils/pathUtils';
import { getProfilePictureUrl } from '../utils/profileImage';
import { AppConfigProvider } from './AppConfigProvider';

// Extend window interface for cart functions and user authentication
declare global {
    interface Window {
        openCart?: () => void;
        closeCart?: () => void;
        toggleCart?: () => void;
        user?: unknown; // Global user object for authentication
    }
}

// Components
import { CalendarDate } from '@internationalized/date';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthorizationStatus, CheckRightsRequest, FadelClient } from '../clients/fadel-client';
import { calendarDateToEpoch } from '../utils/formatters';
import CartPanel from './CartPanel';
import Facets from './Facets';
import HeaderBar from './HeaderBar';
import PersonaActivitiesTopbar from './PersonaActivitiesTopbar';
import PersonaImpersonateModal from './PersonaImpersonateModal';
import { PersonaGlyph } from './PersonaGlyph';
import ImageGallery from './ImageGallery';
import SearchBar from './SearchBar';
import { PortalAppRailIcon } from './PortalAppRailIcon';
import AppGrid from './AppGrid';
import Firefly from '../pages/Firefly';
import ExperienceHub from '../pages/ExperienceHub';
import AIAgents from '../pages/AIAgents';
import Dashboard from '../pages/dashboard';
import ProfileModal from './ProfileModal';
import SkinEditorModal from './SkinEditorModal';
import { Extensible } from '@adobe/uix-host-react';
import ErrorBoundary from './ErrorBoundary';

const HITS_PER_PAGE = 24;

/**
 * Transforms excFacets object into a string array for search facets
 * @param excFacets - The facets object from EXC
 * @returns Array of facet keys for search
 */
function transformExcFacetsToHierarchyArray(excFacets: ExcFacets): string[] {
    const facetKeys: string[] = [];

    Object.entries(excFacets).forEach(([key, facet]) => {
        if (facet.type !== 'tags') {
            // For non-tags types, append the entry key
            facetKeys.push(key);
        } else {
            // For tags type, append 10 hierarchy level keys
            for (let n = 0; n <= 9; n++) {
                facetKeys.push(`${key}.TCCC.#hierarchy.lvl${n}`);
            }
            facetKeys.push(`${key}.TCCC.#values`);
        }
    });

    return facetKeys;
}

// temporary check for cookie auth - can be removed once we drop IMS
// note: real check for is authenticated (with cookie) is if window.user is defined
//       but has race condition between scripts.js and react index.js loading order
function isCookieAuth(): boolean {
    return window.location.origin.endsWith('adobeaem.workers.dev')
        || window.location.origin === 'http://localhost:8787';
}

function MainApp(): React.JSX.Element {
    // External parameters from plain JavaScript
    const [externalParams] = useState<ExternalParams>(() => {
        const params = getExternalParams();
        // console.log('External parameters received:', JSON.stringify(params));
        return params;
    });

    // Compute Firefly extension entries. Supports (and normalizes to an array of {id,url}):
    // - VITE_FIREFLY_EXTENSIONS env var (JSON array/object or comma-separated URLs)
    // - externalParams.fireflyExtensions (array or JSON string)
    // - externalParams.fireflyExtensionUrl (single URL)
    // - fallback placeholder URL
    const fireflyExtensions = useMemo(() => {
        const fallbackUrl = externalParams?.fireflyExtensionUrl || 'https://example.com/firefly-extension.js';

        // Helper to normalize to {id,url}
        const normalizeEntry = (entry: never, idx: number) => {
            if (!entry) return null;
            if (typeof entry === 'string') return { id: `firefly-ext-${idx}`, url: entry };
            if (typeof entry === 'object' && entry.url) return { id: entry.id || `firefly-ext-${idx}`, url: entry.url };
            return null;
        };

        // 1) Check env var first
        try {
            const envVal = (import.meta as any).env?.VITE_FIREFLY_EXTENSIONS;
            if (envVal) {
                try {
                    const parsed = JSON.parse(envVal);
                    if (Array.isArray(parsed)) return parsed.map((p, i) => normalizeEntry(p, i)).filter(Boolean);
                    if (parsed && parsed.url) return [normalizeEntry(parsed, 0)].filter(Boolean);
                } catch (e) {
                    const urls = String(envVal).split(',').map(s => s.trim()).filter(Boolean);
                    if (urls.length > 0) return urls.map((u, i) => normalizeEntry(u, i)).filter(Boolean);
                }
            }
        } catch (e) {
            // ignore
        }

        // 2) externalParams
        const raw = externalParams?.fireflyExtensions ?? externalParams?.fireflyExtensionUrl ?? null;
        if (!raw) {
            return [{ id: 'firefly-extension', url: fallbackUrl }];
        }

        if (Array.isArray(raw)) return raw.map((r, i) => normalizeEntry(r, i)).filter(Boolean);

        if (typeof raw === 'string') {
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) return parsed.map((p, i) => normalizeEntry(p, i)).filter(Boolean);
                if (parsed && parsed.url) return [normalizeEntry(parsed, 0)].filter(Boolean);
            } catch (e) {
                // treat as single URL string
                return [{ id: 'firefly-extension', url: raw }];
            }
        }

        if (raw && raw.url) return [normalizeEntry(raw, 0)].filter(Boolean);

        return [{ id: 'firefly-extension', url: fallbackUrl }];
    }, [externalParams]);

    // Validate entries at runtime and inform user if none are valid
    useEffect(() => {
        try {
            console.debug('[MainApp] fireflyExtensions =', fireflyExtensions);
            const valid = (fireflyExtensions || []).filter((e: any) => e && typeof e.url === 'string' && e.url.length > 0);
            if (!valid || valid.length === 0) {
                ToastQueue.negative('No valid UIX extensions found for Firefly', { timeout: 4000 });
            }
        } catch (e) {
            // ignore validation errors
        }
    }, [fireflyExtensions]);

    // Local state
    const [accessToken, setAccessToken] = useState<string>(() => {
        try {
            return localStorage.getItem('accessToken') || '';
        } catch {
            return '';
        }
    });
    const [bucket] = useState<string>(() => {
        try {
            return getBucket();
        } catch {
            return '';
        }
    });

    // Authentication state - either IMS or cookie authenticated
    const [authenticated, setAuthenticated] = useState<boolean>(() => {
        const hasAccessToken = Boolean(localStorage.getItem('accessToken'));
        return hasAccessToken || isCookieAuth();
    });

    const [dynamicMediaClient, setDynamicMediaClient] = useState<DynamicMediaClient | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [profileImageError, setProfileImageError] = useState<boolean>(false);

    const profileWithJwtAvatar = useMemo(() => {
        if (!accessToken?.trim()) return profile;
        const payload = decodeImsAccessTokenPayload(accessToken);
        const pic =
            (payload && typeof payload.picture === 'string' && payload.picture) ||
            (payload && typeof (payload as Record<string, unknown>).avatar === 'string'
                ? ((payload as Record<string, unknown>).avatar as string)
                : '') ||
            '';
        if (!pic && !profile) return profile;
        return { ...profile, picture: profile?.picture || pic };
    }, [profile, accessToken]);

    const profilePictureUrl = getProfilePictureUrl(profileWithJwtAvatar);

    const [query, setQuery] = useState<string>('');
    const [dmImages, setDmImages] = useState<Asset[]>([]);

    const [searchResults, setSearchResults] = useState<SearchResults['results'] | null>(null);
    const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
    const [loading, setLoading] = useState<LoadingState>({ [LOADING.dmImages]: false, [LOADING.collections]: false });
    const [currentView, setCurrentView] = useState<CurrentView>(CURRENT_VIEW.images);
    const [selectedQueryType, setSelectedQueryType] = useState<string>(QUERY_TYPES.ASSETS);
    const [selectedFacetFilters, setSelectedFacetFilters] = useState<string[][]>([]);
    const [selectedNumericFilters, setSelectedNumericFilters] = useState<string[]>([]);
    const [searchDisabled, setSearchDisabled] = useState<boolean>(false);
    const [isRightsSearch, setIsRightsSearch] = useState<boolean>(false);
    const [rightsStartDate, setRightsStartDate] = useState<DateValue | null>(null);
    const [rightsEndDate, setRightsEndDate] = useState<DateValue | null>(null);
    const [selectedMarkets, setSelectedMarkets] = useState<Set<RightsData>>(new Set());
    const [selectedMediaChannels, setSelectedMediaChannels] = useState<Set<RightsData>>(new Set());
    const searchDisabledRef = useRef<boolean>(false);
    const isRightsSearchRef = useRef<boolean>(false);

    const handleSetSearchDisabled = useCallback((disabled: boolean) => {
        searchDisabledRef.current = disabled; // Update ref immediately
        setSearchDisabled(disabled);
    }, []);

    const handleSetIsRightsSearch = useCallback((isRights: boolean) => {
        isRightsSearchRef.current = isRights; // Update ref immediately
        setIsRightsSearch(isRights);
    }, []);

    const [presetFilters, setPresetFilters] = useState<string[]>(() =>
        externalParams.presetFilters || []
    );
    const [excFacets, setExcFacets] = useState<ExcFacets | undefined>(undefined);

    const [imagePresets, setImagePresets] = useState<{
        assetId?: string;
        items?: Rendition[];
        'repo:name'?: string;
    }>({});
    const [assetRenditionsCache, setAssetRenditionsCache] = useState<{
        [assetId: string]: {
            assetId?: string;
            items?: Rendition[];
            'repo:name'?: string;
        }
    }>({});

    // Track which assets are currently being fetched to prevent duplicates
    const fetchingAssetsRef = useRef<Set<string>>(new Set());

    // Track if image presets are being fetched to prevent duplicates
    const fetchingImagePresetsRef = useRef<boolean>(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

    // Cart state
    const [cartItems, setCartItems] = useState<CartItem[]>(() => {
        try {
            const stored = localStorage.getItem('cartItems');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });
    const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
    // Mobile filter panel state
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);
    const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
    const [showSkinEditor, setShowSkinEditor] = useState<boolean>(false);

    // Application navigation state
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
    const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
    const [selectedDaContentUrl, setSelectedDaContentUrl] = useState<string | null>(null);
    const [iframeCannotDisplay, setIframeCannotDisplay] = useState(false);
    const [portalPersona, setPortalPersona] = useState<PortalPersonaId>(() => getSelectedPersona());
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
    const apps = useMemo(() => getEffectiveLeftNavForPersona(portalPersona), [portalPersona, leftNavRev]);
    /** Assets browser is opened from the dedicated rail icon above; omit duplicate below the divider. */
    const portalRailApps = useMemo(() => apps.filter((a) => a.id !== 'assets-browser'), [apps]);
    const [personaImpersonateModalOpen, setPersonaImpersonateModalOpen] = useState(false);
    const [portalWorkspacePrompt, setPortalWorkspacePrompt] = useState('');
    /** Bumped when preview-strip session flag changes so layout re-renders even if persona state is unchanged (e.g. Admin → Admin). */
    const [personaImpersonationUiEpoch, setPersonaImpersonationUiEpoch] = useState(0);

    const applyPortalPersona = useCallback(
        (p: PortalPersonaId, opts?: { markPersonaPreviewStrip?: boolean }) => {
            setSelectedPersona(p);
            setPortalPersona(p);
            setGridConfigVersion((v) => v + 1);
            setSelectedTileId(null);
            setSelectedDaContentUrl(null);
            if (opts?.markPersonaPreviewStrip) {
                setPortalPersonaPreviewStripActive(true);
                setPersonaImpersonationUiEpoch((n) => n + 1);
            }
        },
        []
    );

    const handleSelectDaContentUrl = useCallback((url: string) => {
        setSelectedDaContentUrl(url);
        setSelectedTileId(null);
        setSelectedAppId(null);
        setIframeCannotDisplay(false);
    }, []);

    // After showing an iframe, offer fallback message in case the app cannot be displayed (e.g. X-Frame-Options)
    const showWorkspaceIframe = Boolean(selectedDaContentUrl) || selectedAppId === PORTAL_EMBED_ADOBE_FILES_APP_ID;
    useEffect(() => {
        if (!showWorkspaceIframe) return;
        setIframeCannotDisplay(false);
        const t = setTimeout(() => setIframeCannotDisplay(true), 5000);
        return () => clearTimeout(t);
    }, [showWorkspaceIframe]);

    /** Hide EXC / host shell chrome (same document) while a tile or iframe fills the workspace body. */
    const suppressHostTopAppBar =
        Boolean(selectedDaContentUrl) ||
        selectedAppId === PORTAL_EMBED_ADOBE_FILES_APP_ID ||
        selectedTileId != null;
    useEffect(() => {
        if (!suppressHostTopAppBar) return undefined;
        document.documentElement.classList.add('portal-suppress-host-top-app-bar');
        return () => {
            document.documentElement.classList.remove('portal-suppress-host-top-app-bar');
        };
    }, [suppressHostTopAppBar]);
    // Slots from DA live (window.__AWESOMEPORTAL_DA_BLOCKS__), externalParams.slotBlocks, or default tiles.
    // gridConfigVersion is bumped when we save grid config so useSlotBlocks recomputes and shows new tiles.
    const [gridConfigVersion, setGridConfigVersion] = useState(0);
    const appTiles = useSlotBlocks(setSelectedTileId, handleSelectDaContentUrl, gridConfigVersion);
    const navigate = useNavigate();
    const location = useLocation();
    const prevLocationPathRef = useRef<string>('');
    const [viewMode, setViewMode] = useState<'admin' | 'creator'>('admin');

    // AEM instance selector (Assets Browser, admin view)
    const [aemPrograms, setAemPrograms] = useState<AemProgramOption[] | null>(null);
    const [selectedAemProgram, setSelectedAemProgramState] = useState<AemProgramOption | null>(() => getSelectedAemProgram());
    const [aemProgramsLoading, setAemProgramsLoading] = useState<boolean>(false);
    const [aemProgramsError, setAemProgramsError] = useState<string | null>(null);
    const isAssetsBrowser =
        selectedAppId === 'assets-browser' ||
        (!selectedAppId && isSpaIndexPathname(window.location.pathname));
    const showAemSelector = isAssetsBrowser && authenticated && viewMode === 'admin';

    // Expose cart functions to window for EDS header integration
    useEffect(() => {
        window.openCart = () => setIsCartOpen(true);
        window.closeCart = () => setIsCartOpen(false);
        window.toggleCart = () => setIsCartOpen(prev => !prev);

        return () => {
            delete window.openCart;
            delete window.closeCart;
            delete window.toggleCart;
        };
    }, []);

    // Sort state
    const [selectedSortType, setSelectedSortType] = useState<string>('Date Created');
    const [selectedSortDirection, setSelectedSortDirection] = useState<string>('Ascending');

    const searchBarRef = useRef<HTMLInputElement>(null);
    const settingsLoadedRef = useRef<boolean>(false);

    const handleSetSelectedQueryType = useCallback((newQueryType: string): void => {
        setSelectedQueryType(prevType => {
            if (prevType !== newQueryType) {
                setQuery('');
            }
            return newQueryType;
        });
        // Focus the query input after changing type
        setTimeout(() => {
            if (searchBarRef.current) {
                searchBarRef.current.focus();
            }
        }, 0);
    }, []);



    // Save cart items to localStorage when they change
    useEffect(() => {
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }, [cartItems]);

    const canImpersonatePortalPersona = useMemo(
        () => authenticated && canImpersonatePortalPersonas(accessToken),
        [authenticated, accessToken]
    );

    const handlePortalPersonaChange = useCallback(
        (e: React.ChangeEvent<HTMLSelectElement>) => {
            const next = e.target.value as PortalPersonaId;
            if (canImpersonatePortalPersona) {
                applyPortalPersona(next, { markPersonaPreviewStrip: true });
            } else {
                applyPortalPersona(next);
            }
        },
        [applyPortalPersona, canImpersonatePortalPersona]
    );

    const imsDerivedPersona = useMemo(
        () => (accessToken ? resolvePersonaFromAccessToken(accessToken) : null),
        [accessToken]
    );

    const handleEndPersonaImpersonation = useCallback(() => {
        if (imsDerivedPersona == null) return;
        endPersonaImpersonationPersist(imsDerivedPersona);
        setPersonaImpersonationUiEpoch((n) => n + 1);
        applyPortalPersona(imsDerivedPersona);
        setPersonaImpersonateModalOpen(false);
        // Neutral admin workspace (no ?persona=) so the session is not URL-scoped to a preview role
        navigate('/admin/activities', { replace: true });
    }, [imsDerivedPersona, applyPortalPersona, navigate]);

    /** Full reload of SPA root so landing, splash, and grid match the current stored persona. */
    const reloadPortalLanding = useCallback(() => {
        setSkipAdminLandingRedirect(true);
        if (externalParams?.isBlockIntegration) {
            window.location.reload();
        } else {
            window.location.assign(getPortalSpaRootHref());
        }
    }, [externalParams?.isBlockIntegration]);

    /** Client-side return to portal root app grid for the active persona (`?persona=`). */
    const goPortalAppsShell = useCallback(() => {
        const search = `?persona=${encodeURIComponent(portalPersona)}`;
        navigate({ pathname: '/', search, hash: '' });
        setSelectedAppId(null);
        setSelectedTileId(null);
        setSelectedDaContentUrl(null);
    }, [navigate, portalPersona]);

    const prevPersonaSearchRef = useRef<string | null>(null);
    useEffect(() => {
        const cur = location.search ?? '';
        if (prevPersonaSearchRef.current === cur) return;
        prevPersonaSearchRef.current = cur;
        const q = new URLSearchParams(cur).get('persona');
        if (!q || !isPortalPersonaId(q)) return;
        if (q === portalPersona) return;
        applyPortalPersona(q);
    }, [location.search, portalPersona, applyPortalPersona]);

    const prevAccessTokenRef = useRef('');
    useEffect(() => {
        const prev = prevAccessTokenRef.current;
        prevAccessTokenRef.current = accessToken;
        if (!accessToken) return;
        const resolved = resolvePersonaFromAccessToken(accessToken);
        if (!resolved) return;
        const admin = isPortalAdminFromToken(accessToken);
        if (!prev) {
            if (!admin) {
                setSelectedPersona(resolved);
                setPortalPersona(resolved);
                setGridConfigVersion((v) => v + 1);
            }
            return;
        }
        if (!admin) {
            setSelectedPersona(resolved);
            setPortalPersona(resolved);
            setGridConfigVersion((v) => v + 1);
        }
    }, [accessToken]);

    useEffect(() => {
        const st = location.state as { openSkinEditor?: boolean; openApp?: string } | undefined;
        if (!st || (!st.openSkinEditor && !st.openApp)) return;
        if (st.openSkinEditor && authenticated) {
            setShowSkinEditor(true);
        }
        /* Deep-link to in-portal app without calling handleAppSelect (declared later in this component). */
        if (st.openApp === 'assets-browser') {
            setSelectedAppId('assets-browser');
            setSelectedTileId(null);
            setSelectedDaContentUrl(null);
        } else if (st.openApp === PORTAL_EMBED_ADOBE_FILES_APP_ID) {
            setSelectedAppId(PORTAL_EMBED_ADOBE_FILES_APP_ID);
            setSelectedTileId(null);
            setSelectedDaContentUrl(null);
        }
        navigate(
            { pathname: location.pathname, search: location.search, hash: location.hash },
            { replace: true, state: {} }
        );
    }, [location.state, location.pathname, location.search, location.hash, authenticated, navigate]);

    useEffect(() => {
        const hasAccessToken = Boolean(accessToken);
        setAuthenticated(hasAccessToken || isCookieAuth());
    }, [accessToken]);

    useEffect(() => {
        if (!shouldOpenAdminActivitiesAfterSignIn(accessToken)) return;
        if (location.pathname !== '/' && location.pathname !== '/index.html') return;
        const delayMs = readPostLoginAdminRedirectDelayMs();
        const id = window.setTimeout(() => {
            if (!shouldOpenAdminActivitiesAfterSignIn(accessToken)) return;
            const path = typeof window !== 'undefined' ? window.location.pathname : '';
            if (path !== '/' && path !== '/index.html' && !path.endsWith('/index.html')) return;
            navigate('/admin/activities', { replace: true });
        }, delayMs);
        return () => window.clearTimeout(id);
    }, [accessToken, location.pathname, navigate]);

    useEffect(() => {
        const prev = prevLocationPathRef.current;
        prevLocationPathRef.current = location.pathname;
        if (prev.startsWith('/admin') && (location.pathname === '/' || location.pathname === '/index.html')) {
            setGridConfigVersion((v) => v + 1);
        }
    }, [location.pathname]);

    useEffect(() => {
        // Only create client when authenticated (either mechanism) and bucket is available
        if (authenticated && bucket) {
            if (accessToken && isCookieAuth()) {
                console.debug('🔑 Authenticated via IMS and Cookie. Using IMS route (during transition period)');
            } else if (accessToken) {
                console.debug('🔑 Authenticated via IMS only.');
            } else if (isCookieAuth()) {
                console.debug('🔑 Authenticated via Cookie only.');
            } else {
                console.debug('🔑 Not authenticated (not IMS, nor Cookie)');
            }
            setDynamicMediaClient(new DynamicMediaClient({
                bucket: bucket,
                accessToken: accessToken || undefined, // Pass undefined if empty string
            }));
        } else {
            console.debug('🔑 Not authenticated (not IMS, nor cookie)');
            setDynamicMediaClient(null);
        }
    }, [authenticated, accessToken, bucket]);

    // Keep accessToken in sync with localStorage
    useEffect(() => {
        try {
            localStorage.setItem('accessToken', accessToken || '');
        } catch (error) {
            // Silently fail if localStorage is not available
            console.warn('Failed to save access token to localStorage:', error);
        }
    }, [accessToken]);

    // Fetch AEM programs when selector is shown (assets browser, authenticated, admin)
    // Use user's token and IMS org (from profile) so backend can load entitlements for their org
    useEffect(() => {
        if (!showAemSelector) return;
        let cancelled = false;
        setAemProgramsLoading(true);
        setAemProgramsError(null);
        const token = localStorage.getItem('accessToken');
        const userOrg = (profile as { imsOrg?: string; org?: string })?.imsOrg ?? (profile as { imsOrg?: string; org?: string })?.org ?? '';
        const apiKey = getAdobeClientId();
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = token;
        if (userOrg) headers['x-user-ims-org'] = userOrg;
        if (apiKey) headers['x-api-key'] = apiKey;
        fetch('/api/aem-programs', { credentials: 'include', headers })
            .then((res) => {
                if (cancelled) return;
                if (res.status === 401 || res.status === 403) {
                    setAemProgramsError('Sign in to load environments.');
                    return res.json().catch(() => ({}));
                }
                if (!res.ok) {
                    setAemProgramsError('Cannot load environments.');
                    return res.json().catch(() => ({}));
                }
                return res.json();
            })
            .then((data: { programs?: AemProgramOption[]; error?: string }) => {
                if (cancelled) return;
                if (data?.programs && Array.isArray(data.programs)) {
                    setAemPrograms(data.programs);
                } else {
                    setAemPrograms([]);
                    if (data?.error) setAemProgramsError('Cannot load environments.');
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setAemProgramsError('Cannot load environments.');
                    setAemPrograms([]);
                }
            })
            .finally(() => {
                if (!cancelled) setAemProgramsLoading(false);
            });
        return () => { cancelled = true; };
    }, [showAemSelector, profile]);

    const handleAemProgramSelect = useCallback((program: AemProgramOption | null) => {
        setSelectedAemProgramState(program);
        setSelectedAemProgram(program);
    }, []);

    // After OAuth redirect, restore Assets Browser (or other app) so user lands in right-content-area
    useEffect(() => {
        try {
            const savedApp = sessionStorage.getItem('postSignInRedirectApp');
            if (savedApp) {
                setSelectedAppId(savedApp);
                sessionStorage.removeItem('postSignInRedirectApp');
            }
        } catch {
            // ignore
        }
    }, []);

    // Process and display Adobe Dynamic Media images
    const processDMImages = useCallback(async (content: unknown, isLoadingMore: boolean = false): Promise<void> => {
        // For demo, just parse and set images if possible
        if (!isLoadingMore) {
            setDmImages([]);
        }

        setSearchResults(null);
        try {
            const contentData = content as Record<string, unknown>;
            const results = contentData.results as SearchResults['results'];

            if (results && results[0]?.hits) {
                const hits = results[0].hits as SearchResult['hits'];
                if (hits.length > 0) {
                    // No longer download blobs upfront - just prepare metadata for lazy loading
                    // Each hit is transformed to match the Asset interface
                    let processedImages: Asset[] = hits.map(populateAssetFromHit);

                    // When performing a rights search, we need to check the rights of the assets
                    if (isRightsSearchRef.current) {
                        const checkRightsRequest: CheckRightsRequest = {
                            inDate: calendarDateToEpoch(rightsStartDate as CalendarDate),
                            outDate: calendarDateToEpoch(rightsEndDate as CalendarDate),
                            selectedExternalAssets: processedImages.filter(image => image.readyToUse?.toLowerCase() !== 'yes').map(image => image.assetId).filter((id): id is string => Boolean(id)).map(id => id.replace('urn:aaid:aem:', '')),
                            selectedRights: {
                                "20": Array.from(selectedMediaChannels).map(channel => channel.id),
                                "30": Array.from(selectedMarkets).map(market => market.id)
                            }
                        };
                        const fadelClient = FadelClient.getInstance();
                        const checkRightsResponse = await fadelClient.checkRights(checkRightsRequest);
                        // Assets that are not in the response are considered authorized
                        // Use immutable update pattern instead of direct mutation
                        processedImages = processedImages.map(image => {
                            const matchingItem = checkRightsResponse.restOfAssets.find(item => `urn:aaid:aem:${item.asset.assetExtId}` === image.assetId);
                            const authorized = matchingItem ? (matchingItem.notAvailable ? AuthorizationStatus.NOT_AVAILABLE
                                : (matchingItem.availableExcept ? AuthorizationStatus.AVAILABLE_EXCEPT : AuthorizationStatus.AVAILABLE))
                                : AuthorizationStatus.AVAILABLE;
                            return { ...image, authorized };
                        });
                    }

                    // Update state after processing (with or without rights check)
                    if (isLoadingMore) {
                        // Append to existing images
                        setDmImages(prev => [...prev, ...processedImages]);
                    } else {
                        // Replace existing images
                        setDmImages(processedImages);
                    }
                }
                // Store the complete results object with nbHits and update pagination info
                setSearchResults(results as SearchResults['results']);
                setTotalPages((results[0] as { nbPages?: number }).nbPages || 0);
            } else {
                setTotalPages(0);
            }
        } catch (error) {
            console.error('Error processing dynamic media images:', error);
        }
        setLoading(prev => ({ ...prev, [LOADING.dmImages]: false }));
        setIsLoadingMore(false);
    }, [rightsStartDate, rightsEndDate, selectedMarkets, selectedMediaChannels]);



    // Search assets (images, videos, etc.)
    const performSearchImages = useCallback((query: string, page: number = 0): void => {
        if (!dynamicMediaClient) return;

        const isLoadingMore = page > 0;
        if (isLoadingMore) {
            setIsLoadingMore(true);
        } else {
            setLoading(prev => ({ ...prev, [LOADING.dmImages]: true }));
            setCurrentPage(0);
        }
        setCurrentView(CURRENT_VIEW.images);
        dynamicMediaClient.searchAssets(query.trim(), {
            collectionId: selectedCollection?.collectionId,
            facets: excFacets ? transformExcFacetsToHierarchyArray(excFacets) : [],
            facetFilters: selectedFacetFilters,
            numericFilters: selectedNumericFilters,
            filters: presetFilters,
            hitsPerPage: externalParams.hitsPerPage || HITS_PER_PAGE,
            page: page
        }).then((content) => processDMImages(content, isLoadingMore)).catch((error) => {
            // Prevent infinite execution when Network error occurs
            if (error?.message === 'Network error') {
                console.warn('Network error encountered, stopping execution to prevent infinite loop');
                setLoading(prev => ({ ...prev, [LOADING.dmImages]: false }));
                setIsLoadingMore(false);
                // Don't clear images or trigger further state changes that might cause re-execution
                return;
            }

            console.error('Error searching assets:', error);
            setLoading(prev => ({ ...prev, [LOADING.dmImages]: false }));
            setIsLoadingMore(false);
            if (!isLoadingMore) {
                setDmImages([]);
            }
        });

    }, [dynamicMediaClient, processDMImages, selectedCollection, selectedFacetFilters, selectedNumericFilters, excFacets, presetFilters, externalParams.hitsPerPage]);

    // Handler for loading more results (pagination)
    const handleLoadMoreResults = useCallback((): void => {
        if (currentPage + 1 < totalPages && !isLoadingMore) {
            const nextPage = currentPage + 1;
            setCurrentPage(nextPage);
            performSearchImages(query, nextPage);
        }
    }, [currentPage, totalPages, isLoadingMore, performSearchImages, query]);

    // Handler for searching
    const search = useCallback((searchQuery?: string): void => {
        if (searchDisabledRef.current) {
            return;
        }
        setCurrentPage(0);
        // Search for assets or assets in a collection
        const queryToUse = searchQuery !== undefined ? searchQuery : query;
        performSearchImages(queryToUse, 0);
    }, [performSearchImages, query]);





    // Read query and selectedQueryType from URL on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const urlQuery = params.get('query');
        const queryType = params.get('selectedQueryType');

        // Check for saved search parameters
        const fulltext = params.get('fulltext');
        const facetFiltersParam = params.get('facetFilters');
        const numericFiltersParam = params.get('numericFilters');

        if (urlQuery !== null) setQuery(urlQuery);
        if (queryType !== null && (queryType === QUERY_TYPES.ASSETS || queryType === QUERY_TYPES.COLLECTIONS)) {
            setSelectedQueryType(queryType);
        }

        // Apply saved search parameters if present
        if (fulltext || facetFiltersParam || numericFiltersParam) {
            try {
                if (fulltext) setQuery(fulltext);
                if (facetFiltersParam) {
                    const facetFilters = JSON.parse(decodeURIComponent(facetFiltersParam));
                    setSelectedFacetFilters(facetFilters);
                }
                if (numericFiltersParam) {
                    const numericFilters = JSON.parse(decodeURIComponent(numericFiltersParam));
                    setSelectedNumericFilters(numericFilters);
                }
                // Trigger search after a brief delay to ensure all state is updated
                setTimeout(() => {
                    setCurrentPage(0);
                    performSearchImages(fulltext || '', 0);
                }, 100);
            } catch (error) {
                console.warn('Error parsing URL search parameters:', error);
            }
        }
    }, [dynamicMediaClient, setSelectedFacetFilters, setSelectedNumericFilters, performSearchImages]);

    useEffect(() => {
        if (!dynamicMediaClient) return;
        const url = new URL(window.location.href);
        // Only strip app-specific params; preserve others like id
        ['query', 'selectedQueryType', 'fulltext', 'facetFilters', 'numericFilters']
            .forEach((key) => url.searchParams.delete(key));
        const next = url.pathname + (url.search ? `?${url.searchParams.toString()}` : '');
        window.history.replaceState({}, '', next);
    }, [selectedQueryType, dynamicMediaClient]);

    // Auto-search with empty query on app load
    useEffect(() => {
        if (!searchDisabled && authenticated && dynamicMediaClient && excFacets !== undefined) {
            search();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dynamicMediaClient, authenticated, excFacets, selectedFacetFilters, selectedNumericFilters, searchDisabled, selectedMarkets, selectedMediaChannels, rightsStartDate, rightsEndDate]);

    useEffect(() => {
        if (authenticated && !settingsLoadedRef.current) {
            setExcFacets(externalParams.excFacets || DEFAULT_FACETS);
            setPresetFilters(externalParams.presetFilters || []);
            settingsLoadedRef.current = true;
        }
    }, [authenticated, externalParams.excFacets, externalParams.presetFilters]);

    // Fetch IMS profile when authenticated via IMS (accessToken present)
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) return;

                // Use the dev proxy mapping `/api/ims` to the IMS endpoint in development
                const resp = await fetch('/api/ims/ims/userinfo/v2', {
                    headers: {
                        'Authorization': token
                    }
                });

                if (!resp.ok) {
                    console.warn('Failed to fetch IMS profile', resp.status);
                    return;
                }

                const data = await resp.json();
                setProfile(data);
                setProfileImageError(false);
                // Also set global window.user for existing codepaths
                try { window.user = data; } catch (e) { /* ignore */ }
            } catch (error) {
                console.error('Error fetching IMS profile:', error);
            }
        };

        if (authenticated) {
            fetchProfile();
        } else {
            setProfile(null);
            setProfileImageError(false);
            try { delete (window as never).user; } catch (e) { /* ignore */ }
        }
    }, [authenticated]);

    // Rights data fetching moved to individual Markets and MediaChannels components



    // Function to fetch and cache static renditions for a specific asset
    const fetchAssetRenditions = useCallback(async (asset: Asset): Promise<void> => {
        if (!dynamicMediaClient || !asset.assetId) return;

        // Check cache first - use functional state update to get current state
        let shouldFetchRenditions = false;
        setAssetRenditionsCache(prevCache => {
            // If already cached, don't fetch
            if (prevCache[asset.assetId!]) {
                asset.renditions = prevCache[asset.assetId!];
                return prevCache; // No state change
            }

            // If currently being fetched, don't fetch again
            if (fetchingAssetsRef.current.has(asset.assetId!)) {
                return prevCache; // No state change
            }

            // Mark as fetching and proceed
            fetchingAssetsRef.current.add(asset.assetId!);
            shouldFetchRenditions = true;
            return prevCache; // No state change yet
        });

        // Only attach image presets to asset if it's not a video
        if (asset.formatType?.toLowerCase() !== 'video') {
            // Fetch image presets once for all assets (only if not already fetched/fetching)
            if (!imagePresets.items && !fetchingImagePresetsRef.current) {
                fetchingImagePresetsRef.current = true;
                try {
                    const presets = await dynamicMediaClient.getImagePresets();
                    setImagePresets(presets);
                    asset.imagePresets = presets;
                    console.log('Successfully fetched image presets');
                } catch (error) {
                    ToastQueue.negative('Failed to get all renditions info', { timeout: 2000 });
                    console.error('Failed to fetch image presets:', error);
                    setImagePresets({ items: [] }); // Set empty items array to prevent infinite loop
                } finally {
                    fetchingImagePresetsRef.current = false;
                }
            } else {
                asset.imagePresets = imagePresets;
            }
        }

        if (!shouldFetchRenditions) return;

        try {
            const renditions = await dynamicMediaClient.getAssetRenditions(asset);
            asset.renditions = renditions;
            setAssetRenditionsCache(prev => ({
                ...prev,
                [asset.assetId!]: renditions
            }));
            fetchingAssetsRef.current.delete(asset.assetId!);
        } catch (error) {
            console.error('Failed to fetch asset static renditions:', error);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dynamicMediaClient, imagePresets.items]);

    // Add useEffect to trigger search when selectedCollection changes
    useEffect(() => {
        if (selectedCollection && authenticated && dynamicMediaClient && excFacets !== undefined) {
            performSearchImages('', 0);
        }
    }, [selectedCollection, authenticated, dynamicMediaClient, excFacets, performSearchImages]);

    // Cart functions
    const handleAddToCart = async (image: Asset): Promise<void> => {
        if (!cartItems.some(item => item.assetId === image.assetId)) {
            // Cache the image when adding to cart
            if (dynamicMediaClient && image.assetId) {
                try {
                    const cacheKey = `${image.assetId}-350`;
                    await fetchOptimizedDeliveryBlob(
                        dynamicMediaClient,
                        image,
                        350,
                        {
                            cache: false,
                            cacheKey: cacheKey,
                            fallbackUrl: image.url
                        }
                    );
                } catch (error) {
                    console.warn(`Failed to cache image for cart ${image.assetId}:`, error);
                }
            }

            setCartItems(prev => [...prev, image]);
        }
    };

    const handleRemoveFromCart = (image: Asset): void => {
        setCartItems(prev => prev.filter(item => item.assetId !== image.assetId));

        // Clean up cached blobs for this asset
        if (image.assetId) {
            removeBlobFromCache(image.assetId);
        }
    };

    const handleBulkAddToCart = async (selectedCardIds: Set<string>, images: Asset[]): Promise<void> => {
        // Process all selected images in parallel
        const processCartImages = async (imageId: string): Promise<Asset | null> => {
            const image = images.find(img => img.assetId === imageId);
            if (!image || cartItems.some(item => item.assetId === image.assetId)) {
                return null;
            }

            return image;
        };

        // Process all images in parallel using Promise.allSettled for better error handling
        const results = await Promise.allSettled(
            Array.from(selectedCardIds).map(processCartImages)
        );

        // Filter successful results and extract the assets
        const newItems: Asset[] = results
            .filter((result): result is PromiseFulfilledResult<Asset | null> =>
                result.status === 'fulfilled' && result.value !== null)
            .map(result => result.value!);

        if (newItems.length > 0) {
            setCartItems(prev => [...prev, ...newItems]);
        }
    };

    // Sort handlers
    const handleSortByTopResults = (): void => {
        console.log('Sort by Top Results');
        // TODO: Implement actual sorting logic
    };

    const handleSortByDateCreated = (): void => {
        console.log('Sort by Date Created');
        // TODO: Implement actual sorting logic
    };

    const handleSortByLastModified = (): void => {
        console.log('Sort by Last Modified');
        // TODO: Implement actual sorting logic
    };

    const handleSortBySize = (): void => {
        console.log('Sort by Size');
        // TODO: Implement actual sorting logic
    };

    // Sort direction handlers
    const handleSortDirectionAscending = (): void => {
        console.log('Sort direction: Ascending');
        // TODO: Implement actual sorting logic
    };

    const handleSortDirectionDescending = (): void => {
        console.log('Sort direction: Descending');
        // TODO: Implement actual sorting logic
    };

    const handleApproveAssets = (): void => {
        if (cartItems.length === 0) {
            return;
        }
    };

    const handleDownloadAssets = (): void => {
        if (cartItems.length === 0) {
            return;
        }
        setIsCartOpen(false);
    };

    const handleIMSAccessToken = (token: string): void => {
        setAccessToken(token);
    };

    const handleSignOut = (): void => {
        console.log('🚪 User signed out, clearing access token');
        setSkipAdminLandingRedirect(false);
        setAccessToken('');
        try {
            clearEphemeralLocalStorageOnSignOut();
            const sessionStorageLength = sessionStorage.length;
            sessionStorage.clear();
            console.log(
                `✅ Cleared session storage (${sessionStorageLength} keys) and non-portal localStorage; preserved portal layouts, skin, persona, App Builder, saved searches.`
            );
        } catch (error) {
            console.error('❌ Error clearing browser storage:', error);
        }
        window.location.assign(getPortalSpaRootHref());
    };

    // Toggle mobile filter panel
    const handleToggleMobileFilter = (): void => {
        setIsMobileFilterOpen(!isMobileFilterOpen);
    };

    // Handle app selection
    const handleAppSelect = (appId: string): void => {
        const navItem = apps.find((a) => a.id === appId);
        const linkHref = navItem?.href?.trim();
        if (linkHref) {
            window.location.assign(linkHref);
            return;
        }
        if (appId === 'portal-activities' || appId === 'portal-admin' || appId === 'portal-grid') {
            navigate(`/admin/activities?persona=${encodeURIComponent(portalPersona)}`);
            return;
        }
        if (appId === 'portal-brand') {
            if (authenticated) {
                setShowSkinEditor(true);
            } else {
                ToastQueue.negative('Please sign in to customize portal branding', { timeout: 4000 });
            }
            return;
        }
        // If user selected Settings, only allow when authenticated
        if (appId === 'settings') {
            if (authenticated) {
                // Open external Adobe profile/settings in a new tab
                // This points to Adobe account management; change if a different URL is desired
                try {
                    window.open('https://account.adobe.com', '_blank', 'noopener');
                } catch (error) {
                    console.warn('Failed to open Adobe profile/settings URL', error);
                }
            } else {
                // Inform the user they must sign in to use Adobe products
                ToastQueue.negative('Please sign in to use an Adobe Product', { timeout: 4000 });
            }
            return;
        }

        setSelectedAppId(appId);
        setSelectedTileId(null);
        setSelectedDaContentUrl(null);
        // TODO: Load app-specific tiles/content based on selected app
    };

    // Handle tile click
    const handleTileClick = (tileId: string): void => {
        setSelectedTileId(tileId);
        setSelectedDaContentUrl(null);
    };

    // Delete mode: slots shake and show X; user can remove one to make room
    const [deleteMode, setDeleteMode] = useState(false);
    const [slotToDelete, setSlotToDelete] = useState<number | null>(null);

    const showPortalGridAdminChrome = portalPersona === 'admin';

    useEffect(() => {
        if (portalPersona !== 'admin') {
            setDeleteMode(false);
            setSlotToDelete(null);
        }
    }, [portalPersona]);
    const handleRequestDeleteSlot = useCallback((index: number) => {
        setSlotToDelete(index);
    }, []);

    const handleConfirmDeleteSlot = useCallback(() => {
        if (slotToDelete === null) return;
        const config = getGridEditConfig();
        const base = getExternalParams();
        const raw = config?.slotBlocks ?? base.slotBlocks ?? getDefaultSlotBlocks();
        const currentBlocks: (SlotBlockDescriptor | null)[] = Array.from({ length: 24 }, (_, i) => {
            const b = raw[i];
            return b != null && typeof b === 'object' ? (b as SlotBlockDescriptor) : null;
        });
        const nextBlocks = [...currentBlocks];
        nextBlocks[slotToDelete] = null;
        setGridEditConfig({
            slotBlocks: nextBlocks,
            gridTopContent: config?.gridTopContent ?? base.gridTopContent ?? '',
            gridTopBanners: config?.gridTopBanners ?? base.gridTopBanners ?? [],
            slotHeight: config?.slotHeight ?? base.slotHeight ?? 120,
            slotWidth: config?.slotWidth ?? base.slotWidth ?? 140,
        });
        setSlotToDelete(null);
        setDeleteMode(false);
        setGridConfigVersion((v) => v + 1);
    }, [slotToDelete]);

    const handleCancelDeleteSlot = useCallback(() => {
        setSlotToDelete(null);
    }, []);

    const handleExitDeleteMode = useCallback(() => {
        setDeleteMode(false);
        setSlotToDelete(null);
    }, []);

    const handleProfileClick = (): void => {
        // Open Adobe account management in a new tab for both profile icon and Settings
        try {
            window.open('https://account.adobe.com', '_blank', 'noopener');
        } catch (error) {
            console.warn('Failed to open Adobe account URL', error);
        }
    };

    // Add breadcrumbs for navigation when inside a collection
    const breadcrumbs = selectedCollection && (
        <div className="breadcrumbs">
            <span
                className="breadcrumb-link"
                onClick={() => {
                    setSelectedCollection(null);
                    setCurrentView(CURRENT_VIEW.collections);
                }}
            >
                Collections
            </span>
            <span className="breadcrumb-separator"> &gt; </span>
            <span>{selectedCollection.collectionMetadata?.title || 'Collection'}</span>
        </div>
    );

    // Gallery logic
    const enhancedGallery = (
        <>
            {currentView === CURRENT_VIEW.images ? (
                <ImageGallery
                    images={dmImages}
                    loading={loading[LOADING.dmImages]}
                    onAddToCart={handleAddToCart}
                    onRemoveFromCart={handleRemoveFromCart}
                    cartItems={cartItems}
                    searchResult={searchResults?.[0] || null}
                    onToggleMobileFilter={handleToggleMobileFilter}
                    isMobileFilterOpen={isMobileFilterOpen}
                    onBulkAddToCart={handleBulkAddToCart}
                    onSortByTopResults={handleSortByTopResults}
                    onSortByDateCreated={handleSortByDateCreated}
                    onSortByLastModified={handleSortByLastModified}
                    onSortBySize={handleSortBySize}
                    onSortDirectionAscending={handleSortDirectionAscending}
                    onSortDirectionDescending={handleSortDirectionDescending}
                    selectedSortType={selectedSortType}
                    selectedSortDirection={selectedSortDirection}
                    onSortTypeChange={setSelectedSortType}
                    onSortDirectionChange={setSelectedSortDirection}
                    onLoadMoreResults={handleLoadMoreResults}
                    hasMorePages={currentPage + 1 < totalPages}
                    isLoadingMore={isLoadingMore}
                    imagePresets={imagePresets}
                    assetRenditionsCache={assetRenditionsCache}
                    fetchAssetRenditions={fetchAssetRenditions}
                    isRightsSearch={isRightsSearch}
                />
            ) : (
                <></>
            )}
        </>
    );

    const showPortalWorkspaceAgent =
        !selectedDaContentUrl &&
        selectedTileId !== 'firefly' &&
        selectedTileId !== 'experience-hub' &&
        selectedTileId !== 'ai-agents';

    const portalPersonaImpersonationUi = useMemo(() => {
        void personaImpersonationUiEpoch;
        return canImpersonatePortalPersona && accessToken?.trim()
            ? getPortalPersonaImpersonationUi(accessToken, portalPersona)
            : null;
    }, [canImpersonatePortalPersona, accessToken, portalPersona, personaImpersonationUiEpoch]);

    const headerPersonaImpersonation = useMemo(() => {
        if (!portalPersonaImpersonationUi) return undefined;
        return {
            personaLabel: portalPersonaImpersonationUi.personaLabel,
            onEndPersona: handleEndPersonaImpersonation,
        };
    }, [portalPersonaImpersonationUi, handleEndPersonaImpersonation]);

    return (
        <AppConfigProvider
            externalParams={externalParams}
            dynamicMediaClient={dynamicMediaClient}
            fetchAssetRenditions={fetchAssetRenditions}
            imagePresets={imagePresets}
        >
            <div className="container">
                <div className="portal-sticky-header-stack">
                    <HeaderBar
                        cartItems={cartItems}
                        handleAuthenticated={handleIMSAccessToken}
                        handleSignOut={handleSignOut}
                        profile={profileWithJwtAvatar}
                        sessionActive={authenticated}
                        imsSession={Boolean(accessToken?.trim())}
                        personaImpersonation={headerPersonaImpersonation}
                        onReloadPortalHome={reloadPortalLanding}
                    />
                    {portalPersonaImpersonationUi ? (
                        <PersonaActivitiesTopbar
                            personaId={portalPersonaImpersonationUi.effectivePersonaId}
                            authChrome={{
                                sessionActive: authenticated,
                                imsSession: Boolean(accessToken?.trim()),
                                onAuthenticated: handleIMSAccessToken,
                                onSignOut: handleSignOut,
                                profile: profileWithJwtAvatar,
                            }}
                        />
                    ) : null}
                </div>

                {/* Cart Container - moved from HeaderBar, now uses Portal */}
                {createPortal(
                    <CartPanel
                        isOpen={isCartOpen}
                        onClose={() => setIsCartOpen(false)}
                        cartItems={cartItems}
                        setCartItems={setCartItems}
                        onRemoveItem={handleRemoveFromCart}
                        onApproveAssets={handleApproveAssets}
                        onDownloadAssets={handleDownloadAssets}
                    />,
                    document.body
                )}

                {createPortal(
                    <ProfileModal
                        isOpen={showProfileModal}
                        onClose={() => setShowProfileModal(false)}
                        onSignOut={handleSignOut}
                        isAuthenticated={authenticated}
                        onSignIn={handleIMSAccessToken}
                    />,
                    document.body
                )}

                <SkinEditorModal
                    isOpen={showSkinEditor}
                    onClose={() => setShowSkinEditor(false)}
                />

                {personaImpersonateModalOpen &&
                    createPortal(
                        <PersonaImpersonateModal
                            isOpen
                            onClose={() => setPersonaImpersonateModalOpen(false)}
                            onSelectPersona={(p) => {
                                setSkipAdminLandingRedirect(true);
                                applyPortalPersona(p, { markPersonaPreviewStrip: true });
                                setPersonaImpersonateModalOpen(false);
                            }}
                            currentPersona={portalPersona}
                        />,
                        document.body
                    )}

                {slotToDelete !== null && createPortal(
                    <div className="grid-dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-slot-dialog-title">
                        <div className="grid-dialog">
                            <h2 id="delete-slot-dialog-title">Delete this slot?</h2>
                            <p>The app in this slot will be removed from the grid.</p>
                            <div className="grid-dialog-actions">
                                <button type="button" className="app-grid-customize-btn" onClick={handleConfirmDeleteSlot}>
                                    Delete
                                </button>
                                <button type="button" className="app-grid-customize-btn secondary" onClick={handleCancelDeleteSlot}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

                <div className="admin-shell portal-workspace-root">
                    <div className="admin-shell-body">
                        <aside className="admin-shell-rail" aria-label="Portal navigation">
                            <button type="button" className="admin-shell-rail-item" onClick={reloadPortalLanding} title="Home" aria-label="Home">
                                <span className="admin-shell-rail-icon">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                        <polyline points="9 22 9 12 15 12 15 22" />
                                    </svg>
                                </span>
                                <span className="admin-shell-rail-label">Home</span>
                            </button>
                            <button
                                type="button"
                                className="admin-shell-rail-item"
                                onClick={goPortalAppsShell}
                                title={`Apps — grid for ${PORTAL_PERSONA_LABELS[portalPersona]}`}
                                aria-label={`Apps — portal grid for ${PORTAL_PERSONA_LABELS[portalPersona]}`}
                            >
                                <span className="admin-shell-rail-icon">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                                        <rect x="3" y="3" width="7" height="7" rx="1" />
                                        <rect x="14" y="3" width="7" height="7" rx="1" />
                                        <rect x="14" y="14" width="7" height="7" rx="1" />
                                        <rect x="3" y="14" width="7" height="7" rx="1" />
                                    </svg>
                                </span>
                                <span className="admin-shell-rail-label">Apps</span>
                            </button>
                            <div className="admin-shell-rail-files-stack">
                                <button
                                    type="button"
                                    className={`admin-shell-rail-item ${
                                        selectedAppId === PORTAL_EMBED_ADOBE_FILES_APP_ID ? 'active' : ''
                                    }`}
                                    title="Files — Adobe cloud storage (in portal)"
                                    aria-label="Files — Adobe cloud storage (in portal)"
                                    onClick={() => {
                                        setSelectedAppId(PORTAL_EMBED_ADOBE_FILES_APP_ID);
                                        setSelectedTileId(null);
                                        setSelectedDaContentUrl(null);
                                        setIframeCannotDisplay(false);
                                    }}
                                >
                                    <span className="admin-shell-rail-icon">
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                        </svg>
                                    </span>
                                    <span className="admin-shell-rail-label">Files</span>
                                </button>
                                <button
                                    type="button"
                                    className={`admin-shell-rail-item ${isAssetsBrowser ? 'active' : ''}`}
                                    onClick={() => handleAppSelect('assets-browser')}
                                    title="Assets — browse and search"
                                    aria-label="Assets — browse and search"
                                >
                                    <span className="admin-shell-rail-icon">
                                        <PortalAppRailIcon appId="assets-browser" />
                                    </span>
                                    <span className="admin-shell-rail-label">Assets</span>
                                </button>
                                {canImpersonatePortalPersona ? (
                                    <button
                                        type="button"
                                        className="admin-shell-rail-persona-btn"
                                        onClick={() => setPersonaImpersonateModalOpen(true)}
                                        title="View portal as a persona"
                                        aria-label="View portal as a persona"
                                    >
                                        <PersonaGlyph size={20} />
                                    </button>
                                ) : null}
                            </div>
                            <div className="admin-shell-rail-divider" aria-hidden />
                            {portalRailApps.map((app) => {
                                const railActive = selectedAppId === app.id;
                                const railClass = `admin-shell-rail-item${railActive ? ' active' : ''}`;
                                const railInner = (
                                    <>
                                        <span className="admin-shell-rail-icon">
                                            <PortalAppRailIcon appId={app.id} />
                                        </span>
                                        <span className="admin-shell-rail-label">{app.name}</span>
                                    </>
                                );
                                const href = app.href?.trim();
                                if (href) {
                                    return (
                                        <a
                                            key={app.id}
                                            href={href}
                                            className={railClass}
                                            title={app.name}
                                            aria-label={app.name}
                                            onClick={(e) => {
                                                if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return;
                                                e.preventDefault();
                                                handleAppSelect(app.id);
                                            }}
                                        >
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
                                        onClick={() => handleAppSelect(app.id)}
                                    >
                                        {railInner}
                                    </button>
                                );
                            })}
                        </aside>
                        <main
                            className={`admin-shell-main portal-workspace-main${showWorkspaceIframe ? ' portal-workspace-main--embed' : ''}`}
                        >
                            {showPortalWorkspaceAgent ? (
                                <section className="admin-shell-agent" aria-label="Agent prompt (coming soon)">
                                    <div className="admin-shell-agent-label">Prompt</div>
                                    <textarea
                                        className="admin-shell-agent-input"
                                        placeholder="Describe what you want to change or generate for the portal. A top-level agent will run here later."
                                        value={portalWorkspacePrompt}
                                        onChange={(e) => setPortalWorkspacePrompt(e.target.value)}
                                        rows={2}
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
                                            Use <strong>Admin activities</strong> to edit the grid and navigation for each persona. Status messages from saves
                                            appear when you return from the admin workspace.
                                        </p>
                                    </div>
                                </section>
                            ) : null}
                            <div
                                className={`portal-workspace-main-scroll${showWorkspaceIframe ? ' portal-workspace-main-scroll--embed' : ''}`}
                            >
                        {isAssetsBrowser && !authenticated ? (
                            <div className="aem-signin-in-content">
                                <p className="aem-signin-in-content-text">
                                    Sign in with Adobe to select an AEM instance and browse assets.
                                </p>
                            </div>
                        ) : isAssetsBrowser ? (
                            <>
                                {showAemSelector && (
                                    <div className="aem-instance-selector-bar">
                                        <label htmlFor="aem-instance-select" className="aem-instance-selector-label">
                                            AEM instance
                                        </label>
                                        <select
                                            id="aem-instance-select"
                                            className="aem-instance-select"
                                            value={selectedAemProgram?.id ?? ''}
                                            onChange={(e) => {
                                                const id = e.target.value;
                                                const program = id ? (aemPrograms?.find((p) => p.id === id) ?? null) : null;
                                                handleAemProgramSelect(program);
                                            }}
                                            disabled={aemProgramsLoading}
                                            aria-label="Select AEM instance"
                                        >
                                            <option value="">Select environment…</option>
                                            {aemPrograms?.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name}
                                                </option>
                                            ))}
                                        </select>
                                        <label htmlFor="aem-program-name-field" className="aem-instance-selector-label">
                                            Program name
                                        </label>
                                        <input
                                            id="aem-program-name-field"
                                            type="text"
                                            className="aem-program-name-field"
                                            readOnly
                                            value={selectedAemProgram?.name ?? ''}
                                            placeholder="Select an environment above"
                                            aria-label="Program name"
                                        />
                                        {aemProgramsLoading && <span className="aem-instance-selector-loading">Loading…</span>}
                                        {aemProgramsError && <span className="aem-instance-selector-error">{aemProgramsError}</span>}
                                    </div>
                                )}
                                <div className="search-bar-container search-bar-in-content">
                                    <SearchBar
                                        query={query}
                                        setQuery={setQuery}
                                        sendQuery={search}
                                        selectedQueryType={selectedQueryType}
                                        setSelectedQueryType={handleSetSelectedQueryType}
                                        inputRef={searchBarRef}
                                    />
                                    {authenticated ? (
                                        <a
                                            className="profile-icon-btn-search profile-avatar-link"
                                            href="https://account.adobe.com"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label="Profile"
                                            title="Open Adobe Account"
                                        >
                                            {profilePictureUrl && !profileImageError ? (
                                                <img
                                                    src={profilePictureUrl}
                                                    alt=""
                                                    className="profile-avatar-img account-profile-image"
                                                    width={24}
                                                    height={24}
                                                    onError={() => setProfileImageError(true)}
                                                />
                                            ) : (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                    <circle cx="12" cy="7" r="4"></circle>
                                                </svg>
                                            )}
                                        </a>
                                    ) : (
                                        <button
                                            className="profile-icon-btn-search"
                                            onClick={() => setShowProfileModal(true)}
                                            aria-label="Profile"
                                            title="Sign in"
                                        >
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                <circle cx="12" cy="7" r="4"></circle>
                                            </svg>
                                        </button>
                                    )}
                                </div>
                                <div className="images-container">
                                <div className="images-content-wrapper">
                                    <div className="images-content-row">
                                        <div className="images-main">
                                            {breadcrumbs}
                                            {enhancedGallery}
                                        </div>
                                        <div className={`facet-filter-panel ${isMobileFilterOpen ? 'mobile-open' : ''}`}>
                                            <Facets
                                                searchResults={searchResults}
                                                selectedFacetFilters={selectedFacetFilters}
                                                setSelectedFacetFilters={setSelectedFacetFilters}
                                                search={search}
                                                excFacets={excFacets}
                                                selectedNumericFilters={selectedNumericFilters}
                                                setSelectedNumericFilters={setSelectedNumericFilters}
                                                query={query}
                                                setQuery={setQuery}
                                                searchDisabled={searchDisabled}
                                                setSearchDisabled={handleSetSearchDisabled}
                                                setIsRightsSearch={handleSetIsRightsSearch}
                                                rightsStartDate={rightsStartDate}
                                                setRightsStartDate={setRightsStartDate}
                                                rightsEndDate={rightsEndDate}
                                                setRightsEndDate={setRightsEndDate}
                                                selectedMarkets={selectedMarkets}
                                                setSelectedMarkets={setSelectedMarkets}
                                                selectedMediaChannels={selectedMediaChannels}
                                                setSelectedMediaChannels={setSelectedMediaChannels}
                                            />
                                        </div>
                                    </div>
                                    {/* <Footer /> */}
                                </div>
                            </div>
                            </>
                        ) : selectedAppId === PORTAL_EMBED_ADOBE_FILES_APP_ID ? (
                            <div className="da-content-in-frame">
                                <iframe
                                    title="Adobe Files"
                                    src={ADOBE_FILES_WEB_URL}
                                    className="da-content-in-frame-iframe"
                                />
                                {iframeCannotDisplay && (
                                    <div className="da-content-in-frame-error" role="alert">
                                        <p className="da-content-in-frame-error-text">
                                            Adobe Files could not be displayed in this frame (the site may block embedding). You can open it in a new tab
                                            instead.
                                        </p>
                                        <a
                                            href={ADOBE_FILES_WEB_URL}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="app-grid-customize-btn da-content-in-frame-error-link"
                                        >
                                            Open Adobe Files in new tab
                                        </a>
                                    </div>
                                )}
                            </div>
                        ) : selectedAppId === 'dashboard' ? (
                            <Dashboard />
                        ) : selectedDaContentUrl ? (
                            <div className="da-content-in-frame da-content-in-frame--clip-embedded-top-app-bar">
                                <div className="da-content-in-frame-clip">
                                    <iframe
                                        title="DA Content"
                                        src={selectedDaContentUrl}
                                        className="da-content-in-frame-iframe"
                                    />
                                </div>
                                {iframeCannotDisplay && (
                                    <div className="da-content-in-frame-error" role="alert">
                                        <p className="da-content-in-frame-error-text">
                                            This application could not be displayed in this frame. It may not allow embedding (for example, firefly.adobe.com).
                                        </p>
                                        <a
                                            href={selectedDaContentUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="app-grid-customize-btn da-content-in-frame-error-link"
                                        >
                                            Open in new tab
                                        </a>
                                    </div>
                                )}
                            </div>
                        ) : selectedTileId === 'firefly' ? (
                            // Wrap Firefly in Extensible so UI Extensions can be loaded into that subtree.
                            <ErrorBoundary fallback={<Firefly onBack={() => setSelectedTileId(null)} />}> 
                                <Extensible
                                    // Provide both shapes to be compatible with different library versions
                                    extensions={fireflyExtensions}
                                    extensionsProvider={async () => fireflyExtensions}
                                >
                                    <Firefly onBack={() => setSelectedTileId(null)} />
                                </Extensible>
                            </ErrorBoundary>
                        ) : selectedTileId === 'experience-hub' ? (
                            <ExperienceHub onBack={() => setSelectedTileId(null)} />
                        ) : selectedTileId === 'ai-agents' ? (
                            <AIAgents onBack={() => setSelectedTileId(null)} />
                        ) : (
                            <>
                                {showPortalGridAdminChrome ? (
                                    <div className="app-grid-view-toggle">
                                        <label className="portal-persona-switcher">
                                            <span className="portal-persona-switcher-label">View as</span>
                                            {canImpersonatePortalPersona ? (
                                                <select
                                                    className="portal-persona-select"
                                                    value={portalPersona}
                                                    onChange={handlePortalPersonaChange}
                                                    aria-label="Portal persona"
                                                >
                                                    {PORTAL_PERSONA_ORDER.map((id) => (
                                                        <option key={id} value={id}>
                                                            {PORTAL_PERSONA_LABELS[id]}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className="portal-persona-readonly" aria-live="polite">
                                                    {PORTAL_PERSONA_LABELS[portalPersona]}
                                                </span>
                                            )}
                                        </label>
                                        {canImpersonatePortalPersona ? (
                                            <p className="portal-persona-switcher-hint">
                                                Impersonate Marketeer, Developer, or Org admin to see that persona&apos;s rail and grid. Admin activities keeps the
                                                same persona in sync when you change layout there.
                                            </p>
                                        ) : null}
                                        <button
                                            type="button"
                                            className={`app-grid-customize-btn ${viewMode === 'admin' ? 'active' : ''}`}
                                            onClick={() => setViewMode('admin')}
                                        >
                                            Admin
                                        </button>
                                        <button
                                            type="button"
                                            className={`app-grid-customize-btn ${viewMode === 'creator' ? 'active' : ''}`}
                                            onClick={() => setViewMode('creator')}
                                        >
                                            Creator
                                        </button>
                                    </div>
                                ) : null}
                                {showPortalGridAdminChrome && viewMode === 'admin' ? (
                                    <div className="app-grid-edit-bar">
                                        <button
                                            type="button"
                                            className="app-grid-customize-btn"
                                            onClick={() =>
                                                navigate(`/admin/activities?persona=${encodeURIComponent(portalPersona)}`)
                                            }
                                        >
                                            Admin activities
                                        </button>
                                        <button
                                            type="button"
                                            className="app-grid-customize-btn"
                                            onClick={() => setShowSkinEditor(true)}
                                        >
                                            Customize
                                        </button>
                                        {deleteMode ? (
                                            <button
                                                type="button"
                                                className="app-grid-customize-btn"
                                                onClick={handleExitDeleteMode}
                                            >
                                                Done
                                            </button>
                                        ) : null}
                                    </div>
                                ) : null}
                                <div className="admin-shell-grid-wrap">
                                    {showPortalGridAdminChrome ? (
                                        <div className="admin-shell-grid-persona" role="status">
                                            <span className="admin-shell-grid-persona-label">Viewing as</span>
                                            <span className="admin-shell-grid-persona-name">{PORTAL_PERSONA_LABELS[portalPersona]}</span>
                                            <span className="admin-shell-grid-persona-hint">
                                                Edit slots and navigation in <strong>Admin activities</strong>.
                                            </span>
                                        </div>
                                    ) : null}
                                    <AppGrid
                                        tiles={appTiles}
                                        onTileClick={handleTileClick}
                                        topContent={getExternalParams().gridTopContent}
                                        topBanners={getExternalParams().gridTopBanners}
                                        slotHeight={getExternalParams().slotHeight}
                                        slotWidth={getExternalParams().slotWidth}
                                        hideEmptySlots={!showPortalGridAdminChrome || viewMode === 'creator'}
                                        deleteMode={showPortalGridAdminChrome && deleteMode}
                                        onRequestDeleteSlot={
                                            showPortalGridAdminChrome && deleteMode ? handleRequestDeleteSlot : undefined
                                        }
                                    />
                                </div>
                                <section className="admin-shell-bottom-slot" aria-label="Reserved for future content">
                                    <p className="admin-shell-bottom-placeholder">
                                        Content area reserved for documentation, activity feed, or embeds.
                                    </p>
                                </section>
                            </>
                        )}
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        </AppConfigProvider>
    );
}

export default MainApp;
