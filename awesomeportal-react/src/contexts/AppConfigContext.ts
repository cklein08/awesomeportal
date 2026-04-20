import { createContext } from 'react';
import type { DynamicMediaClient } from '../clients/dynamicmedia-client';
import type { Asset, ExternalParams, PortalSkinConfig, Rendition } from '../types';

export interface AppConfigContextType {
    externalParams: ExternalParams;
    dynamicMediaClient: DynamicMediaClient | null;
    fetchAssetRenditions?: (asset: Asset) => Promise<void>;
    imagePresets?: {
        assetId?: string;
        items?: Rendition[];
        'repo:name'?: string;
    };
    skinConfig: PortalSkinConfig | null;
    setSkinConfig: (config: PortalSkinConfig | null) => void;
}

export const AppConfigContext = createContext<AppConfigContextType | undefined>(undefined);
