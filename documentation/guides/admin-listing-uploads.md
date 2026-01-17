# Admin Listing Uploads Documentation

## Overview

This document provides comprehensive documentation for the admin-side listing upload functionality in Dropiti. The system supports two main flows for managing property listings:

1. **Add Property Flow** (`/dashboard/add-property`) - 8-step wizard for creating new listings
2. **Edit Property Flow** (`/dashboard/properties/edit/[id]`) - Inline editing for existing listings

Both flows are designed to ensure consistency in data entry through controlled static values and structured field validation.

---

## Table of Contents

- [Add Property Flow (8-Step Wizard)](#add-property-flow-8-step-wizard)
- [Edit Property Flow (Inline Sections)](#edit-property-flow-inline-sections)
- [Controlled Static Values Reference](#controlled-static-values-reference)
- [Data Structure & API Mapping](#data-structure--api-mapping)
- [Field Validation Rules](#field-validation-rules)
- [Best Practices for Admin Uploads](#best-practices-for-admin-uploads)

---

## Add Property Flow (8-Step Wizard)

**Location:** `/dashboard/add-property`  
**Component:** `AddPropertyView.tsx`

The add property flow uses a multi-step wizard to guide admins through creating a new listing. Each step focuses on a specific category of property information.

### Step 1: Property Type
**Component:** `Step1PropertyType.tsx`  
**Purpose:** Select the main property type and residential subtype

#### Fields:
- **Property Type** (required)
  - Type: Single selection
  - Controlled Values: `residential`, `commercial`
  - Note: `commercial` is currently disabled

- **Residential Type** (required when property type is residential)
  - Type: Single selection
  - Controlled Values:
    - `serviced-apartment` - Serviced Apartment
    - `village-house` - Village House
    - `apartment` - Apartment
    - `condo` - Condominium

#### Validation:
- Both property type and residential type must be selected to proceed

---

### Step 2: Rental Space
**Component:** `Step2RentalSpace.tsx`  
**Purpose:** Define what type of rental space is being offered

#### Fields:
- **Rental Space Type** (required)
  - Type: Single selection
  - Controlled Values:
    - `entire-apartment` - Entire Apartment (complete apartment with private bathroom and kitchen)
    - `partial-apartment` - Partial Apartment (own room, shared common areas)
    - `shared-space` - Shared Space (shared room or space with others)
    - `private-room` - Private Room (private room, shared common areas)

#### Validation:
- One rental space type must be selected

---

### Step 3: Address
**Component:** `Step3Address.tsx`  
**Purpose:** Capture complete property location information

#### Fields:

##### Building Details:
- **Unit Number**
  - Type: Text input (optional)
  - Example: "1501"

- **Floor**
  - Type: Text input (optional)
  - Example: "15th"

- **Block**
  - Type: Text input (optional)
  - Example: "Block A"

- **Building Name / Estate**
  - Type: Text input (optional)
  - Example: "The Arch, Causeway Bay"

##### Location Details:
- **Address Line 1** (required)
  - Type: Text input
  - Example: "123 Hennessy Road"

- **Address Line 2**
  - Type: Text input (optional)
  - Example: "Suite 100"

- **District** (required)
  - Type: Dropdown selection
  - Controlled Values: See [Districts by Country](#districts-by-country)

- **State/Region**
  - Type: Text input (optional)
  - Example: "Hong Kong"

- **Country** (required)
  - Type: Dropdown selection
  - Controlled Values: `HK` (Hong Kong), `MO` (Macau)
  - Default: `HK` (Hong Kong)

##### Privacy Settings:
- **Show Specific Location**
  - Type: Toggle (boolean)
  - Default: `false`
  - When `true`: Displays Address Line 1 to clients
  - When `false`: Displays only district to clients

#### Validation:
- Address Line 1 and District are required
- Map preview updates automatically based on address input (2-second debounce)

---

### Step 4: Unit Details
**Component:** `Step4UnitDetails.tsx`  
**Purpose:** Specify property dimensions, room counts, and furnishing status

#### Fields:

##### Area Details:
- **Gross Area**
  - Type: Number input (optional)
  - Unit: Square feet (sq ft)
  - Description: Total area including walls and common areas
  - Example: 800

- **Net Area**
  - Type: Number input (optional)
  - Unit: Square feet (sq ft)
  - Description: Usable floor area excluding walls
  - Example: 650

##### Room Details:
- **Number of Bedrooms** (required)
  - Type: Number input
  - Range: 0-10
  - Note: 0 indicates a studio apartment

- **Number of Bathrooms** (required)
  - Type: Number input
  - Range: 0-10
  - Step: 0.5 (allows half bathrooms)

##### Furnishing Status:
- **Furnished** (optional)
  - Type: Single selection
  - Controlled Values:
    - `fully` - Fully Furnished (all furniture and appliances)
    - `partially` - Partially Furnished (some furniture and basic appliances)
    - `non-furnished` - Non-Furnished (empty unit)

##### Additional Details:
- **Pets Allowed** (optional)
  - Type: Boolean (Yes/No buttons)
  - Values: `true` or `false`

#### Validation:
- Bedrooms and bathrooms must be specified (can be 0)

---

### Step 5: Amenities
**Component:** `Step5Amenities.tsx`  
**Purpose:** Select available property amenities from predefined categories

#### Fields:
- **Amenities** (required - at least one)
  - Type: Multiple selection (checkboxes)
  - Controlled Values: See [Amenities Reference](#amenities-by-category)

#### Categories:
Amenities are organized into 13 categories for easier selection:
1. Internet & Technology
2. Appliances
3. Entertainment
4. Transportation
5. Fitness & Recreation
6. Safety
7. Accessibility
8. Outdoor
9. Work
10. Communication
11. Furnishing
12. Utilities
13. Services
14. Bathroom
15. Family

#### Validation:
- At least one amenity must be selected

---

### Step 6: Photos
**Component:** `Step6Photos.tsx`  
**Purpose:** Upload property images

#### Fields:
- **Photos** (required)
  - Type: File upload (images only)
  - Accepted formats: JPEG, PNG, WebP
  - Storage: AWS S3
  - Note: Images are uploaded during draft save or final submission

#### Validation:
- At least one photo must be uploaded
- Files must be valid image formats

---

### Step 7: Rental Details
**Component:** `Step7RentalDetails.tsx`  
**Purpose:** Add final listing information and preview

#### Fields:
- **Listing Name** (required)
  - Type: Text input
  - Max length: 100 characters
  - Example: "Modern 2BR Apartment in Central"

- **Listing Description**
  - Type: Textarea (optional)
  - Description: Detailed property description

- **Monthly Rental Price** (required)
  - Type: Number input
  - Currency: HKD
  - Example: 25000

- **Available Date**
  - Type: Date picker (optional)
  - Description: When the property becomes available

#### Features:
- Live preview of PropertyCard showing how the listing will appear to clients

#### Validation:
- Listing name and rental price are required

---

### Step 8: Summary
**Component:** `Step8Summary.tsx`  
**Purpose:** Review all information before submission

#### Actions:
- **Save as Draft** - Saves incomplete listing for later completion
- **Publish** - Submits listing and makes it visible to clients (requires all required fields)

---

## Edit Property Flow (Inline Sections)

**Location:** `/dashboard/properties/edit/[id]`  
**Component:** `InlineEditPropertyView.tsx`

The edit flow allows admins to modify existing listings through inline editable sections. Each section can be edited independently.

### Section 1: Basic Information
**Component:** `BasicInfoSection.tsx`

#### Fields:
- **Property Type**
  - Type: Dropdown
  - Controlled Values: `residential` (commercial is disabled)

- **Residential Type**
  - Type: Dropdown
  - Controlled Values: `serviced-apartment`, `village-house`, `apartment`, `condo`

- **Rental Space**
  - Type: Dropdown
  - Controlled Values: `entire-apartment`, `partial-apartment`, `shared-space`, `private-room`

- **Listing Name**
  - Type: Text input
  - Max length: 100 characters

- **Listing Description**
  - Type: Textarea
  - Note: Auto-truncates after 500 characters with "See More" toggle

- **Listing Status**
  - Type: Dropdown
  - Controlled Values:
    - `draft` - Draft (Not Published)
    - `published` - Published (Active)
    - `archived` - Archived
    - `expired` - Expired

---

### Section 2: Location
**Component:** `LocationSection.tsx`

Contains all address fields from Step 3 of the add property flow:
- Unit Number, Floor, Block
- Building Name / Estate
- Address Line 1, Address Line 2
- District, State/Region, Country
- Show Specific Location toggle

---

### Section 3: Property Details
**Component:** `PropertyDetailsSection.tsx`

Contains all unit detail fields from Step 4 of the add property flow:
- Gross Area, Net Area
- Number of Bedrooms, Number of Bathrooms
- Furnished status
- Pets Allowed

---

### Section 4: Amenities
**Component:** `AmenitiesSection.tsx`

Contains amenity selection from Step 5 of the add property flow:
- Multiple selection of amenities by category
- Same controlled values as Step 5

---

### Section 5: Photos
**Component:** `PhotosSection.tsx`

Manages property images:
- Upload new photos
- Delete existing photos
- Reorder photos
- Set primary display image

---

### Section 6: Rental Information
**Component:** `RentalInfoSection.tsx`

#### Fields:
- **Rental Price** (per month)
  - Type: Number input
  - Currency: HKD

- **Available Date**
  - Type: Date picker

---

## Controlled Static Values Reference

### Property Types

```javascript
PROPERTY_TYPE = {
  RESIDENTIAL: 'residential',
  COMMERCIAL: 'commercial' // Currently disabled
}
```

### Residential Types

```javascript
RESIDENTIAL_TYPE = {
  SERVICED_APARTMENT: 'serviced-apartment',
  VILLAGE_HOUSE: 'village-house',
  APARTMENT: 'apartment',
  CONDO: 'condo'
}
```

### Rental Space Types

```javascript
RENTAL_SPACE = {
  ENTIRE_APARTMENT: 'entire-apartment',
  PARTIAL_APARTMENT: 'partial-apartment',
  SHARED_SPACE: 'shared-space',
  PRIVATE_ROOM: 'private-room'
}
```

### Furnishing Status

```javascript
FURNISHED = {
  FULLY: 'fully',
  PARTIALLY: 'partially',
  NON_FURNISHED: 'non-furnished'
}
```

### Listing Status

```javascript
STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
  EXPIRED: 'expired'
}
```

### Districts by Country

#### Hong Kong (HK)
**Hong Kong Island:**
- Central and Western
- Eastern
- Southern
- Wan Chai

**Kowloon:**
- Sham Shui Po
- Kowloon City
- Kwun Tong
- Wong Tai Sin
- Yau Tsim Mong

**New Territories:**
- Islands
- Kwai Tsing
- North
- Sai Kung
- Sha Tin
- Tai Po
- Tsuen Wan
- Tuen Mun
- Yuen Long

#### Macau (MO)
**Macau Peninsula:**
- Nossa Senhora de Fátima
- Santo António
- Sé
- São Lázaro
- São Lourenço

**Other Regions:**
- Taipa
- Coloane
- Cotai

---

### Amenities by Category

#### Internet & Technology
- `wifi` - WiFi

#### Appliances
- `air-conditioning` - Air Conditioning
- `heating` - Heating
- `dishwasher` - Dishwasher
- `fridge` - Fridge
- `microwave` - Microwave
- `oven` - Oven
- `gas-stove` - Gas Stove
- `induction-stove` - Induction Stove
- `washer` - Washing Machine
- `dryer` - Dryer

#### Entertainment
- `tv` - TV

#### Transportation
- `parking` - Parking

#### Fitness & Recreation
- `gym` - Gym
- `pool` - Swimming Pool

#### Safety
- `security` - Security System
- `smoke-alarm` - Smoke Alarm

#### Accessibility
- `elevator` - Elevator

#### Outdoor
- `balcony` - Balcony
- `trees` - Trees
- `walk` - Walk

#### Work
- `workspace` - Workspace

#### Communication
- `phone` - Phone

#### Furnishing
- `furnished` - Furnished

#### Utilities
- `utilities-included` - Utilities Included
- `lightning` - Lightning
- `clock` - Clock
- `ruler` - Ruler

#### Services
- `cleaning` - Cleaning Service
- `clean` - Clean
- `quiet` - Quiet
- `spacious` - Spacious

#### Bathroom
- `bathtub` - Bathtub
- `shower` - Shower
- `hair-dryer` - Hair Dryer
- `exhaust-fan` - Exhaust Fan
- `dehumidifier` - Dehumidifier

#### Family
- `children` - Children

---

## Data Structure & API Mapping

### PropertyData Interface

The internal data structure used throughout the application:

```typescript
interface PropertyData {
  // Step 1
  propertyType?: 'residential' | 'commercial';
  residentialType?: 'serviced-apartment' | 'village-house' | 'apartment' | 'condo';
  
  // Step 2
  rentalSpace?: 'entire-apartment' | 'partial-apartment' | 'shared-space' | 'private-room';
  
  // Step 3
  address?: {
    unit?: string;
    floor?: string;
    block?: string;
    building?: string;
    addressLine1?: string;
    addressLine2?: string;
    district?: string;
    state?: string;
    country?: string;
    city?: string;
    showSpecificLocation?: boolean;
  };
  
  // Step 4
  unitDetails?: {
    grossArea?: number;
    grossAreaUnit?: string;
    netArea?: number;
    bedrooms?: number;
    bathrooms?: number;
    furnished?: 'fully' | 'partially' | 'non-furnished';
    petsAllowed?: boolean;
  };
  
  // Step 5
  amenities?: string[];
  
  // Step 6
  photos?: File[];
  displayImage?: string;
  uploadedImages?: string[];
  
  // Step 7
  rentalDetails?: {
    listingName?: string;
    listingDescription?: string;
    rentalPrice?: number;
    availableDate?: Date | string | null;
  };
  
  // Status
  status?: 'draft' | 'published' | 'archived' | 'expired';
}
```

### API Field Mapping

When submitting to the API, field names are transformed to match database schema:

| PropertyData Field | API Field Name | Notes |
|-------------------|----------------|-------|
| `rentalDetails.rentalPrice` | `rental_price` or `price` | `price` for retrieval, `rental_price` for updates |
| `rentalDetails.availableDate` | `available_date` or `availability_date` | `available_date` for retrieval, `availability_date` for updates |
| `unitDetails.bedrooms` | `bedrooms` | Direct mapping |
| `unitDetails.bathrooms` | `bathrooms` | Direct mapping |
| `photos` (File[]) | `photos` (string[]) | Converted to S3 URLs before submission |

---

## Field Validation Rules

### Required Fields for Draft Save
Minimum requirements to save as draft:
- No required fields (can save with any data)

### Required Fields for Publishing
All of the following must be completed:
1. **Step 1:** Property Type, Residential Type
2. **Step 2:** Rental Space
3. **Step 3:** Address Line 1, District
4. **Step 4:** Bedrooms (can be 0), Bathrooms (can be 0)
5. **Step 5:** At least one amenity
6. **Step 6:** At least one photo
7. **Step 7:** Listing Name, Rental Price

### Field-Specific Validation

#### Numeric Fields:
- **Bedrooms:** 0-10 (0 = studio)
- **Bathrooms:** 0-10, step 0.5
- **Rental Price:** Must be > 0
- **Area:** Must be > 0 if specified

#### Text Fields:
- **Listing Name:** Max 100 characters
- **Address Line 1:** Required, no max length specified
- **Description:** No max length (auto-truncates in display at 500 chars)

#### Date Fields:
- **Available Date:** Optional, must be valid date format

#### File Uploads:
- **Photos:** Must be valid image files (JPEG, PNG, WebP)

---

## Best Practices for Admin Uploads

### 1. Consistency in Data Entry

**Property Types:**
- Always select the most specific property type available
- Use "Apartment" for standard residential units
- Use "Serviced Apartment" for properties with hotel-like services
- Use "Condominium" for properties in condo complexes
- Use "Village House" for standalone houses in village areas

**Rental Space:**
- "Entire Apartment" - Full unit with all private facilities
- "Private Room" - Own bedroom, shared common areas
- "Partial Apartment" - Use when renting specific portion of unit
- "Shared Space" - Multiple people sharing the same room

### 2. Location Data

**Address Entry:**
- Always provide complete Address Line 1 (street name + number)
- Include building name for better identification
- Select accurate district for proper map display
- Use "Show Specific Location" toggle based on landlord preference

**Map Verification:**
- Always check map preview to ensure correct location
- Wait for map to update (2-second debounce) after typing
- If map shows wrong location, refine Address Line 1

### 3. Unit Details

**Area Measurements:**
- Always provide both Gross Area and Net Area when known
- Use square feet (sq ft) as the standard unit
- Gross Area should be larger than Net Area

**Bedroom Count:**
- Use 0 for studio apartments
- Count only actual bedrooms (not living rooms)

**Furnishing Status:**
- "Fully Furnished" - All furniture, appliances, and kitchenware
- "Partially Furnished" - Basic furniture only (bed, table, chairs)
- "Non-Furnished" - Empty unit

### 4. Amenities Selection

**Priority Amenities (Select if available):**
- WiFi (essential for most tenants)
- Air Conditioning
- Washing Machine
- Parking (if applicable)
- Elevator (for buildings above 3 floors)

**Accuracy:**
- Only select amenities that are actually available
- For shared amenities (gym, pool), confirm tenants have access
- Security features should be functional, not just present

### 5. Photos

**Photo Guidelines:**
- Minimum 5 photos recommended
- First photo should be the best exterior or living room shot
- Include: living room, bedrooms, kitchen, bathroom, any special features
- Ensure good lighting and straight angles
- No watermarks or date stamps
- High resolution (at least 1200px wide)

### 6. Rental Information

**Listing Name:**
- Format: "[Bedrooms]BR [Type] in [District]"
- Example: "Spacious 2BR Apartment in Central"
- Keep under 100 characters
- Include key selling points

**Description:**
- First paragraph: Overview and key features
- Second paragraph: Location benefits and nearby facilities
- Third paragraph: Lease terms and contact information
- Be specific about what's included
- Mention any restrictions clearly

**Pricing:**
- Always enter price in HKD
- Include only the monthly rent (exclude utilities if separate)
- Be consistent with market rates for the area

### 7. Publishing Workflow

**Before Publishing:**
1. ✅ Complete all required fields
2. ✅ Verify map location is correct
3. ✅ Check all photos are uploaded and display correctly
4. ✅ Review amenities list for accuracy
5. ✅ Proofread listing name and description
6. ✅ Confirm rental price is correct

**Draft Usage:**
- Use drafts for incomplete listings
- Save drafts regularly to avoid data loss
- Drafts are not visible to clients
- Can edit drafts unlimited times before publishing

**Status Management:**
- `draft` - Work in progress, not visible to clients
- `published` - Active listing, visible to all clients
- `archived` - No longer available, hidden from search but kept in records
- `expired` - Lease period ended, can be republished if needed

---

## Technical Notes

### File Locations

**Add Property Flow:**
- Main component: `/src/components/dashboard/AddPropertyView.tsx`
- Step components: `/src/components/add-property/Step[1-8]*.tsx`

**Edit Property Flow:**
- Main component: `/src/components/dashboard/InlineEditPropertyView.tsx`
- Section components: `/src/components/dashboard/property-sections/*Section.tsx`

**Constants:**
- Property types: `/src/types/property.ts`
- Amenities: `/src/constants/amenities.ts`
- Locations: `/src/constants/locations.ts`

### API Endpoints

**Property Operations:**
- Create: `POST /api/properties`
- Read: `GET /api/properties/:uuid`
- Update: `PATCH /api/properties/:uuid`
- Delete: `DELETE /api/properties/:uuid`

**Draft Operations:**
- Save draft: `POST /api/properties/draft`
- Update draft: `PATCH /api/properties/draft/:uuid`
- Delete draft: `DELETE /api/properties/draft/:uuid`

**File Upload:**
- Upload photos: `POST /api/upload`
- Storage: AWS S3

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-17 | 1.0.0 | Initial documentation created |

---

## Support

For questions or issues with the admin listing upload system, please contact the development team or refer to the codebase comments for detailed implementation notes.
