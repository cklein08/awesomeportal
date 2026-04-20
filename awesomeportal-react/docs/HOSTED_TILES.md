# Hosted tiles: open behavior

Grid tiles backed by `SlotBlockDescriptor` (saved layout, DA live, or `externalParams`) can open a URL in three ways via optional **`openMode`**:

| `openMode` | Behavior |
|------------|----------|
| `iframe` (default) | Same-tab host shell loads the URL in the content iframe (see in-app banner if the target sends `X-Frame-Options` / CSP and cannot embed). |
| `new-tab` | `window.open(url, '_blank', 'noopener')`. **Use for most Adobe SaaS** (Firefly, Express, etc.) that block embedding. |
| `navigate` | Full-page `location.assign(url)` — leaves the portal SPA. |

## Defaults

- **`daContentUrl`** or **`slotType: 'da-content'`** → always treated as **`iframe`** (unless you set `openMode` explicitly).
- **`href`** without `openMode` → **`iframe`** (legacy behavior).
- Curated **`ADOBE_ENTITLEMENTS`** entries use **`new-tab`** so drag-to-grid tiles match expected SaaS UX.

## Limits

- Embedding is controlled by the **target site** (headers, CSP). The portal shows an in-frame fallback link after a short timeout when the iframe appears blank.
- **`navigate`** is a hard navigation; prefer **`new-tab`** for external product URLs so users keep the portal tab.
