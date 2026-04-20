Please always provide the [GitHub issue(s)](../issues) your PR is for, as well as test URLs where your change can be observed (before and after):

_No GitHub issue linked (portal React persona and admin UX)._

Test URLs:
- Before: Local `awesomeportal-react` on `main` (`npm run dev`).
- After: Local `awesomeportal-react` on `Restor` (`npm run dev`).

---

## Summary

- **Personas:** Expanded `PortalPersonaId` to ten roles with power order, labels, nav defaults, and `org_admin` / CSS slug fixes (including `PersonaActivitiesTopbar`).
- **Storage:** Legacy `admin` persona key migrates to `org_admin` in localStorage (persona, grids, left-nav overrides).
- **Multi-role IMS:** `resolvePersonasFromAccessToken` pairs **org admin + developer** when `isPortalAdminFromToken` applies; empty matches default to both for gated org admins. Opt out with `VITE_PORTAL_DUAL_ROLE_ORG_ADMIN_DEVELOPER=false`. Optional per-role JWT substring envs and `VITE_PORTAL_SIMULATED_ROLES` documented in `.env.example`.
- **Admin activities:** Stacked “{Persona} Activities” header with links between entitled roles; default `?persona=` to highest entitled; sync `setSelectedPersona` from URL.
- **Portal chrome:** `MainApp` grid admin chrome for `org_admin` / `portal_admin`; post-login admin route includes `?persona=`; impersonation strip only when persona is outside token-derived set.
- **Types / access:** `portalAccess` and related helpers updated for new personas.
