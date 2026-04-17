# Awesome Portal (React) — progress tracker

Use this file to record what shipped and what is next. Update it when you merge meaningful work or change direction.

## Recently completed

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

## Suggested next steps

- [ ] Extend `--portal-*` to any remaining panels (e.g. cart sub-modals, MUI-heavy areas) if gaps show up in Heineken or other skins.
- [ ] Remove or repurpose unused `public/brand-demos/heineken/hero.svg` if confirmed unused.
- [ ] Wire E2E/Playwright to set `VITE_SKIP_SPLASH` or seed `sessionStorage` for stable automation.
- [ ] Replace draft PR placeholders (issue link, real test URLs) when you open or update the PR.

## How to update this doc

After a meaningful change: add a short bullet under **Recently completed** (newest first) and tick or add items under **Suggested next steps**. Keep bullets factual (what/where), not full commit hashes unless useful for your team.
