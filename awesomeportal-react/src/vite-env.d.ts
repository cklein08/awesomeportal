/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_ADOBE_CLIENT_ID: string
    readonly VITE_BUCKET: string
    /** When `"true"`, the session splash gate is skipped (local dev / CI / automated tests). */
    readonly VITE_SKIP_SPLASH?: string
    readonly VITE_HEINEKEN_DEMO?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
} 