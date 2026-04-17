# Awesome Portal (React) — progress tracker

Use this file to record what shipped and what is next. Update it when you merge meaningful work or change direction.

## Recently completed

- **README — portal persona & IMS env** — Quick Reference documents persona/admin behavior, sign-out preservation, optional `VITE_IMS_*` / `VITE_PORTAL_*` variables, and pointers to `src/utils/imsPersona.ts` and `docs/HOSTED_TILES.md`.
- **Sign-out preserves portal config** — `clearEphemeralLocalStorageOnSignOut()` keeps grid/skin/persona/App Builder keys; `sessionStorage` still cleared on sign-out (`src/utils/config.ts`, `MainApp.tsx`).
- **IMS-driven persona** — Non-admins get persona from access token (optional env substring lists + `VITE_PORTAL_PERSONA_AFTER_SIGNIN`); admins / cookie hosts keep the persona switcher (`src/utils/imsPersona.ts`, `MainApp.tsx`).
- **Hosted tile open modes** — `openMode` on slots/entitlements (`iframe` | `new-tab` | `navigate`); curated Adobe tiles default to new tab; see `docs/HOSTED_TILES.md`.
- **`/admin` hub** — `AdminHub` route links to grid edit, branding (via navigation state), placeholder org settings; left nav **Admin hub** for admins (`App.tsx`, `portalPersonas.ts`).
- **Persona layouts & nav** — Per-persona grids (`awesomeportal_roleGrids`), persona switcher, App Builder drop-ins merged into entitlements, grid editor scoped by persona.
- **Heineken local demo** — Skin preset, Coachella banner asset, `VITE_HEINEKEN_DEMO`, bundled assets with Vite `base` via `withBase()`.
- **Portal skin system** — `PortalSkinConfig` extended (page/panel/elevated/search/border/text); `applySkin` sets `--portal-*` on `documentElement`; Skin Editor + Heineken preset.
- **Splash gate** — Full-screen splash before routes; session ack in `sessionStorage`; Heineken-style visual treatment; **`VITE_SKIP_SPLASH=true`** skips the gate (dev/CI/automation).
- **Image URLs in storage** — `normalizePersistedImageUrl` on grid banners and skin URL fields; read/write migration + `sanitizeAllStoredRoleGridsImageUrls()` on app load.
- **Gallery & asset cards** — `ImageGallery` / grid & list cards use `--portal-*` and heading/body font vars.
- **Cart & facets chrome** — Cart panels (assets, download, rights extension, rights check, templates) and `Facets.css` wired to `--portal-*` / `--font-*` for neutral surfaces; primary vars for branded actions.
- **CI-friendly build** — `SKIP_RUNTIME_CONFIG_VALIDATION=1` allows `generate-runtime-config.cjs` without full Adobe env; **`npm run build:ci`**; optional `tools/assets-browser` copy skipped if directory missing.

## Environment quick reference

| Variable | Purpose |
|----------|---------|
| `VITE_HEINEKEN_DEMO=true` | Apply Heineken demo skin + grid strip on load. |
| `VITE_SKIP_SPLASH=true` | Skip splash gate entirely. |
| `SKIP_RUNTIME_CONFIG_VALIDATION=1` | Allow post-Vite config script with missing `VITE_*` (CI only). |
| `VITE_ADOBE_CLIENT_ID`, `VITE_BUCKET` | Required for real runtime config (strict `npm run build` default). |
| `VITE_IMS_ADMIN_GROUP_SUBSTRINGS` | Comma-separated fragments; if any appear in JWT JSON, user is portal admin (persona switcher). Unset = all IMS users treated as admin (demo default). |
| `VITE_IMS_PERSONA_*_SUBSTRINGS`, `VITE_PORTAL_PERSONA_AFTER_SIGNIN`, `VITE_PORTAL_ALL_USERS_ARE_ADMINS` | Optional IMS persona mapping; see `src/utils/imsPersona.ts` and **README** (Portal persona and admin). |

## Suggested next steps

- [ ] Extend `--portal-*` to any remaining panels (e.g. cart sub-modals, MUI-heavy areas) if gaps show up in Heineken or other skins.
- [ ] Remove or repurpose unused `public/brand-demos/heineken/hero.svg` if confirmed unused.
- [ ] Wire E2E/Playwright to set `VITE_SKIP_SPLASH` or seed `sessionStorage` for stable automation.
- [ ] Replace draft PR placeholders (issue link, real test URLs) when you open or update the PR.

## How to update this doc

After a meaningful change: add a short bullet under **Recently completed** (newest first) and tick or add items under **Suggested next steps**. Keep bullets factual (what/where), not full commit hashes unless useful for your team.
