import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { DynamicMediaClient } from '../clients/dynamicmedia-client';
import { AppConfigContext } from '../contexts/AppConfigContext';
import type { Asset, ExternalParams, PortalSkinConfig, Rendition } from '../types';
import { applySkin } from '../utils/applySkin';
import { clearSkinConfig, getSkinConfig, setSkinConfig as persistSkinConfig } from '../utils/config';

interface AppConfigProviderProps {
    children: React.ReactNode;
    externalParams: ExternalParams;
    dynamicMediaClient: DynamicMediaClient | null;
    fetchAssetRenditions?: (asset: Asset) => Promise<void>;
    imagePresets?: {
        assetId?: string;
        items?: Rendition[];
        'repo:name'?: string;
    };
}

export const AppConfigProvider: React.FC<AppConfigProviderProps> = ({
    children,
    externalParams,
    dynamicMediaClient,
    fetchAssetRenditions,
    imagePresets
}) => {
    const [skinConfig, setSkinConfigState] = useState<PortalSkinConfig | null>(() => getSkinConfig());

    useEffect(() => {
        applySkin(skinConfig);
    }, [skinConfig]);

    const setSkinConfig = useCallback((config: PortalSkinConfig | null) => {
        if (config === null) {
            clearSkinConfig();
            setSkinConfigState(null);
        } else {
            persistSkinConfig(config);
            setSkinConfigState(config);
        }
    }, []);

    const value = useMemo(
        () => ({
            externalParams,
            dynamicMediaClient,
            fetchAssetRenditions,
            imagePresets,
            skinConfig,
            setSkinConfig
        }),
        [externalParams, dynamicMediaClient, fetchAssetRenditions, imagePresets, skinConfig, setSkinConfig]
    );

    return (
        <AppConfigContext.Provider value={value}>
            {children}
        </AppConfigContext.Provider>
    );
};
