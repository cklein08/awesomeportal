/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_ADOBE_CLIENT_ID: string
    readonly VITE_BUCKET: string
    /** When `"true"`, the session splash gate is skipped (local dev / CI / automated tests). */
    readonly VITE_SKIP_SPLASH?: string
    readonly VITE_HEINEKEN_DEMO?: string
    /** Comma-separated substrings matched (case-insensitive) against JWT JSON to treat user as org admin (persona switcher). Unset = permissive for demos. */
    readonly VITE_IMS_ADMIN_GROUP_SUBSTRINGS?: string
    /** Legacy: substrings → org admin persona when matched (see VITE_IMS_PERSONA_ORG_ADMIN_SUBSTRINGS). */
    readonly VITE_IMS_PERSONA_ADMIN_SUBSTRINGS?: string
    readonly VITE_IMS_PERSONA_PORTAL_ADMIN_SUBSTRINGS?: string
    readonly VITE_IMS_PERSONA_ORG_ADMIN_SUBSTRINGS?: string
    readonly VITE_IMS_PERSONA_DEVELOPER_SUBSTRINGS?: string
    readonly VITE_IMS_PERSONA_CREATIVE_SUBSTRINGS?: string
    readonly VITE_IMS_PERSONA_MARKETEER_SUBSTRINGS?: string
    readonly VITE_IMS_PERSONA_CONTENT_CREATOR_SUBSTRINGS?: string
    readonly VITE_IMS_PERSONA_APPROVER_SUBSTRINGS?: string
    readonly VITE_IMS_PERSONA_REVIEWER_SUBSTRINGS?: string
    readonly VITE_IMS_PERSONA_EDITOR_SUBSTRINGS?: string
    readonly VITE_IMS_PERSONA_AGENT_SUBSTRINGS?: string
    /** Force persona after sign-in (single id; `admin` in URL is normalized to org_admin). */
    readonly VITE_PORTAL_PERSONA_AFTER_SIGNIN?: string
    /** Comma-separated persona ids to simulate multiple entitled roles (e.g. org_admin,developer). */
    readonly VITE_PORTAL_SIMULATED_ROLES?: string
    /** Set to `false` to disable auto-pairing org admin + developer for IMS org admins (see imsPersona). */
    readonly VITE_PORTAL_DUAL_ROLE_ORG_ADMIN_DEVELOPER?: string
    /** Dev only: treat every signed-in user as portal admin. */
    readonly VITE_PORTAL_ALL_USERS_ARE_ADMINS?: string
    /** Shown in splash title as "{name} Portal" (e.g. your client or program name). */
    readonly VITE_PORTAL_CLIENT_NAME?: string
    /** Milliseconds to wait after IMS returns tokens in the URL before reloading the SPA (org confirmation). `0` = immediate. */
    readonly VITE_POST_IMS_RETURN_SETTLE_MS?: string
    /** Milliseconds to wait on `/` before redirecting setup users to Admin activities. `0` = immediate. */
    readonly VITE_POST_LOGIN_ADMIN_REDIRECT_DELAY_MS?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
} 