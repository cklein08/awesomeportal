/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_ADOBE_CLIENT_ID: string
    readonly VITE_BUCKET: string
    /** When `"true"`, the session splash gate is skipped (local dev / CI / automated tests). */
    readonly VITE_SKIP_SPLASH?: string
    readonly VITE_HEINEKEN_DEMO?: string
    /** Comma-separated substrings matched (case-insensitive) against JWT JSON to treat user as org admin (persona switcher). Unset = permissive for demos. */
    readonly VITE_IMS_ADMIN_GROUP_SUBSTRINGS?: string
    /** Comma-separated substrings → `admin` persona when matched in JWT. */
    readonly VITE_IMS_PERSONA_ADMIN_SUBSTRINGS?: string
    /** Comma-separated substrings → `developer` persona when matched in JWT. */
    readonly VITE_IMS_PERSONA_DEVELOPER_SUBSTRINGS?: string
    /** Force persona after sign-in: `marketeer` | `developer` | `admin`. */
    readonly VITE_PORTAL_PERSONA_AFTER_SIGNIN?: string
    /** Dev only: treat every signed-in user as portal admin. */
    readonly VITE_PORTAL_ALL_USERS_ARE_ADMINS?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
} 