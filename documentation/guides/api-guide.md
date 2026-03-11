# Dropiti API Guide

Complete API documentation for implementing the Dropiti API in another application. The API is built on Next.js App Router, Nhost (auth), and Hasura (GraphQL over Postgres).

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URL & Environment Setup](#base-url--environment-setup)
4. [GraphQL (Server-Side)](#graphql-server-side)
5. [REST API Endpoints](#rest-api-endpoints)
   - [Properties](#properties)
   - [Offers](#offers)
   - [Chat](#chat)
   - [Users](#users)
   - [Reviews](#reviews)
   - [Notifications](#notifications)
   - [Tenants](#tenants)
   - [Upload](#upload)
6. [Error Handling](#error-handling)
7. [Data Models](#data-models)
8. [Implementation Notes](#implementation-notes)

---

## Overview

The Dropiti API uses:

- **Nhost** for authentication (email/password and Google OAuth). User identity is the Nhost user UUID (`auth.users.id`), which is stored as `nhost_user_id` in the app database.
- **Hasura** (GraphQL) over Postgres for data. All Hasura access from the app is server-side only, using the Hasura admin secret.
- **REST** routes under `/api/v1/*` for operations that the Next.js app (or an external client) calls. These routes run on the server and call Hasura internally.

**Important:** All user identifiers in this API are **Nhost user UUIDs** (the same as `auth.users.id` and `real_estate.user.nhost_user_id`). There is no Firebase; legacy names like “get-user-by-uuid” refer to lookup by this Nhost UUID.

### API Version

- Current Version: `v1`
- Base Path: `/api/v1`

---

## Authentication

Authentication is handled by **Nhost**. The front-end app uses the Nhost client (`@nhost/nextjs`) and session cookies. For server-to-server or external clients:

- **Same-origin (Next.js app):** Requests are made to `/api/v1/*` with the browser’s cookies; the session is established by Nhost.
- **External client:** You must establish a Nhost session (e.g. `nhost.auth.signIn`) and send the session token (e.g. in `Authorization: Bearer <access_token>`) if your backend validates it. The current API routes do not always enforce auth on every endpoint; they assume the caller is the Next.js app or a trusted service.

For full auth flow, session handling, and the link between `auth.users` and `real_estate.user`, see **[Nhost Migration & Auth Architecture](../docs/nhost-migration.md)**.

### User identity in API

- **`userId` / `nhost_user_id` / `id` (user):** Always the Nhost user UUID (same as `auth.users.id`).
- **`landlord_user_id` / `initiator_user_id` / `recipient_user_id` / `sender_user_id`:** In the database these store the same Nhost UUID (as text or uuid depending on table). Use the Nhost user ID in all requests.

### Session auth (v1)

Session endpoints live under `/api/v1/auth/`. Both the admin and client apps use these paths.

| Method | Endpoint | Description |
|--------|----------|-------------|
| **POST** | `/api/v1/auth/login` | Sign in with email/password. Body: `{ email, password }`. Sets HTTP-only session cookies on success. Returns `{ success, user }` or `{ error }`. |
| **GET** | `/api/v1/auth/check` | Validate current session (cookies). Returns `{ authenticated, user? }` or 401. May refresh tokens if access token expired. |
| **POST** | `/api/v1/auth/logout` | Sign out; revokes refresh token and clears session cookies. Returns `{ success }`. |

The admin app requires the user to have the `admin` role in Nhost; login returns 403 if the user does not have that role.

---

## Base URL & Environment Setup

### Base URL

- **Same app:** `https://your-domain.com/api/v1` or relative `/api/v1`.
- **External client:** Use the full origin, e.g. `https://dropiti.com/api/v1`.

### Required Environment Variables (Server)

These are used by the Next.js API routes and must be set in the deployment environment (e.g. Vercel).

```env
# Hasura (server-only)
HASURA_ENDPOINT=https://<project>.hasura.<region>.nhost.run/v1/graphql
HASURA_ADMIN_SECRET=<your-admin-secret>

# Nhost (client + server for app)
NEXT_PUBLIC_NHOST_SUBDOMAIN=<project>
NEXT_PUBLIC_NHOST_REGION=<region>

# Optional but recommended
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Chat encryption (server-only)
CHAT_ENCRYPTION_KEY=<hex-key>

# S3 (server-only, for uploads)
S3_BUCKET_NAME=
S3_BUCKET_ACCESS_KEY=
S3_BUCKET_SECRET_KEY=
S3_BUCKET_AWS_REGION=
S3_BUCKET_DOMAIN_URL=
```

---

## GraphQL (Server-Side)

The app does **not** expose the Hasura endpoint or admin secret to the browser. All Hasura calls go through the Next.js server.

### Server client (API routes)

**File (reference):** `src/app/api/graphql/serverClient.ts`

```typescript
import { executeQuery, executeMutation } from '@/app/api/graphql/serverClient';

const data = await executeQuery(GraphQL_QUERY_STRING, variables);
const result = await executeMutation(GraphQL_MUTATION_STRING, variables);
```

- **Endpoint:** `HASURA_ENDPOINT`
- **Headers:** `Content-Type: application/json`, `x-hasura-admin-secret: HASURA_ADMIN_SECRET`

If you integrate from another backend, point it at your Hasura URL and use your own admin secret; do not expose the admin secret to the client.

### Variable types (Hasura)

After the Firebase → Nhost migration, some columns remain `text` and others are `uuid`. Use the type Hasura expects:

- **`nhost_user_id`** (e.g. in `real_estate.user`): `uuid!`
- **`landlord_user_id`** (e.g. in `real_estate.property_listing`): `uuid!`
- **`initiator_user_id` / `recipient_user_id`** (e.g. in `real_estate.offer`): `String!`
- **`user_id`** in chat/tenant tables: check schema (often `String`)

See **[Column Type Reference](../docs/nhost-migration.md#column-type-reference)** in the Nhost migration doc.

---

## REST API Endpoints

### Properties

#### 1. Get Listings  
**GET** `/api/v1/properties/get-listings`

**Query parameters:**

| Parameter            | Type   | Default | Description                    |
|----------------------|--------|---------|--------------------------------|
| `limit`              | number | 10      | Results per page               |
| `offset`             | number | 0       | Pagination offset              |
| `location`           | string | —       | Location filter                |
| `minPrice`           | number | —       | Min rental price               |
| `maxPrice`           | number | —       | Max rental price               |
| `bedrooms`           | number | —       | Number of bedrooms             |
| `type`               | string | —       | Property type                  |
| `landlord_user_id`   | string | —       | Filter by landlord (Nhost UUID)|

**Response:** `{ success, data[], pagination: { total, limit, offset, hasMore } }`

---

#### 2. Get Property  
**GET** `/api/v1/properties/get-property?id=<id>`

Returns a single property by internal id.

---

#### 3. Get Property by UUID  
**GET** `/api/v1/properties/get-property-by-uuid?property_uuid=<uuid>`

**Query parameters:** `property_uuid` (required).

**Response:** `{ success, data: { property, landlord? } }` — property and optional landlord info (e.g. `nhost_user_id`, `display_name`, `photo_url`, `email`).

---

#### 4. Create Property  
**POST** `/api/v1/properties/create-property`

**Body:** Property payload including `title`, `description`, `address`, `price`, `bedrooms`, `bathrooms`, `photos`/`imageUrl`, `details`, `amenities`, `availableDate`, `ownerId` (Nhost user UUID), `isDraft` (boolean).

**Response:** `{ success, data, message }`

---

#### 5. Update Property  
**PUT** `/api/v1/properties/update-property`

**Body:** `{ id: string, updates: { title?, description?, price?, status?, ... } }`

**Response:** `{ success, data, message }`

---

#### 6. Get Drafts  
**GET** `/api/v1/properties/get-drafts?landlord_id=<nhost_user_id>`

**Query parameters:** `landlord_id` (required) — Nhost user UUID of the landlord.

**Response:** `{ success, data: [] }` — list of draft properties.

---

#### 7. Publish Draft  
**POST** `/api/v1/properties/publish-draft`

**Body:** `{ property_uuid: string }`

---

#### 8. Delete Draft  
**DELETE** `/api/v1/properties/delete-draft?property_uuid=<uuid>`

---

#### 9. Get Property Count by User  
**GET** `/api/v1/properties/get-property-count-by-user?landlordUserId=<nhost_user_id>`

**Query parameters:** `landlordUserId` (required) — Nhost user UUID.

**Response:** `{ success, data: { count }, message }`

---

### Offers

All user IDs in offer endpoints are **Nhost user UUIDs**.

#### 1. Get Offers  
**GET** `/api/v1/offers/get-offers?userId=<nhost_user_id>&type=<incoming|outgoing>&limit=10&offset=0`

**Response:** `{ success, data[], pagination }`

---

#### 2. Create Offer  
**POST** `/api/v1/offers/create-offer`

**Body:**

```json
{
  "propertyId": "property-uuid",
  "initiatorUserId": "tenant-nhost-uuid",
  "recipientUserId": "landlord-nhost-uuid",
  "proposingRentPrice": 2500,
  "numLeasingMonths": 12,
  "paymentFrequency": "monthly",
  "moveInDate": "2024-01-01",
  "currency": "HKD"
}
```

**Response:** `{ success, data: { id, offer_key, property_uuid, initiator_user_id, recipient_user_id, ... } }`

---

#### 3. Accept Offer  
**POST** `/api/v1/offers/accept-offer`

**Body:** `{ offerId: string, currentUserId: string }` — `currentUserId` is Nhost user UUID.

---

#### 4. Reject Offer  
**POST** `/api/v1/offers/reject-offer`

**Body:** `{ offerId, currentUserId, reason? }`

---

#### 5. Counter Offer  
**POST** `/api/v1/offers/counter-offer`

**Body:** `{ offerId, currentUserId, counterData: { rentPrice?, numLeasingMonths?, paymentFrequency?, moveInDate?, message?, reason? } }`

---

#### 6. Withdraw Offer  
**POST** `/api/v1/offers/withdraw-offer`

**Body:** `{ offerId, currentUserId, reason? }`

---

#### 7. Get Offers by Recipient  
**GET** `/api/v1/offers/get-offers-by-id?recipientUserId=<nhost_uuid>&propertyUuid=<uuid>` (optional)

**Query parameters:** `recipientUserId` (required), `propertyUuid` (optional).

---

#### 8. Get Offers by Initiator  
**GET** `/api/v1/offers/get-offers-by-initiator?initiatorUserId=<nhost_uuid>`

---

#### 9. Get Negotiation State  
**GET** `/api/v1/offers/get-negotiation-state?offerId=<id>&currentUserId=<nhost_uuid>`

**Response:** `{ success, data: { offer, negotiationState: { canAccept, canReject, canCounter, canWithdraw } } }`

---

#### 10. Get Offer Actions  
**GET** `/api/v1/offers/get-offer-actions?offerId=<id>`

---

#### 11. Get Review Opportunities  
**GET** `/api/v1/offers/get-review-opportunities?user_id=<nhost_uuid>`

**Response:** `{ success, data: { opportunities: [] } }`

---

### Chat

All user IDs are **Nhost user UUIDs**. Chat messages are encrypted at rest; the API returns decrypted content.

#### 1. Get Chat Rooms  
**GET** `/api/v1/chat/get-chat-rooms?userId=<nhost_uuid>`

**Response:** `{ success, data: [] }` — list of rooms with `room_id`, `user_id`, `role`, `room`, `last_message`, `other_participant` (with `user_details`).

---

#### 2. Get or Create Room  
**POST** `/api/v1/chat/get-or-create-room`

**Body:**

```json
{
  "user1UserId": "nhost-uuid-1",
  "user2UserId": "nhost-uuid-2",
  "user1Role": "tenant",
  "user2Role": "landlord"
}
```

**Response:** `{ success, data: { roomId, room, isNew } }`

---

#### 3. Get Room Messages  
**GET** `/api/v1/chat/get-room-messages?roomId=<uuid>&limit=50&offset=0`

**Response:** `{ success, data: [] }` — messages with `id`, `content`, `sender_user_id`, `status`, `created_at`, `message_type`, `metadata`.

---

#### 4. Send Message  
**POST** `/api/v1/chat/send-message`

**Body:**

```json
{
  "roomId": "room-uuid",
  "senderUserId": "nhost-uuid",
  "content": "Message text",
  "messageType": "text",
  "metadata": null
}
```

**Response:** `{ success, data: { id, content, sender_user_id, status, created_at, ... } }`

Rate limit: 20 messages per minute per user.

---

### Users

All lookups are by **Nhost user UUID** (`auth.users.id` / `real_estate.user.nhost_user_id`).

#### 1. Create User  
**POST** `/api/v1/users/create-user`

**Body:**

```json
{
  "nhost_user_id": "nhost-uuid",
  "display_name": "User Name",
  "email": "user@example.com",
  "photo_url": "https://...",
  "auth_provider": "email"
}
```

`auth_provider`: `"email"` or `"google"`. Creates a row in `real_estate.user` if one does not exist (by `nhost_user_id` or `email`).

**Response:** `{ success, data: { uuid, nhost_user_id, display_name, email, ... } }`

---

#### 2. Get User by ID (by Nhost user ID)  
**GET** `/api/v1/users/get-user-by-id?nhost_user_id=<uuid>` or `?id=<uuid>`

Used for session/profile load. Returns full `real_estate.user` profile.

**Response:** `{ success, data: { uuid, nhost_user_id, display_name, email, photo_url, ... } }`

---

#### 3. Get User by UUID (public profile)  
**GET** `/api/v1/users/get-user-by-uuid?uuid=<nhost_uuid>` or `?id=<nhost_uuid>`

Same as get-user-by-id: looks up by `nhost_user_id`. Used for public profile pages (e.g. `/user/[id]`).

**Response:** `{ success, data: { ... } }`

---

#### 4. Update User  
**PUT** `/api/v1/users/update-user`

**Body:** `{ id: string, updates: { display_name?, phone_number?, location?, about?, preferences?, notification_settings?, ... } }`

`id` is the Nhost user UUID.

**Response:** `{ success, data, message }`

---

### Reviews

#### 1. Create Review  
**POST** `/api/v1/reviews/create-review`

**Body:**

```json
{
  "offerId": "offer-id",
  "offerUuid": "offer-uuid",
  "reviewType": "tenant_to_landlord",
  "rating": 5,
  "comment": "Great experience!",
  "reviewerId": "reviewer-nhost-uuid",
  "revieweeUserId": "reviewee-nhost-uuid",
  "propertyUuid": "property-uuid"
}
```

**Response:** `{ success, data: { review } }`

---

#### 2. Get Reviews by Property  
**GET** `/api/v1/reviews/get-reviews-by-property?propertyUuid=<uuid>&reviewType=<type>&limit=50&offset=0`

**Response:** `{ success, data: [], total }` — reviews with reviewer/reviewee user details.

---

#### 3. Get Reviews by User  
**GET** `/api/v1/reviews/get-reviews-by-user?userId=<nhost_uuid>&reviewType=<type>&limit=50&offset=0`

---

#### 4. Update Review  
**PUT** `/api/v1/reviews/update-review?reviewUuid=<uuid>`

**Body:** Update payload (e.g. `rating`, `comment`).

---

#### 5. Delete Review  
**DELETE** `/api/v1/reviews/delete-review?reviewUuid=<uuid>`

---

#### 6. Mark Helpful  
**POST** `/api/v1/reviews/mark-helpful?reviewUuid=<uuid>`

---

### Notifications

All user IDs are **Nhost user UUIDs**.

#### 1. Get Notifications  
**GET** `/api/v1/notifications?userId=<nhost_uuid>&isRead=<true|false>&category=<category>&limit=50&offset=0`

**Response:** `{ success, data: [] }`

---

#### 2. Mark as Read  
**POST** `/api/v1/notifications/mark-read`

**Body:** `{ notificationId: string }`

---

#### 3. Mark All as Read  
**POST** `/api/v1/notifications/mark-all-read`

**Body:** `{ userId: string }`

---

#### 4. Archive  
**POST** `/api/v1/notifications/archive`

**Body:** `{ notificationId: string }`

---

#### 5. Unread Count  
**GET** `/api/v1/notifications/unread-count?userId=<nhost_uuid>`

**Response:** `{ success, data: { count } }`

---

### Tenants

#### 1. Get Tenant Profiles (list)  
**GET** `/api/v1/tenants?limit=20&offset=0&budget_min=&budget_max=&location=&move_in_date=&property_type=`

**Response:** `{ success, data: [], pagination }`

---

#### 2. Get Tenant Profile (single user)  
**GET** `/api/v1/tenants/profile?nhost_user_id=<nhost_uuid>`

**Response:** `{ success, data: { tenant_listing_title, tenant_listing_description, budget_min, budget_max, ... } }`

---

#### 3. Create or Update Tenant Profile (upsert)  
**POST** `/api/v1/tenants/profile`

**Body:** Must include `user_nhost_user_id` (Nhost user UUID) plus all tenant profile fields (e.g. `tenant_listing_title`, `tenant_listing_description`, `budget_min`, `budget_max`, `budget_currency`, `preferred_locations`, `privacy_settings`, etc.). If a row exists for that user, it is updated; otherwise a new row is inserted.

**Response:** `{ success, data, message }`

---

#### 4. Update Tenant Profile (partial)  
**PUT** `/api/v1/tenants/profile`

**Body:** `{ user_nhost_user_id: string, updates: { ... } }`

**Response:** `{ success, data, message }`

---

### Upload

#### 1. Upload (generic)  
**POST** `/api/v1/upload`

**Form data:** `files`, `category` (default `"images"`), `uploadType` (default `"direct"`).

**Response:** `{ success, data: { uploadedFiles, totalFiles, successfulUploads, category, uploadType } }`

---

#### 2. Direct S3 Upload  
**POST** `/api/v1/upload/s3`

**Form data:** `file`, `category` (default `"images"`).

**Response:** `{ success, data: { url, key, filename, size, type, uploadedAt } }`

---

## Error Handling

### Standard error response

```json
{
  "error": "Error message",
  "details": "Optional details"
}
```

### HTTP status codes

- **200** — Success  
- **400** — Bad request (validation, missing params)  
- **401** — Unauthorized  
- **403** — Forbidden  
- **404** — Not found  
- **409** — Conflict  
- **429** — Rate limit (e.g. chat)  
- **500** — Server error  

---

## Data Models

Identifiers are Nhost user UUIDs unless noted.

### User (`real_estate.user`)

```typescript
interface User {
  uuid: string;           // Table PK (not used for routing)
  nhost_user_id: string;  // auth.users.id — use this for URLs and API params
  display_name: string;
  email: string;
  photo_url?: string;
  auth_provider: 'email' | 'google';
  phone_number?: string;
  location?: string;
  about?: string;
  occupation?: string;
  preferences?: Record<string, unknown>;
  notification_settings?: Record<string, unknown>;
  privacy_settings?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
```

### Property

```typescript
interface Property {
  id: string;
  property_uuid: string;
  title: string;
  description: string;
  address: Record<string, unknown> | string;
  location?: string;
  rental_price: number;
  rental_price_currency?: string;
  num_bedroom: number;
  num_bathroom: number;
  landlord_user_id: string;  // Nhost UUID
  status: 'draft' | 'published' | 'archived' | 'expired';
  display_image?: string;
  uploaded_images?: string[];
  amenities?: string[];
  created_at: string;
  updated_at: string;
}
```

### Offer

```typescript
interface Offer {
  id: string;
  offer_key: string;
  property_uuid: string;
  initiator_user_id: string;   // Nhost UUID (text in DB)
  recipient_user_id: string;   // Nhost UUID (text in DB)
  proposing_rent_price: number;
  proposing_rent_price_currency?: string;
  num_leasing_months: number;
  payment_frequency: string;
  move_in_date: string;
  offer_status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### Review

```typescript
interface Review {
  id: string;
  review_uuid: string;
  offer_uuid: string;
  review_type: 'tenant_to_landlord' | 'landlord_to_tenant';
  rating: number;
  comment: string;
  reviewer_user_id: string;
  reviewee_user_id: string;
  property_uuid: string;
  created_at: string;
  updated_at: string;
}
```

### Chat message

```typescript
interface ChatMessage {
  id: string;
  room_id: string;
  content: string;
  sender_user_id: string;
  status: string;
  message_type: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}
```

---

## Implementation Notes

### Client (same app)

The app uses an Axios client with `baseURL: '/api/v1'`. See `src/lib/api-client.ts` for the exact method signatures (e.g. `usersAPI.getUserByNhostUserId`, `propertiesAPI.getListings`, `offersAPI.createOffer`, `tenantsAPI.upsertTenantProfile` with `user_nhost_user_id`).

### Server (Hasura)

- Use `executeQuery` and `executeMutation` from `src/app/api/graphql/serverClient.ts`.
- Set `HASURA_ENDPOINT` and `HASURA_ADMIN_SECRET` in the server environment only.

### Chat encryption

Messages are encrypted before storage. `CHAT_ENCRYPTION_KEY` must be set on the server. Content is decrypted when returned by the API.

### File uploads

- Images: typically max 5MB; types such as JPEG, PNG, GIF, WebP.
- Documents: max size and types as configured in the upload route.

### Pagination

List endpoints use `limit` and `offset`. Responses often include `pagination: { total, limit, offset, hasMore }`.

---

## Testing

- `GET /api` — API info  
- `GET /api/test-env` — Env check  
- `GET /api/test-hasura` — Hasura connectivity  
- `GET /api/test-s3` — S3 config  

---

## Related docs

- **Auth & user model:** [Nhost Migration & Auth Architecture](../docs/nhost-migration.md)  
- **Database:** `documentation/database/`  
- **API client reference:** `src/lib/api-client.ts`, `src/lib/chat-api.ts`  

---

**Last updated:** 2025-03  
**API version:** v1
