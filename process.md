# Engineering process — Awesome Portal

## Day-to-day

1. **Branch** off the integration branch you use for portal work (for example `Ai-integrations`) or off `main` if that is your convention.
2. **Implement** in `awesomeportal-react/` (and other packages as needed). Prefer small, reviewable commits with clear messages.
3. **Record shipped work** in `awesomeportal-react/PROGRESS.md` under **Recently completed** (newest first). Keep bullets factual: what changed and which files or areas matter. If you change **how we work** (branch targets, build gates, review expectations), update this `process.md` in the same PR when practical.
4. **Build** — `cd awesomeportal-react && npm run build` needs Adobe-related env (e.g. `VITE_BUCKET`). For CI or local smoke without secrets, use `SKIP_RUNTIME_CONFIG_VALIDATION=1` or `npm run build:ci` per `PROGRESS.md`.
5. **Open or refresh a PR** to `main`, push your branch, and use the PR body for user-visible behavior, screenshots if UI changed, and any env or migration notes.

## Portal shell, personas, and Admin activities

When you touch **persona-scoped UX** (home grid, left rail, `MainApp`, `/admin/activities`, `portalPersonas`, IMS helpers, `useSlotBlocks`, per-persona grid storage):

- Treat **`?persona=`** and stored selected persona as the source of truth for which rail, grid layout, and activities scope the user sees; keep URL, storage, and UI in agreement (see `awesomeportal-react/README.md`).
- **Grid admin chrome** applies only to personas where `personaHasPortalGridAdminChrome` is true (`portal_admin`, `org_admin`). That cohort gets full home-grid customization (admin/creator toggle, empty slots, delete flow where enabled) and the **Admin activities** workspace with tabs, agent strip, and the right-hand **Applications** catalog for drag-in.
- Personas **without** grid admin chrome (for example `developer`) should see the **same left rail as the main portal** for that persona, a **read-only compact grid** (hide empty slots, no drag catalog, strip `appbuilder-*` tiles from grid resolution), and **no** applications drop-in column on Admin activities. Implement changes in both **MainApp** and **AdminActivities** when behavior must match.
- After UI changes, smoke **two scopes**: at least one grid-admin persona URL and at least one non-admin persona (e.g. `?persona=developer`) on `/` and `/admin/activities`.

## Pull requests

- Target **`main`** unless you are stacking on another long-lived branch by team agreement.
- After pushing, use **GitHub CLI** (`gh pr create` / `gh pr edit`) or the web UI so reviewers get context, not only a diff.
- When a PR is still open and you add commits, **push to the same branch**; the PR updates automatically.

## Related docs

| Doc | Purpose |
|-----|---------|
| `process.md` (this file) | Branching, PRs, build notes, portal/persona workflow |
| `awesomeportal-react/PROGRESS.md` | Shipped features, env table, suggested next steps |
| `awesomeportal-react/README.md` | App setup, persona / IMS behavior, quick reference |
| `CONTRIBUTING.md` | Repo-wide contribution expectations (if present) |
