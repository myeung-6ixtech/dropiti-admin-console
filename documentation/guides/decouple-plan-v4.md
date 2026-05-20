# Dropiti Admin Console — Decouple Plan v4

**Document:** `decouple-plan-v4.md`
**Date:** May 2026
**Repo:** `myeung-6ixtech/dropiti-admin-console` · branch `main` (post dev2 merge)
**API standard:** `api-doc-v1.md` · `dropiti-unified-backend-v6.md`
**Backend:** `https://fcuycyemqprjrkbshlcj.functions.ap-southeast-1.nhost.run`

> This plan is sourced from a direct audit of the live main branch files:
> `package.json` (68 lines), `middleware.ts` (90 lines), `.env` (50 lines),
> `.env.local` (49 lines), `IMPLEMENTATION_SUMMARY.md` (388 lines).
> Every finding is traceable to a specific file and line.

---

## Contents

1. [What the Audit Found](#1-what-the-audit-found)
2. [Cross-Comparison Table](#2-cross-comparison-table)
3. [Coding Standards & Patterns](#3-coding-standards--patterns)
4. [Dos and Do-Nots](#4-dos-and-do-nots)
5. [Phase 0 — Immediate Security (Do First)](#phase-0--immediate-security-do-first)
6. [Phase 1 — Foundation](#phase-1--foundation)
7. [Phase 2 — Auth Replacement](#phase-2--auth-replacement)
8. [Phase 3 — BFF Proxy Layer](#phase-3--bff-proxy-layer)
9. [Phase 4 — Page Migration](#phase-4--page-migration)
10. [Phase 5 — Upload Migration](#phase-5--upload-migration)
11. [Phase 6 — Env & Package Cleanup](#phase-6--env--package-cleanup)
12. [Phase 7 — Delete Dead Code](#phase-7--delete-dead-code)
13. [Verification Checklist](#verification-checklist)

---

## 1. What the Audit Found

### package.json — confirmed dependencies

| Package | Version | Status | Action |
|---|---|---|---|
| `@airwallex/components-sdk` | `^1.22.0` | ⚠️ Keep UI only | Remove server-side API key usage |
| `@aws-sdk/client-s3` | `^3.966.0` | ❌ Wrong layer | Move to Nhost Functions; remove from frontend |
| `axios` | `^1.13.6` | ⚠️ Replace | Replace with typed `fetch` wrapper |
| `graphql` | `^16.11.0` | ❌ Remove | Direct Hasura calls replaced by Nhost Functions |
| `graphql-request` | `^7.2.0` | ❌ Remove | Same — no more direct Hasura with admin secret |
| `jose` | `^6.2.1` | ✅ Keep | Used by `middleware.ts` JWT verification |
| `react-dropzone` | `^14.3.5` | ✅ Keep | UI only — wire to new upload Function |
| `sharp` | `^0.34.5` | ❌ Remove | Native binary — crashes in serverless AND Nhost Functions |
| `@nhost/nextjs` | missing | ❌ Add | Required for Nhost Auth |
| `@nhost/react` | missing | ❌ Add | Required for `useAccessToken`, `useAuthenticationStatus` |

### middleware.ts — confirmed correct, do not modify

```
Line 5:  ACCESS_TOKEN_COOKIE = "nhost_access_token"  ✅ correct cookie name
Line 29: jwtVerify(accessToken, getJwtSecret())       ✅ correct jose call
Line 35: allowedRoles.includes("admin")               ✅ correct role check
Line 46: pathname.startsWith("/api")                  ✅ API routes skipped
```

The middleware is **fully correct and Nhost-ready**. The only missing piece is the auth token being set by Nhost Auth's `signIn()` rather than the legacy PBKDF2 `/api/login` route. Once auth is replaced, middleware needs zero changes.

### .env and .env.local — both files committed to git with live secrets

Both `.env` and `.env.local` are identical and **both committed to the public repo**. Every secret in them is compromised. The exact committed values are:

| Variable | Committed value | Risk |
|---|---|---|
| `AIRWALLEX_API_KEY` | `d129b557fe0d1dea...` (full key) | 🔴 Critical — live payment API key |
| `HASURA_ADMIN_SECRET` | `N10KH^j%rs3Y%eq...` (full secret) | 🔴 Critical — full DB write access |
| `S3_BUCKET_ACCESS_KEY` | `AKIAUJJYJXEZ5DERETX6` | 🔴 Critical — live AWS IAM key |
| `S3_BUCKET_SECRET_KEY` | `OHtzU14YJlxhZ2VF...` (full key) | 🔴 Critical — live AWS secret |
| `UPSTASH_REDIS_REST_TOKEN` | `AXuiAAIncDI4...` (full token) | 🔴 Critical |
| `NHOST_JWT_SECRET` | `B4F9zIHzizLwDC6X...` (full secret) | 🔴 Critical — JWT signing key |
| `ROOT_PASSWORD` | `ABC@123!` | 🔴 Critical — admin password |

### IMPLEMENTATION_SUMMARY.md — confirms legacy auth is still active

The summary confirms the current auth flow uses:
- `POST /api/login` — PBKDF2 + `real_estate.user_sessions` DB table
- `GET /api/auth/check` — session DB lookup via `SDK_BACKEND_URL`
- `POST /api/auth/logout` — session invalidation
- `AuthContext.tsx` — calls all three, manages `admin_session` cookie

None of these use Nhost Auth. The `nhost_access_token` cookie is only set if a user separately signs in via Nhost. The two auth systems currently coexist — legacy session auth for pages, Nhost JWT for `middleware.ts`. This is the core inconsistency: **middleware checks `nhost_access_token` but login sets `admin_session`**, meaning every page load currently redirects to `/signin` unless `nhost_access_token` happens to be present from a separate Nhost login.

---

## 2. Cross-Comparison Table

Direct mapping of current frontend state vs `api-doc-v1.md` standard.

| Area | Current frontend | Required by api-doc-v1 | Gap |
|---|---|---|---|
| **Auth — login** | `POST /api/login` (PBKDF2, sets `admin_session` cookie) | `nhost.auth.signIn()` (sets `nhost_access_token`) | ❌ Wrong mechanism — cookie name mismatch breaks middleware |
| **Auth — session check** | `GET /api/auth/check` (DB query) | `useAuthenticationStatus()` hook | ❌ Legacy route, not Nhost |
| **Auth — logout** | `POST /api/auth/logout` (DB invalidation) | `nhost.auth.signOut()` | ❌ Legacy route |
| **Auth — token for API calls** | `admin_session` cookie value | `Authorization: Bearer <nhost_access_token>` | ❌ Wrong token format for Nhost Functions |
| **Data fetching** | `graphql-request` + `HASURA_ADMIN_SECRET` | `adminFetch()` → Nhost Function → `hasuraQuery()` | ❌ Admin secret exposed in server component layer |
| **Properties page** | Direct Hasura `AdminListProperties` query | `GET /v1/admin/properties` | ❌ Bypasses Function layer |
| **Offers/incoming** | Direct Hasura `AdminIncomingOffers` + batched lookup | `GET /v1/admin/offers/incoming` | ❌ Bypasses Function layer |
| **Payments** | `@airwallex/components-sdk` with `AIRWALLEX_API_KEY` in env | `GET /v1/admin/payment-intents` (server-side proxy) | ❌ API key on client |
| **Uploads** | `@aws-sdk/client-s3` + `S3_BUCKET_*` in env | `POST /v1/admin/upload/presign` → PUT to S3 | ❌ AWS credentials on client |
| **middleware.ts** | Reads `nhost_access_token`, verifies HS256, checks admin role | Reads `nhost_access_token`, verifies HS256, checks admin role | ✅ Already correct |
| **CORS** | N/A — same-origin Next.js routes | `Authorization: Bearer` header on every Function call | ❌ Cross-origin header not being set |
| **Response shape** | Custom per route (`{ success: true }`, `{ isAuthenticated }`) | `{ ok: true, data: T }` or `{ ok: false, error: string }` | ❌ Shape mismatch — must check `result.ok` |
| **Properties query shape** | Full `AdminListProperties` with all columns | `AdminListProperties` via `/v1/admin/properties` | ⚠️ Query is correct — routing is wrong |
| **Offers property context** | Slim batched lookup (5 fields only) | Slim lookup via `/v1/admin/offers/incoming` | ⚠️ Query is correct — routing is wrong |
| **`sharp`** | `^0.34.5` in `package.json` | Banned — native binary | ❌ Must remove |
| **`@nhost/nextjs`** | Not installed | Required for `NhostProvider`, `NhostClient` | ❌ Missing |
| **`NEXT_PUBLIC_FUNCTIONS_URL`** | Not in `.env` | Required — base URL for all Function calls | ❌ Missing |

---

## 3. Coding Standards & Patterns

These apply to every file created or modified during this decouple. Read before touching any file.

### Pattern 1 — The single BFF fetch wrapper

Create `src/lib/admin-api.ts`. This is the **only** file in the frontend that calls Nhost Functions. No page, component, or hook calls `fetch()` directly to the backend.

```ts
// src/lib/admin-api.ts
const FUNCTIONS_URL = process.env.NEXT_PUBLIC_FUNCTIONS_URL!
// resolves to: https://fcuycyemqprjrkbshlcj.functions.ap-southeast-1.nhost.run

const ADMIN_BASE = `${FUNCTIONS_URL}/v1/admin`

// The response shape from every Nhost Function
type ApiOk<T>   = { ok: true;  data: T }
type ApiFail    = { ok: false; error: string; details?: unknown }
type ApiResult<T> = ApiOk<T> | ApiFail

async function adminFetch<T>(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${ADMIN_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    })
    // Parse envelope — every Function returns { ok, data } or { ok, error }
    const body = await res.json()
    return body as ApiResult<T>
  } catch (err) {
    return { ok: false, error: 'Network error', details: err }
  }
}
```

### Pattern 2 — Token acquisition

Get the Nhost access token with `useAccessToken()` in React components:

```ts
import { useAccessToken } from '@nhost/react'

function PropertiesPage() {
  const token = useAccessToken()

  useEffect(() => {
    if (!token) return
    fetchProperties(token)
  }, [token])
}
```

**Never** read the token from a cookie. **Never** store it in `localStorage`. The `@nhost/react` hook is the only correct source.

### Pattern 3 — Response shape handling

Every call to `adminFetch` returns `ApiResult<T>`. Always check `ok` before using `data`:

```ts
// ✅ Correct
const result = await adminFetch<PropertyListResponse>('/properties', token)
if (!result.ok) {
  setError(result.error)
  return
}
setProperties(result.data.items)
setTotal(result.data.total)

// ❌ Wrong — assumes success
const { data } = await adminFetch<PropertyListResponse>('/properties', token)
setProperties(data.items)  // crashes if ok === false
```

### Pattern 4 — Properties vs Offers property context

Per `dropiti-unified-backend-v6.md §8a` — these two routes return **different shapes** for property data. Never mix them.

```ts
// Properties page — use AdminListProperties shape
// Fields available: ALL (status, completion_percentage, images, location, etc.)
const result = await adminFetch<{ items: AdminPropertyListItem[] }>(
  '/properties?limit=20&offset=0',
  token
)

// Offers incoming page — use AdminIncomingOffer shape
// Property context has ONLY: id, property_uuid, title, external_contact, rental_price
const result = await adminFetch<{ items: AdminIncomingOffer[] }>(
  '/offers/incoming?limit=50&offset=0',
  token
)

// ❌ NEVER do this — completion_percentage is undefined in offer context
const offer = incomingOffers[0]
console.log(offer.property_listing.completion_percentage) // always undefined
```

### Pattern 5 — Loading and error states

Every fetch must have three states: loading, error, data. Never render an empty table without a loading indicator.

```ts
const [loading, setLoading] = useState(true)
const [error, setError]     = useState<string | null>(null)
const [items, setItems]     = useState<AdminPropertyListItem[]>([])

useEffect(() => {
  if (!token) return
  setLoading(true)
  adminFetch<{ items: AdminPropertyListItem[] }>('/properties', token)
    .then(result => {
      if (!result.ok) { setError(result.error); return }
      setItems(result.data.items)
    })
    .finally(() => setLoading(false))
}, [token])

if (loading) return <Skeleton />
if (error)   return <ErrorBanner message={error} />
return <PropertiesTable items={items} />
```

### Pattern 6 — Airwallex stub response

Airwallex proxy routes return `{ ok: true, data: { stub: true } }` when `AIRWALLEX_API_KEY` is not configured in Nhost Functions. Handle it explicitly:

```ts
interface AirwallexCustomerList {
  stub?: boolean
  items?: Customer[]
  total?: number
}

const result = await adminFetch<AirwallexCustomerList>('/customers', token)
if (!result.ok) { setError(result.error); return }
if (result.data.stub) {
  setConfigNotice('Airwallex is not configured on this environment')
  return
}
setCustomers(result.data.items ?? [])
```

### Pattern 7 — TypeScript types

Define separate TypeScript interfaces for each shape. Never use a single merged type.

```ts
// src/types/admin.ts

// Shape 1 — Full listing (from AdminListProperties via /v1/admin/properties)
export interface AdminPropertyListItem {
  id:                    number
  property_uuid:         string
  title:                 string
  status:                'draft' | 'pending_review' | 'published' | 'rejected' | 'archived'
  completion_percentage: number
  landlord_user_id:      string
  landlord_role:         'user' | 'admin'
  external_contact:      string | null
  rental_price:          number | null
  is_flagged:            boolean
  is_featured:           boolean
  primary_image:         string | null
  images:                string[]
  city:                  string | null
  created_at:            string
  updated_at:            string
}

// Shape 2 — Slim property context inside offer (from AdminIncomingOffers)
export interface AdminOfferPropertyContext {
  id:               number
  property_uuid:    string
  title:            string
  external_contact: string | null
  rental_price:     number | null
  // DO NOT add other fields here — they are not returned by this route
}

export interface AdminIncomingOffer {
  id:               number
  status:           string
  amount:           number
  terms:            string | null
  created_at:       string
  updated_at:       string
  property_listing: AdminOfferPropertyContext
  user:             { display_name: string | null; email: string }
  whatsappOutreachUrl: string | null
}

// Shape 3 — Detail (from AdminGetProperty via /v1/admin/properties/get-property)
export interface AdminPropertyDetail extends AdminPropertyListItem {
  moderation_records: ModerationRecord[]
  reports:            Report[]
  offer_count:        number
  active_offer_count: number
}
```

---

## 4. Dos and Do-Nots

### Authentication

| ✅ Do | ❌ Do Not |
|---|---|
| Use `nhost.auth.signIn({ email, password })` for login | Call `POST /api/login` |
| Use `useAuthenticationStatus()` for session state | Call `GET /api/auth/check` |
| Use `nhost.auth.signOut()` for logout | Call `POST /api/auth/logout` |
| Use `useAccessToken()` to get the JWT | Read the cookie manually |
| Leave `middleware.ts` unchanged | Modify `middleware.ts` in any way |
| Set `"admin"` role via Nhost custom claims | Compare against `real_estate.administrator_users` table |

### Data fetching

| ✅ Do | ❌ Do Not |
|---|---|
| Call only through `adminFetch()` in `src/lib/admin-api.ts` | Use `graphql-request` in any page or component |
| Set `Authorization: Bearer <token>` on every request | Pass auth in cookies or URL parameters |
| Check `result.ok` before using `result.data` | Destructure response without checking `ok` |
| Expect `{ ok: true, data: { items, total, limit, offset } }` | Expect `{ success: true }` or `{ data: [] }` |
| Use `NEXT_PUBLIC_FUNCTIONS_URL` from env | Hardcode the Functions URL in any file |

### Properties vs Offers — shape contract

| ✅ Do | ❌ Do Not |
|---|---|
| Use `/v1/admin/properties` for the properties management page | Populate the properties table from `/v1/admin/offers/incoming` |
| Use `/v1/admin/offers/incoming` for the offer inbox | Render offer card using full property shape |
| Read `completion_percentage` only from `AdminPropertyListItem` | Read it from `AdminIncomingOffer.property_listing` |
| Make a separate call to `/v1/admin/properties/get-property?propertyUuid=` for property detail from an offer | Try to derive property detail from the offer slim shape |
| Define `AdminPropertyListItem` and `AdminIncomingOffer` as separate types | Use one merged type for both contexts |

### Uploads

| ✅ Do | ❌ Do Not |
|---|---|
| Call `POST /v1/admin/upload/presign` to get S3 presigned URL | Use `@aws-sdk/client-s3` in the frontend |
| PUT file directly to the returned `uploadUrl` (S3) | Proxy file bytes through Next.js |
| Cap `react-dropzone` at 20 files (`maxFiles={20}`) | Allow unlimited batch uploads |
| Remove `sharp` from `package.json` | Use `sharp` anywhere in the Next.js app |

### Secrets

| ✅ Do | ❌ Do Not |
|---|---|
| Add `.env` and `.env.local` to `.gitignore` immediately | Leave them tracked in git |
| Rotate all six compromised secrets before any code changes | Deploy with the committed credentials |
| Keep `NHOST_JWT_SECRET` in frontend env (needed by `middleware.ts`) | Move `NHOST_JWT_SECRET` to Nhost Functions |
| Keep `AIRWALLEX_CLIENT_ID` in frontend (browser-safe) | Keep `AIRWALLEX_API_KEY` in frontend env |

---

## Phase 0 — Immediate Security (Do First)

> **Stop everything else until Phase 0 is complete. The credentials committed to the public repo are live and compromised.**

- [ ] **0.1** Add `.env` and `.env.local` to `.gitignore`:
  ```
  .env
  .env.local
  .env*.local
  ```

- [ ] **0.2** Remove both files from git tracking:
  ```bash
  git rm --cached .env .env.local
  git commit -m "chore: remove committed env files from git tracking"
  git push
  ```

- [ ] **0.3** Rotate every compromised secret immediately — do not skip any:

  | Secret | Where to rotate |
  |---|---|
  | `AIRWALLEX_API_KEY` | Airwallex Dashboard → API Keys → Regenerate |
  | `HASURA_ADMIN_SECRET` | Nhost Dashboard → Settings → Database → Reset admin secret |
  | `S3_BUCKET_ACCESS_KEY` + `S3_BUCKET_SECRET_KEY` | AWS IAM → Security credentials → Delete key → Create new |
  | `UPSTASH_REDIS_REST_TOKEN` | Upstash Console → Database → Reset token |
  | `NHOST_JWT_SECRET` | Nhost Dashboard → Settings → Hasura → JWT Secret → Regenerate |
  | `ROOT_PASSWORD` (`ABC@123!`) | Change the admin account password in Nhost Auth |

- [ ] **0.4** Add rotated S3, Airwallex API key, Upstash, and Hasura admin secret to Nhost Functions `.secrets` in the `dropiti-nhost` repo:
  ```bash
  # dropiti-nhost repo root .secrets
  AIRWALLEX_API_KEY=<new-rotated>
  S3_BUCKET_ACCESS_KEY=<new-rotated>
  S3_BUCKET_SECRET_KEY=<new-rotated>
  S3_BUCKET_DOMAIN_URL=https://tastyplates-bucket.s3.ap-northeast-2.amazonaws.com
  S3_BUCKET_AWS_REGION=ap-northeast-2
  S3_BUCKET_NAME=tastyplates-bucket
  UPSTASH_REDIS_REST_URL=https://selected-bear-31650.upstash.io
  UPSTASH_REDIS_REST_TOKEN=<new-rotated>
  HASURA_GRAPHQL_ADMIN_SECRET=<new-rotated>
  ```

- [ ] **0.5** Create a clean local `.env` with only what the frontend legitimately needs:
  ```bash
  # KEEP — middleware.ts JWT verification
  NHOST_JWT_SECRET=<new-rotated>

  # KEEP — @nhost/nextjs client
  NEXT_PUBLIC_NHOST_SUBDOMAIN=fcuycyemqprjrkbshlcj
  NEXT_PUBLIC_NHOST_REGION=ap-southeast-1
  NEXT_PUBLIC_SITE_URL=http://localhost:3000

  # KEEP — Airwallex Elements UI (browser-safe credentials only)
  NEXT_PUBLIC_AIRWALLEX_ENV=demo
  AIRWALLEX_CLIENT_ID=WyQ2_hk4TlaAnOuaOSV1FQ

  # ADD — Nhost Functions base URL
  NEXT_PUBLIC_FUNCTIONS_URL=https://fcuycyemqprjrkbshlcj.functions.ap-southeast-1.nhost.run
  ```

- [ ] **0.6** Verify build still passes: `yarn build`

---

## Phase 1 — Foundation

- [ ] **1.1** Install Nhost packages:
  ```bash
  yarn add @nhost/nextjs @nhost/react
  ```

- [ ] **1.2** Remove packages that move server-side or are replaced:
  ```bash
  yarn remove @aws-sdk/client-s3 sharp
  # graphql and graphql-request removed in Phase 7 after all pages are migrated
  ```

- [ ] **1.3** Create `src/lib/nhost.ts`:
  ```ts
  import { NhostClient } from '@nhost/nextjs'

  export const nhost = new NhostClient({
    subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN!,
    region:    process.env.NEXT_PUBLIC_NHOST_REGION!,
  })
  ```

- [ ] **1.4** Wrap app root with `NhostProvider` in `src/app/layout.tsx`:
  ```tsx
  import { NhostProvider } from '@nhost/nextjs'
  import { nhost } from '@/lib/nhost'

  export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
      <html>
        <body>
          <NhostProvider nhost={nhost}>
            {children}
          </NhostProvider>
        </body>
      </html>
    )
  }
  ```

- [ ] **1.5** Create `src/lib/admin-api.ts` with the full typed wrapper (see Pattern 1 above) and these domain helpers:

  ```ts
  // Properties
  export const adminPropertiesApi = {
    list: (p: { limit?: number; offset?: number; status?: string; flagged?: boolean }, token: string) =>
      adminFetch<{ items: AdminPropertyListItem[]; total: number; limit: number; offset: number }>(
        `/properties?limit=${p.limit ?? 20}&offset=${p.offset ?? 0}${p.status ? `&status=${p.status}` : ''}${p.flagged ? '&flagged=true' : ''}`,
        token
      ),
    get: (propertyUuid: string, token: string) =>
      adminFetch<AdminPropertyDetail>(`/properties/get-property?propertyUuid=${propertyUuid}`, token),
    moderationQueue: (p: { limit?: number; offset?: number }, token: string) =>
      adminFetch<{ items: AdminPropertyListItem[]; total: number }>(`/properties/moderation-queue?limit=${p.limit ?? 20}&offset=${p.offset ?? 0}`, token),
    approve:  (body: { propertyUuid: string; notes?: string }, token: string) =>
      adminFetch('/properties/approve', token, { method: 'POST', body: JSON.stringify(body) }),
    reject:   (body: { propertyUuid: string; reason: string }, token: string) =>
      adminFetch('/properties/reject', token, { method: 'POST', body: JSON.stringify(body) }),
    flag:     (body: { propertyUuid: string; flagType: string; reason: string }, token: string) =>
      adminFetch('/properties/flag', token, { method: 'POST', body: JSON.stringify(body) }),
    feature:  (body: { propertyUuid: string; featured: boolean; featureUntil?: string }, token: string) =>
      adminFetch('/properties/feature', token, { method: 'POST', body: JSON.stringify(body) }),
    update:   (body: { propertyUuid: string; updates: Partial<AdminPropertyListItem>; reason: string }, token: string) =>
      adminFetch('/properties/update-property', token, { method: 'PUT', body: JSON.stringify(body) }),
    bulk:     (body: { action: string; propertyUuids: string[] }, token: string) =>
      adminFetch('/properties/bulk', token, { method: 'POST', body: JSON.stringify(body) }),
  }

  // Offers
  export const adminOffersApi = {
    incoming: (p: { limit?: number; offset?: number; status?: string; propertyUuid?: string }, token: string) =>
      adminFetch<{ items: AdminIncomingOffer[]; total: number }>(
        `/offers/incoming?limit=${p.limit ?? 50}&offset=${p.offset ?? 0}${p.status ? `&status=${p.status}` : ''}${p.propertyUuid ? `&propertyUuid=${p.propertyUuid}` : ''}`,
        token
      ),
    incomingDetail: (id: string, token: string) =>
      adminFetch<AdminIncomingOffer>(`/offers/incoming-detail?id=${id}`, token),
  }

  // Transfer ownership
  export const adminTransferApi = {
    invite:  (body: { propertyUuid: string; externalContact?: string; offerId?: string }, token: string) =>
      adminFetch('/transfer-ownership/invite', token, { method: 'POST', body: JSON.stringify(body) }),
    resend:  (body: { propertyUuid: string }, token: string) =>
      adminFetch('/transfer-ownership/resend', token, { method: 'POST', body: JSON.stringify(body) }),
    status:  (propertyUuid: string, token: string) =>
      adminFetch<{ status: string; canResend: boolean; expiresAt?: string }>(`/transfer-ownership/status?propertyUuid=${propertyUuid}`, token),
  }

  // Upload (S3 presigned PUT)
  export const adminUploadApi = {
    presign: (body: { filename: string; mimeType: string }, token: string) =>
      adminFetch<{ uploadUrl: string; s3Key: string; publicUrl: string }>('/upload/presign', token, { method: 'POST', body: JSON.stringify(body) }),
    batch:   (files: Array<{ filename: string; mimeType: string }>, token: string) =>
      adminFetch<Array<{ uploadUrl: string; s3Key: string; publicUrl: string; filename: string }>>('/upload/batch', token, { method: 'POST', body: JSON.stringify(files) }),
  }

  // Analytics
  export const adminAnalyticsApi = {
    dashboard: (params: { period?: string }, token: string) =>
      adminFetch<Record<string, unknown>>(`/analytics/dashboard?period=${params.period ?? '30d'}`, token),
    export:    (body: { format: string; period: string }, token: string) =>
      adminFetch<{ jobId?: string; downloadUrl?: string }>('/analytics/export', token, { method: 'POST', body: JSON.stringify(body) }),
  }

  // Airwallex proxy (all return { stub: true } when not configured)
  export const adminPaymentsApi = {
    listCustomers:       (p: { limit?: number; offset?: number }, token: string) =>
      adminFetch<{ stub?: boolean; items?: unknown[]; total?: number }>(`/customers?limit=${p.limit ?? 20}&offset=${p.offset ?? 0}`, token),
    getCustomer:         (id: string, token: string) =>
      adminFetch<{ stub?: boolean; customer?: unknown }>(`/customers/get-customer?id=${id}`, token),
    listPaymentIntents:  (p: { limit?: number; offset?: number }, token: string) =>
      adminFetch<{ stub?: boolean; items?: unknown[] }>(`/payment-intents?limit=${p.limit ?? 20}&offset=${p.offset ?? 0}`, token),
    getPaymentIntent:    (id: string, token: string) =>
      adminFetch<{ stub?: boolean; intent?: unknown }>(`/payment-intents/get-intent?id=${id}`, token),
    cancelPayment:       (body: { paymentId: string }, token: string) =>
      adminFetch('/payments/cancel', token, { method: 'POST', body: JSON.stringify(body) }),
    listBeneficiaries:   (p: { limit?: number }, token: string) =>
      adminFetch<{ stub?: boolean; items?: unknown[] }>(`/beneficiaries?limit=${p.limit ?? 20}`, token),
    listTransfers:       (p: { limit?: number }, token: string) =>
      adminFetch<{ stub?: boolean; items?: unknown[] }>(`/transfers?limit=${p.limit ?? 20}`, token),
  }

  // Users
  export const adminUsersApi = {
    list:       (p: { search?: string; limit?: number; offset?: number; status?: string }, token: string) =>
      adminFetch<{ items: unknown[]; total: number }>(`/users?limit=${p.limit ?? 20}&offset=${p.offset ?? 0}${p.search ? `&search=${encodeURIComponent(p.search)}` : ''}${p.status ? `&status=${p.status}` : ''}`, token),
    get:        (userId: string, token: string) => adminFetch<unknown>(`/users/get-user?userId=${userId}`, token),
    suspend:    (body: { userId: string; reason: string; duration?: number }, token: string) =>
      adminFetch('/users/suspend-user', token, { method: 'POST', body: JSON.stringify(body) }),
    reactivate: (body: { userId: string; notes?: string }, token: string) =>
      adminFetch('/users/reactivate-user', token, { method: 'POST', body: JSON.stringify(body) }),
    ban:        (body: { userId: string; reason: string; permanent: boolean }, token: string) =>
      adminFetch('/users/ban-user', token, { method: 'POST', body: JSON.stringify(body) }),
    bulk:       (body: { action: string; userIds: string[]; params?: unknown }, token: string) =>
      adminFetch('/users/bulk', token, { method: 'POST', body: JSON.stringify(body) }),
  }
  ```

- [ ] **1.6** Create `src/types/admin.ts` with the three property shapes and offer types from Pattern 7 above.

- [ ] **1.7** Verify build: `yarn build` — must pass with zero TypeScript errors.

---

## Phase 2 — Auth Replacement

> The root cause of the middleware/login mismatch: `POST /api/login` sets `admin_session` cookie but `middleware.ts` reads `nhost_access_token`. This phase fixes it.

- [ ] **2.1** Confirm admin users have `"admin"` in `x-hasura-allowed-roles` in Nhost:
  - Nhost Dashboard → Auth → Custom Claims
  - Ensure: `x-hasura-allowed-roles` includes `"admin"` for admin accounts
  - Without this, `middleware.ts` `hasAdminRole()` returns `false` and every page redirects to `/signin`

- [ ] **2.2** Rewrite `src/context/AuthContext.tsx`:
  - Remove: all calls to `/api/login`, `/api/auth/check`, `/api/auth/logout`
  - Remove: all references to `admin_session` cookie
  - Replace with:
  ```ts
  import { useAuthenticationStatus, useUserData, useAccessToken } from '@nhost/react'
  import { nhost } from '@/lib/nhost'

  // isAuthenticated: useAuthenticationStatus().isAuthenticated
  // isLoading:       useAuthenticationStatus().isLoading
  // user:            useUserData()
  // token:           useAccessToken()

  const signIn = async (email: string, password: string) => {
    const { isError, error } = await nhost.auth.signIn({ email, password })
    if (isError) throw new Error(error?.message ?? 'Login failed')
    // On success: Nhost Auth sets nhost_access_token cookie automatically
    // middleware.ts picks it up with zero changes
  }

  const signOut = async () => {
    await nhost.auth.signOut()
    // Nhost Auth clears nhost_access_token cookie automatically
  }
  ```
  - Keep: `hasPermission()` utility — wire to JWT custom claims or a local role lookup

- [ ] **2.3** Update the sign-in page (wherever `POST /api/login` is currently called):
  ```ts
  // Replace this:
  const res = await fetch('/api/login', { method: 'POST', body: JSON.stringify({ email, password }) })
  const data = await res.json()
  if (!data.success) setError(data.error)

  // With this:
  try {
    await signIn(email, password)
    router.push('/dashboard')
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Login failed')
  }
  ```

- [ ] **2.4** Test auth end-to-end before proceeding to Phase 3:
  - [ ] Login → `nhost_access_token` cookie set → `middleware.ts` allows `/dashboard`
  - [ ] Non-admin Nhost user → `middleware.ts` redirects to `/signin` (403 path)
  - [ ] Expired token → `middleware.ts` deletes cookie and redirects to `/signin`
  - [ ] Logout → cookie cleared → redirect to `/signin`

---

## Phase 3 — BFF Proxy Layer

> The dev2 merge likely introduced a BFF (Backend-For-Frontend) proxy pattern using Next.js API routes at `/api/v1/*` that forward requests to Nhost Functions. If that is the case, those routes are an **intermediate step** and should eventually be replaced by direct calls from `src/lib/admin-api.ts`. This phase verifies what's there and decides whether to keep or bypass.

- [ ] **3.1** Audit the current `/api/v1/` routes introduced in dev2:
  ```bash
  find src/app/api -name "route.ts" | sort
  ```
  Paste the result here to confirm the route structure.

- [ ] **3.2** For each `/api/v1/*` route found, check whether it:
  - Adds auth, validation, or transformation logic → **keep temporarily as a transition shim**
  - Simply forwards the request to a Nhost Function URL → **bypass it** by calling the Function directly from `admin-api.ts`

- [ ] **3.3** The correct final architecture is:
  ```
  ✅ Admin console page → adminFetch() → Nhost Function → Hasura
  ❌ Admin console page → /api/v1/* (Next.js) → Nhost Function → Hasura
  ```
  The middle Next.js API route layer adds latency, duplicates auth, and reintroduces a server-side layer that was supposed to be removed. Eliminate it once pages are stable.

- [ ] **3.4** If `/api/v1/auth/check` exists in the dev2 merge, check whether `AuthContext.tsx` still calls it. Replace with `useAuthenticationStatus()` hook (Phase 2.2).

---

## Phase 4 — Page Migration

Work through pages in dependency order. After each page: `yarn build` + manual smoke test.

### `/dashboard`

- [ ] **4.1** Replace data source with `adminAnalyticsApi.dashboard({ period: '30d' }, token)`
- [ ] **4.2** Add loading skeleton, error banner, handle `result.ok === false`

---

### `/properties`

This page has the known query inconsistency. Apply §8a constraints from `dropiti-unified-backend-v6.md`.

- [ ] **4.3** Confirm the page currently calls `AdminListProperties` directly via `graphql-request`. Replace with:
  ```ts
  const result = await adminPropertiesApi.list({ limit: 20, offset: 0 }, token)
  ```
- [ ] **4.4** The response shape from `/v1/admin/properties` returns `AdminPropertyListItem[]`. Ensure the TypeScript type used matches exactly — all columns including `completion_percentage`, `landlord_user_id`, `status`, `images`, `primary_image` must be present.
- [ ] **4.5** For property detail (clicking into a listing), call:
  ```ts
  const result = await adminPropertiesApi.get(propertyUuid, token)
  ```
  This returns `AdminPropertyDetail` which includes `moderation_records`, `reports`, `offer_count`.
- [ ] **4.6** Approve/reject/flag/feature buttons — wire to their respective `adminPropertiesApi.*` methods.
- [ ] **4.7** Bulk actions — cap selection at 20 items in the UI before calling `adminPropertiesApi.bulk()`.
- [ ] **4.8** Moderation queue tab — wire to `adminPropertiesApi.moderationQueue()`.

---

### `/offers` (incoming offer inbox)

This page has the known slim-shape constraint. Apply §8a constraints.

- [ ] **4.9** Confirm the page currently calls `AdminIncomingOffers` + batched property lookup via `graphql-request`. Replace with:
  ```ts
  const result = await adminOffersApi.incoming({ limit: 50, offset: 0 }, token)
  ```
- [ ] **4.10** The `AdminIncomingOffer` type has `property_listing` with only 5 fields. Update any component that reads `property_listing.status`, `property_listing.completion_percentage`, `property_listing.images`, or similar — these return `undefined` from this route by design.
- [ ] **4.11** Wire the WhatsApp outreach URL: `result.data.items[n].whatsappOutreachUrl` is pre-computed by the Function when `external_contact` is set — do not rebuild it on the client.
- [ ] **4.12** Wire the ownership invite buttons to `adminTransferApi.invite()`, `adminTransferApi.resend()`, `adminTransferApi.status()`.
- [ ] **4.13** `AdminOfferCard` badge state — driven by the `status` field from `adminTransferApi.status()`:

  | `status` value | Badge/button shown |
  |---|---|
  | `none` | **Send Ownership Invitation** (disabled if no `external_contact`) |
  | `pending` < 24h | Blue badge "Invitation Sent — N days remaining" |
  | `pending` ≥ 24h | Badge + **Resend** button |
  | `expired` | **Resend Invitation (Expired)** — orange |
  | `used` | Green badge "Listing Claimed" |

---

### `/customers`

- [ ] **4.14** Replace Airwallex direct call with `adminPaymentsApi.listCustomers({ limit: 20, offset: 0 }, token)`
- [ ] **4.15** Handle stub response: show "Airwallex not configured" notice when `result.data.stub === true`

### `/payments` and `/payment-intents`

- [ ] **4.16** Payments: `adminPaymentsApi.listPaymentIntents()` / cancel: `adminPaymentsApi.cancelPayment()`
- [ ] **4.17** Payment intents: `adminPaymentsApi.getPaymentIntent(id, token)`
- [ ] **4.18** Remove any code that reads `AIRWALLEX_API_KEY` from the frontend env

### `/transfers`

- [ ] **4.19** List: `adminPaymentsApi.listTransfers()`
- [ ] **4.20** Transfer ownership flow: `adminTransferApi.invite()`, `adminTransferApi.resend()`, `adminTransferApi.status()`

### `/beneficiaries`

- [ ] **4.21** List: `adminPaymentsApi.listBeneficiaries()`
- [ ] **4.22** Handle stub response

### `/user-management`

- [ ] **4.23** List: `adminUsersApi.list()`
- [ ] **4.24** Suspend/reactivate/ban: `adminUsersApi.suspend()` / `reactivate()` / `ban()`
- [ ] **4.25** Bulk: `adminUsersApi.bulk()` — cap UI selection at 20 users

### `/settings`, `/reports`

- [ ] **4.26** Settings: wire to `/v1/admin/settings/index` (GET) and `/v1/admin/settings/update` (PUT)
- [ ] **4.27** Reports: wire to `adminAnalyticsApi.dashboard()` and `adminAnalyticsApi.export()`

---

## Phase 5 — Upload Migration

**Currently:** `@aws-sdk/client-s3` + `S3_BUCKET_*` env in frontend. S3 credentials exposed in Next.js server components.
**Target:** `POST /v1/admin/upload/presign` or `/upload/batch` → PUT to S3 directly from browser.

### `/media-library`

- [ ] **5.1** Replace upload logic with the presign pattern:
  ```ts
  // Step 1 — get presigned URL from Nhost Function (S3 credentials server-side only)
  const presignResult = await adminUploadApi.presign({ filename: file.name, mimeType: file.type }, token)
  if (!presignResult.ok) { showError(presignResult.error); return }
  const { uploadUrl, publicUrl } = presignResult.data

  // Step 2 — PUT file directly to S3 (no proxy, no Function bandwidth used)
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  })
  if (!uploadRes.ok) { showError('Upload to S3 failed'); return }

  // Step 3 — store publicUrl in your data layer
  // publicUrl = "https://tastyplates-bucket.s3.ap-northeast-2.amazonaws.com/{key}"
  // URL format is unchanged — no DB updates needed
  ```

- [ ] **5.2** For batch uploads:
  ```ts
  const batchResult = await adminUploadApi.batch(
    files.map(f => ({ filename: f.name, mimeType: f.type })),
    token
  )
  if (!batchResult.ok) { showError(batchResult.error); return }

  await Promise.all(
    batchResult.data.map((item, i) =>
      fetch(item.uploadUrl, { method: 'PUT', body: files[i], headers: { 'Content-Type': files[i].type } })
    )
  )
  ```

- [ ] **5.3** Set `maxFiles={20}` on the `react-dropzone` instance

- [ ] **5.4** Remove all `import { S3Client, ... } from '@aws-sdk/client-s3'` statements

---

## Phase 6 — Env & Package Cleanup

- [ ] **6.1** Final `.env` state — only these variables remain:
  ```bash
  NHOST_JWT_SECRET=<rotated>
  NEXT_PUBLIC_NHOST_SUBDOMAIN=fcuycyemqprjrkbshlcj
  NEXT_PUBLIC_NHOST_REGION=ap-southeast-1
  NEXT_PUBLIC_SITE_URL=http://localhost:3000
  NEXT_PUBLIC_AIRWALLEX_ENV=demo
  AIRWALLEX_CLIENT_ID=WyQ2_hk4TlaAnOuaOSV1FQ
  NEXT_PUBLIC_FUNCTIONS_URL=https://fcuycyemqprjrkbshlcj.functions.ap-southeast-1.nhost.run
  ```

- [ ] **6.2** Verify these vars are gone from `.env`:
  ```bash
  grep -E "AIRWALLEX_API_KEY|HASURA_ADMIN_SECRET|SDK_BACKEND_URL|S3_BUCKET|UPSTASH|JWT_SECRET|ROOT_PASSWORD|NEXT_PUBLIC_API_URL" .env
  # Must return zero results
  ```

- [ ] **6.3** Remove packages after all pages are migrated:
  ```bash
  yarn remove graphql graphql-request @aws-sdk/client-s3 sharp axios
  ```

---

## Phase 7 — Delete Dead Code

- [ ] **7.1** Delete legacy auth API routes:
  ```
  src/app/api/login/route.ts
  src/app/api/auth/check/route.ts
  src/app/api/auth/logout/route.ts
  ```

- [ ] **7.2** Delete password generator script:
  ```
  scripts/generate-admin-password.js
  ```

- [ ] **7.3** If `/api/v1/` BFF proxy routes from dev2 are now bypassed by direct `adminFetch()` calls, delete them:
  ```bash
  find src/app/api/v1 -name "route.ts" | xargs rm
  # Only after confirming no page still calls them
  ```

- [ ] **7.4** Run final code audit:
  ```bash
  # No direct Hasura admin queries in frontend
  grep -rn "SDK_BACKEND_URL\|HASURA_ADMIN_SECRET\|graphql-request" src/
  # → zero results

  # No S3 SDK or credentials in frontend
  grep -rn "client-s3\|S3Client\|S3_BUCKET" src/
  # → zero results

  # No AIRWALLEX_API_KEY in frontend
  grep -rn "AIRWALLEX_API_KEY" src/
  # → zero results

  # No sharp
  grep -rn "from 'sharp'\|require('sharp')" src/
  # → zero results

  # No legacy auth routes being called
  grep -rn "/api/login\|/api/auth/check\|/api/auth/logout\|admin_session" src/
  # → zero results
  ```

---

## Verification Checklist

### Build
```bash
yarn build
# Zero errors, zero TypeScript errors
```

### Backend smoke tests
```bash
# Health check
curl -sS "https://fcuycyemqprjrkbshlcj.functions.ap-southeast-1.nhost.run/v1/health"
# → { "ok": true }

# Admin route with valid admin token → 200
curl -sS -H "Authorization: Bearer <ADMIN_TOKEN>" \
  "https://fcuycyemqprjrkbshlcj.functions.ap-southeast-1.nhost.run/v1/admin/properties?limit=5"
# → { "ok": true, "data": { "items": [...], "total": N } }

# Same route with non-admin token → 403
curl -sS -H "Authorization: Bearer <USER_TOKEN>" \
  "https://fcuycyemqprjrkbshlcj.functions.ap-southeast-1.nhost.run/v1/admin/properties"
# → { "ok": false, "error": "Forbidden" }

# Upload presign → S3 URL
curl -sS -X POST \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"filename":"test.jpg","mimeType":"image/jpeg"}' \
  "https://fcuycyemqprjrkbshlcj.functions.ap-southeast-1.nhost.run/v1/admin/upload/presign"
# → { "ok": true, "data": { "uploadUrl": "https://tastyplates-bucket.s3...", ... } }
```

### Page sign-off

- [ ] `/signin` — Nhost Auth `signIn()` works; `nhost_access_token` cookie set; `middleware.ts` allows `/dashboard`
- [ ] `/dashboard` — KPIs load from `/v1/admin/analytics/dashboard`
- [ ] `/properties` — list loads with full `AdminPropertyListItem` shape including `completion_percentage`, `status`, `images`
- [ ] `/properties` — approve/reject/flag all call Nhost Functions correctly
- [ ] `/offers` (incoming) — loads using slim `AdminIncomingOffer` shape; no attempt to read `completion_percentage` from property context
- [ ] `/offers` — WhatsApp outreach URL present when `external_contact` set
- [ ] `/offers` — ownership invite/resend/status badge all working
- [ ] `/customers` — loads from Airwallex proxy (or shows stub notice)
- [ ] `/payments` — loads from `/v1/admin/payment-intents`
- [ ] `/payment-intents` — detail loads
- [ ] `/transfers` — loads from `/v1/admin/transfers`
- [ ] `/beneficiaries` — loads (or stub notice)
- [ ] `/user-management` — list, suspend, reactivate, ban all work; bulk capped at 20
- [ ] `/settings` — loads and saves
- [ ] `/reports` — analytics load; export returns job ID or download URL
- [ ] `/media-library` — single upload returns S3 presigned URL; PUT succeeds; `publicUrl` has `tastyplates-bucket.s3` domain
- [ ] `/media-library` — batch upload works for up to 20 files
- [ ] Logout — `nhost.auth.signOut()` clears cookie; middleware redirects to `/signin`
- [ ] No `AIRWALLEX_API_KEY`, `HASURA_ADMIN_SECRET`, or `S3_BUCKET_*` visible in browser network tab or `.env`

---

*decouple-plan-v4.md — May 2026. Sourced from live `package.json`, `middleware.ts`, `.env`, `.env.local`, `IMPLEMENTATION_SUMMARY.md` from `myeung-6ixtech/dropiti-admin-console` main branch. Cross-referenced against `api-doc-v1.md` and `dropiti-unified-backend-v6.md §8a`.*