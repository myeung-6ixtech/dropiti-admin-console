# Dropiti Admin Interface - Product Functionality & API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Admin Roles & Permissions](#admin-roles--permissions)
3. [Product Functionality](#product-functionality)
4. [API Endpoints](#api-endpoints)
   - [Admin Authentication](#admin-authentication)
   - [User Management](#user-management)
   - [Property Management](#property-management)
   - [Offer Management](#offer-management)
   - [Content Moderation](#content-moderation)
   - [Analytics & Reporting](#analytics--reporting)
   - [System Configuration](#system-configuration)
   - [Support & Tickets](#support--tickets)
   - [Audit Logs](#audit-logs)
5. [Data Models](#data-models)
6. [Implementation Guidelines](#implementation-guidelines)

---

## Overview

The Dropiti Admin Interface is a comprehensive administrative platform that enables platform administrators to manage, moderate, and optimize the Dropiti real estate marketplace. The admin system operates as a privileged user with extended permissions to perform platform-wide operations.

### Key Capabilities
- **User Management**: Manage user accounts, verify identities, handle suspensions
- **Property Moderation**: Review, approve, edit, and remove property listings
- **Offer Oversight**: Monitor negotiations, resolve disputes, and intervene when necessary
- **Content Moderation**: Review flagged content, manage reviews, and handle reports
- **Analytics**: Track platform metrics, generate reports, and identify trends
- **System Configuration**: Manage platform settings, policies, and configurations
- **Support Operations**: Handle support tickets, assist users, and resolve issues

### Admin Base Path
- Base Path: `/api/v1/admin`
- All admin endpoints require admin authentication
- Admin actions are logged for audit purposes

---

## Admin Roles & Permissions

### Role Types

#### Super Admin
- Full system access
- Can create/modify admin accounts
- Access to sensitive data and configurations
- Can override any system rule

#### Content Moderator
- Review and moderate property listings
- Manage reviews and comments
- Handle content reports
- Cannot access financial data

#### User Manager
- Manage user accounts
- Verify user identities
- Handle user disputes
- Cannot delete users (only suspend)

#### Support Agent
- View user information
- Access support tickets
- Send system notifications
- Read-only access to most data

#### Analyst
- View analytics and reports
- Export data
- Read-only access to all modules
- Cannot perform moderation actions

### Permission Matrix

| Function | Super Admin | Content Mod | User Manager | Support | Analyst |
|----------|-------------|-------------|--------------|---------|---------|
| User Management | ✓ | ✗ | ✓ | View Only | View Only |
| Property Moderation | ✓ | ✓ | ✗ | View Only | View Only |
| Offer Management | ✓ | ✓ | ✗ | View Only | View Only |
| System Config | ✓ | ✗ | ✗ | ✗ | ✗ |
| Analytics | ✓ | View Only | View Only | View Only | ✓ |
| Audit Logs | ✓ | ✗ | ✗ | ✗ | ✓ |

---

## Product Functionality

### 1. Dashboard & Overview

#### 1.1 Admin Dashboard
- **Real-time Statistics**
  - Total users (landlords, tenants, active, suspended)
  - Active listings count
  - Pending moderation queue count
  - Active offers and negotiation status
  - Revenue metrics (if applicable)
  - Platform health indicators

- **Recent Activity Feed**
  - New user registrations
  - New property listings
  - Completed deals
  - System alerts and warnings

- **Quick Actions**
  - Jump to moderation queue
  - View pending verifications
  - Access support tickets
  - Generate reports

#### 1.2 Activity Monitoring
- Live user activity tracking
- Real-time offer status updates
- Message volume monitoring
- System performance metrics

---

### 2. User Management

#### 2.1 User Search & Browse
- Advanced search by:
  - Email, name, phone number
  - User type (landlord/tenant)
  - Registration date range
  - Verification status
  - Activity status
  - Location

- Filters:
  - Verified/unverified
  - Active/suspended/banned
  - Has active listings
  - Has completed deals

#### 2.2 User Profile Management
- View complete user profiles
- Edit user information
- Update contact details
- Manage user roles (landlord/tenant)
- View user activity history
- Access user's listings and offers

#### 2.3 User Verification
- Identity verification queue
- Document review interface
- Approve/reject verification requests
- Request additional documentation
- Manually verify users
- View verification history

#### 2.4 User Status Management
- Suspend user accounts (temporary)
- Ban users (permanent)
- Reactivate suspended accounts
- Set suspension duration
- Add internal notes about actions taken

#### 2.5 User Analytics
- Individual user performance metrics
- Response rate tracking
- Deal completion rates
- Review scores
- Platform engagement metrics

---

### 3. Property Management

#### 3.1 Property Moderation Queue
- **New Listings Review**
  - Automated flagging system
  - Quality score assessment
  - Image verification
  - Address validation
  - Content compliance check

- **Moderation Actions**
  - Approve listings
  - Request revisions
  - Reject with reason
  - Flag for further review
  - Edit on behalf of landlord

#### 3.2 Property Search & Browse
- Advanced property search
- Filter by status (draft, published, archived, flagged)
- Search by location, price, features
- View by landlord
- Sort by creation date, views, offers

#### 3.3 Property Editing
- Edit any property field
- Update images
- Correct address information
- Modify pricing
- Update amenities
- Change availability status

#### 3.4 Property Status Management
- Force publish/unpublish listings
- Archive old listings
- Feature premium listings
- Mark as verified
- Set expiration dates

#### 3.5 Bulk Operations
- Bulk approve/reject properties
- Mass status updates
- Batch export property data
- Bulk notification to landlords

#### 3.6 Property Analytics
- Listing performance metrics
- View counts and engagement
- Offer conversion rates
- Time-to-deal analytics
- Popular features and amenities

---

### 4. Offer & Negotiation Management

#### 4.1 Offer Monitoring
- View all active negotiations
- Track offer status changes
- Monitor negotiation rounds
- Identify stalled negotiations
- Flag suspicious activity

#### 4.2 Offer Intervention
- Send reminder notifications
- Mediate disputes
- Override offer status (emergency only)
- Cancel fraudulent offers
- Extend negotiation deadlines

#### 4.3 Deal Analytics
- Deal completion rates
- Average negotiation duration
- Price negotiation patterns
- Success factors analysis
- Rejection reason analysis

---

### 5. Content Moderation

#### 5.1 Review Management
- View all reviews (published and flagged)
- Review moderation queue
- Flag inappropriate reviews
- Edit reviews for compliance
- Remove fake or spam reviews
- Verify legitimate reviews

#### 5.2 Chat Moderation
- Access reported chat messages
- View chat room history (with privacy considerations)
- Flag inappropriate conversations
- Ban users for violations
- Export chat logs for legal purposes

#### 5.3 Reported Content Queue
- User-reported properties
- Flagged reviews
- Reported chat messages
- Fake listing reports
- Scam alerts

#### 5.4 Content Policy Enforcement
- Apply content guidelines
- Track policy violations
- Issue warnings to users
- Escalate serious violations
- Maintain policy documentation

---

### 6. Analytics & Reporting

#### 6.1 Platform Analytics
- **User Metrics**
  - User growth over time
  - User retention rates
  - Active vs inactive users
  - User demographics
  - Geographic distribution

- **Listing Metrics**
  - New listings per period
  - Listing quality scores
  - Average time to first offer
  - Listing expiration rates

- **Transaction Metrics**
  - Deals completed
  - Average deal value
  - Negotiation success rates
  - Revenue trends (if applicable)

- **Engagement Metrics**
  - Message volume
  - Response rates
  - Platform usage patterns
  - Feature adoption rates

#### 6.2 Custom Reports
- Generate custom date-range reports
- Export data to CSV/Excel
- Schedule automated reports
- Create data visualizations
- Compare time periods

#### 6.3 Performance Monitoring
- API response times
- Error rates
- System uptime
- Database performance
- S3 storage usage

---

### 7. System Configuration

#### 7.1 Platform Settings
- General platform configurations
- Feature flags (enable/disable features)
- Maintenance mode toggle
- Rate limiting configurations
- File upload limits

#### 7.2 Email & Notification Templates
- Edit system email templates
- Manage notification types
- Configure notification triggers
- Customize messaging
- Multilingual template management

#### 7.3 Policy Management
- Update Terms of Service
- Modify Privacy Policy
- Edit listing guidelines
- Update FAQ content
- Manage cookie policies

#### 7.4 Pricing & Subscription (Future)
- Configure subscription tiers
- Set listing fees
- Manage promotional codes
- Configure payment methods

---

### 8. Support & Ticketing

#### 8.1 Support Ticket System
- View all support tickets
- Ticket categorization
- Priority management
- Assignment to support agents
- Ticket status tracking

#### 8.2 Ticket Management
- Respond to tickets
- Internal notes
- Escalate to higher tier
- Close/resolve tickets
- Track resolution time

#### 8.3 Common Issues Library
- Predefined responses
- FAQ integration
- Solution templates
- Knowledge base articles

#### 8.4 Direct User Contact
- Send system notifications
- Email users directly
- In-app messaging to users
- Broadcast announcements

---

### 9. Audit & Compliance

#### 9.1 Audit Logs
- Track all admin actions
- User modification logs
- Property change history
- System configuration changes
- Security events

#### 9.2 Compliance Reports
- GDPR compliance tools
- Data export requests
- User data deletion logs
- Privacy policy changes
- Legal hold management

#### 9.3 Security Monitoring
- Failed login attempts
- Suspicious activity alerts
- API abuse detection
- Unusual pattern identification

---

## API Endpoints

### Admin Authentication

#### 1. Admin Login
**POST** `/api/v1/admin/auth/login`

**Request Body:**
```json
{
  "email": "admin@dropiti.com",
  "password": "secure-password",
  "twoFactorCode": "123456" // optional, if 2FA enabled
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "adminId": "admin-uuid",
    "email": "admin@dropiti.com",
    "role": "super_admin",
    "token": "jwt-token",
    "expiresAt": "2024-01-01T12:00:00Z",
    "permissions": ["users.manage", "properties.moderate", "system.config"]
  }
}
```

#### 2. Verify Admin Session
**GET** `/api/v1/admin/auth/verify`

#### 3. Admin Logout
**POST** `/api/v1/admin/auth/logout`

#### 4. Refresh Admin Token
**POST** `/api/v1/admin/auth/refresh`

---

### User Management

#### 1. Get All Users
**GET** `/api/v1/admin/users`

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 50, max: 100)
- `search` (string) - Search by name, email, phone
- `userType` (string) - "landlord", "tenant", "both"
- `status` (string) - "active", "suspended", "banned", "pending_verification"
- `verified` (boolean)
- `sortBy` (string) - "created_at", "last_active", "name"
- `sortOrder` (string) - "asc", "desc"
- `dateFrom` (string) - Filter by registration date
- `dateTo` (string)

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "uuid": "user-uuid",
        "firebase_uid": "firebase-uid",
        "display_name": "John Doe",
        "email": "john@example.com",
        "phone_number": "+1234567890",
        "user_type": "landlord",
        "verified": true,
        "status": "active",
        "rating": 4.5,
        "review_count": 12,
        "active_listings_count": 3,
        "completed_deals_count": 5,
        "created_at": "2024-01-01T00:00:00Z",
        "last_active_at": "2024-01-15T10:30:00Z",
        "flags": {
          "has_reports": false,
          "pending_verification": false,
          "suspended": false
        }
      }
    ],
    "pagination": {
      "total": 1250,
      "page": 1,
      "limit": 50,
      "totalPages": 25
    }
  }
}
```

#### 2. Get User Details
**GET** `/api/v1/admin/users/:userId`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "uuid": "user-uuid",
      "firebase_uid": "firebase-uid",
      "display_name": "John Doe",
      "email": "john@example.com",
      "phone_number": "+1234567890",
      "photo_url": "https://...",
      "location": "San Francisco, CA",
      "about": "About text...",
      "verified": true,
      "verification_date": "2024-01-05T00:00:00Z",
      "status": "active",
      "created_at": "2024-01-01T00:00:00Z",
      "last_active_at": "2024-01-15T10:30:00Z"
    },
    "statistics": {
      "properties_listed": 5,
      "active_properties": 3,
      "offers_sent": 10,
      "offers_received": 15,
      "deals_completed": 2,
      "reviews_received": 8,
      "average_rating": 4.5,
      "response_rate": 95,
      "average_response_time": "2 hours"
    },
    "activity": {
      "last_login": "2024-01-15T10:30:00Z",
      "total_messages_sent": 156,
      "properties_viewed": 45,
      "searches_performed": 23
    },
    "moderation": {
      "warnings_received": 0,
      "reports_against": 0,
      "reports_made": 1,
      "suspensions_history": []
    }
  }
}
```

#### 3. Update User
**PUT** `/api/v1/admin/users/:userId`

**Request Body:**
```json
{
  "display_name": "Updated Name",
  "email": "newemail@example.com",
  "phone_number": "+9876543210",
  "verified": true,
  "status": "active",
  "adminNotes": "User verified via phone call"
}
```

#### 4. Verify User
**POST** `/api/v1/admin/users/:userId/verify`

**Request Body:**
```json
{
  "verificationType": "identity", // "identity", "phone", "email", "address"
  "verificationStatus": "approved", // "approved", "rejected", "pending"
  "notes": "ID verified manually",
  "verifiedBy": "admin-uuid"
}
```

#### 5. Suspend User
**POST** `/api/v1/admin/users/:userId/suspend`

**Request Body:**
```json
{
  "reason": "Violation of terms of service",
  "duration": 30, // days, null for indefinite
  "notes": "User posted fake listings",
  "notifyUser": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user-uuid",
    "status": "suspended",
    "suspendedUntil": "2024-02-15T00:00:00Z",
    "reason": "Violation of terms of service",
    "actionTakenBy": "admin-uuid",
    "actionTakenAt": "2024-01-15T00:00:00Z"
  }
}
```

#### 6. Reactivate User
**POST** `/api/v1/admin/users/:userId/reactivate`

**Request Body:**
```json
{
  "notes": "User apologized and agreed to terms",
  "sendWelcomeBackEmail": true
}
```

#### 7. Ban User (Permanent)
**POST** `/api/v1/admin/users/:userId/ban`

**Request Body:**
```json
{
  "reason": "Fraudulent activity",
  "notes": "Multiple fake listings and scam attempts",
  "permanent": true,
  "deleteUserData": false // GDPR consideration
}
```

#### 8. Get User Activity Log
**GET** `/api/v1/admin/users/:userId/activity`

**Query Parameters:**
- `limit` (number)
- `offset` (number)
- `activityType` (string) - "login", "listing", "offer", "message", "review"
- `dateFrom` (string)
- `dateTo` (string)

#### 9. Export User Data (GDPR)
**GET** `/api/v1/admin/users/:userId/export`

**Response:** ZIP file with all user data

#### 10. Delete User Data (GDPR)
**DELETE** `/api/v1/admin/users/:userId/data`

**Request Body:**
```json
{
  "confirmDeletion": true,
  "reason": "User requested data deletion",
  "retentionOverride": false // For legal holds
}
```

#### 11. Bulk User Actions
**POST** `/api/v1/admin/users/bulk`

**Request Body:**
```json
{
  "action": "suspend", // "suspend", "reactivate", "verify", "send_notification"
  "userIds": ["uuid1", "uuid2", "uuid3"],
  "params": {
    "reason": "Bulk suspension reason",
    "duration": 7
  }
}
```

---

### Property Management

#### 1. Get All Properties (Admin View)
**GET** `/api/v1/admin/properties`

**Query Parameters:**
- `page` (number)
- `limit` (number)
- `status` (string) - "pending_review", "published", "rejected", "flagged", "archived"
- `search` (string)
- `landlordId` (string)
- `location` (string)
- `priceMin` (number)
- `priceMax` (number)
- `flagged` (boolean)
- `sortBy` (string) - "created_at", "updated_at", "views", "offers"
- `dateFrom` (string)
- `dateTo` (string)

**Response:**
```json
{
  "success": true,
  "data": {
    "properties": [
      {
        "id": "1",
        "property_uuid": "uuid",
        "title": "Modern Apartment",
        "location": "Downtown, SF",
        "rental_price": 2500,
        "status": "published",
        "landlord": {
          "firebase_uid": "landlord-uid",
          "display_name": "Landlord Name",
          "verified": true
        },
        "moderation": {
          "quality_score": 85,
          "flagged": false,
          "flag_reasons": [],
          "reviewed_by": "admin-uuid",
          "reviewed_at": "2024-01-10T00:00:00Z"
        },
        "analytics": {
          "views": 245,
          "offers_received": 12,
          "days_active": 15
        },
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 500,
      "page": 1,
      "limit": 50,
      "totalPages": 10
    },
    "summary": {
      "pending_review": 25,
      "flagged": 8,
      "total_active": 450
    }
  }
}
```

#### 2. Get Property Details (Admin)
**GET** `/api/v1/admin/properties/:propertyUuid`

**Response:**
```json
{
  "success": true,
  "data": {
    "property": { /* full property object */ },
    "landlord": { /* landlord details */ },
    "moderation": {
      "status": "approved",
      "quality_score": 85,
      "automated_checks": {
        "images_verified": true,
        "address_validated": true,
        "price_reasonable": true,
        "content_appropriate": true
      },
      "manual_review": {
        "reviewed_by": "admin-uuid",
        "reviewed_at": "2024-01-10T00:00:00Z",
        "notes": "Property verified in person"
      },
      "flags": [],
      "reports": []
    },
    "analytics": {
      "views": 245,
      "unique_viewers": 180,
      "offers_received": 12,
      "messages_received": 34,
      "average_response_time": "3 hours",
      "conversion_rate": 4.9
    },
    "history": [
      {
        "action": "created",
        "performed_by": "landlord-uid",
        "timestamp": "2024-01-01T00:00:00Z"
      },
      {
        "action": "reviewed",
        "performed_by": "admin-uuid",
        "timestamp": "2024-01-02T00:00:00Z",
        "notes": "Approved after verification"
      }
    ]
  }
}
```

#### 3. Approve Property
**POST** `/api/v1/admin/properties/:propertyUuid/approve`

**Request Body:**
```json
{
  "notes": "Property verified and approved",
  "featured": false, // Mark as featured listing
  "qualityScore": 90,
  "notifyLandlord": true
}
```

#### 4. Reject Property
**POST** `/api/v1/admin/properties/:propertyUuid/reject`

**Request Body:**
```json
{
  "reason": "incomplete_information", // predefined reason codes
  "detailedReason": "Missing clear images of bathroom",
  "allowResubmission": true,
  "suggestions": [
    "Add more photos",
    "Provide detailed description",
    "Verify address"
  ],
  "notifyLandlord": true
}
```

#### 5. Flag Property
**POST** `/api/v1/admin/properties/:propertyUuid/flag`

**Request Body:**
```json
{
  "flagType": "suspicious", // "suspicious", "fake", "inappropriate", "spam"
  "reason": "Property images appear to be stock photos",
  "severity": "high", // "low", "medium", "high"
  "autoUnpublish": true,
  "requiresReview": true
}
```

#### 6. Edit Property (Admin)
**PUT** `/api/v1/admin/properties/:propertyUuid`

**Request Body:**
```json
{
  "updates": {
    "title": "Corrected Title",
    "description": "Updated description",
    "rental_price": 2600,
    "status": "published"
  },
  "reason": "Corrected pricing error reported by user",
  "notifyLandlord": true
}
```

#### 7. Feature Property
**POST** `/api/v1/admin/properties/:propertyUuid/feature`

**Request Body:**
```json
{
  "featured": true,
  "featureUntil": "2024-02-01T00:00:00Z",
  "placement": "homepage_top", // "homepage_top", "category_featured", "search_boost"
  "notes": "Partnership agreement with landlord"
}
```

#### 8. Bulk Property Actions
**POST** `/api/v1/admin/properties/bulk`

**Request Body:**
```json
{
  "action": "approve", // "approve", "reject", "flag", "archive"
  "propertyUuids": ["uuid1", "uuid2", "uuid3"],
  "params": {
    "reason": "Batch approval after manual review",
    "notifyLandlords": true
  }
}
```

#### 9. Get Moderation Queue
**GET** `/api/v1/admin/properties/moderation-queue`

**Query Parameters:**
- `priority` (string) - "high", "medium", "low"
- `age` (number) - Days waiting for review
- `limit` (number)

**Response:**
```json
{
  "success": true,
  "data": {
    "queue": [
      {
        "property_uuid": "uuid",
        "title": "Property Title",
        "landlord": { /* landlord info */ },
        "submitted_at": "2024-01-15T08:00:00Z",
        "waiting_time_hours": 12,
        "priority": "high",
        "automated_flags": ["price_unusual", "images_low_quality"],
        "quality_score": 65
      }
    ],
    "stats": {
      "total_pending": 25,
      "high_priority": 5,
      "average_wait_time_hours": 18
    }
  }
}
```

#### 10. Get Property Reports
**GET** `/api/v1/admin/properties/:propertyUuid/reports`

**Response:**
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": "report-uuid",
        "reported_by": "user-uuid",
        "report_type": "fake_listing",
        "description": "This property doesn't exist at this address",
        "evidence": ["url1", "url2"],
        "status": "open", // "open", "investigating", "resolved", "dismissed"
        "created_at": "2024-01-14T00:00:00Z"
      }
    ]
  }
}
```

---

### Offer Management

#### 1. Get All Offers (Admin)
**GET** `/api/v1/admin/offers`

**Query Parameters:**
- `status` (string) - "pending", "accepted", "rejected", "countered", "expired"
- `propertyUuid` (string)
- `initiatorUid` (string)
- `recipientUid` (string)
- `dateFrom` (string)
- `dateTo` (string)
- `minValue` (number)
- `maxValue` (number)
- `flagged` (boolean)
- `limit` (number)
- `offset` (number)

**Response:**
```json
{
  "success": true,
  "data": {
    "offers": [
      {
        "id": "1",
        "offer_key": "offer_123",
        "property": {
          "uuid": "property-uuid",
          "title": "Property Title"
        },
        "initiator": {
          "firebase_uid": "tenant-uid",
          "display_name": "Tenant Name"
        },
        "recipient": {
          "firebase_uid": "landlord-uid",
          "display_name": "Landlord Name"
        },
        "proposing_rent_price": 2500,
        "offer_status": "pending",
        "negotiation_round": 3,
        "created_at": "2024-01-10T00:00:00Z",
        "last_activity": "2024-01-12T00:00:00Z",
        "flags": {
          "stalled": true,
          "unusual_activity": false
        }
      }
    ],
    "pagination": {
      "total": 350,
      "limit": 50,
      "offset": 0
    },
    "summary": {
      "active_negotiations": 125,
      "stalled_over_3_days": 15,
      "completed_this_month": 45
    }
  }
}
```

#### 2. Get Offer Details (Admin)
**GET** `/api/v1/admin/offers/:offerId`

**Response:**
```json
{
  "success": true,
  "data": {
    "offer": { /* full offer object */ },
    "property": { /* property details */ },
    "initiator": { /* initiator details */ },
    "recipient": { /* recipient details */ },
    "negotiation_history": [
      {
        "action": "offer_created",
        "performed_by": "initiator",
        "rent_price": 2300,
        "timestamp": "2024-01-10T00:00:00Z"
      },
      {
        "action": "counter_offer",
        "performed_by": "recipient",
        "rent_price": 2500,
        "timestamp": "2024-01-11T00:00:00Z"
      }
    ],
    "analytics": {
      "response_times": {
        "initiator_avg": "4 hours",
        "recipient_avg": "12 hours"
      },
      "negotiation_duration": "3 days"
    },
    "flags": []
  }
}
```

#### 3. Send Offer Reminder
**POST** `/api/v1/admin/offers/:offerId/remind`

**Request Body:**
```json
{
  "recipientType": "recipient", // "initiator" or "recipient"
  "message": "Please respond to the pending offer",
  "notificationMethod": "email" // "email", "in_app", "both"
}
```

#### 4. Flag Offer
**POST** `/api/v1/admin/offers/:offerId/flag`

**Request Body:**
```json
{
  "flagType": "suspicious", // "suspicious", "fraudulent", "spam"
  "reason": "Unusual pricing patterns",
  "action": "monitor", // "monitor", "freeze", "cancel"
  "notifyParties": false
}
```

#### 5. Cancel Offer (Admin Override)
**POST** `/api/v1/admin/offers/:offerId/cancel`

**Request Body:**
```json
{
  "reason": "Fraudulent activity detected",
  "notifyInitiator": true,
  "notifyRecipient": true,
  "refundIfPaid": true // if payment was involved
}
```

#### 6. Get Stalled Negotiations
**GET** `/api/v1/admin/offers/stalled`

**Query Parameters:**
- `daysSinceLastActivity` (number, default: 3)
- `limit` (number)

---

### Content Moderation

#### 1. Get Review Moderation Queue
**GET** `/api/v1/admin/reviews/moderation-queue`

**Query Parameters:**
- `status` (string) - "pending", "flagged", "approved", "rejected"
- `limit` (number)
- `offset` (number)

**Response:**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "review-id",
        "review_uuid": "review-uuid",
        "rating": 1,
        "comment": "Review text...",
        "reviewer": {
          "firebase_uid": "reviewer-uid",
          "display_name": "Reviewer Name"
        },
        "reviewee": {
          "firebase_uid": "reviewee-uid",
          "display_name": "Reviewee Name"
        },
        "property": {
          "uuid": "property-uuid",
          "title": "Property Title"
        },
        "flags": {
          "inappropriate_language": true,
          "personal_info_shared": false,
          "spam": false
        },
        "automated_sentiment": "negative",
        "created_at": "2024-01-14T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 45,
      "limit": 20,
      "offset": 0
    }
  }
}
```

#### 2. Approve Review
**POST** `/api/v1/admin/reviews/:reviewUuid/approve`

**Request Body:**
```json
{
  "verified": true, // Mark as verified review
  "notes": "Review verified as legitimate"
}
```

#### 3. Reject/Remove Review
**POST** `/api/v1/admin/reviews/:reviewUuid/reject`

**Request Body:**
```json
{
  "reason": "inappropriate_content", // predefined reasons
  "detailedReason": "Contains personal attacks",
  "notifyReviewer": true,
  "allowAppeal": true
}
```

#### 4. Edit Review (Admin)
**PUT** `/api/v1/admin/reviews/:reviewUuid`

**Request Body:**
```json
{
  "comment": "Edited review text (removed inappropriate content)",
  "editReason": "Removed personal information",
  "notifyReviewer": true,
  "markAsEdited": true
}
```

#### 5. Get Reported Content
**GET** `/api/v1/admin/reports`

**Query Parameters:**
- `contentType` (string) - "property", "review", "user", "chat"
- `status` (string) - "open", "investigating", "resolved", "dismissed"
- `severity` (string) - "low", "medium", "high", "critical"
- `limit` (number)
- `offset` (number)

**Response:**
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": "report-uuid",
        "report_type": "inappropriate_content",
        "content_type": "property",
        "content_id": "property-uuid",
        "reported_by": {
          "firebase_uid": "reporter-uid",
          "display_name": "Reporter Name"
        },
        "description": "Fake listing with stock photos",
        "evidence_urls": ["url1", "url2"],
        "status": "open",
        "severity": "high",
        "assigned_to": "admin-uuid",
        "created_at": "2024-01-14T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 23,
      "limit": 20,
      "offset": 0
    },
    "summary": {
      "open": 15,
      "investigating": 5,
      "resolved_today": 8
    }
  }
}
```

#### 6. Update Report Status
**PUT** `/api/v1/admin/reports/:reportId`

**Request Body:**
```json
{
  "status": "investigating", // "open", "investigating", "resolved", "dismissed"
  "assignedTo": "admin-uuid",
  "notes": "Investigation started, contacted property owner",
  "actions_taken": ["contacted_user", "flagged_content"],
  "resolution": null // Add when resolving
}
```

#### 7. Resolve Report
**POST** `/api/v1/admin/reports/:reportId/resolve`

**Request Body:**
```json
{
  "resolution": "Property removed for violating listing guidelines",
  "actionTaken": "content_removed",
  "notifyReporter": true,
  "closeRelatedReports": true
}
```

---

### Analytics & Reporting

#### 1. Get Dashboard Statistics
**GET** `/api/v1/admin/analytics/dashboard`

**Query Parameters:**
- `period` (string) - "today", "week", "month", "year", "custom"
- `dateFrom` (string) - For custom period
- `dateTo` (string) - For custom period

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 12500,
      "new_this_period": 250,
      "active": 3200,
      "growth_rate": 8.5,
      "landlords": 4200,
      "tenants": 8300
    },
    "properties": {
      "total": 5600,
      "active": 4200,
      "pending_review": 25,
      "new_this_period": 120,
      "archived": 1400
    },
    "offers": {
      "total": 18500,
      "active": 450,
      "completed_this_period": 89,
      "average_negotiation_days": 4.2,
      "success_rate": 42.5
    },
    "engagement": {
      "daily_active_users": 2100,
      "messages_sent_today": 5600,
      "searches_today": 12500,
      "average_session_duration": "12 minutes"
    },
    "moderation": {
      "pending_reviews": 25,
      "open_reports": 15,
      "flagged_content": 8
    }
  }
}
```

#### 2. Get User Analytics
**GET** `/api/v1/admin/analytics/users`

**Query Parameters:**
- `period` (string)
- `groupBy` (string) - "day", "week", "month"
- `metric` (string) - "registrations", "activity", "retention"

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "total_users": 12500,
      "new_users": [
        { "date": "2024-01-01", "count": 45 },
        { "date": "2024-01-02", "count": 52 }
      ],
      "active_users": [
        { "date": "2024-01-01", "count": 3200 },
        { "date": "2024-01-02", "count": 3450 }
      ],
      "retention_rate": {
        "day_1": 75,
        "day_7": 55,
        "day_30": 42
      },
      "user_demographics": {
        "by_location": {
          "San Francisco": 3200,
          "Los Angeles": 2800
        },
        "by_type": {
          "landlord": 4200,
          "tenant": 8300
        }
      }
    }
  }
}
```

#### 3. Get Property Analytics
**GET** `/api/v1/admin/analytics/properties`

**Query Parameters:**
- `period` (string)
- `groupBy` (string)

**Response:**
```json
{
  "success": true,
  "data": {
    "listings": {
      "total": 5600,
      "new_listings": [
        { "date": "2024-01-01", "count": 12 }
      ],
      "average_price": 2450,
      "price_distribution": {
        "0-1000": 120,
        "1000-2000": 850,
        "2000-3000": 2100,
        "3000+": 2530
      },
      "by_type": {
        "apartment": 3200,
        "house": 1800,
        "studio": 600
      },
      "by_location": {
        "Downtown": 1200,
        "Suburbs": 2400
      },
      "average_time_to_deal": "18 days",
      "conversion_rate": 15.5
    }
  }
}
```

#### 4. Get Transaction Analytics
**GET** `/api/v1/admin/analytics/transactions`

**Response:**
```json
{
  "success": true,
  "data": {
    "deals": {
      "total_completed": 2300,
      "this_period": 89,
      "total_value": 5600000,
      "average_deal_value": 2435,
      "by_month": [
        {
          "month": "2024-01",
          "count": 89,
          "total_value": 216715
        }
      ],
      "negotiation_stats": {
        "average_rounds": 2.8,
        "average_duration_days": 4.2,
        "success_rate": 42.5,
        "average_price_change": -8.5
      }
    }
  }
}
```

#### 5. Get Platform Performance
**GET** `/api/v1/admin/analytics/performance`

**Response:**
```json
{
  "success": true,
  "data": {
    "api": {
      "average_response_time_ms": 145,
      "error_rate": 0.08,
      "requests_per_minute": 850,
      "slowest_endpoints": [
        {
          "endpoint": "/api/v1/properties/get-listings",
          "avg_time_ms": 320
        }
      ]
    },
    "database": {
      "connection_pool_usage": 45,
      "slow_queries": 3,
      "average_query_time_ms": 25
    },
    "storage": {
      "total_size_gb": 125.5,
      "images_count": 45000,
      "monthly_upload_gb": 12.3
    },
    "system": {
      "uptime": "99.97%",
      "last_downtime": "2024-01-05T02:00:00Z"
    }
  }
}
```

#### 6. Export Analytics Report
**POST** `/api/v1/admin/analytics/export`

**Request Body:**
```json
{
  "reportType": "comprehensive", // "users", "properties", "transactions", "comprehensive"
  "period": "month",
  "dateFrom": "2024-01-01",
  "dateTo": "2024-01-31",
  "format": "csv", // "csv", "excel", "pdf"
  "includeCharts": true,
  "email": "admin@dropiti.com" // Email report when ready
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "exportId": "export-uuid",
    "status": "processing",
    "estimatedTime": "2 minutes",
    "downloadUrl": null // Provided when ready
  }
}
```

#### 7. Get Custom Report
**POST** `/api/v1/admin/analytics/custom-report`

**Request Body:**
```json
{
  "reportName": "High-Value Properties Performance",
  "filters": {
    "priceMin": 5000,
    "dateFrom": "2024-01-01"
  },
  "metrics": ["views", "offers", "time_to_deal"],
  "groupBy": "location",
  "visualization": "bar_chart"
}
```

---

### System Configuration

#### 1. Get Platform Settings
**GET** `/api/v1/admin/settings`

**Response:**
```json
{
  "success": true,
  "data": {
    "general": {
      "platform_name": "Dropiti",
      "maintenance_mode": false,
      "allow_registrations": true,
      "allow_guest_browsing": true
    },
    "features": {
      "chat_enabled": true,
      "offers_enabled": true,
      "reviews_enabled": true,
      "tenant_marketplace_enabled": true,
      "advanced_search_enabled": true
    },
    "moderation": {
      "auto_approve_verified_users": true,
      "require_property_review": true,
      "min_quality_score": 70,
      "auto_flag_low_score": true
    },
    "limits": {
      "max_properties_per_user": 50,
      "max_images_per_property": 20,
      "max_message_length": 5000,
      "rate_limit_messages": 20
    },
    "uploads": {
      "max_image_size_mb": 5,
      "max_document_size_mb": 10,
      "allowed_image_types": ["jpg", "jpeg", "png", "webp"],
      "allowed_document_types": ["pdf", "doc", "docx"]
    }
  }
}
```

#### 2. Update Platform Settings
**PUT** `/api/v1/admin/settings`

**Request Body:**
```json
{
  "general": {
    "maintenance_mode": true
  },
  "features": {
    "chat_enabled": true
  },
  "reason": "Enabling maintenance mode for database migration",
  "notifyUsers": true
}
```

#### 3. Get Feature Flags
**GET** `/api/v1/admin/feature-flags`

**Response:**
```json
{
  "success": true,
  "data": {
    "flags": [
      {
        "key": "new_search_algorithm",
        "name": "New Search Algorithm",
        "description": "Use ML-based search ranking",
        "enabled": false,
        "rollout_percentage": 10, // Gradual rollout
        "target_users": ["beta_testers"],
        "created_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

#### 4. Toggle Feature Flag
**POST** `/api/v1/admin/feature-flags/:flagKey/toggle`

**Request Body:**
```json
{
  "enabled": true,
  "rollout_percentage": 25,
  "target_users": ["beta_testers", "premium_users"]
}
```

#### 5. Get Email Templates
**GET** `/api/v1/admin/email-templates`

**Response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "welcome_email",
        "name": "Welcome Email",
        "subject": "Welcome to Dropiti!",
        "content": "HTML template content...",
        "variables": ["user_name", "verification_link"],
        "languages": ["en", "zh-HK"],
        "last_updated": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

#### 6. Update Email Template
**PUT** `/api/v1/admin/email-templates/:templateId`

**Request Body:**
```json
{
  "subject": "Updated subject",
  "content": "HTML content...",
  "language": "en",
  "testEmail": "admin@dropiti.com" // Send test email
}
```

---

### Support & Tickets

#### 1. Get Support Tickets
**GET** `/api/v1/admin/support/tickets`

**Query Parameters:**
- `status` (string) - "open", "in_progress", "resolved", "closed"
- `priority` (string) - "low", "medium", "high", "urgent"
- `category` (string) - "account", "property", "payment", "technical", "other"
- `assignedTo` (string) - Admin UUID
- `limit` (number)
- `offset` (number)

**Response:**
```json
{
  "success": true,
  "data": {
    "tickets": [
      {
        "id": "ticket-uuid",
        "ticket_number": "DRP-12345",
        "subject": "Cannot upload property images",
        "category": "technical",
        "priority": "high",
        "status": "open",
        "user": {
          "firebase_uid": "user-uid",
          "display_name": "User Name",
          "email": "user@example.com"
        },
        "assigned_to": {
          "admin_id": "admin-uuid",
          "display_name": "Admin Name"
        },
        "created_at": "2024-01-14T10:30:00Z",
        "last_updated": "2024-01-14T11:00:00Z",
        "response_count": 2,
        "sla_breach": false
      }
    ],
    "pagination": {
      "total": 125,
      "limit": 50,
      "offset": 0
    },
    "summary": {
      "open": 45,
      "in_progress": 30,
      "urgent": 5,
      "overdue": 3
    }
  }
}
```

#### 2. Get Ticket Details
**GET** `/api/v1/admin/support/tickets/:ticketId`

**Response:**
```json
{
  "success": true,
  "data": {
    "ticket": {
      "id": "ticket-uuid",
      "ticket_number": "DRP-12345",
      "subject": "Cannot upload property images",
      "description": "When I try to upload images...",
      "category": "technical",
      "priority": "high",
      "status": "open",
      "user": { /* user details */ },
      "assigned_to": { /* admin details */ },
      "created_at": "2024-01-14T10:30:00Z",
      "last_updated": "2024-01-14T11:00:00Z"
    },
    "messages": [
      {
        "id": "message-uuid",
        "content": "Initial message...",
        "sender_type": "user",
        "sender": { /* user or admin details */ },
        "attachments": ["url1"],
        "created_at": "2024-01-14T10:30:00Z"
      },
      {
        "id": "message-uuid-2",
        "content": "Admin response...",
        "sender_type": "admin",
        "sender": { /* admin details */ },
        "created_at": "2024-01-14T11:00:00Z",
        "internal_note": false
      }
    ],
    "internal_notes": [
      {
        "id": "note-uuid",
        "content": "Reproduced issue in staging",
        "author": { /* admin details */ },
        "created_at": "2024-01-14T10:45:00Z"
      }
    ],
    "activity_log": [
      {
        "action": "ticket_created",
        "performed_by": "user-uid",
        "timestamp": "2024-01-14T10:30:00Z"
      },
      {
        "action": "assigned",
        "assigned_to": "admin-uuid",
        "performed_by": "admin-uuid-2",
        "timestamp": "2024-01-14T10:35:00Z"
      }
    ]
  }
}
```

#### 3. Create Support Ticket (On Behalf of User)
**POST** `/api/v1/admin/support/tickets`

**Request Body:**
```json
{
  "userFirebaseUid": "user-uid",
  "subject": "Ticket subject",
  "description": "Ticket description...",
  "category": "account",
  "priority": "medium",
  "assignTo": "admin-uuid", // optional
  "notifyUser": true
}
```

#### 4. Update Ticket
**PUT** `/api/v1/admin/support/tickets/:ticketId`

**Request Body:**
```json
{
  "status": "in_progress",
  "priority": "high",
  "assignedTo": "admin-uuid",
  "category": "technical"
}
```

#### 5. Reply to Ticket
**POST** `/api/v1/admin/support/tickets/:ticketId/reply`

**Request Body:**
```json
{
  "content": "Admin response message...",
  "notifyUser": true,
  "attachments": ["url1", "url2"], // optional
  "closeTicket": false, // Auto-close after reply
  "cannedResponseId": "response-id" // optional, use predefined response
}
```

#### 6. Add Internal Note
**POST** `/api/v1/admin/support/tickets/:ticketId/notes`

**Request Body:**
```json
{
  "content": "Internal note not visible to user...",
  "author": "admin-uuid"
}
```

#### 7. Assign Ticket
**POST** `/api/v1/admin/support/tickets/:ticketId/assign`

**Request Body:**
```json
{
  "assignTo": "admin-uuid",
  "notifyAssignee": true,
  "notes": "Assigning to specialist"
}
```

#### 8. Close Ticket
**POST** `/api/v1/admin/support/tickets/:ticketId/close`

**Request Body:**
```json
{
  "resolution": "Issue resolved by updating browser",
  "notifyUser": true,
  "satisfaction_survey": true // Send satisfaction survey
}
```

#### 9. Get Canned Responses
**GET** `/api/v1/admin/support/canned-responses`

**Response:**
```json
{
  "success": true,
  "data": {
    "responses": [
      {
        "id": "response-uuid",
        "title": "Image Upload Troubleshooting",
        "content": "Thank you for contacting us. Please try...",
        "category": "technical",
        "usage_count": 45,
        "last_used": "2024-01-14T00:00:00Z"
      }
    ]
  }
}
```

---

### Audit Logs

#### 1. Get Audit Logs
**GET** `/api/v1/admin/audit-logs`

**Query Parameters:**
- `adminId` (string) - Filter by admin who performed action
- `action` (string) - Filter by action type
- `resourceType` (string) - "user", "property", "offer", "review", "system"
- `resourceId` (string) - Filter by specific resource
- `dateFrom` (string)
- `dateTo` (string)
- `limit` (number)
- `offset` (number)

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "log-uuid",
        "timestamp": "2024-01-14T10:30:00Z",
        "admin": {
          "id": "admin-uuid",
          "email": "admin@dropiti.com",
          "display_name": "Admin Name"
        },
        "action": "user_suspended",
        "resource_type": "user",
        "resource_id": "user-uuid",
        "details": {
          "reason": "Violation of terms",
          "duration_days": 30
        },
        "ip_address": "192.168.1.1",
        "user_agent": "Mozilla/5.0..."
      }
    ],
    "pagination": {
      "total": 5000,
      "limit": 50,
      "offset": 0
    }
  }
}
```

#### 2. Export Audit Logs
**GET** `/api/v1/admin/audit-logs/export`

**Query Parameters:**
- Same as Get Audit Logs
- `format` (string) - "csv", "json"

#### 3. Get Admin Activity
**GET** `/api/v1/admin/audit-logs/admin/:adminId`

**Response:**
```json
{
  "success": true,
  "data": {
    "admin": { /* admin details */ },
    "statistics": {
      "total_actions": 1250,
      "actions_this_week": 85,
      "most_common_action": "property_approved",
      "last_login": "2024-01-14T08:00:00Z"
    },
    "recent_actions": [ /* array of audit log entries */ ]
  }
}
```

---

## Data Models

### Admin User Model

```typescript
interface AdminUser {
  admin_id: string;
  email: string;
  display_name: string;
  role: "super_admin" | "content_moderator" | "user_manager" | "support_agent" | "analyst";
  permissions: string[];
  status: "active" | "suspended" | "inactive";
  two_factor_enabled: boolean;
  last_login: string;
  created_at: string;
  created_by: string;
}
```

### Moderation Record Model

```typescript
interface ModerationRecord {
  id: string;
  content_type: "property" | "review" | "user" | "chat";
  content_id: string;
  action: "approved" | "rejected" | "flagged" | "edited" | "removed";
  moderator_id: string;
  reason?: string;
  notes?: string;
  automated: boolean;
  quality_score?: number;
  created_at: string;
}
```

### Report Model

```typescript
interface Report {
  id: string;
  report_type: "fake_listing" | "inappropriate_content" | "scam" | "harassment" | "spam" | "other";
  content_type: "property" | "review" | "user" | "chat";
  content_id: string;
  reported_by: string;
  description: string;
  evidence_urls?: string[];
  status: "open" | "investigating" | "resolved" | "dismissed";
  severity: "low" | "medium" | "high" | "critical";
  assigned_to?: string;
  resolution?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}
```

### Support Ticket Model

```typescript
interface SupportTicket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  category: "account" | "property" | "payment" | "technical" | "other";
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "waiting_user" | "resolved" | "closed";
  user_firebase_uid: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  sla_due_at?: string;
}
```

### Audit Log Model

```typescript
interface AuditLog {
  id: string;
  timestamp: string;
  admin_id: string;
  action: string;
  resource_type: "user" | "property" | "offer" | "review" | "system" | "settings";
  resource_id: string;
  details: Record<string, unknown>;
  ip_address: string;
  user_agent: string;
  success: boolean;
  error_message?: string;
}
```

---

## Implementation Guidelines

### 1. Authentication & Authorization

**Admin Authentication Flow:**
1. Admin logs in with email/password
2. Two-factor authentication (mandatory for Super Admin)
3. JWT token issued with role and permissions
4. Token refresh mechanism
5. Activity monitoring

**Permission Checks:**
```typescript
// Middleware example
const requirePermission = (permission: string) => {
  return async (req, res, next) => {
    const admin = req.admin; // From JWT token
    
    if (!admin.permissions.includes(permission) && admin.role !== 'super_admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Usage
app.post('/api/v1/admin/users/:id/suspend', 
  authenticate,
  requirePermission('users.manage'),
  suspendUserHandler
);
```

### 2. Audit Logging

**All admin actions must be logged:**
```typescript
const logAdminAction = async (action: AuditLog) => {
  await executeQuery(`
    INSERT INTO admin_audit_logs (
      admin_id, action, resource_type, resource_id, 
      details, ip_address, user_agent
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [
    action.admin_id,
    action.action,
    action.resource_type,
    action.resource_id,
    JSON.stringify(action.details),
    action.ip_address,
    action.user_agent
  ]);
};
```

### 3. Rate Limiting

**Protect admin endpoints:**
- Read operations: 100 requests/minute
- Write operations: 30 requests/minute
- Bulk operations: 10 requests/minute
- Export operations: 5 requests/hour

### 4. Data Privacy

**GDPR Compliance:**
- Mask sensitive user data in audit logs
- Implement data retention policies
- Provide data export functionality
- Honor data deletion requests
- Maintain consent records

**Encryption:**
- Encrypt sensitive fields in database
- Use HTTPS for all API communication
- Encrypt exported data files
- Secure admin session tokens

### 5. Notifications

**Admin Action Notifications:**
```typescript
interface AdminNotificationConfig {
  action: string;
  notifyUser: boolean;
  notifyAdmin: boolean;
  emailTemplate: string;
  inAppNotification: boolean;
}
```

**Example:**
- User suspended → Notify user via email
- Property rejected → Notify landlord with reason
- Ticket replied → Notify user via email and in-app
- System alert → Notify all Super Admins

### 6. Error Handling

**Admin-Specific Error Codes:**
- `ADMIN_401` - Unauthorized (not logged in)
- `ADMIN_403` - Forbidden (insufficient permissions)
- `ADMIN_404` - Resource not found
- `ADMIN_409` - Conflict (e.g., cannot delete user with active offers)
- `ADMIN_422` - Validation error
- `ADMIN_429` - Rate limit exceeded

### 7. Database Schema Additions

**Required Tables:**
```sql
-- Admin users table
CREATE TABLE admin_users (
  admin_id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  role VARCHAR(50) NOT NULL,
  permissions JSONB,
  two_factor_secret VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(admin_id)
);

-- Moderation records table
CREATE TABLE moderation_records (
  id UUID PRIMARY KEY,
  content_type VARCHAR(50) NOT NULL,
  content_id VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL,
  moderator_id UUID REFERENCES admin_users(admin_id),
  reason TEXT,
  notes TEXT,
  automated BOOLEAN DEFAULT FALSE,
  quality_score INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY,
  report_type VARCHAR(50) NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  content_id VARCHAR(255) NOT NULL,
  reported_by VARCHAR(255) NOT NULL,
  description TEXT,
  evidence_urls JSONB,
  status VARCHAR(50) DEFAULT 'open',
  severity VARCHAR(50),
  assigned_to UUID REFERENCES admin_users(admin_id),
  resolution TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- Support tickets table
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY,
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  priority VARCHAR(50),
  status VARCHAR(50) DEFAULT 'open',
  user_firebase_uid VARCHAR(255) NOT NULL,
  assigned_to UUID REFERENCES admin_users(admin_id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  sla_due_at TIMESTAMP
);

-- Audit logs table
CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT NOW(),
  admin_id UUID REFERENCES admin_users(admin_id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id VARCHAR(255),
  details JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT
);
```

### 8. Security Best Practices

1. **Use separate authentication for admin**
   - Different session management
   - Stronger password requirements
   - Mandatory 2FA for privileged roles

2. **IP Whitelisting (Optional)**
   - Restrict admin access to known IPs
   - VPN requirement for remote access

3. **Session Management**
   - Shorter session timeouts (15 minutes)
   - Require re-authentication for sensitive actions
   - Single session per admin (prevent session sharing)

4. **Action Confirmation**
   - Require confirmation for destructive actions
   - Display impact preview before execution
   - Implement undo capability where possible

5. **Monitoring & Alerts**
   - Alert on suspicious admin activity
   - Monitor failed login attempts
   - Track unusual bulk operations

---

## Next Steps

### Phase 1: Core Admin Functions (MVP)
- [ ] Admin authentication system
- [ ] User management (view, search, suspend)
- [ ] Property moderation queue
- [ ] Basic analytics dashboard
- [ ] Audit logging

### Phase 2: Enhanced Moderation
- [ ] Review moderation
- [ ] Report management system
- [ ] Content flagging automation
- [ ] Bulk operations

### Phase 3: Support System
- [ ] Support ticket system
- [ ] Canned responses
- [ ] User communication tools
- [ ] Knowledge base integration

### Phase 4: Advanced Features
- [ ] Advanced analytics & reporting
- [ ] Custom report builder
- [ ] Automated moderation ML
- [ ] Feature flag management
- [ ] A/B testing framework

---

**Document Version:** 1.0.0  
**Last Updated:** 2024-12-30  
**Maintained By:** Platform Team  
**Review Cycle:** Quarterly

---

## Appendix

### API Error Codes Reference

| Code | Description | HTTP Status |
|------|-------------|-------------|
| ADMIN_AUTH_REQUIRED | Admin authentication required | 401 |
| ADMIN_INSUFFICIENT_PERMISSION | Insufficient permissions | 403 |
| ADMIN_RESOURCE_NOT_FOUND | Resource not found | 404 |
| ADMIN_VALIDATION_ERROR | Request validation failed | 422 |
| ADMIN_RATE_LIMIT | Rate limit exceeded | 429 |
| ADMIN_CONFLICT | Resource conflict | 409 |
| ADMIN_SERVER_ERROR | Internal server error | 500 |

### Common Use Cases

#### Use Case 1: Moderate New Property Listing
1. GET `/api/v1/admin/properties/moderation-queue` - View pending properties
2. GET `/api/v1/admin/properties/:uuid` - Review property details
3. POST `/api/v1/admin/properties/:uuid/approve` OR `/reject` - Take action
4. Audit log automatically created

#### Use Case 2: Handle User Report
1. GET `/api/v1/admin/reports?status=open` - View open reports
2. GET `/api/v1/admin/reports/:id` - Review report details
3. PUT `/api/v1/admin/reports/:id` - Update status to "investigating"
4. POST `/api/v1/admin/properties/:uuid/flag` - Flag reported property
5. POST `/api/v1/admin/reports/:id/resolve` - Resolve report

#### Use Case 3: Suspend Problematic User
1. GET `/api/v1/admin/users/:userId` - Review user details and history
2. POST `/api/v1/admin/users/:userId/suspend` - Suspend user
3. User receives email notification automatically
4. Related properties auto-unpublished
5. Active offers auto-cancelled

---

For implementation questions or API integration support, contact the Platform Team or refer to the main [API Guide](/documentation/api-guide.md).

---

## Admin Offer Inbox & Outreach

### Overview

When a user creates an offer on an admin-managed listing (a property where `landlord_role = 'admin'`), there is no real landlord account receiving the standard P2P notification. The Admin Offer Inbox bridges this gap: it surfaces every incoming offer across all admin-owned listings so the admin can review it and then manually route the enquiry to the real-world contact for that property — typically an external agent or landlord — via WhatsApp (Phase 1) or Facebook Messenger DM (Phase 2).

This feature does **not** change the offer lifecycle from the tenant's perspective. The tenant still creates, counters, and tracks offers through the normal flow. The admin is purely an observer and outreach facilitator.

---

### Prerequisites

#### 1. `external_contact` column on `property_listing`

The property listing table must carry a phone number for the real-world point of contact. If the column does not exist yet, add it via a Hasura migration:

```sql
-- migration: add_external_contact_to_property_listing.sql
ALTER TABLE real_estate.property_listing
  ADD COLUMN IF NOT EXISTS external_contact TEXT;

COMMENT ON COLUMN real_estate.property_listing.external_contact IS
  'E.164 phone number (digits only, no + prefix) for the external agent or landlord. Used by admin for WhatsApp outreach.';
```

Expose the column in Hasura (track the column, update permissions so only `admin` role can write it, all roles can read it on their own listing).

#### 2. Admin authentication guard

All admin offer inbox pages and API routes must check that the requesting user has `role = 'admin'` (or `Super Admin` in the permission matrix). Reject with `403` otherwise.

---

### Architecture

```
[Admin Portal UI]
  └─ /admin/offers/incoming
       ├─ AdminIncomingOffersPage          (Next.js page, server-authenticated)
       │    └─ AdminIncomingOffers         (client component, mirrors IncomingOffers)
       │         └─ AdminOfferCard         (extends OfferCard + outreach action strip)
       │              ├─ WhatsAppOutreach  (Method 1 — Phase 1)
       │              └─ FacebookOutreach  (Method 2 — Phase 2, placeholder)
       └─ /api/v1/admin/offers/incoming    (REST endpoint, Hasura query)
```

---

### API Route

#### `GET /api/v1/admin/offers/incoming`

Fetches all `real_estate_offer` rows where the related `property_listing.landlord_role = 'admin'`, joining `external_contact` from the listing so the UI can construct outreach URLs without a second round-trip.

**Query parameters**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | `OfferStatus` | _(all)_ | Filter by offer status |
| `propertyUuid` | `string` | _(all)_ | Filter to a single property |
| `limit` | `number` | `50` | Page size |
| `offset` | `number` | `0` | Pagination offset |

**Hasura GraphQL query (server-side)**

```graphql
query AdminIncomingOffers(
  $where: real_estate_offer_bool_exp
  $limit: Int
  $offset: Int
) {
  real_estate_offer(
    where: $where
    order_by: { created_at: desc }
    limit: $limit
    offset: $offset
  ) {
    id
    offer_uuid
    offer_key
    property_uuid
    initiator_user_id
    recipient_user_id
    proposing_rent_price
    proposing_rent_price_currency
    num_leasing_months
    payment_frequency
    move_in_date
    offer_status
    is_active
    negotiation_round
    last_action_by
    last_action_at
    last_action_type
    created_at
    updated_at
    # Tenant (initiator) identity
    initiator {
      uuid
      display_name
      email
      photo_url
      whatsapp_number
    }
    # Property + external contact for outreach
    property_listing {
      property_uuid
      title
      location
      price
      external_contact       # E.164 digits for WhatsApp
    }
  }
  real_estate_offer_aggregate(where: $where) {
    aggregate { count }
  }
}
```

**`$where` variable construction (server)**

```typescript
const where: Record<string, unknown> = {
  property_listing: { landlord_role: { _eq: 'admin' } },
  is_active: { _eq: true },
};
if (status)       where.offer_status   = { _eq: status };
if (propertyUuid) where.property_uuid  = { _eq: propertyUuid };
```

**Response shape**

```typescript
{
  success: true,
  data: AdminOffer[],   // see type extension below
  total: number,
  message: string
}
```

**Route file:** `src/app/api/v1/admin/offers/incoming/route.ts`

---

### Type Extension

Extend the base `Offer` type with the admin-specific fields:

```typescript
// src/types/offer.ts  (append to existing file)

export interface AdminOffer extends Offer {
  /** External real-world contact number (E.164 digits, no +) for the property. */
  externalContact?: string;
}
```

---

### Outreach Utility

Add a dedicated utility that mirrors the existing `claimListingContact.ts` pattern:

**File:** `src/lib/adminOfferOutreach.ts`

```typescript
/**
 * Builds a pre-filled WhatsApp wa.me URL addressed to the external contact
 * for a given property, summarising the tenant's offer terms so the admin
 * can forward the lead with a single tap.
 *
 * @param externalContact - E.164 phone digits (no + prefix), e.g. "60123456789"
 * @param offer           - AdminOffer object from the admin inbox API
 * @returns wa.me URL string, or null if externalContact is missing
 */
export function buildAdminOfferWhatsAppUrl(
  externalContact: string | null | undefined,
  offer: {
    property: { title: string; location: string };
    initiator?: { displayName: string; email: string };
    proposingRentPrice: number;
    proposingRentPriceCurrency: string;
    numLeasingMonths: number;
    paymentFrequency: string;
    moveInDate: string;
    offerKey: string;
  }
): string | null {
  const digits = externalContact?.replace(/\D/g, '');
  if (!digits) return null;

  const tenantName   = offer.initiator?.displayName ?? 'A potential tenant';
  const tenantEmail  = offer.initiator?.email        ?? 'unknown';
  const price        = `${offer.proposingRentPriceCurrency} ${offer.proposingRentPrice.toLocaleString()}`;
  const frequency    = offer.paymentFrequency;
  const duration     = `${offer.numLeasingMonths} month${offer.numLeasingMonths !== 1 ? 's' : ''}`;
  const moveIn       = new Date(offer.moveInDate).toLocaleDateString('en-MY', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const body = `Hi, I'm reaching out on behalf of Dropiti regarding your listing.

*Property:* ${offer.property.title} (${offer.property.location})
*Offer ref:* ${offer.offerKey}

A tenant is interested and has submitted the following offer:
• Proposed rent: ${price} / ${frequency}
• Lease duration: ${duration}
• Move-in date: ${moveIn}
• Tenant contact: ${tenantName} (${tenantEmail})

Please let us know if you'd like to proceed or have any questions.

— Dropiti Admin`;

  return `https://wa.me/${digits}?text=${encodeURIComponent(body)}`;
}

/**
 * Phase 2 placeholder — Facebook Messenger DM deep link.
 * Replace `pageId` with the Facebook Page ID of the external contact
 * once the Page-to-Page or Page-to-User messaging flow is configured.
 */
export function buildAdminOfferFacebookUrl(
  pageId: string | null | undefined
): string | null {
  if (!pageId) return null;
  return `https://m.me/${pageId}`;
}
```

---

### UI Components

#### `AdminIncomingOffers` (client component)

**File:** `src/components/admin/AdminIncomingOffers.tsx`

Mirrors the existing `IncomingOffers` component but:
- Calls `GET /api/v1/admin/offers/incoming` instead of `offersAPI.getOffersByRecipient`
- Passes the resolved `externalContact` field down to each card
- Does **not** show accept/reject/counter actions (admin is an observer, not a party)
- Adds a new `OutreachActions` strip at the bottom of each card

```typescript
interface AdminIncomingOffersProps {
  propertyUuid?: string;   // Optional: scope to one listing
  statusFilter?: OfferStatus;
}
```

#### `AdminOfferCard` (client component)

**File:** `src/components/admin/AdminOfferCard.tsx`

Wraps the existing `OfferCard` display (read-only, `isIncomingOffer={false}`, hide action buttons) and appends an `OutreachActions` strip:

```typescript
interface AdminOfferCardProps {
  offer: AdminOffer;
}
```

#### `OutreachActions` (sub-component, inline in AdminOfferCard)

Renders two buttons:

| Button | Phase | Behaviour |
|--------|-------|-----------|
| **WhatsApp** | 1 (now) | Opens `buildAdminOfferWhatsAppUrl(offer.externalContact, offer)` in a new tab. Disabled with tooltip "No external contact set" if `externalContact` is empty. |
| **Facebook DM** | 2 (next) | Renders as disabled with badge "Coming soon". |

```typescript
// Simplified render sketch
function OutreachActions({ offer }: { offer: AdminOffer }) {
  const waUrl = buildAdminOfferWhatsAppUrl(offer.externalContact, {
    property:    offer.property!,
    initiator:   offer.initiator,
    proposingRentPrice:         offer.proposingRentPrice,
    proposingRentPriceCurrency: offer.proposingRentPriceCurrency,
    numLeasingMonths:           offer.numLeasingMonths,
    paymentFrequency:           offer.paymentFrequency,
    moveInDate:                 offer.moveInDate,
    offerKey:                   offer.offerKey,
  });

  return (
    <div className="flex gap-3 pt-3 border-t border-gray-100 mt-3">
      {/* Method 1 — WhatsApp */}
      <a
        href={waUrl ?? '#'}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={!waUrl}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
          ${waUrl
            ? 'bg-green-500 text-white hover:bg-green-600'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'
          }`}
        title={!waUrl ? 'No external contact set for this listing' : 'Send WhatsApp to external contact'}
        onClick={e => { if (!waUrl) e.preventDefault(); }}
      >
        {/* WhatsApp SVG icon */}
        <WhatsAppIcon className="w-4 h-4" />
        Contact via WhatsApp
      </a>

      {/* Method 2 — Facebook DM (Phase 2 placeholder) */}
      <button
        disabled
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-400 cursor-not-allowed"
        title="Facebook DM outreach — coming soon"
      >
        {/* Facebook SVG icon */}
        <FacebookIcon className="w-4 h-4" />
        Facebook DM
        <span className="ml-1 text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">Soon</span>
      </button>
    </div>
  );
}
```

---

### Page Route

**File:** `src/app/admin/offers/incoming/page.tsx`

```
Route: /admin/offers/incoming
Auth:  Admin role required (server-side guard)
```

The page:
1. Verifies the session has `role = 'admin'`; redirects to `/` if not
2. Renders `AdminIncomingOffers` with optional `propertyUuid` / `status` query-param filters
3. Includes a filter bar (status dropdown, property UUID search) and a summary count badge

---

### Dashboard Navigation Hook

Add a nav link in the admin dashboard sidebar (or wherever the admin navigation lives) pointing to `/admin/offers/incoming` with a live unread count badge — the count being the number of offers with `offer_status = 'pending'` across all admin listings.

Fetch the badge count client-side from a lightweight endpoint:

```
GET /api/v1/admin/offers/incoming?status=pending&limit=0
// Returns { total: N } — use `total` for the badge
```

---

### `external_contact` Admin UI

To let the admin set or update the `external_contact` field on any listing without leaving the portal, add an editable field to the existing property management detail page (`/admin/properties/[uuid]`):

- Input type: `tel`, placeholder `+60 12-345 6789`
- Strip non-digits before saving (`value.replace(/\D/g, '')`)
- Save via `PATCH /api/v1/admin/properties/:uuid` (or a new dedicated route `PUT /api/v1/admin/properties/:uuid/external-contact`)
- Show a live preview of the WhatsApp URL as a test link below the input

---

### Data Flow Summary

```
1. Tenant views admin listing → creates offer (standard flow, no change)
2. Offer stored in real_estate_offer with admin user as recipient_user_id
3. Admin navigates to /admin/offers/incoming
4. Page calls GET /api/v1/admin/offers/incoming
   └─ Hasura query joins property_listing.external_contact
5. AdminOfferCard renders offer details (read-only)
6. Admin clicks "Contact via WhatsApp"
   └─ buildAdminOfferWhatsAppUrl() generates pre-filled wa.me link
   └─ Opens WhatsApp Web / mobile app addressed to external_contact
   └─ Admin reviews the pre-drafted message and hits Send
7. (Phase 2) Admin clicks "Facebook DM" → routes to Messenger thread
```

---

### Phase Roadmap

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Database: `external_contact` column + migration | Required before UI work |
| 1 | `GET /api/v1/admin/offers/incoming` API route | Required before UI work |
| 1 | `AdminIncomingOffers` + `AdminOfferCard` UI | Core deliverable |
| 1 | WhatsApp outreach (`buildAdminOfferWhatsAppUrl`) | Core deliverable |
| 1 | `external_contact` editable field in property admin UI | QoL for admin operators |
| 1 | Pending offers badge in admin nav | QoL for admin operators |
| 2 | Facebook Messenger DM outreach | Next phase |
| 2 | Outreach audit log (record which admin sent a WhatsApp, when) | Compliance |
| 2 | Outreach deduplication (warn admin if external contact was pinged recently) | UX improvement |

---

### Security & Permissions

- All `/api/v1/admin/offers/*` routes **must** validate `role = 'admin'` server-side via the Firebase token claim or Hasura session variable — never trust the client.
- `external_contact` must be writable only by `admin` role in Hasura permissions.
- WhatsApp links are generated entirely client-side (wa.me redirects); no credentials are needed and no server-side WhatsApp Business API call is made in Phase 1. This keeps the implementation dependency-free and avoids per-message API costs until volume justifies it.
- In Phase 2, Facebook Messenger DM will require a Facebook App + Page token and must go through a server-side route to protect the access token.

---

## Transfer Ownership Invitation

### Overview

When an admin spots an incoming offer on an admin-managed listing and wants to route the lead to the real-world landlord or agent, they trigger a **Transfer Ownership Invitation**. The system:

1. Creates a time-limited token in the `property_transfer_invitation` table
2. Dispatches a WhatsApp message (server-side, via `WhatsAppService`) to the `external_contact` number on file for the listing
3. The message contains a unique link: `/transfer-ownership/<token_uuid>`
4. The recipient opens the link, registers/logs in on Dropiti, and clicks **Claim This Property**
5. The system transfers the listing's ownership (updates `landlord_firebase_uid`) to the new user and marks the token as used

If the token expires before it is claimed (default: 7 days), the admin can resend with a fresh token.

---

### Database

**Migration file:** `documentation/database/add-property-transfer-invitation.sql`

This migration:
- Adds `external_contact TEXT` to `real_estate.property_listing`
- Creates `real_estate.property_transfer_invitation`

```sql
CREATE TABLE real_estate.property_transfer_invitation (
    id                    SERIAL PRIMARY KEY,
    token_uuid            UUID        UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    property_uuid         UUID        NOT NULL REFERENCES real_estate.property_listing(property_uuid) ON DELETE CASCADE,
    external_contact      TEXT        NOT NULL,
    sent_by_admin_id      TEXT        NOT NULL,
    offer_id              TEXT,
    status                TEXT        NOT NULL CHECK (status IN ('pending','used','expired','cancelled')) DEFAULT 'pending',
    expires_at            TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    used_at               TIMESTAMPTZ,
    claimed_by_user_id    TEXT,
    whatsapp_message_id   TEXT,
    resend_count          INTEGER     NOT NULL DEFAULT 0
);
```

**Token lifecycle:**

```
pending → used       (claimed by new owner)
pending → expired    (expires_at passed, auto-resolved on validate)
pending → cancelled  (admin sends a new invite / resend; old one cancelled first)
expired → cancelled  (resend also cancels expired tokens)
```

**Hasura permissions:**
- `admin` role: full CRUD on `property_transfer_invitation`; write `external_contact` on `property_listing`
- `user` role: read own rows (`claimed_by_user_id = X-Hasura-User-Id`)
- `public`: no direct table access (validated via Next.js API routes only)

---

### WhatsApp Service Layer

**File:** `src/lib/whatsappService.ts`

Provider-agnostic interface. The active implementation is set by `WHATSAPP_PROVIDER` env var:

| `WHATSAPP_PROVIDER` | Behaviour |
|---------------------|-----------|
| `stub` (default)    | Logs to console, returns fake message ID — safe for development |
| `meta`              | Uses Meta Cloud API (uncomment `WhatsAppMetaProvider` class, set `WHATSAPP_API_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID`) |
| `twilio`            | Twilio WhatsApp Business (add `WhatsAppTwilioProvider` class) |

**Required env vars (add to `.env.local` / Vercel):**

```
WHATSAPP_PROVIDER=stub
WHATSAPP_API_TOKEN=          # provider access token (when not using stub)
WHATSAPP_PHONE_NUMBER_ID=    # Meta Cloud API phone number ID
```

**High-level helper:**

```typescript
import { sendOwnershipInvitation } from '@/lib/whatsappService';

const result = await sendOwnershipInvitation(externalContact, {
  propertyTitle: 'Seaview Apartment 3B',
  invitationUrl: 'https://dropiti.com/transfer-ownership/<token>',
  expiryDays: 7,
});
// result: { success: boolean, messageId?: string, error?: string }
```

**Template name (register in Meta Business Manager / Twilio console):**
`property_ownership_invitation`

Example body:
> Hi, your property *{{1}}* has received a rental enquiry on Dropiti. Register or log in to claim your listing and manage this lead: {{2}}. This invitation expires in {{3}} days.

---

### API Routes

All routes follow the existing `src/app/api/v1/` Next.js route handler pattern.

#### `POST /api/v1/admin/transfer-ownership/invite`
**File:** `src/app/api/v1/admin/transfer-ownership/invite/route.ts`
**Auth:** Admin only

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `propertyUuid` | `string` | Yes | UUID of the property |
| `externalContact` | `string` | No | Override phone number (falls back to `property_listing.external_contact`) |
| `offerId` | `string` | No | Offer that triggered the invite (for audit trail) |

Response:
```json
{
  "success": true,
  "data": {
    "invitationId": 1,
    "tokenUuid": "...",
    "invitationUrl": "https://dropiti.com/transfer-ownership/...",
    "expiresAt": "2026-05-14T...",
    "whatsappSent": true,
    "whatsappError": null
  }
}
```

---

#### `GET /api/v1/transfer-ownership/validate`
**File:** `src/app/api/v1/transfer-ownership/validate/route.ts`
**Auth:** Public (no authentication required)

| Param | Description |
|-------|-------------|
| `?token=<uuid>` | The `token_uuid` from the invitation URL |

Performs a **live expiry check**: if `expires_at < NOW()` and status is still `pending`, automatically updates status to `expired` in the background before returning.

Response:
```json
{
  "success": true,
  "status": "valid",
  "property": {
    "propertyUuid": "...",
    "title": "...",
    "location": "...",
    "rentalPrice": 8000,
    "rentalPriceCurrency": "HKD",
    "propertyType": "apartment",
    "bedrooms": 2,
    "bathrooms": 1,
    "imageUrl": "..."
  },
  "expiresAt": "2026-05-14T...",
  "tokenUuid": "..."
}
```

Possible `status` values: `valid` | `expired` | `used` | `cancelled` | `invalid`

---

#### `POST /api/v1/transfer-ownership/claim`
**File:** `src/app/api/v1/transfer-ownership/claim/route.ts`
**Auth:** Authenticated Nhost user required

| Field | Type | Description |
|-------|------|-------------|
| `token` | `string` | The `token_uuid` from the URL |
| `userId` | `string` | The authenticated user's Nhost user ID |

Validates the token is `pending` and not expired, then:
1. Updates `property_listing.landlord_firebase_uid` to `userId`
2. Sets `invitation.status = 'used'`, `used_at = now()`, `claimed_by_user_id = userId`

Error codes returned in `code` field: `INVITATION_INVALID` | `INVITATION_USED` | `INVITATION_CANCELLED` | `INVITATION_EXPIRED`

---

#### `POST /api/v1/admin/transfer-ownership/resend`
**File:** `src/app/api/v1/admin/transfer-ownership/resend/route.ts`
**Auth:** Admin only

| Field | Type | Description |
|-------|------|-------------|
| `propertyUuid` | `string` | UUID of the property |
| `externalContact` | `string` | Optional override phone |

Cancels all existing `pending`/`expired` invitations for the property+contact pair, creates a fresh token, increments `resend_count`, and resends the WhatsApp message.

---

#### `GET /api/v1/admin/transfer-ownership/status`
**File:** `src/app/api/v1/admin/transfer-ownership/status/route.ts`
**Auth:** Admin only

| Param | Description |
|-------|-------------|
| `?propertyUuid=<uuid>` | Returns the latest invitation for this property |

Used by `AdminOfferCard` to render the correct badge/button. Response includes:
- `status` — resolved invitation state
- `daysRemaining` — days until expiry (when pending)
- `hoursSinceSent` — time since created (guards against spamming resend)
- `canResend` — `true` when status is `expired` OR (`pending` AND `hoursSinceSent >= 24`)

---

#### `GET /api/v1/admin/offers/incoming`
**File:** `src/app/api/v1/admin/offers/incoming/route.ts`
**Auth:** Admin only

Fetches all active offers on admin-managed listings (where `recipient_user_id` is in `DROPITI_PLATFORM_LANDLORD_USER_IDS`), enriched with initiator user info, property details, and `external_contact`.

| Param | Default | Description |
|-------|---------|-------------|
| `propertyUuid` | — | Scope to single listing |
| `status` | — | Filter by `offer_status` |
| `limit` | `50` | Page size (max 100) |
| `offset` | `0` | Pagination |

---

### Client Pages & Components

#### `/transfer-ownership/[token]`

**Files:**
- `src/app/transfer-ownership/[token]/layout.tsx` — minimal layout (no nav/bottom-bar; this page is entered from WhatsApp)
- `src/app/transfer-ownership/[token]/page.tsx` — full client component

The page validates the token on mount and renders one of these states:

| State | What the user sees |
|-------|--------------------|
| `loading` | Spinner while token is validated |
| `invalid` | "This invitation link is not valid." |
| `expired` | Property card + "Invitation expired — contact manager" |
| `used` / `cancelled` | "This property has already been claimed." |
| `unauthenticated` | Invitation banner + property card + **Create Account** / **Sign In** buttons |
| `ready_to_claim` | Property card + **Claim This Property** button |
| `claiming` | Button shows spinner |
| `claimed` | Success message → auto-redirects to `/dashboard/properties` in 3 s |

Auth redirect loop uses the existing `callbackUrl` param supported by both `signin` and `signup` pages:
```
/auth/signup?callbackUrl=/transfer-ownership/<token>
/auth/signin?callbackUrl=/transfer-ownership/<token>
```

> **Note:** `src/app/auth/signup/page.tsx` was updated to honour `callbackUrl` on successful registration (previously it always redirected to `/`).

---

#### `AdminIncomingOffers` (client component)

**File:** `src/components/admin/AdminIncomingOffers.tsx`

Drop-in replacement for `IncomingOffers` for admin pages. Calls `GET /api/v1/admin/offers/incoming` and renders a list of `AdminOfferCard` components.

```tsx
<AdminIncomingOffers
  propertyUuid="..."    // optional
  statusFilter="pending" // optional
  title="Incoming Offers"
/>
```

---

#### `AdminOfferCard` (client component)

**File:** `src/components/admin/AdminOfferCard.tsx`

Extends the standard offer card with an **OutreachActions** strip at the bottom. The strip:
1. Fetches the latest invitation status via `GET /api/v1/admin/transfer-ownership/status?propertyUuid=...` on mount
2. Renders the appropriate button/badge based on status:

| Invitation status | UI shown |
|------------------|----------|
| `none` | **Send Ownership Invitation** (green, disabled if no `external_contact`) |
| `pending_fresh` (<24h old) | Blue badge "Invitation Sent — N days remaining" |
| `pending_stale` (≥24h old) | Badge + **Resend** button |
| `expired` | **Resend Invitation (Expired)** button (orange) |
| `claimed` | Green badge "Listing Claimed" |

The card also shows a Facebook DM button (disabled, "Soon" badge — Phase 2).

---

### Token Expiry Strategy

- **Default expiry:** 7 days (`INVITATION_EXPIRY_DAYS` constant in `src/lib/whatsappService.ts`)
- **Live check:** The `validate` route always compares `expires_at` to `NOW()` and auto-marks as `expired` — no cron needed for correctness
- **Optional Hasura scheduled event** (for reporting accuracy):
  ```sql
  UPDATE real_estate.property_transfer_invitation
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < NOW();
  ```
- **Resend guard:** `canResend` is only `true` when the previous invite is either `expired` or older than 24 hours, preventing accidental spam

---

### Data Flow Summary

```
1. Tenant submits offer on admin listing (standard offer flow, no change)
2. Admin opens /admin/offers/incoming → AdminIncomingOffers → AdminOfferCard
3. AdminOfferCard fetches invitation status (none → badge is empty)
4. Admin clicks "Send Ownership Invitation"
   └─ POST /api/v1/admin/transfer-ownership/invite
      ├─ Inserts property_transfer_invitation row (token_uuid, expires_at)
      └─ WhatsAppService.sendOwnershipInvitation(external_contact, url)
5. External contact receives WhatsApp → opens /transfer-ownership/<token>
6. Validate route confirms token is valid, returns property details
7a. If not authenticated → /auth/signup?callbackUrl=/transfer-ownership/<token>
    → User registers → redirected back to /transfer-ownership/<token>
7b. If already authenticated → skip to step 8
8. User clicks "Claim This Property"
   └─ POST /api/v1/transfer-ownership/claim { token, userId }
      ├─ Validates token (pending + not expired)
      ├─ Updates property_listing.landlord_firebase_uid = userId
      └─ Marks invitation status = 'used'
9. Page shows success → redirects to /dashboard/properties
10. AdminOfferCard refreshes invitation status → shows "Listing Claimed" badge
```

---

### Security Notes

- `POST /api/v1/admin/transfer-ownership/*` routes must validate admin role server-side (Nhost JWT + Hasura session variable or header check). Add the `x-admin-user-id` header validation in a shared middleware once the admin auth layer is implemented.
- The `validate` endpoint is intentionally **public** (no auth required) — it only exposes a sanitised property card, not PII.
- The `claim` endpoint requires the authenticated user's ID in the request body. In production, extract the user ID from the verified Nhost JWT rather than trusting the client-supplied value.
- `external_contact` is write-restricted to `admin` role in Hasura. It is returned in admin API responses only.
- WhatsApp messages are sent server-side; no API credentials are exposed to the browser.

---

### Phase Roadmap (Transfer Ownership)

| Phase | Item | Status |
|-------|------|--------|
| 1 | `add-property-transfer-invitation.sql` migration | Done |
| 1 | `src/lib/whatsappService.ts` provider-agnostic layer (stub) | Done |
| 1 | All 5 API routes (invite, validate, claim, resend, status) | Done |
| 1 | `AdminOfferCard` + `AdminIncomingOffers` components | Done |
| 1 | `/transfer-ownership/[token]` page (all 8 states) | Done |
| 1 | `signup` page `callbackUrl` support | Done |
| 2 | Swap `WhatsAppStub` for `WhatsAppMetaProvider` or `WhatsAppTwilioProvider` | Pending provider selection |
| 2 | Pre-approve `property_ownership_invitation` template in Meta Business Manager | Pending |
| 2 | Server-side Nhost JWT verification on claim route | Pending admin auth layer |
| 2 | Facebook Messenger DM outreach | Next phase |
| 2 | Outreach audit log | Compliance |
| 3 | Hasura scheduled event to sweep expired tokens | Operational cleanup |

