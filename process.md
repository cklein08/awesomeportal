# Engineering process — Awesome Portal

## Day-to-day

1. **Branch** off the integration branch you use for portal work (for example `Ai-integrations`) or off `main` if that is your convention.
2. **Implement** in `awesomeportal-react/` (and other packages as needed). Prefer small, reviewable commits with clear messages.
3. **Record shipped work** in `awesomeportal-react/PROGRESS.md` under **Recently completed** (newest first). Keep bullets factual: what changed and which files or areas matter.
4. **Build** — `cd awesomeportal-react && npm run build` needs Adobe-related env (e.g. `VITE_BUCKET`). For CI or local smoke without secrets, use `SKIP_RUNTIME_CONFIG_VALIDATION=1` or `npm run build:ci` per `PROGRESS.md`.
5. **Open or refresh a PR** to `main`, push your branch, and use the PR body for user-visible behavior, screenshots if UI changed, and any env or migration notes.

## Pull requests

- Target **`main`** unless you are stacking on another long-lived branch by team agreement.
- After pushing, use **GitHub CLI** (`gh pr create` / `gh pr edit`) or the web UI so reviewers get context, not only a diff.
- When a PR is still open and you add commits, **push to the same branch**; the PR updates automatically.

## Related docs

| Doc | Purpose |
|-----|---------|
| `awesomeportal-react/PROGRESS.md` | Shipped features, env table, suggested next steps |
| `awesomeportal-react/README.md` | App setup, persona / IMS behavior, quick reference |
| `CONTRIBUTING.md` | Repo-wide contribution expectations (if present) |
