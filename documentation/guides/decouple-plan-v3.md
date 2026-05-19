# Dropiti Admin Console — Decouple Plan v3

**Document:** `decouple-plan-v3.md`
**Date:** May 2026
**Repo:** `myeung-6ixtech/dropiti-admin-console` · branch `main`
**API standard:** `api-doc-v1.md` (Nhost Functions backend)
**Backend URL:** `https://fcuycyemqprjrkbshlcj.functions.ap-southeast-1.nhost.run`

> This plan is a precise, ordered to-do list. Every task maps a current admin console behaviour to its `api-doc-v1.md` replacement. Tasks are grouped by phase so they can be executed sequentially without breaking the running app.

### Implemented connectivity (this repo — read first)

The console **already talks to** the deployed Nhost Functions URL in the document header. The runtime pattern is:

- **`src/lib/admin-api.ts`** — Browser code calls **`/api/v1/bff/functions/...`** via `functionsBffUrl()` (same-origin). The BFF route reads httpOnly **`nhost_access_token`** and forwards to **`{NEXT_PUBLIC_FUNCTIONS_URL}/v1/...`** with **`Authorization: Bearer`**, matching [`api-doc-v1.md`](../../../dropiti-nhost/documentation/api-doc-v1.md) §1 and §3.
- **`src/lib/bff-route-rewrite.ts`** — Rewrites REST path segments from **`adminRoutes`** to static Nhost file paths (e.g. list `GET` → `admin/users/index`, by-id → `get-user?userId=`).
- **`src/app/api/v1/auth/login`**, **`check`**, **`logout`** — Server routes wrapping Nhost Auth REST (`src/lib/nhost.ts`), **not** legacy PBKDF2. **Do not delete** these routes for cookie-based sessions.

Any phase below that says to remove `/api/v1/auth/*` or to forbid `/api/v1/auth/check` is **obsolete** for the cookie + BFF design unless you intentionally move to client-readable tokens.

---

## Contents

1. [Current State Audit](#1-current-state-audit)
2. [Coding Standards for This Codebase](#2-coding-standards-for-this-codebase)
3. [Dos and Do-Nots](#3-dos-and-do-nots)
4. [Phase 0 — Security: Remove Secrets from Git](#phase-0--security-remove-secrets-from-git)
5. [Phase 1 — Foundation: Packages + Shared Client](#phase-1--foundation-packages--shared-client)
6. [Phase 2 — Auth: Replace Legacy Login System](#phase-2--auth-replace-legacy-login-system)
7. [Phase 3 — Page by Page API Migration](#phase-3--page-by-page-api-migration)
8. [Phase 4 — Upload Migration](#phase-4--upload-migration)
9. [Phase 5 — Env Cleanup](#phase-5--env-cleanup)
10. [Phase 6 — Delete Dead Code](#phase-6--delete-dead-code)
11. [Verification Checklist](#verification-checklist)

---

## 1. Current State Audit

### What is currently in the repo (sourced from live files)

**Authentication system (`AuthContext.tsx`, `src/app/api/v1/auth/*`, `middleware.ts`):**
- Next.js API routes: `POST /api/v1/auth/login`, `GET /api/v1/auth/check`, `POST /api/v1/auth/logout` — Nhost email/password sign-in and refresh via **`src/lib/nhost.ts`**, httpOnly **`nhost_access_token`** / **`nhost_refresh_token`** cookies
- `middleware.ts` — reads `nhost_access_token`, verifies JWT with `jose`, checks `x-hasura-allowed-roles` for `"admin"`
- `AuthContext.tsx` — calls the **`/api/v1/auth/*`** routes above (intentional: tokens stay httpOnly; data calls use the BFF)

**Data fetching (`package.json`, `.env`):**
- `graphql-request` + `SDK_BACKEND_URL` + `HASURA_ADMIN_SECRET` — pages query Hasura directly using the admin secret
- `axios` — used for HTTP calls to local routes

**File uploads (`package.json`, `.env`):**
- `@aws-sdk/client-s3` + `S3_BUCKET_*` env vars — S3 SDK running in the Next.js frontend (credentials exposed in server components)
- `sharp` — used for image processing (will break in Nhost Functions — native binary)
- `react-dropzone` — UI component only, keep

**Payments (`package.json`, `.env`):**
- `@airwallex/components-sdk` — Airwallex Elements UI SDK (browser-safe, keep)
- `AIRWALLEX_API_KEY` — **currently committed to `.env` in plaintext** — critical security issue
- `AIRWALLEX_CLIENT_ID` — browser-safe, keep

**Secrets committed to `.env` (live values visible in git):**
- `AIRWALLEX_API_KEY` — live API key committed
- `HASURA_ADMIN_SECRET` — live Hasura admin secret committed
- `S3_BUCKET_ACCESS_KEY` + `S3_BUCKET_SECRET_KEY` — live AWS credentials committed
- `UPSTASH_REDIS_REST_TOKEN` — live token committed
- `ROOT_PASSWORD` — plaintext admin password committed
- `NHOST_JWT_SECRET` — JWT signing secret committed

**Protected pages (from `middleware.ts` `PROTECTED_ROUTES`):**
`/dashboard`, `/customers`, `/payments`, `/transfers`, `/beneficiaries`, `/settings`, `/reports`, `/properties`, `/payment-intents`, `/user-management`, `/media-library`

### What stays unchanged

| Item | Why it stays |
|---|---|
| `middleware.ts` | Already correct — reads `nhost_access_token`, verifies HS256 JWT, checks `"admin"` role |
| `@airwallex/components-sdk` | Browser-safe Airwallex Elements UI for payment form rendering |
| `react-dropzone` | UI component only — wire to new upload function |
| `jose` | Used by `middleware.ts` — keep |
| `lucide-react`, `apexcharts`, UI components | UI-only — no data coupling |
| `NHOST_JWT_SECRET` in `.env` | Required by `middleware.ts` for JWT verification |
| `NEXT_PUBLIC_NHOST_SUBDOMAIN`, `NEXT_PUBLIC_NHOST_REGION` | Required by `@nhost/nextjs` |

---

## 2. Coding Standards for This Codebase

Before touching any file, align to these standards. Every new or modified file must follow them.

### Shared API client — the single fetch wrapper

Create `src/lib/admin-api.ts` as the **only** place that performs **browser-initiated** calls to Nhost admin Functions. Every dashboard page should use `adminFetch`, `adminList`, or `functionsBffUrl` from here — not raw `fetch` to `NEXT_PUBLIC_FUNCTIONS_URL` from the client (tokens are httpOnly; cross-origin cookies do not reach Functions per `api-doc-v1.md` §3).

```ts
// Implemented pattern — src/lib/admin-api.ts (simplified)
import { functionsBffUrl, parseFunctionsEnvelope } from "@/lib/nhost-functions";

// Browser: same-origin BFF; server adds Bearer from nhost_access_token cookie
export async function adminFetch<T>(pathSegment: string, init?: RequestInit) {
  const res = await fetch(functionsBffUrl(pathSegment /* + optional URLSearchParams */), {
    credentials: "include",
    ...init,
  });
  const parsed = await parseFunctionsEnvelope<T>(res);
  // Returns { data, error, status, ok } — see src/lib/admin-api.ts
}
```

Path segments must come from **`adminRoutes`** in `src/lib/admin-routes.ts` (REST-style); the BFF rewrites to real Nhost paths.

### Token access pattern

**Implemented (recommended):** Leave access tokens in **httpOnly** cookies. Do not pass a Bearer string from React; use **`adminFetch`** / **`adminList`**, which hit the BFF. Session lifecycle uses **`POST /api/v1/auth/login`**, **`GET /api/v1/auth/check`**, **`POST /api/v1/auth/logout`** (see `AuthContext.tsx`).

**Optional alternative:** If you expose tokens to client JS, you could use `useAccessToken()` from `@nhost/react` and call Functions directly with `Authorization: Bearer` — not required for this repo and weaker for XSS.

`src/lib/nhost.ts` provides **server-side** Nhost Auth REST helpers (`nhostSignIn`, etc.), not a browser `NhostClient` singleton for data calls.

### Response handling

Every Nhost Function returns `{ ok: true, data: T }` or `{ ok: false, error: string }`. Always check `ok` before using `data`:

```ts
import { adminList } from '@/lib/admin-api'
import { adminRoutes } from '@/lib/admin-routes'

const { items, error } = await adminList<User>(adminRoutes.users(), { limit: '20' })
if (error) {
  setError(error)
  return
}
setUsers(items)
```

For lower-level control, `adminFetch` returns `{ data, error, status, ok }` — check `error` / `ok` before using `data`.

Do not assume the shape. Do not destructure without checking `ok` first.

### Error display standard

Nhost Functions return structured errors. Map them to UI:

```ts
// ✅ Do
if (!result.ok) toast.error(result.error)

// ❌ Do not
catch (e) { console.log(e) }   // swallow errors silently
```

### Loading state standard

Every data fetch must have a loading state. Never render empty tables without a loading indicator.

```ts
const [loading, setLoading] = useState(true)
const [data, setData] = useState<Item[]>([])

useEffect(() => {
  fetchData().finally(() => setLoading(false))
}, [])
```

---

## 3. Dos and Do-Nots

### Calling the backend

| ✅ Do | ❌ Do Not |
|---|---|
| Call `adminFetch()` / `adminList()` / `functionsBffUrl()` from `src/lib/admin-api.ts` (same-origin BFF) | Call `fetch(NEXT_PUBLIC_FUNCTIONS_URL/...)` from the browser with Bearer in JS |
| Let the BFF add `Authorization: Bearer` from the httpOnly cookie | Rely on cookies sent cross-origin to the Functions URL (they are not forwarded) |
| Check `result.ok` / `result.error` (or `adminList`’s `error`) before using data | Ignore envelope errors |
| Set `NEXT_PUBLIC_FUNCTIONS_URL` on the server (BFF uses it) only | Hardcode the Functions URL in any file |
| Paginate lists with `limit` (max 100) and `offset` | Fetch unbounded lists |

### Authentication

| ✅ Do | ❌ Do Not |
|---|---|
| Use `POST /api/v1/auth/login` (Nhost via server route + cookies) | Use legacy `POST /api/login` |
| Use `GET /api/v1/auth/check` for session refresh / `AuthContext` | Drop session checks entirely |
| Use `POST /api/v1/auth/logout` | Legacy logout routes |
| Keep tokens in httpOnly cookies with the BFF pattern | Put long-lived secrets in `localStorage` |
| Keep `middleware.ts` unchanged | Weaken JWT / admin role checks in middleware |

### Secrets and environment variables

| ✅ Do | ❌ Do Not |
|---|---|
| Add `.env` and `.env.local` to `.gitignore` immediately | Commit any file containing credentials |
| Store `AIRWALLEX_API_KEY` in Nhost Functions `.secrets` | Put `AIRWALLEX_API_KEY` in any frontend env file |
| Store `S3_BUCKET_*` in Nhost Functions `.secrets` | Use AWS SDK in the frontend |
| Rotate all secrets that were committed to git | Continue using compromised credentials |
| Use only `NEXT_PUBLIC_*` vars for values the browser needs | Expose server-side secrets in `NEXT_PUBLIC_*` vars |

### Uploads

| ✅ Do | ❌ Do Not |
|---|---|
| Call `POST /v1/admin/upload/presign` to get S3 presigned URL | Use `@aws-sdk/client-s3` in the frontend |
| PUT the file directly from browser to the presigned S3 URL | Proxy file bytes through your Next.js server |
| Remove `sharp` from `package.json` | Use `sharp` (native binary — breaks in both Next.js serverless and Nhost Functions) |
| Handle MIME type validation error from the Function | Validate MIME types client-side only |

### Data fetching patterns

| ✅ Do | ❌ Do Not |
|---|---|
| Use `graphql-request` for client-side Hasura queries if needed (with user JWT, no admin secret) | Use `graphql-request` with `HASURA_ADMIN_SECRET` in any client component |
| Treat `{ stub: true }` from Airwallex routes as a valid dev state | Crash or error on stub responses |
| Use `useEffect` + `useState` for data fetching in components | Fetch data at module scope outside a component |

---

## Phase 0 — Security: Remove Secrets from Git

> **Do this first, before any code changes. Compromised credentials must be rotated and removed from git history.**

### Tasks

- [ ] **0.1** Add `.env` and `.env.local` to `.gitignore` if not already present
  ```
  # .gitignore
  .env
  .env.local
  .env*.local
  ```

- [ ] **0.2** Rotate every secret currently committed to `.env`:
  - `AIRWALLEX_API_KEY` — regenerate in Airwallex Dashboard
  - `HASURA_ADMIN_SECRET` — regenerate in Nhost Dashboard → Settings
  - `S3_BUCKET_ACCESS_KEY` + `S3_BUCKET_SECRET_KEY` — regenerate in AWS IAM
  - `UPSTASH_REDIS_REST_TOKEN` — regenerate in Upstash Dashboard
  - `NHOST_JWT_SECRET` — if regenerated, update in Nhost Dashboard and `middleware.ts`
  - `ROOT_PASSWORD` — change the admin account password

- [ ] **0.3** Remove `.env` from git tracking:
  ```bash
  git rm --cached .env .env.local
  git commit -m "remove committed env files from tracking"
  ```

- [ ] **0.4** Add new secrets to Nhost Functions `.secrets` file (server-side only):
  ```bash
  # In dropiti-nhost repo, repo-root .secrets
  AIRWALLEX_API_KEY=<new-rotated-value>
  S3_BUCKET_ACCESS_KEY=<new-rotated-value>
  S3_BUCKET_SECRET_KEY=<new-rotated-value>
  UPSTASH_REDIS_REST_URL=<value>
  UPSTASH_REDIS_REST_TOKEN=<new-rotated-value>
  HASURA_GRAPHQL_ADMIN_SECRET=<new-rotated-value>
  ```

- [ ] **0.5** Keep only these vars in admin console `.env` (no secrets):
  ```bash
  NHOST_JWT_SECRET=<value>              # middleware.ts JWT verify
  NEXT_PUBLIC_NHOST_SUBDOMAIN=fcuycyemqprjrkbshlcj
  NEXT_PUBLIC_NHOST_REGION=ap-southeast-1
  NEXT_PUBLIC_SITE_URL=http://localhost:3000
  NEXT_PUBLIC_AIRWALLEX_ENV=demo
  AIRWALLEX_CLIENT_ID=WyQ2_hk4TlaAnOuaOSV1FQ
  NEXT_PUBLIC_FUNCTIONS_URL=https://fcuycyemqprjrkbshlcj.functions.ap-southeast-1.nhost.run
  ```

---

## Phase 1 — Foundation: Packages + Shared Client

### Tasks

- [ ] **1.1** Install Nhost packages:
  ```bash
  yarn add @nhost/nextjs @nhost/react
  ```

- [ ] **1.2** Remove server-side packages that move to Nhost Functions:
  ```bash
  yarn remove @aws-sdk/client-s3 sharp
  ```
  > `sharp` uses a native C++ binary and will also crash in Next.js serverless (Vercel/Netlify). Remove it unconditionally.

- [ ] **1.3** Create `src/lib/nhost.ts`:
  ```ts
  import { NhostClient } from '@nhost/nextjs'

  export const nhost = new NhostClient({
    subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN!,
    region:    process.env.NEXT_PUBLIC_NHOST_REGION!,
  })
  ```

- [ ] **1.4** Wrap the app root with `NhostProvider`.
  In `src/app/layout.tsx`:
  ```tsx
  import { NhostProvider } from '@nhost/nextjs'
  import { nhost } from '@/lib/nhost'

  export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
      <NhostProvider nhost={nhost}>
        {children}
      </NhostProvider>
    )
  }
  ```

- [ ] **1.5** Create `src/lib/admin-api.ts` — the single fetch wrapper for all Nhost Function calls. See §2 for the full implementation. Add typed helper groups for each domain:
  - `adminUsersApi` — `/users`, `/users/get-user`, `/users/suspend-user`, etc.
  - `adminPropertiesApi` — `/properties`, `/properties/approve`, etc.
  - `adminOffersApi` — `/offers/incoming`, `/offers/index`, etc.
  - `adminTransferApi` — `/transfer-ownership/invite`, `/resend`, `/status`
  - `adminAnalyticsApi` — `/analytics/dashboard`, `/analytics/export`
  - `adminPaymentsApi` — `/customers`, `/payment-intents`, `/payments/cancel`
  - `adminBeneficiariesApi` — `/beneficiaries`
  - `adminTransfersApi` — `/transfers`
  - `adminUploadApi` — `/upload/presign`, `/upload/batch`

- [ ] **1.6** Verify build still passes: `yarn build`

---

## Phase 2 — Auth: Replace Legacy Login System

> The three local API routes (`/api/login`, `/api/auth/check`, `/api/auth/logout`) are replaced entirely by Nhost Auth. `middleware.ts` is unchanged.

### Tasks

- [ ] **2.1** Rewrite `src/context/AuthContext.tsx`:
  - Remove all calls to `POST /api/login`, `GET /api/auth/check`, `POST /api/auth/logout`
  - Replace session state with Nhost Auth hooks:
    ```ts
    import { useAuthenticationStatus, useUserData, useAccessToken } from '@nhost/react'

    // isAuthenticated:  useAuthenticationStatus()
    // user:             useUserData()
    // token:            useAccessToken()
    // login:            nhost.auth.signIn({ email, password })
    // logout:           nhost.auth.signOut()
    ```
  - Keep `hasPermission()` utility — wire it to Nhost custom JWT claims or a local lookup

- [ ] **2.2** Update `src/app/(auth)/signin/page.tsx` (or wherever the sign-in form lives):
  - Replace `POST /api/login` call with `nhost.auth.signIn({ email, password })`
  - Handle Nhost Auth error shapes:
    ```ts
    const { isError, error } = await nhost.auth.signIn({ email, password })
    if (isError) setFormError(error?.message ?? 'Login failed')
    ```
  - On success: Nhost Auth sets `nhost_access_token` cookie automatically — `middleware.ts` picks it up with no changes needed

- [ ] **2.3** Test auth end-to-end:
  - [ ] Login → `nhost_access_token` cookie set → `middleware.ts` allows `/dashboard`
  - [ ] Logout → cookie cleared → `middleware.ts` redirects to `/signin`
  - [ ] Expired token → `middleware.ts` redirects to `/signin` and deletes cookie (already handled)
  - [ ] Non-admin Nhost user → `middleware.ts` rejects and redirects to `/signin`

- [ ] **2.4** Ensure admin users have `"admin"` in `x-hasura-allowed-roles`:
  - Go to Nhost Dashboard → Auth → Custom Claims
  - Add custom claim: `x-hasura-allowed-roles` must include `"admin"` for admin accounts
  - Test: sign in as admin → `middleware.ts` `hasAdminRole()` must return `true`

---

## Phase 3 — Page by Page API Migration

Each task below maps one protected page to its `api-doc-v1.md` endpoint. Work through them sequentially. After each page, run `yarn build` and verify the page renders correctly.

### Page: `/dashboard`

**Currently:** Direct Hasura query or stub data
**Migrate to:** `GET /v1/admin/analytics/dashboard`

- [ ] **3.1** In the dashboard page component, replace any direct Hasura queries with:
  ```ts
  const result = await adminAnalyticsApi.dashboard(
    { period: '30d' },
    token
  )
  if (!result.ok) { /* handle error */ return }
  // use result.data
  ```
- [ ] **3.2** Handle the loading state — show skeleton loaders while data fetches
- [ ] **3.3** Handle `result.ok === false` — show an error banner, not a blank page

---

### Page: `/customers`

**Currently:** Direct Hasura query with admin secret
**Migrate to:** `GET /v1/admin/customers` (Airwallex proxy)

- [ ] **3.4** Replace Hasura query with `adminPaymentsApi.listCustomers(params, token)`
  - Endpoint: `GET /v1/admin/customers?limit=20&offset=0`
  - Response: `{ ok: true, data: { items: [...], total: N } }` OR `{ ok: true, data: { stub: true } }` when Airwallex is not configured
- [ ] **3.5** Handle stub response: show a "Airwallex not configured" message rather than crashing
- [ ] **3.6** Wire search, pagination controls to `?search=&limit=&offset=` query params

---

### Page: `/payments` and `/payment-intents`

**Currently:** `@airwallex/components-sdk` with direct API calls using `AIRWALLEX_API_KEY`
**Migrate to:** Nhost Functions proxy routes (API key server-side only)

- [ ] **3.7** For `/payments`:
  - Replace direct Airwallex SDK API calls with `adminPaymentsApi.listPayments(params, token)`
  - Endpoint: `GET /v1/admin/payment-intents?limit=20&offset=0`
  - Keep Airwallex Elements UI components (browser-safe) for rendering payment forms
  - Remove any code that reads `AIRWALLEX_API_KEY` in the frontend

- [ ] **3.8** For `/payment-intents`:
  - Replace with `adminPaymentsApi.getPaymentIntent(id, token)`
  - Endpoint: `GET /v1/admin/payment-intents/get-intent?id=`
  - Cancel intent: `POST /v1/admin/payments/cancel` with body `{ paymentId }`
  - Attach method: `POST /v1/admin/payments/attach-method`

- [ ] **3.9** Verify `AIRWALLEX_API_KEY` is not referenced anywhere in `src/`:
  ```bash
  grep -rn "AIRWALLEX_API_KEY" src/
  # Must return zero results
  ```

---

### Page: `/transfers`

**Currently:** Direct Hasura query or stub
**Migrate to:** `GET /v1/admin/transfers`

- [ ] **3.10** Replace with `adminTransfersApi.list(params, token)`
  - Endpoint: `GET /v1/admin/transfers?limit=20&offset=0`
- [ ] **3.11** Cancel transfer: `POST /v1/admin/transfers/cancel` with body `{ transferId }`
- [ ] **3.12** Wire `AdminOfferCard` ownership invite flow:
  - Send invite: `POST /v1/admin/transfer-ownership/invite`
  - Check status: `GET /v1/admin/transfer-ownership/status?propertyUuid=`
  - Resend: `POST /v1/admin/transfer-ownership/resend`
  - Map invitation status to badge state (see `api-doc-v1.md` §11)

---

### Page: `/beneficiaries`

**Currently:** Direct Airwallex SDK with `AIRWALLEX_API_KEY`
**Migrate to:** `GET /v1/admin/beneficiaries`

- [ ] **3.13** List: `GET /v1/admin/beneficiaries?limit=20&offset=0`
- [ ] **3.14** Get single: `GET /v1/admin/beneficiaries/get-beneficiary?id=`
- [ ] **3.15** Update: `PUT /v1/admin/beneficiaries/update-beneficiary`
- [ ] **3.16** Delete: `DELETE /v1/admin/beneficiaries/delete-beneficiary`
- [ ] **3.17** Handle stub response: when Airwallex is not configured, all routes return `{ ok: true, data: { stub: true } }` — display a configuration notice rather than an error

---

### Page: `/properties`

**Currently:** Direct Hasura query with admin secret
**Migrate to:** `GET /v1/admin/properties`

- [ ] **3.18** List all properties: `GET /v1/admin/properties?limit=20&offset=0&status=&flagged=`
- [ ] **3.19** Moderation queue: `GET /v1/admin/properties/moderation-queue`
- [ ] **3.20** Get single property: `GET /v1/admin/properties/get-property?propertyUuid=`
- [ ] **3.21** Approve: `POST /v1/admin/properties/approve` body `{ propertyUuid, notes? }`
- [ ] **3.22** Reject: `POST /v1/admin/properties/reject` body `{ propertyUuid, reason }`
- [ ] **3.23** Flag: `POST /v1/admin/properties/flag` body `{ propertyUuid, flagType, reason }`
- [ ] **3.24** Feature: `POST /v1/admin/properties/feature` body `{ propertyUuid, featured, featureUntil? }`
- [ ] **3.25** Update: `PUT /v1/admin/properties/update-property` body `{ propertyUuid, updates, reason }`
- [ ] **3.26** Bulk action: `POST /v1/admin/properties/bulk` body `{ action, propertyUuids }` — max 20 items

---

### Page: `/user-management`

**Currently:** Direct Hasura query with admin secret
**Migrate to:** `GET /v1/admin/users`

- [ ] **3.27** List users: `GET /v1/admin/users?search=&limit=20&offset=0&status=`
- [ ] **3.28** Get single user: `GET /v1/admin/users/get-user?userId=`
- [ ] **3.29** Update: `PUT /v1/admin/users/update-user`
- [ ] **3.30** Verify: `POST /v1/admin/users/verify-user` body `{ userId, verificationType, status, notes }`
- [ ] **3.31** Suspend: `POST /v1/admin/users/suspend-user` body `{ userId, reason, duration }`
- [ ] **3.32** Reactivate: `POST /v1/admin/users/reactivate-user` body `{ userId, notes }`
- [ ] **3.33** Ban: `POST /v1/admin/users/ban-user` body `{ userId, reason, permanent }`
- [ ] **3.34** Activity log: `GET /v1/admin/users/activity-log?userId=`
- [ ] **3.35** Export (GDPR): `GET /v1/admin/users/export-user-data?userId=` — 6 MB response cap; handle large exports gracefully
- [ ] **3.36** Bulk: `POST /v1/admin/users/bulk` body `{ action, userIds, params }` — cap selection at 20 users in the UI

---

### Page: `/settings`

**Currently:** Direct Hasura query or local state
**Migrate to:** `GET /v1/admin/settings/index`

- [ ] **3.37** Load settings: `GET /v1/admin/settings/index`
- [ ] **3.38** Save settings: `PUT /v1/admin/settings/update` body `{ section, updates, reason }`
- [ ] **3.39** Feature flags: `GET /v1/admin/settings/feature-flags`
- [ ] **3.40** Toggle flag: `POST /v1/admin/settings/toggle-flag` body `{ enabled, rollout_percentage? }`
- [ ] **3.41** Email templates: `GET /v1/admin/settings/email-templates`
- [ ] **3.42** Update template: `PUT /v1/admin/settings/update-template` body `{ subject, content, language }`

---

### Page: `/reports`

**Currently:** Direct Hasura query or stub
**Migrate to:** `GET /v1/admin/analytics/`

- [ ] **3.43** Dashboard summary: `GET /v1/admin/analytics/dashboard?period=30d`
- [ ] **3.44** User analytics: `GET /v1/admin/analytics/users?period=&groupBy=`
- [ ] **3.45** Property analytics: `GET /v1/admin/analytics/properties`
- [ ] **3.46** Transaction analytics: `GET /v1/admin/analytics/transactions`
- [ ] **3.47** Export: `POST /v1/admin/analytics/export` — returns a job ID or direct download if <6 MB
  ```ts
  const result = await adminAnalyticsApi.export({ format: 'csv', period: '30d' }, token)
  if (!result.ok) { showError(result.error); return }
  // result.data may be { jobId } for async or { downloadUrl } for sync
  ```

---

## Phase 4 — Upload Migration

**Currently:** `@aws-sdk/client-s3` running in Next.js server components with `S3_BUCKET_*` credentials in `.env`
**Migrate to:** `POST /v1/admin/upload/presign` + `POST /v1/admin/upload/batch` (S3 credentials server-side in Nhost Functions)

### Page: `/media-library`

- [ ] **4.1** Replace the current S3 upload code with a two-step pattern:

  **Step 1 — Get presigned URL from Nhost Function:**
  ```ts
  const result = await adminUploadApi.presign(
    { filename: file.name, mimeType: file.type },
    token
  )
  if (!result.ok) { showError(result.error); return }
  const { uploadUrl, publicUrl, s3Key } = result.data
  ```

  **Step 2 — PUT file directly to S3:**
  ```ts
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  })
  if (!uploadRes.ok) { showError('S3 upload failed'); return }
  // Store publicUrl in your data layer
  ```

- [ ] **4.2** For batch uploads (multiple files at once), use `/v1/admin/upload/batch`:
  ```ts
  const result = await adminUploadApi.batch(
    files.map(f => ({ filename: f.name, mimeType: f.type })),
    token
  )
  if (!result.ok) { showError(result.error); return }
  // result.data is an array: [{ uploadUrl, publicUrl, s3Key, filename }]
  await Promise.all(
    result.data.map((item, i) =>
      fetch(item.uploadUrl, { method: 'PUT', body: files[i], headers: { 'Content-Type': files[i].type } })
    )
  )
  ```

- [ ] **4.3** Cap batch selections at **20 files** in the `react-dropzone` configuration:
  ```tsx
  <Dropzone maxFiles={20} onDrop={handleDrop}>
  ```

- [ ] **4.4** Wire `react-dropzone`'s `onDrop` to the new two-step pattern above
- [ ] **4.5** Remove all references to `S3_BUCKET_*` env vars from the frontend code
- [ ] **4.6** Remove all `import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'` statements
- [ ] **4.7** The `publicUrl` returned is already the final S3 URL (`https://tastyplates-bucket.s3.ap-northeast-2.amazonaws.com/...`) — no URL transformation needed

---

## Phase 5 — Env Cleanup

After all pages are migrated, clean the `.env` file down to only what the frontend legitimately needs.

### Final `.env` state

```bash
# Auth — middleware.ts JWT verification
NHOST_JWT_SECRET=<value>

# Nhost — @nhost/nextjs client + Functions URL
NEXT_PUBLIC_NHOST_SUBDOMAIN=fcuycyemqprjrkbshlcj
NEXT_PUBLIC_NHOST_REGION=ap-southeast-1
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_FUNCTIONS_URL=https://fcuycyemqprjrkbshlcj.functions.ap-southeast-1.nhost.run

# Airwallex — Elements UI SDK (browser-safe only)
NEXT_PUBLIC_AIRWALLEX_ENV=demo
AIRWALLEX_CLIENT_ID=WyQ2_hk4TlaAnOuaOSV1FQ
```

### Variables to remove from `.env`

- [ ] **5.1** `AIRWALLEX_API_KEY` — moved to Nhost Functions `.secrets`
- [ ] **5.2** `HASURA_ADMIN_SECRET` — moved to Nhost Functions `.secrets`
- [ ] **5.3** `SDK_BACKEND_URL` — no longer used (direct Hasura queries replaced)
- [ ] **5.4** `HASURA_ENDPOINT` — same
- [ ] **5.5** `S3_BUCKET_ACCESS_KEY` — moved to Nhost Functions `.secrets`
- [ ] **5.6** `S3_BUCKET_SECRET_KEY` — moved to Nhost Functions `.secrets`
- [ ] **5.7** `S3_BUCKET_DOMAIN_URL` — moved to Nhost Functions `.secrets`
- [ ] **5.8** `S3_BUCKET_AWS_REGION` — moved to Nhost Functions `.secrets`
- [ ] **5.9** `S3_BUCKET_NAME` — moved to Nhost Functions `.secrets`
- [ ] **5.10** `IMAGE_MAX_WIDTH`, `IMAGE_MAX_HEIGHT`, `IMAGE_WEBP_QUALITY` — moved to Nhost Function server constants
- [ ] **5.11** `UPSTASH_REDIS_REST_URL` — moved to Nhost Functions `.secrets`
- [ ] **5.12** `UPSTASH_REDIS_REST_TOKEN` — moved to Nhost Functions `.secrets`
- [ ] **5.13** `JWT_SECRET` — replaced by `NHOST_JWT_SECRET`
- [ ] **5.14** `NEXT_PUBLIC_API_URL` — was pointing to old local API server
- [ ] **5.15** `NEXT_PUBLIC_CLIENT_SECRET` — review; if Airwallex-specific remove
- [ ] **5.16** `ROOT_EMAIL`, `ROOT_PASSWORD` — legacy seed credentials, never needed in frontend

---

## Phase 6 — Delete Dead Code

> **Update (May 2026):** Keep **`src/app/api/v1/auth/login`**, **`check`**, **`logout`**, and the entire **`src/app/api/v1/bff/functions/`** tree — they implement the cookie + BFF pattern required by [`api-doc-v1.md`](../../../dropiti-nhost/documentation/api-doc-v1.md). Do **not** delete the `/api/v1/auth/*` routes unless you replace them with another server-mediated session design.

### Files to delete (only if they still exist and are unused)

- [ ] **6.1** ~~`src/app/api/login/route.ts`~~ — use **`/api/v1/auth/login`** instead; delete only a **legacy** top-level `/api/login` if present
- [ ] **6.2** ~~Delete `src/app/api/auth/check`~~ — **retain** **`src/app/api/v1/auth/check`**
- [ ] **6.3** ~~Delete `src/app/api/auth/logout`~~ — **retain** **`src/app/api/v1/auth/logout`**
- [ ] **6.4** `scripts/generate-admin-password.js` — PBKDF2 password generator, remove if still present
- [ ] **6.5** ~~Delete entire `src/app/api/`~~ — **do not**; keep `v1/auth`, `v1/bff`, and `webhooks`

### Code patterns to remove from pages

- [ ] **6.6** Remove all imports of `graphql-request` used with admin secret:
  ```bash
  grep -rn "graphql-request" src/
  # Any hit that involves HASURA_ADMIN_SECRET or SDK_BACKEND_URL must be removed
  ```

- [ ] **6.7** Remove all `axios` calls to local API routes or Hasura:
  ```bash
  grep -rn "axios" src/
  # Replace remaining hits with adminFetch() calls
  ```

- [ ] **6.8** Remove all `@aws-sdk/client-s3` imports:
  ```bash
  grep -rn "client-s3\|S3Client\|PutObjectCommand" src/
  # Must return zero results
  ```

- [ ] **6.9** Remove all `sharp` imports:
  ```bash
  grep -rn "from 'sharp'\|require('sharp')" src/
  # Must return zero results
  ```

- [ ] **6.10** Remove references to deleted env vars from **browser bundles**; allow **server-only** `process.env.AIRWALLEX_API_KEY` in `src/app/api/webhooks/airwallex` and `src/lib/server-airwallex-auth.ts` (never `NEXT_PUBLIC_*`):
  ```bash
  grep -rn "SDK_BACKEND_URL\|HASURA_ADMIN_SECRET\|HASURA_ENDPOINT\|S3_BUCKET\|UPSTASH_REDIS" src/
  grep -rn "AIRWALLEX_API_KEY" src/   # expect only server webhook + server-airwallex helpers
  ```

### Package cleanup

- [ ] **6.11** Remove `graphql-request` if no longer used anywhere:
  ```bash
  yarn remove graphql-request graphql
  ```
  > Only remove if zero remaining imports after Phase 6.6.

- [ ] **6.12** Remove `axios` if no longer used anywhere:
  ```bash
  yarn remove axios
  ```

---

## Verification Checklist

Run all checks after Phase 6 is complete.

### Build

```bash
yarn build
# Must complete with zero errors and zero TypeScript errors
```

### Code audit

```bash
# No direct Hasura admin queries in frontend
grep -rn "SDK_BACKEND_URL\|HASURA_ADMIN_SECRET\|HASURA_ENDPOINT" src/
# → zero results

# No S3 SDK in frontend
grep -rn "client-s3\|S3Client\|S3_BUCKET" src/
# → zero results

# AIRWALLEX_API_KEY — allowed only in server routes / lib (webhook), never NEXT_PUBLIC_*
grep -rn "AIRWALLEX_API_KEY" src/
# Expect: src/app/api/webhooks/airwallex, src/lib/server-airwallex-auth.ts only

# Auth routes — EXPECTED hits in AuthContext for cookie session
grep -rn "/api/v1/auth/login\|/api/v1/auth/check\|/api/v1/auth/logout" src/

# BFF usage — dashboard pages should call adminFetch / functionsBffUrl
grep -rn "functionsBffUrl\|/api/v1/bff/functions\|adminFetch\|adminList" src/

# No sharp in app source
grep -rn "from 'sharp'\|require('sharp')" src/
# → zero results

# No legacy unversioned auth (wrong prefix)
grep -rn '"/api/login"' src/
grep -rn '"/api/auth/check"' src/
# → zero results (use /api/v1/auth/*)

# No raw Hasura / S3 env in src (Airwallex key allowed only in server webhook path above)
grep -rn "process\.env\.HASURA\|process\.env\.S3_BUCKET" src/
# → zero results
```

### Runtime verification

```bash
# 1. Nhost Functions health
curl -sS "https://fcuycyemqprjrkbshlcj.functions.ap-southeast-1.nhost.run/v1/health"
# → { "ok": true, "data": { "status": "ok" } }

# 2. Admin list (Nhost file path is .../users/index). Browser uses BFF: rewrites `admin/users` → this path.
curl -sS -H "Authorization: Bearer <ADMIN_TOKEN>" \
  "https://fcuycyemqprjrkbshlcj.functions.ap-southeast-1.nhost.run/v1/admin/users/index?limit=20"
# → { "ok": true, "data": { "items": [...] } } (shape may include pagination)

# 3. Admin route with non-admin JWT → 403
curl -sS -H "Authorization: Bearer <USER_TOKEN>" \
  "https://fcuycyemqprjrkbshlcj.functions.ap-southeast-1.nhost.run/v1/admin/users/index"
# → { "ok": false, "error": "Forbidden" }

# 4. Upload presign → S3 URL returned
curl -sS -X POST -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"filename":"test.jpg","mimeType":"image/jpeg"}' \
  "https://fcuycyemqprjrkbshlcj.functions.ap-southeast-1.nhost.run/v1/admin/upload/presign"
# → { "ok": true, "data": { "uploadUrl": "https://tastyplates-bucket.s3...", ... } }
```

### Manual page-by-page sign-off

- [ ] `/signin` — login works via Nhost Auth; `nhost_access_token` cookie set
- [ ] `/dashboard` — KPI data loads from `analytics/dashboard`
- [ ] `/customers` — loads from Airwallex proxy (or shows stub notice)
- [ ] `/payments` — loads from `payment-intents`; cancel works
- [ ] `/payment-intents` — loads from `payment-intents/get-intent`
- [ ] `/transfers` — loads from `transfers`; ownership invite flow works
- [ ] `/beneficiaries` — loads from `beneficiaries` (or stub notice)
- [ ] `/properties` — list loads; approve/reject/flag/feature all work
- [ ] `/user-management` — list loads; suspend/reactivate/ban all work; bulk limited to 20
- [ ] `/settings` — settings load and save
- [ ] `/reports` — analytics load; export works
- [ ] `/media-library` — single upload returns S3 presigned URL and completes; batch upload works up to 20 files; S3 public URL stored correctly
- [ ] Logout — `nhost.auth.signOut()` clears cookie; `middleware.ts` redirects to `/signin`
- [ ] Expired session — `middleware.ts` deletes cookie and redirects to `/signin` (no change needed — already works)

---

*decouple-plan-v3.md — May 2026. Follow phases in order. Do not skip Phase 0. Each phase ends with `yarn build` to confirm no regressions.*