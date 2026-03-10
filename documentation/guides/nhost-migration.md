# Nhost Migration — Authentication & User Profile Architecture

This document describes how Dropiti authenticates users via Nhost and how the `auth.users` table is linked to the `real_estate.user` table. It serves as the authoritative reference for the current post-migration state.

---

## Overview

Authentication is handled entirely by **Nhost Auth**. Nhost manages its own internal `auth.users` table (inside the `auth` schema) which stores credentials, OAuth provider details, email verification status, and the user's `avatarUrl`. Application-specific profile data lives in a separate **`real_estate.user`** table that is linked to `auth.users` via the `nhost_user_id` column.

The Hasura GraphQL Engine sits on top of Postgres and exposes both tables. All direct Hasura access from the server uses the **Hasura admin secret** — this secret is never sent to the browser.

---

## Database Schema Relationship

```
auth.users                          real_estate.user
──────────────────────────          ──────────────────────────────────────
id          uuid  (PK)  ─────────► nhost_user_id  uuid   (FK → auth.users.id)
email       text                    uuid           uuid   (PK — table's own PK)
avatarUrl   text                    display_name   text
displayName text                    email          text
...                                 photo_url      text
                                    auth_provider  text   ('email' | 'google')
                                    phone_number   text
                                    location       text
                                    about          text
                                    occupation     text
                                    onboarding_complete  boolean
                                    preferences    jsonb
                                    created_at     timestamptz
                                    updated_at     timestamptz
```

**Key points:**
- `auth.users.id` is a UUID managed by Nhost — this is the canonical user identity.
- `real_estate.user.nhost_user_id` stores that same UUID and is used for all lookups.
- `real_estate.user.uuid` is the table's own separate primary key (auto-generated).
- Throughout the app, `user.id` (from `AuthContext`) always refers to the **Nhost UUID** (`nhost_user_id`), which is what profile URLs (`/user/[id]`) and API lookups are based on.
- The old `firebase_uid` columns were renamed (not retyped) during migration — they remain `text` type in Hasura's GraphQL schema (see [Column Type Reference](#column-type-reference) below).

---

## Environment Variables

| Variable | Location | Purpose |
|---|---|---|
| `NEXT_PUBLIC_NHOST_SUBDOMAIN` | Client + Server | Nhost project subdomain |
| `NEXT_PUBLIC_NHOST_REGION` | Client + Server | Nhost project region |
| `HASURA_ENDPOINT` | **Server only** | Hasura GraphQL endpoint URL |
| `HASURA_ADMIN_SECRET` | **Server only** | Hasura admin secret — never expose to client |
| `NEXT_PUBLIC_SITE_URL` | Client + Server | Canonical site URL (`http://localhost:3000` locally, `https://dropiti.com` in prod) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Client | Google Maps embed key |
| `NEXT_PUBLIC_BYPASS_ONBOARDING` | Client | Set `true` in dev to skip onboarding gate |
| `CHAT_ENCRYPTION_KEY` | **Server only** | AES key for chat message encryption |
| `S3_BUCKET_ACCESS_KEY` | **Server only** | AWS S3 access key |
| `S3_BUCKET_SECRET_KEY` | **Server only** | AWS S3 secret key |
| `S3_BUCKET_NAME` | **Server only** | S3 bucket name |
| `S3_BUCKET_AWS_REGION` | **Server only** | S3 bucket region |
| `S3_BUCKET_DOMAIN_URL` | **Server only** | S3 public domain URL |

All server-only variables must be added to Vercel project settings for production. The `.env.local` file is never deployed.

---

## Nhost Client

**File:** `src/lib/nhost.ts`

Singleton `NhostClient` instance initialised with `NEXT_PUBLIC_NHOST_SUBDOMAIN` and `NEXT_PUBLIC_NHOST_REGION`. Imported wherever Nhost auth operations are needed.

---

## Authentication Context — `AuthContext`

**File:** `src/context/AuthContext.tsx`

The single source of truth for auth state in the app. Wraps Nhost's `useAuthenticationStatus` and `useUserData` hooks and enriches the session with the `real_estate.user` DB profile row.

### `AuthUser` Shape

| Field | Source |
|---|---|
| `id` | `real_estate.user.nhost_user_id` (= `auth.users.id`) |
| `email` | `real_estate.user.email` |
| `name` | `real_estate.user.display_name` |
| `avatar` | `real_estate.user.photo_url` |
| `uuid` | `real_estate.user.uuid` (DB row PK — not used for routing) |
| All other fields | Mapped directly from `real_estate.user` columns |

> **Important:** Use `user.id` (not `user.uuid`) for profile URLs (`/user/${user.id}`) and all API lookups. `user.id` is the Nhost UUID that matches `nhost_user_id` in the database.

### Profile Load Flow

```
isAuthenticated + nhostUser.id available
  └─► GET /api/v1/users/get-user-by-uuid?id=<nhostUserId>
        ├─► Profile found → setUser() with full DB data
        └─► Profile not found (e.g. new Google OAuth user)
              └─► POST /api/v1/users/create-user
                    (auto-detects auth_provider from avatarUrl)
                  └─► setUser() with minimal Nhost data
```

### Provided Context Values

| Value | Type | Description |
|---|---|---|
| `isAuthenticated` | `boolean` | Nhost session active |
| `isLoading` | `boolean` | Auth loading OR profile fetching |
| `user` | `AuthUser \| null` | Enriched user object |
| `login(email, password, rememberMe?)` | function | Email/password sign-in |
| `loginWithGoogle()` | function | Google OAuth redirect |
| `logout()` | function | Signs out and redirects to `/` |
| `isRememberMeEnabled` | `boolean` | 90-day session preference |

---

## Authentication Service — `nhostAuthService`

**File:** `src/services/auth/nhostAuthService.ts`

A singleton class that wraps all Nhost auth operations with `real_estate.user` profile management. Used primarily by the sign-up flow.

### Key Methods

| Method | Description |
|---|---|
| `registerWithEmail(email, password, displayName)` | Signs up via `nhost.auth.signUp()`, then ensures a `real_estate.user` row exists |
| `signInWithEmail(email, password)` | Signs in via `nhost.auth.signIn()`, with profile row safety-net creation |
| `signInWithGoogle(redirectTo?)` | Triggers Google OAuth redirect — returns `{ error? }`, never throws |
| `signOut()` | Calls `nhost.auth.signOut()`, errors swallowed |
| `resetPassword(email)` | Sends reset email via `nhost.auth.resetPassword()` |
| `resendVerificationEmail(email)` | Calls `nhost.auth.sendVerificationEmail()` |
| `getUserProfile(nhostUserId)` | Queries `real_estate.user` by `nhost_user_id` — returns discriminated union `'ok' \| 'not_found' \| 'error'` |
| `createUserProfile(userData)` | Inserts a new `real_estate.user` row |

### Email Sign-Up Flow

```
SignUpForm
  └─► nhostAuthService.registerWithEmail(email, password, displayName)
        ├─► nhost.auth.signUp({ email, password, options: { displayName } })
        │     └─► Nhost creates auth.users row, returns session.user.id
        └─► ensureUserProfile({ nhost_user_id: session.user.id, auth_provider: 'email', ... })
              └─► Hasura mutation: insert_real_estate_user_one
```

### Email Sign-In Flow

```
SignInForm / AuthContext.login()
  └─► nhost.auth.signIn({ email, password })
        └─► Nhost validates credentials, returns session
              └─► AuthContext loadProfile()
                    ├─► GET /api/v1/users/get-user-by-uuid (profile found → done)
                    └─► Not found → POST /api/v1/users/create-user (safety net)
```

### Google OAuth Flow

```
GoogleSignInButton / AuthContext.loginWithGoogle()
  └─► nhost.auth.signIn({ provider: 'google' })
        └─► Browser redirected to Google → back to app
              └─► AuthContext loadProfile()
                    ├─► Profile found → done
                    └─► Not found → auto-create real_estate.user row
                          (auth_provider detected from avatarUrl containing 'googleusercontent')
```

### Password Change Flow (Settings page)

```
SettingsPage → Security tab
  ├─► Re-authenticate: nhost.auth.signIn({ email, currentPassword })
  └─► nhost.auth.changePassword({ newPassword })
```

---

## Server-Side Hasura Client

**File:** `src/app/api/graphql/serverClient.ts`

All API routes use this thin wrapper to query Hasura with the admin secret:

```typescript
executeQuery(query, variables)    // for queries
executeMutation(query, variables) // for mutations
```

Both functions POST to `HASURA_ENDPOINT` with the `x-hasura-admin-secret` header set from `HASURA_ADMIN_SECRET`. These are server-only env vars and are never sent to the client.

---

## API Routes for User Profiles

### `GET /api/v1/users/get-user-by-uuid?id=<nhostUserId>`

Fetches a `real_estate.user` row by `nhost_user_id`. Used by `AuthContext` on every session load.

### `POST /api/v1/users/create-user`

Creates a new `real_estate.user` row. Accepts `{ nhost_user_id, display_name, email, photo_url?, auth_provider? }`. Checks for existing row by both `nhost_user_id` and `email` before inserting to prevent duplicates.

### `PUT /api/v1/users/update-user`

Updates profile fields for a user identified by `nhost_user_id`.

### `GET /api/v1/users/get-user-by-id?id=<nhostUserId>`

Public-facing profile lookup used by the `/user/[id]` page.

---

## Column Type Reference

Due to the Firebase → Nhost migration (rename-only, no type change), not all user ID columns are the same type in Hasura:

| Column | Table | GraphQL Type | Notes |
|---|---|---|---|
| `nhost_user_id` | `real_estate.user` | `uuid` | Newly added; FK to `auth.users.id` |
| `landlord_user_id` | `real_estate.property_listing` | `uuid` | Was already uuid type |
| `initiator_user_id` | `real_estate.offer` | `String` | Renamed from `initiator_firebase_uid` (text) |
| `recipient_user_id` | `real_estate.offer` | `String` | Renamed from `recipient_firebase_uid` (text) |
| `reviewer_user_id` | `real_estate.review` | `String` | Renamed from `reviewer_firebase_uid` (text) |
| `reviewee_user_id` | `real_estate.review` | `String` | Renamed from `reviewee_firebase_uid` (text) |

**Always check Hasura's reported type before writing a GraphQL variable declaration.** Using `uuid!` where Hasura expects `String!` (or vice versa) causes a `validation-failed` error.

---

## Pending Tasks

1. **Drop stale FK constraints on `real_estate.offer`** — The old constraints `offer_initiator_firebase_uid_fkey` and `offer_recipient_firebase_uid_fkey` still exist and reference the old `real_estate.user.firebase_uid` column. They must be dropped in Hasura console to unblock offer creation:
   ```sql
   ALTER TABLE real_estate.offer DROP CONSTRAINT IF EXISTS offer_initiator_firebase_uid_fkey;
   ALTER TABLE real_estate.offer DROP CONSTRAINT IF EXISTS offer_recipient_firebase_uid_fkey;
   ```

2. **Retype renamed FK columns (optional)** — If you want proper referential integrity, alter `initiator_user_id`, `recipient_user_id`, etc. from `text` to `uuid` and add new FK constraints pointing to `auth.users.id`.

3. **Baseline browser mapping** — `yarn build` reports warnings about `browserslist` targets being out of date. Run `npx update-browserslist-db@latest` to fix.
