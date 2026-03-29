# Admin Portal: Nhost Authentication (Admin-Only)

This guide documents the authentication module used by this admin console: **Nhost** for identity, **JWT with Hasura claims** for the `admin` role, and **HTTP-only cookies** for session storage. Only users with the **admin** role can sign in; all others receive "Access denied. Admin role required."

Use this document to replicate the same authentication method when migrating another admin portal.

---

## Overview

| Layer | Responsibility |
|-------|----------------|
| **Nhost Auth** | Email/password sign-in, token refresh, sign-out. Nhost issues JWTs that include Hasura-style claims. |
| **Hasura JWT claims** | Custom claim `https://hasura.io/jwt/claims` with `x-hasura-allowed-roles` (e.g. `["user","admin"]`). Only users whose JWT includes `"admin"` are allowed. |
| **Next.js API routes** | Login, session check, logout. Verify JWT and admin role; set/clear HTTP-only cookies. |
| **Middleware** | Protect routes: require valid JWT with admin role; redirect to `/signin` otherwise. Skip all `/api` paths to avoid redirecting API fetches. |
| **AuthContext** | Client-side: call `/api/v1/auth/check` on load, expose `login`/`logout` and `user` state. |

**Flow in one sentence:** User signs in via Nhost → we verify the JWT and require `admin` in Hasura allowed roles → we set `nhost_access_token` and `nhost_refresh_token` cookies → middleware and API routes use that token for protection and Hasura calls.

---

## Prerequisites

1. **Nhost project** with Auth enabled (email/password).
2. **JWT configured in Nhost** so that issued tokens include Hasura-style claims:
   - In Nhost Dashboard: **Settings → Hasura → JWT** (or Auth → JWT template).
   - The JWT must contain a custom claim such as `https://hasura.io/jwt/claims` with:
     - `x-hasura-allowed-roles`: array of roles, e.g. `["user","admin"]`. Admin users must have `"admin"` in this array.
     - `x-hasura-default-role`: e.g. `"admin"`.
     - `x-hasura-user-id`: the Nhost user ID (e.g. `{{ .user.id }}`).
3. **JWT secret**: The HS256 key used by Nhost to sign JWTs. You need this in the Next.js server as `NHOST_JWT_SECRET` to verify tokens (same value as in Nhost Hasura JWT config).

---

## Environment Variables

| Variable | Where | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_NHOST_SUBDOMAIN` | Client + Server | Nhost project subdomain (e.g. `abcdefgh` from `abcdefgh.auth.eu-central-1.nhost.run`) |
| `NEXT_PUBLIC_NHOST_REGION` | Client + Server | Nhost region (e.g. `eu-central-1`) |
| `NHOST_JWT_SECRET` | **Server only** | HS256 JWT signing key from Nhost (Hasura JWT config). Used to verify and decode access tokens. **Never expose to the client.** |

Nhost Auth base URL is derived as:  
`https://${NEXT_PUBLIC_NHOST_SUBDOMAIN}.auth.${NEXT_PUBLIC_NHOST_REGION}.nhost.run/v1`

---

## 1. Nhost library (server-side)

**File:** `src/lib/nhost.ts`

Thin wrappers over Nhost’s REST Auth API; no Nhost client SDK required. All functions are intended for server-side use (API routes, middleware if needed).

- **`getNhostJwtSecret(): Uint8Array`**  
  Returns the JWT secret for `jose` (e.g. `jwtVerify`). Reads `NHOST_JWT_SECRET`.

- **`nhostSignIn(email, password)`**  
  `POST .../v1/signin/email-password`. Returns `{ session, error }`. On success, `session` contains `accessToken`, `refreshToken`, `accessTokenExpiresIn`, and `user` (id, email, displayName, avatarUrl).

- **`nhostRefreshToken(refreshToken)`**  
  `POST .../v1/token` with `{ refreshToken }`. Returns a new session (access + refresh tokens).

- **`nhostSignOut(refreshToken)`**  
  `POST .../v1/signout` to revoke the refresh token (best-effort).

- **`extractHasuraClaims(payload)`**  
  Reads `payload["https://hasura.io/jwt/claims"]` and returns `{ allowedRoles, defaultRole, userId }` (e.g. `x-hasura-allowed-roles`, `x-hasura-default-role`, `x-hasura-user-id`).

- **`hasRole(payload, role): boolean`**  
  Returns whether `role` is in `allowedRoles` from Hasura claims.

Implement the same helpers in the target admin portal so login, check, and logout can verify JWTs and enforce the admin role.

---

## 2. Cookie names and usage

Use two HTTP-only cookies:

| Cookie | Purpose |
|--------|---------|
| `nhost_access_token` | Nhost access JWT. Used by middleware and `/api/v1/auth/check` to verify identity and admin role. |
| `nhost_refresh_token` | Used by `/api/v1/auth/check` to refresh the access token when it expires. |

- **Set** on successful login and after a successful token refresh in the check route.
- **Cleared** on logout and when the user is not admin or the token is invalid/expired.
- **Options:** `httpOnly: true`, `secure: true` in production, `sameSite: "strict"`, `path: "/"`. Access token `maxAge` from Nhost (e.g. `session.accessTokenExpiresIn`); refresh token e.g. 30 days.

---

## 3. API routes

### 3.1 `POST /api/v1/auth/login`

1. Read `email` and `password` from the JSON body; validate format.
2. Call `nhostSignIn(email, password)`.
3. If `session` is null or error, return 401 (e.g. "Invalid email or password").
4. Decode the access token with `jose.jwtVerify(accessToken, getNhostJwtSecret())`.
5. If verification fails, return 401.
6. **Admin check:** `hasRole(payload, "admin")`. If false, return **403** with a message like "Access denied. Admin role required."
7. Set cookies `nhost_access_token` and `nhost_refresh_token` (see above).
8. Return 200 with `{ success: true, user: { id, email, name, avatar, role: "admin", permissions: ["*"] } }`.

Only users whose Nhost JWT includes the `admin` role in Hasura claims can reach step 7.

### 3.2 `GET /api/v1/auth/check`

1. Read `nhost_access_token` and `nhost_refresh_token` from cookies.
2. If both missing, return 401 (e.g. "No session found").
3. If access token present:
   - Verify with `jwtVerify(accessToken, getNhostJwtSecret())`.
   - If not admin (`hasRole(decoded, "admin")` is false), delete both cookies and return 403 ("Admin role required").
   - Otherwise return 200 with `{ authenticated: true, user: { id, email, name, avatar, role: "admin", permissions: ["*"] } }` (id from Hasura claims if desired).
   - If verification throws and error is not `ERR_JWT_EXPIRED`, delete cookies and return 401.
4. If access token missing or expired, use refresh token:
   - Call `nhostRefreshToken(refreshToken)`. On failure, delete cookies and return 401 ("Session expired").
   - Verify the new access token and admin role; if not admin, delete cookies and return 403.
   - Set both cookies with the new tokens, then return 200 with user as above.

This keeps the session alive and ensures only admin users remain logged in.

### 3.3 `POST /api/v1/auth/logout`

1. Read `nhost_refresh_token` from cookies.
2. If present, call `nhostSignOut(refreshToken)` (best-effort).
3. Delete both `nhost_access_token` and `nhost_refresh_token`.
4. Return 200.

---

## 4. Middleware (route protection)

**File:** `middleware.ts` (at project root)

- **Skip API routes:** If `pathname.startsWith("/api")` or `pathname.includes("/api/")`, return `NextResponse.next()`. This avoids redirecting API fetches (e.g. 308/too many redirects when the app is under a base path).
- **Protected routes:** Define a list of path prefixes (e.g. `/dashboard`, `/properties`, `/user-management`, …). If the request path matches:
  - No `nhost_access_token` cookie → redirect to `/signin`.
  - Verify JWT with `jose.jwtVerify(accessToken, getJwtSecret())`.
  - If verification fails or `hasAdminRole(payload)` is false: delete the access token cookie and redirect to `/signin`.
- **Signed-in users on sign-in page:** If path is `/signin` (or `/`) and a valid access token with admin role exists, redirect to `/dashboard` (optional).

**Admin role in middleware:** Same as in the API: read `payload["https://hasura.io/jwt/claims"]` and require `"admin"` in `x-hasura-allowed-roles`.

---

## 5. Client-side: AuthContext

**File:** `src/context/AuthContext.tsx`

- **State:** `isAuthenticated`, `isLoading`, `user` (id, email, name, avatar, role, permissions).
- **On mount:** Call `GET /api/v1/auth/check` with `credentials: "include"`. If 200, set user and authenticated; if not, set unauthenticated and, if not already on `/signin`/`/signup`, set `window.location.href = "/signin"`.
- **login(email, password):** `POST /api/v1/auth/login` with JSON body and `credentials: "include"`. On success, update state and return `{ success: true }`; on failure return `{ success: false, error: data.error }`.
- **logout():** `POST /api/v1/auth/logout` with `credentials: "include"`, then clear state and redirect to `/signin` (e.g. `window.location.href = "/signin"`).
- **hasPermission(permission):** For this admin portal, permissions can be a simple list (e.g. `["*"]` for full access); implement as needed.

Wrap the app (or the part that needs auth) with this provider so pages can use `useAuth()` for login, logout, and user state.

---

## 6. Sign-in form

**File:** `src/components/auth/SignInForm.tsx` (or equivalent)

- Form fields: email, password.
- Submit handler: call `login(email, password)` from AuthContext. On `success: true`, redirect (e.g. `router.push(redirect)` with default `/dashboard` or a `?redirect=` query). On failure, show `error` from the response (e.g. "Access denied. Admin role required." or "Invalid email or password").

---

## 7. End-to-end flow

```
User opens app
  → Middleware: if protected route and no/invalid token or not admin → redirect to /signin
  → If /signin: show SignInForm

User submits email/password
  → POST /api/v1/auth/login
  → Nhost signin → JWT verified → admin role checked
  → If not admin: 403, show "Access denied. Admin role required."
  → If admin: set cookies, return user → client redirects to dashboard

User navigates (or refreshes)
  → Middleware: sees cookie, verifies JWT and admin → allow
  → Client: GET /api/v1/auth/check (credentials: include)
  → If 401/403: clear state, redirect to /signin
  → If 200: set user, show app

Token expires
  → Middleware or check route: verify fails or refresh fails → clear cookies, redirect / 401
  → Client: check returns non-ok → redirect to /signin

User clicks logout
  → POST /api/v1/auth/logout → clear cookies
  → Client: clear state, redirect to /signin
```

---

## 8. Migration checklist for another admin portal

- [ ] Nhost project created; JWT configured with Hasura-style claims and an `admin` role for admin users.
- [ ] Env: `NEXT_PUBLIC_NHOST_SUBDOMAIN`, `NEXT_PUBLIC_NHOST_REGION`, `NHOST_JWT_SECRET` (server-only).
- [ ] Implement `src/lib/nhost.ts`: `getNhostJwtSecret`, `nhostSignIn`, `nhostRefreshToken`, `nhostSignOut`, `extractHasuraClaims`, `hasRole`.
- [ ] Implement `POST /api/v1/auth/login`: Nhost signin → verify JWT → require admin → set `nhost_access_token` and `nhost_refresh_token` cookies.
- [ ] Implement `GET /api/v1/auth/check`: verify or refresh token, enforce admin, return user; clear cookies on failure.
- [ ] Implement `POST /api/v1/auth/logout`: revoke refresh token (best-effort), clear both cookies.
- [ ] Middleware: skip paths containing `/api`; for protected routes require valid JWT with admin role; redirect to sign-in otherwise.
- [ ] AuthContext: check on load, login, logout, user state; redirect to sign-in when unauthenticated.
- [ ] Sign-in page: form calling `login`, show API error (including 403 admin denied), redirect on success.
- [ ] Ensure all protected pages are behind the same middleware and that the root layout is wrapped with `AuthProvider`.

---

## 9. Reference: key files in this repo

| Purpose | Path |
|--------|------|
| Nhost helpers | `src/lib/nhost.ts` |
| Login API | `src/app/api/v1/auth/login/route.ts` |
| Session check API | `src/app/api/v1/auth/check/route.ts` |
| Logout API | `src/app/api/v1/auth/logout/route.ts` |
| Route protection | `middleware.ts` |
| Client auth state | `src/context/AuthContext.tsx` |
| Sign-in form | `src/components/auth/SignInForm.tsx` |

Using this pattern, any admin portal can reuse the same Nhost + admin-only JWT + cookie + middleware + AuthContext approach for consistent, secure admin authentication.
