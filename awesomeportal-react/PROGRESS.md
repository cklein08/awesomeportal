# Awesome Portal (React) — progress tracker

Use this file to record what shipped and what is next. Update it when you merge meaningful work or change direction.

## Recently completed

- **Workspace iframe — full viewport and main column width** — `html` / `body` / `#root` use a full-height flex column chain; `.container` stretches with `min-height: 0` so nested flex children can shrink. When a workspace iframe is active (`showWorkspaceIframe`), `portal-workspace-main-scroll--embed` keeps the main scroll region from swallowing height (`overflow: hidden`, flex + `min-width: 0`), and `portal-workspace-main--embed` drops horizontal padding so DA tile / hosted embeds use the full main column (`index.css`, `MainApp.css`, `MainApp.tsx`).
- **Adobe Files in the portal body** — **Files** on the portal rail opens `https://www.adobe.com/files` inside the main workspace scroll area as an iframe (same window as the grid), via synthetic `selectedAppId` `PORTAL_EMBED_ADOBE_FILES_APP_ID` (`constants/adobeFilesEmbed.ts`, `MainApp.tsx`). **Admin activities** Files navigates to `/` with `location.state.openApp` so the SPA lands in that embed. If the site blocks framing, the existing iframe fallback offers opening in a new tab only then. **Assets** rail button opens the in-portal assets browser; distinct **image-frame** icon for assets vs folder icon for Files (`PortalAppRailIcon.tsx`). `openApp: 'assets-browser'` from admin; `assets-browser` stays off the duplicate rail list below the divider. Opening a DA tile iframe clears `selectedAppId` so DA content wins over the Files embed.
- **Admin activities — Skin & Applications chrome** — Skin tab uses the same **Layout & URLs** shell (`admin-shell-layout-panel`, `grid-edit-form-root` / sections / footer) instead of modal-style chrome (`SkinEditorModal.tsx`, `AdminActivities.tsx` / `.css`). **Applications** (entitled apps) column typography matches the agent prompt block (explicit stack + `0.95rem` / `1.45` on `admin-shell-right*`, avoiding global `h2` / `--font-heading` skew from skins).
- **Per-persona portal left nav** — Optional overrides in `localStorage` (`PERSONA_LEFT_NAV_STORAGE_KEY`), sanitize + getters/setters and `getEffectiveLeftNavForPersona` in `config.ts`; **Personas** tab on Admin activities edits rows (id, label, optional link); `MainApp` / `LeftNav` consume effective nav; event bumps rail when overrides change.
- **Grid edit (persona scope, App Builder)** — Layout editor reflects persona-scoped grids and App Builder URL drop-ins where implemented (`GridEditForm.tsx`, `GridEdit.css`, related `MainApp` / admin wiring).
- **Persona impersonation (admins)** — Org admins and legacy cookie hosts can open **View portal as** from a persona icon under **Assets browser** in the main left nav (`LeftNav.tsx`, `PersonaImpersonateModal.tsx`, `PersonaGlyph.tsx`, `portalAccess.ts` `canImpersonatePortalPersonas`). Same affordance under **Files** on Admin activities; choosing a persona sets storage, skips post-login admin redirect, and navigates to `/`. While impersonating, the **header** shows icon, persona name, and **End Persona** (restores IMS-derived persona and goes to `/admin/activities`). Full-width impersonation banner removed (`MainApp.css`). **View as** dropdown remains on the grid for admins.
- **Admin activities rail** — Removed persona-scoped app links below the Files/persona area; only a divider remains (`AdminActivities.tsx`, `AdminActivities.css`).
- **Persona control styling** — Persona icon buttons use no outline border (solid `LeftNav.css` / `AdminActivities.css` treatment).
- **Portal shell / skin** — Dark chrome aligned with admin activities across header, nav, grid, search, gallery (`portal-skin-tokens.css`, `index.css`, `applySkin.ts`, component CSS).
- **Splash = Adobe sign-in** — `SplashPage` uses `AdobeSignInButton` instead of Continue; `PortalSplashGate` opens the app after `onAuthenticated`. Legacy cookie dev hosts can use **Continue without Adobe**. Removed the duplicate full-screen IMS gate from `MainApp.tsx` (sign-in only on splash).
- **Client-branded portal title** — `VITE_PORTAL_CLIENT_NAME` + `getPortalTitle()` / `getPortalClientName()` in `src/utils/portalBranding.ts`; splash H1 and `document.title` show **{Client} Portal** (default name `Client` when unset). `index.html` title set generic **Portal** until the app runs.
- **IMS return & admin redirect delays** — `VITE_POST_IMS_RETURN_SETTLE_MS` (default 2500, `0` = off) waits before `location.replace` after OAuth hash handling so users can finish Adobe org/profile steps. `VITE_POST_LOGIN_ADMIN_REDIRECT_DELAY_MS` (default 3500, `0` = off) defers auto-navigation to Admin activities from `/`.
- **README — portal persona & IMS env** — Quick Reference documents persona/admin behavior, sign-out preservation, optional `VITE_IMS_*` / `VITE_PORTAL_*` variables, and pointers to `src/utils/imsPersona.ts` and `docs/HOSTED_TILES.md`.
- **Sign-out preserves portal config** — `clearEphemeralLocalStorageOnSignOut()` keeps grid/skin/persona/App Builder keys; `sessionStorage` still cleared on sign-out (`src/utils/config.ts`, `MainApp.tsx`).
- **IMS-driven persona** — Non-admins get persona from access token (optional env substring lists + `VITE_PORTAL_PERSONA_AFTER_SIGNIN`); admins / cookie hosts keep the persona switcher (`src/utils/imsPersona.ts`, `MainApp.tsx`).
- **Hosted tile open modes** — `openMode` on slots/entitlements (`iframe` | `new-tab` | `navigate`); curated Adobe tiles default to new tab; see `docs/HOSTED_TILES.md`.
- **`/admin` hub** — `AdminHub` route links to grid edit, branding (via navigation state), placeholder org settings; left nav **Admin hub** for admins (`App.tsx`, `portalPersonas.ts`).
- **Persona layouts & nav** — Per-persona grids (`awesomeportal_roleGrids`), persona switcher, App Builder drop-ins merged into entitlements, grid editor scoped by persona.
- **Heineken local demo** — Skin preset, Coachella banner asset, `VITE_HEINEKEN_DEMO`, bundled assets with Vite `base` via `withBase()`.
- **Portal skin system** — `PortalSkinConfig` extended (page/panel/elevated/search/border/text); `applySkin` sets `--portal-*` on `documentElement`; Skin Editor + Heineken preset.
- **Splash gate** — Full-screen splash before routes; session ack in `sessionStorage`; primary path is Adobe sign-in on the splash card; Heineken-style visual treatment; **`VITE_SKIP_SPLASH=true`** skips the gate (dev/CI/automation).
- **Image URLs in storage** — `normalizePersistedImageUrl` on grid banners and skin URL fields; read/write migration + `sanitizeAllStoredRoleGridsImageUrls()` on app load.
- **Gallery & asset cards** — `ImageGallery` / grid & list cards use `--portal-*` and heading/body font vars.
- **Cart & facets chrome** — Cart panels (assets, download, rights extension, rights check, templates) and `Facets.css` wired to `--portal-*` / `--font-*` for neutral surfaces; primary vars for branded actions.
- **CI-friendly build** — `SKIP_RUNTIME_CONFIG_VALIDATION=1` allows `generate-runtime-config.cjs` without full Adobe env; **`npm run build:ci`**; optional `tools/portal` copy skipped if directory missing.

## Environment quick reference

| Variable | Purpose |
|----------|---------|
| `VITE_HEINEKEN_DEMO=true` | Apply Heineken demo skin + grid strip on load. |
| `VITE_SKIP_SPLASH=true` | Skip splash gate entirely. |
| `SKIP_RUNTIME_CONFIG_VALIDATION=1` | Allow post-Vite config script with missing `VITE_*` (CI only). |
| `VITE_ADOBE_CLIENT_ID`, `VITE_BUCKET` | Required for real runtime config (strict `npm run build` default). |
| `VITE_IMS_ADMIN_GROUP_SUBSTRINGS` | Comma-separated fragments; if any appear in JWT JSON, user is portal admin (persona switcher). Unset = all IMS users treated as admin (demo default). |
| `VITE_IMS_PERSONA_*_SUBSTRINGS`, `VITE_PORTAL_PERSONA_AFTER_SIGNIN`, `VITE_PORTAL_ALL_USERS_ARE_ADMINS` | Optional IMS persona mapping; see `src/utils/imsPersona.ts` and **README** (Portal persona and admin). |
| `VITE_PORTAL_CLIENT_NAME` | Splash + `document.title`: shown as **{name} Portal** (`src/utils/portalBranding.ts`). |
| `VITE_POST_IMS_RETURN_SETTLE_MS` | Ms to wait after IMS token-in-URL before SPA reload (`0` = immediate). `src/utils/portalSession.ts`, `AdobeSignInButton.tsx`. |
| `VITE_POST_LOGIN_ADMIN_REDIRECT_DELAY_MS` | Ms on `/` before auto-redirect to Admin activities (`0` = immediate). `MainApp.tsx`. |

## Suggested next steps

- [ ] Extend `--portal-*` to any remaining panels (e.g. cart sub-modals, MUI-heavy areas) if gaps show up in Heineken or other skins.
- [ ] Remove or repurpose unused `public/brand-demos/heineken/hero.svg` if confirmed unused.
- [ ] Wire E2E/Playwright to set `VITE_SKIP_SPLASH` or seed `sessionStorage` for stable automation.
- [ ] Replace draft PR placeholders (issue link, real test URLs) when you open or update the PR.

## How to update this doc

After a meaningful change: add a short bullet under **Recently completed** (newest first) and tick or add items under **Suggested next steps**. Keep bullets factual (what/where), not full commit hashes unless useful for your team.
