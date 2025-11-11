# Dropiti API Guide

Complete API documentation for implementing the Dropiti API in another application.

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URL & Environment Setup](#base-url--environment-setup)
4. [GraphQL Endpoint](#graphql-endpoint)
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

---

## Overview

The Dropiti API is built on Next.js 13+ App Router and uses:
- **GraphQL** for data queries and mutations (via Hasura)
- **REST API** endpoints for specific operations
- **NextAuth.js** for authentication
- **Firebase** for user authentication

### API Version
- Current Version: `v1.0.0`
- Base Path: `/api/v1`

---

## Authentication

### NextAuth.js Configuration

The API uses NextAuth.js with the following providers:
- **Credentials Provider** (Email/Password via Firebase)
- **Google OAuth Provider**

### Session Management
- **Strategy**: JWT
- **Max Age**: 30 days (default), 90 days (with "Remember Me")
- **Cookie**: `next-auth.session-token`

### Authentication Headers

For authenticated requests, include the session cookie or Authorization header:

```http
Authorization: Bearer <session_token>
```

Or use cookies:
```http
Cookie: next-auth.session-token=<token>
```

---

## Base URL & Environment Setup

### Required Environment Variables

```env
# Hasura Configuration
HASURA_ENDPOINT=https://your-hasura-instance.hasura.app/v1/graphql
HASURA_ADMIN_SECRET=your-admin-secret

# NextAuth Configuration
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# Firebase Configuration (for authentication)
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_FIREBASE_GOOGLE_CLIENT_SECRET=your-google-client-secret

# S3 Configuration (for file uploads)
S3_BUCKET_NAME=your-bucket-name
S3_BUCKET_ACCESS_KEY=your-access-key
S3_BUCKET_SECRET_KEY=your-secret-key
S3_BUCKET_AWS_REGION=ap-northeast-2
S3_BUCKET_DOMAIN_URL=https://your-domain.com
```

---

## GraphQL Endpoint

### Endpoint
```
POST /api/graphql
```

### Request Format

```json
{
  "query": "query GetUser($id: String!) { real_estate_user(where: { firebase_uid: { _eq: $id } }) { uuid display_name email } }",
  "variables": {
    "id": "user-firebase-uid"
  }
}
```

### Headers

```http
Content-Type: application/json
x-hasura-admin-secret: <admin-secret>
Authorization: Bearer <token> (optional)
```

### Response Format

```json
{
  "data": {
    "real_estate_user": [...]
  },
  "errors": [] // if any
}
```

### Client Implementation

**Server-side (for API routes):**
```typescript
import { executeQuery, executeMutation } from '@/app/api/graphql/serverClient';

// Query
const data = await executeQuery(query, variables);

// Mutation
const result = await executeMutation(mutation, variables);
```

**Client-side:**
```typescript
import { hasuraClient } from '@/app/api/graphql/client';

const data = await hasuraClient.request(query, variables);
```

---

## REST API Endpoints

### Properties

#### 1. Get Listings
**GET** `/api/v1/properties/get-listings`

**Query Parameters:**
- `limit` (number, default: 10) - Number of results per page
- `offset` (number, default: 0) - Pagination offset
- `minPrice` (number, optional) - Minimum rental price filter
- `maxPrice` (number, optional) - Maximum rental price filter
- `bedrooms` (number, optional) - Number of bedrooms filter
- `type` (string, optional) - Property type filter
- `landlord_firebase_uid` (string, optional) - Filter by landlord

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "property_uuid": "uuid-string",
      "title": "Modern Downtown Apartment",
      "description": "Beautiful 2-bedroom apartment...",
      "location": "Downtown, City Center",
      "address": { /* JSON address object */ },
      "price": 2500,
      "bedrooms": 2,
      "bathrooms": 2,
      "imageUrl": "https://...",
      "details": {
        "type": "apartment",
        "furnished": "full",
        "petsAllowed": false,
        "parking": true
      },
      "amenities": ["WiFi", "Gym", "Pool"],
      "minimumLease": 12,
      "availableDate": "2024-01-01T00:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

#### 2. Get Property
**GET** `/api/v1/properties/get-property?property_uuid=<uuid>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "property_uuid": "uuid-string",
    "title": "Property Title",
    "description": "Property description",
    "address": { /* JSON address */ },
    "location": "Formatted location string",
    "rental_price": 2500,
    "num_bedroom": 2,
    "num_bathroom": 2,
    "display_image": "https://...",
    "uploaded_images": ["https://..."],
    "property_type": "apartment",
    "furnished": "full",
    "pets_allowed": true,
    "amenities": ["WiFi", "Gym"],
    "availability_date": "2024-01-01",
    "is_public": true,
    "status": "published",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### 3. Get Property by UUID (with Landlord Info)
**GET** `/api/v1/properties/get-property-by-uuid?property_uuid=<uuid>`

**Response:**
```json
{
  "success": true,
  "data": {
    "property": { /* property object */ },
    "landlord": {
      "id": "uuid",
      "firebase_uid": "firebase-uid",
      "name": "Landlord Name",
      "email": "landlord@example.com",
      "avatar": "https://...",
      "verified": true,
      "rating": 4.5,
      "review_count": 10
    }
  }
}
```

#### 4. Create Property
**POST** `/api/v1/properties/create-property`

**Request Body:**
```json
{
  "title": "Property Title",
  "description": "Property description",
  "address": {
    "country": "United States",
    "state": "California",
    "city": "San Francisco",
    "district": "Downtown",
    "building": "123 Main St, Apt 4B"
  },
  "price": 2500,
  "bedrooms": 2,
  "bathrooms": 2,
  "photos": ["https://..."],
  "details": {
    "propertyType": "apartment",
    "rentalSpace": "entire",
    "furnished": "full",
    "petsAllowed": true,
    "grossArea": 1000
  },
  "amenities": ["WiFi", "Gym"],
  "availableDate": "2024-01-01",
  "ownerId": "firebase-uid",
  "isDraft": false
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* created property object */ },
  "message": "Property created successfully"
}
```

#### 5. Update Property
**PUT** `/api/v1/properties/update-property`

**Request Body:**
```json
{
  "id": "property-uuid",
  "updates": {
    "title": "Updated Title",
    "description": "Updated description",
    "price": 2600,
    "bedrooms": 3,
    "status": "published"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* updated property object */ },
  "message": "Property updated successfully"
}
```

#### 6. Get Drafts
**GET** `/api/v1/properties/get-drafts?landlord_id=<firebase-uid>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "property_uuid": "uuid",
      "title": "Draft Title",
      "status": "draft",
      "completion_percentage": 50,
      "last_saved_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### 7. Publish Draft
**POST** `/api/v1/properties/publish-draft`

**Request Body:**
```json
{
  "property_uuid": "uuid"
}
```

#### 8. Delete Draft
**DELETE** `/api/v1/properties/delete-draft?property_uuid=<uuid>`

#### 9. Get Property Count by User
**GET** `/api/v1/properties/get-property-count-by-user?landlordFirebaseUid=<firebase-uid>`

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

---

### Offers

#### 1. Get Offers
**GET** `/api/v1/offers/get-offers?userId=<uuid>&type=<incoming|outgoing>&limit=10&offset=0`

**Response:**
```json
{
  "success": true,
  "data": [ /* offer objects */ ],
  "pagination": {
    "total": 20,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

#### 2. Create Offer
**POST** `/api/v1/offers/create-offer`

**Request Body:**
```json
{
  "propertyId": "property-uuid",
  "initiatorFirebaseUid": "tenant-firebase-uid",
  "recipientFirebaseUid": "landlord-firebase-uid",
  "proposingRentPrice": 2500,
  "numLeasingMonths": 12,
  "paymentFrequency": "monthly",
  "moveInDate": "2024-01-01",
  "currency": "HKD"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "offer_key": "offer_1234567890_abc123",
    "property_uuid": "property-uuid",
    "initiator_firebase_uid": "tenant-uid",
    "recipient_firebase_uid": "landlord-uid",
    "proposing_rent_price": 2500,
    "offer_status": "pending",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### 3. Accept Offer
**POST** `/api/v1/offers/accept-offer`

**Request Body:**
```json
{
  "offerId": 1,
  "currentUserId": "firebase-uid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "offerId": "1",
    "offerKey": "offer_123",
    "newStatus": "accepted",
    "action": "RECIPIENT_ACCEPTED",
    "bulkRejection": {
      "rejectedOffersCount": 2,
      "rejectedOffers": [...]
    }
  },
  "message": "Offer accepted and deal finalized!",
  "isFinalized": true
}
```

#### 4. Reject Offer
**POST** `/api/v1/offers/reject-offer`

**Request Body:**
```json
{
  "offerId": 1,
  "currentUserId": "firebase-uid",
  "reason": "Price too low" // optional
}
```

#### 5. Counter Offer
**POST** `/api/v1/offers/counter-offer`

**Request Body:**
```json
{
  "offerId": 1,
  "currentUserId": "firebase-uid",
  "counterData": {
    "rentPrice": 2600,
    "numLeasingMonths": 12,
    "paymentFrequency": "monthly",
    "moveInDate": "2024-02-01",
    "message": "Counter offer message", // optional
    "reason": "Reason for counter" // optional
  }
}
```

#### 6. Withdraw Offer
**POST** `/api/v1/offers/withdraw-offer`

**Request Body:**
```json
{
  "offerId": 1,
  "currentUserId": "firebase-uid",
  "reason": "Found another property" // optional
}
```

#### 7. Get Offers by ID
**GET** `/api/v1/offers/get-offers-by-id?recipientFirebaseUid=<uid>&propertyUuid=<uuid>`

#### 8. Get Offers by Initiator
**GET** `/api/v1/offers/get-offers-by-initiator?initiatorFirebaseUid=<uid>`

#### 9. Get Negotiation State
**GET** `/api/v1/offers/get-negotiation-state?offerId=1&currentUserId=<uid>`

**Response:**
```json
{
  "success": true,
  "data": {
    "offer": { /* offer object */ },
    "negotiationState": {
      "canAccept": true,
      "canReject": true,
      "canCounter": true,
      "canWithdraw": false
    }
  }
}
```

#### 10. Get Offer Actions
**GET** `/api/v1/offers/get-offer-actions?offerId=1`

#### 11. Get Review Opportunities
**GET** `/api/v1/offers/get-review-opportunities?user_id=<firebase-uid>`

**Response:**
```json
{
  "success": true,
  "data": {
    "opportunities": [
      {
        "id": "1",
        "offerId": "1",
        "propertyUuid": "uuid",
        "propertyTitle": "Property Title",
        "otherPartyName": "User Name",
        "otherPartyPhotoUrl": "https://...",
        "reviewType": "tenant_to_landlord",
        "reviewWindowEnd": "2024-01-15T00:00:00Z",
        "status": "pending"
      }
    ]
  }
}
```

---

### Chat

#### 1. Get Chat Rooms
**GET** `/api/v1/chat/get-chat-rooms?userFirebaseUid=<uid>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "participant-id",
      "room_id": "room-uuid",
      "user_firebase_uid": "user-uid",
      "role": "tenant",
      "joined_at": "2024-01-01T00:00:00Z",
      "last_read_at": "2024-01-01T00:00:00Z",
      "is_active": true,
      "room": {
        "id": "room-uuid",
        "title": null,
        "room_type": "direct",
        "last_message_at": "2024-01-01T00:00:00Z"
      },
      "last_message": {
        "content": "Hello",
        "sender_firebase_uid": "sender-uid",
        "created_at": "2024-01-01T00:00:00Z"
      },
      "other_participant": {
        "room_id": "room-uuid",
        "user_firebase_uid": "other-uid",
        "role": "landlord",
        "user_details": {
          "display_name": "Other User",
          "photo_url": "https://...",
          "email": "other@example.com"
        }
      }
    }
  ]
}
```

#### 2. Get or Create Room
**POST** `/api/v1/chat/get-or-create-room`

**Request Body:**
```json
{
  "user1FirebaseUid": "user1-uid",
  "user2FirebaseUid": "user2-uid",
  "user1Role": "tenant",
  "user2Role": "landlord"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "roomId": "room-uuid",
    "room": {
      "id": "room-uuid",
      "room_type": "direct",
      "created_at": "2024-01-01T00:00:00Z"
    },
    "isNew": true
  }
}
```

#### 3. Get Room Messages
**GET** `/api/v1/chat/get-room-messages?roomId=<uuid>&limit=50&offset=0`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "message-id",
      "content": "Message content (decrypted)",
      "sender_firebase_uid": "sender-uid",
      "status": "sent",
      "created_at": "2024-01-01T00:00:00Z",
      "message_type": "text",
      "metadata": null
    }
  ]
}
```

#### 4. Send Message
**POST** `/api/v1/chat/send-message`

**Request Body:**
```json
{
  "roomId": "room-uuid",
  "senderFirebaseUid": "sender-uid",
  "content": "Message content",
  "messageType": "text", // optional, default: "text"
  "metadata": null // optional
}
```

**Note:** Messages are encrypted before storage. Content is returned unencrypted to the client.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "message-id",
    "content": "Message content",
    "sender_firebase_uid": "sender-uid",
    "status": "sent",
    "created_at": "2024-01-01T00:00:00Z",
    "message_type": "text",
    "metadata": null
  }
}
```

---

### Users

#### 1. Create User
**POST** `/api/v1/users/create-user`

**Request Body:**
```json
{
  "firebase_uid": "firebase-uid",
  "display_name": "User Name",
  "email": "user@example.com",
  "photo_url": "https://...", // optional
  "auth_provider": "firebase" // optional, default: "firebase"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uuid": "user-uuid",
    "firebase_uid": "firebase-uid",
    "display_name": "User Name",
    "email": "user@example.com",
    "photo_url": "https://...",
    "auth_provider": "firebase"
  }
}
```

#### 2. Get User by ID
**GET** `/api/v1/users/get-user-by-id?firebase_uid=<uid>` or `?id=<uid>`

**Response:**
```json
{
  "success": true,
  "data": {
    "uuid": "user-uuid",
    "firebase_uid": "firebase-uid",
    "display_name": "User Name",
    "email": "user@example.com",
    "photo_url": "https://...",
    "phone_number": "+1234567890",
    "location": "City, Country",
    "about": "About text",
    "verified": true,
    "rating": 4.5,
    "review_count": 10
  }
}
```

#### 3. Get User by UUID
**GET** `/api/v1/users/get-user-by-uuid?uuid=<uuid>`

#### 4. Update User
**PUT** `/api/v1/users/update-user`

**Request Body:**
```json
{
  "id": "firebase-uid",
  "updates": {
    "display_name": "New Name",
    "phone_number": "+1234567890",
    "location": "New Location",
    "about": "New about text",
    "languages": ["English", "Spanish"],
    "preferences": { /* JSON object */ },
    "notification_settings": { /* JSON object */ }
  }
}
```

---

### Reviews

#### 1. Create Review
**POST** `/api/v1/reviews/create-review`

**Request Body:**
```json
{
  "offerId": 1,
  "offerUuid": "offer-uuid",
  "reviewType": "tenant_to_landlord", // or "landlord_to_tenant"
  "rating": 5,
  "comment": "Great experience!",
  "reviewerId": "reviewer-firebase-uid",
  "reviewedUserId": "reviewee-firebase-uid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "review": {
      "id": "1",
      "review_uuid": "review-uuid",
      "offer_uuid": "offer-uuid",
      "review_type": "tenant_to_landlord",
      "rating": 5,
      "comment": "Great experience!",
      "reviewer_firebase_uid": "reviewer-uid",
      "reviewee_firebase_uid": "reviewee-uid",
      "property_uuid": "property-uuid",
      "is_public": true,
      "is_verified": false,
      "helpful_count": 0,
      "created_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### 2. Get Reviews by Property
**GET** `/api/v1/reviews/get-reviews-by-property?propertyUuid=<uuid>&reviewType=<type>&limit=50&offset=0`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "reviewUuid": "uuid",
      "reviewerFirebaseUid": "uid",
      "revieweeFirebaseUid": "uid",
      "reviewType": "tenant_to_landlord",
      "rating": 5,
      "comment": "Great!",
      "reviewer": {
        "uuid": "uuid",
        "displayName": "Reviewer Name",
        "email": "reviewer@example.com",
        "photoUrl": "https://..."
      },
      "reviewee": { /* similar structure */ }
    }
  ],
  "total": 10
}
```

#### 3. Get Reviews by User
**GET** `/api/v1/reviews/get-reviews-by-user?userFirebaseUid=<uid>&reviewType=<type>&limit=50&offset=0`

#### 4. Update Review
**PUT** `/api/v1/reviews/update-review`

#### 5. Delete Review
**DELETE** `/api/v1/reviews/delete-review`

#### 6. Mark Helpful
**POST** `/api/v1/reviews/mark-helpful`

---

### Notifications

#### 1. Get Notifications
**GET** `/api/v1/notifications?userFirebaseUid=<uid>&isRead=<true|false>&category=<category>&limit=50&offset=0`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "notification-id",
      "type": "offer_created",
      "title": "New Offer Received",
      "message": "You have received a new offer",
      "recipient_firebase_uid": "uid",
      "sender_firebase_uid": "uid",
      "is_read": false,
      "data": {
        "offer_id": "1",
        "property_title": "Property Title"
      },
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### 2. Mark as Read
**POST** `/api/v1/notifications/mark-read`

**Request Body:**
```json
{
  "notificationId": "notification-id"
}
```

#### 3. Mark All as Read
**POST** `/api/v1/notifications/mark-all-read`

#### 4. Archive Notification
**POST** `/api/v1/notifications/archive`

#### 5. Get Unread Count
**GET** `/api/v1/notifications/unread-count?userFirebaseUid=<uid>`

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

---

### Tenants

#### 1. Get Tenant Profiles
**GET** `/api/v1/tenants?status=active&limit=20&offset=0`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "tenant_uuid": "uuid",
      "user_firebase_uid": "uid",
      "tenant_listing_title": "Looking for 2BR Apartment",
      "tenant_listing_description": "Description...",
      "budget_min": 2000,
      "budget_max": 3000,
      "budget_currency": "HKD",
      "preferred_property_types": ["apartment"],
      "preferred_locations": ["Downtown"],
      "preferred_move_in_date": "2024-01-01",
      "user": {
        "firebase_uid": "uid",
        "display_name": "Tenant Name",
        "photo_url": "https://...",
        "email": "tenant@example.com"
      }
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 50
  }
}
```

#### 2. Get Tenant Profile
**GET** `/api/v1/tenants/profile?userFirebaseUid=<uid>`

---

### Upload

#### 1. Upload Files
**POST** `/api/v1/upload`

**Form Data:**
- `files` (File[]) - Array of files to upload
- `category` (string, default: "images") - File category: "images", "documents", etc.
- `uploadType` (string, default: "direct") - "direct" or "presigned"

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadedFiles": [
      {
        "url": "https://...",
        "key": "path/to/file.jpg",
        "filename": "file.jpg",
        "size": 102400,
        "type": "image/jpeg"
      }
    ],
    "totalFiles": 1,
    "successfulUploads": 1,
    "category": "images",
    "uploadType": "direct"
  }
}
```

#### 2. Generate Presigned URL
**GET** `/api/v1/upload?filename=<name>&category=<category>&contentType=<type>`

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://presigned-url...",
    "key": "path/to/file.jpg",
    "fields": { /* S3 upload fields */ }
  }
}
```

#### 3. Direct S3 Upload
**POST** `/api/v1/upload/s3`

**Form Data:**
- `file` (File) - File to upload
- `category` (string, default: "images") - File category

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://...",
    "key": "path/to/file.jpg",
    "filename": "file.jpg",
    "size": 102400,
    "type": "image/jpeg",
    "uploadedAt": "2024-01-01T00:00:00Z"
  }
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "error": "Error message",
  "details": "Additional error details" // optional
}
```

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request (validation errors, missing parameters)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate resource, business rule violation)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

### Common Error Scenarios

1. **Missing Required Fields**
```json
{
  "error": "property_uuid is required"
}
```

2. **Resource Not Found**
```json
{
  "error": "Property not found"
}
```

3. **Validation Error**
```json
{
  "error": "Rating must be between 1 and 5"
}
```

4. **Rate Limit Exceeded**
```json
{
  "error": "Rate limit exceeded. Please wait a moment before sending more messages."
}
```

---

## Data Models

### Property Model

```typescript
interface Property {
  id: string;
  property_uuid: string;
  title: string;
  description: string;
  address: AddressObject | string;
  rental_price: number;
  rental_price_currency: string;
  num_bedroom: number;
  num_bathroom: number;
  property_type: string; // "apartment", "house", etc.
  rental_space: string; // "entire", "shared", etc.
  furnished: string; // "full", "partial", "non-furnished"
  pets_allowed: boolean;
  amenities: string[];
  display_image: string;
  uploaded_images: string[];
  availability_date: string;
  is_public: boolean;
  status: "draft" | "published" | "archived" | "expired";
  landlord_firebase_uid: string;
  created_at: string;
  updated_at: string;
}
```

### Offer Model

```typescript
interface Offer {
  id: string;
  offer_key: string;
  property_uuid: string;
  initiator_firebase_uid: string;
  recipient_firebase_uid: string;
  proposing_rent_price: number;
  proposing_rent_price_currency: string;
  num_leasing_months: number;
  payment_frequency: string; // "monthly", "quarterly", etc.
  move_in_date: string;
  offer_status: "pending" | "tentatively_accepted" | "accepted" | "rejected" | "countered" | "withdrawn" | "expired" | "completed";
  is_active: boolean;
  current_rent_price?: number;
  current_rent_price_currency?: string;
  current_num_leasing_months?: number;
  current_payment_frequency?: string;
  current_move_in_date?: string;
  negotiation_round: number;
  last_action_by: "initiator" | "recipient";
  last_action_type: string;
  final_rent_price?: number;
  final_rent_price_currency?: string;
  final_num_leasing_months?: number;
  final_payment_frequency?: string;
  final_move_in_date?: string;
  final_accepted_at?: string;
  final_accepted_by?: "initiator" | "recipient";
  review_window_start?: string;
  review_window_end?: string;
  initiator_review_status?: "pending" | "completed";
  recipient_review_status?: "pending" | "completed";
  created_at: string;
  updated_at: string;
}
```

### User Model

```typescript
interface User {
  uuid: string;
  firebase_uid: string;
  display_name: string;
  email: string;
  photo_url?: string;
  auth_provider: string;
  phone_number?: string;
  location?: string;
  about?: string;
  education?: string;
  occupation?: string;
  marital_status?: string;
  languages?: string[];
  verified: boolean;
  rating: number;
  review_count: number;
  response_rate: number;
  preferences?: Record<string, unknown>;
  notification_settings?: Record<string, unknown>;
  privacy_settings?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
```

### Review Model

```typescript
interface Review {
  id: string;
  review_uuid: string;
  offer_uuid: string;
  review_type: "tenant_to_landlord" | "landlord_to_tenant";
  rating: number; // 1-5
  comment: string;
  reviewer_firebase_uid: string;
  reviewee_firebase_uid: string;
  property_uuid: string;
  is_public: boolean;
  is_verified: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}
```

### Chat Message Model

```typescript
interface ChatMessage {
  id: string;
  room_id: string;
  content: string; // Encrypted in storage, decrypted when retrieved
  sender_firebase_uid: string;
  status: "sent" | "delivered" | "read";
  message_type: "text" | "image" | "file" | "system";
  metadata?: Record<string, unknown>;
  created_at: string;
}
```

---

## Implementation Notes

### GraphQL Client Setup

**Server-side (API routes):**
```typescript
// src/app/api/graphql/serverClient.ts
export const executeQuery = async <T = unknown>(
  query: string, 
  variables?: Record<string, unknown>
): Promise<T> => {
  const hasuraEndpoint = process.env.HASURA_ENDPOINT;
  const hasuraAdminSecret = process.env.HASURA_ADMIN_SECRET;
  
  const response = await fetch(hasuraEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': hasuraAdminSecret || '',
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();
  
  if (result.errors && result.errors.length > 0) {
    throw new Error(result.errors[0].message);
  }
  
  return result.data;
};
```

**Client-side:**
```typescript
// src/app/api/graphql/client.ts
export const executeGraphQLRequest = async <T = unknown>(
  query: string, 
  variables?: Record<string, unknown>
): Promise<T> => {
  const response = await fetch('/api/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'GraphQL request failed');
  }
  
  const result = await response.json();
  return result.data;
};
```

### Message Encryption

Chat messages are encrypted before storage using AES encryption. The encryption key should be stored securely in environment variables.

### Rate Limiting

Chat messages have rate limiting: 20 messages per minute per user.

### File Upload Validation

- **Images**: Max 5MB, allowed types: JPEG, PNG, GIF, WebP
- **Documents**: Max 10MB, allowed types: PDF, DOC, DOCX

### Pagination

Most list endpoints support pagination with `limit` and `offset` parameters. Response includes pagination metadata:

```json
{
  "pagination": {
    "total": 100,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

---

## Testing

### Test Endpoints

- `GET /api` - Returns API information and available endpoints
- `GET /api/test-env` - Tests environment variable configuration
- `GET /api/test-hasura` - Tests Hasura connection
- `GET /api/test-s3` - Tests S3 configuration

---

## Support

For implementation questions or issues, refer to:
- API Structure Guide: `/documentation/guides/api-structure.md`
- Database Setup: `/documentation/database/README.md`
- Product Features: `/documentation/product-features/`

---

**Last Updated:** 2024-01-01
**API Version:** 1.0.0

