Please always provide the [GitHub issue(s)](../issues) your PR is for, as well as test URLs where your change can be observed (before and after):

Fix # (not linked)

## Summary

- Re-check post-login admin redirect inside the delayed timer so impersonation skip flags are respected.
- Sticky header stack with persona **Activities** topbar while impersonating in the main portal.
- Admin activities: impersonation strip, **End Persona**, topbar title/mark aligned with impersonated persona; sticky topbar layout tweaks.

Test URLs:

- Before: `main` — run `npm run dev` in `awesomeportal-react` and compare behavior.
- After: `Ai-integrations` — same local dev; verify impersonation chrome on Home/Apps/Files/Assets, Admin activities, and End Persona.
