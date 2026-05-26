# Admin console — API integration backlog

Tracks pages or features that **middleware** may reference (`/settings`, `/reports`) but are **not yet** wired to Nhost Functions per [api-doc-v1.md](../../../dropiti-nhost/documentation/api-doc-v1.md). Use this when prioritizing work from [decouple-plan-v4.md](./decouple-plan-v4.md).

## Wired (reference)

| Surface | BFF path segment | Nhost route |
|---------|------------------|-------------|
| Dashboard KPIs | `admin/analytics/dashboard` | `GET /v1/admin/analytics/dashboard` |
| Properties list | `admin/properties` BFF → `admin/properties/list` | `GET /v1/admin/properties/list` |
| Media library | `admin/media` | `GET /v1/admin/media` (`functions/admin/media/index.ts`) |
| Payments / customers / etc. | See [admin-routes.ts](../../src/lib/admin-routes.ts) | api-doc §11 |

## Not wired yet

| Target (api-doc §11) | Suggested `adminRoutes` helper | Notes |
|---------------------|--------------------------------|--------|
| `GET /v1/admin/settings/index`, `PUT .../settings/update` | `admin/settings/index`, … | No `src/app/.../settings` pages found in repo |
| `GET /v1/admin/reports/index`, analytics export | `admin/reports/index`, `admin/analytics/export` | No `src/app/.../reports` pages found |
| Reviews / support / audit modules | various under `admin/reviews/*`, `admin/support/*`, `admin/audit-logs/*` | Add when product surfaces exist |

## Media library

`adminRoutes.media()` and upload batch are implemented. Remaining checklist items are UX (e.g. cap batch at 20) — see decouple-plan v4 Phase 5.

When adding a new page, always use **`adminFetch`** / **`functionsBffUrl`** + **`adminRoutes`**, and add a BFF **rewrite** in `src/lib/bff-route-rewrite.ts` if the path is not already a literal Nhost file path.
