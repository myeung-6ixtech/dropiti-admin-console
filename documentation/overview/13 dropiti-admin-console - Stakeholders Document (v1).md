---
stakeholders:
  internal_users:
    - Super Admin: Primary administrator with full system access and user management capabilities
    - Administrators: Additional admin users to be added for product management and scaling
  external_stakeholders:
    - Customers: Only stakeholders who can create payment intent and define payment details (tenants from Dropiti platform)
    - Beneficiaries: Recipients of payments via company transfer requests (landlords from Dropiti platform)
  platform_integration:
    - Tenants (Dropiti) → Customers (Admin Console)
    - Landlords (Dropiti) → Beneficiaries (Admin Console)
  current_state:
    - Super Admin is the only user in the user management list (Administrators)
    - System is designed to scale up with additional administrators
    - CRM contains Customers and Beneficiaries as external stakeholders
    - Users can be either Customers or Beneficiaries depending on platform usage
---

# Dropiti-admin-console - Stakeholders Document (v1)

## 1. Introduction

- **1.1. Document Purpose:** This document defines the key stakeholders involved in the Dropiti-admin-console platform, their roles, responsibilities, and relationships within the system.
- **1.2. Scope:** Covers both internal users (administrators) and external stakeholders (customers and beneficiaries) that interact with the platform.
- **1.3. Version:** v1 - Initial stakeholder mapping and definition

## 2. Internal Stakeholders (Administrators)

### 2.1. Super Admin
- **Role:** Primary system administrator
- **Current Status:** Only user currently in the user management list (Administrators)
- **Responsibilities:**
  - Full system access and configuration
  - User management and permissions
  - Platform oversight and monitoring
  - Critical system operations
  - Security and compliance oversight
- **Access Level:** Complete administrative privileges

### 2.2. Administrators (Future)
- **Role:** Additional administrative users for product management
- **Current Status:** To be added as system scales up
- **Responsibilities:**
  - Product management and operations
  - Customer and beneficiary management
  - Payment processing oversight
  - Transaction monitoring
  - Support and issue resolution
- **Access Level:** Administrative privileges (scope to be defined based on role requirements)

## 3. External Stakeholders

### 3.1. Customers
- **Definition:** Following Airwallex stakeholder definitions - only customers can create payment intent and define payment details
- **Role:** Primary users of the Dropiti platform who initiate payment transactions
- **Relationship:** External users who interact with the system through the admin console
- **Platform Integration:** Tenants from the client-facing platform 'Dropiti' are tied to Customers
- **Key Characteristics:**
  - Individuals and companies applying for real estate tenancy (tenants)
  - Users of the external SaaS platform 'Dropiti'
  - Only stakeholders who can create payment intents and define payment details
  - Subject to KYC and verification processes
  - Managed through the CRM system

### 3.2. Beneficiaries
- **Definition:** Following Airwallex stakeholder definitions - beneficiaries are added into the system and are recipients of payments via transfer requests from the company (our company)
- **Role:** Recipients of payments and transfers initiated by the company
- **Relationship:** External stakeholders who receive funds through the platform via company-initiated transfers
- **Platform Integration:** Landlords from the client-facing platform 'Dropiti' are tied to Beneficiaries
- **Key Characteristics:**
  - Payment recipients in the transaction flow (landlords)
  - Added to the system by the company for payment distribution
  - Receive payments via transfer requests initiated by the company
  - Subject to verification and compliance checks
  - Managed through the CRM system
  - Part of the payout process management

## 4. Stakeholder Relationships and Interactions

### 4.1. Platform Integration Mapping
- **Dropiti Platform → Admin Console Mapping:**
  - **Tenants** (Dropiti platform) → **Customers** (Admin console)
  - **Landlords** (Dropiti platform) → **Beneficiaries** (Admin console)
- **Role Determination:** User role depends on how they interact with the platform
  - Same user can be a Customer (tenant) in one transaction and a Beneficiary (landlord) in another
  - Role is context-dependent based on platform usage

### 4.2. Internal User Hierarchy
```
Super Admin
    ↓
Administrators (Future)
    ↓
System Operations
```

### 4.3. External Stakeholder Flow
```
Tenants (Dropiti Platform) → Customers (Payment Intent Creators)
    ↓
Admin Console Management
    ↓
Landlords (Dropiti Platform) → Beneficiaries (Payment Recipients)
```

### 4.4. Stakeholder Management
- **CRM Integration:** Both Customers and Beneficiaries are managed within the CRM system
- **Airwallex Compliance:** External stakeholders follow Airwallex definitions and requirements
- **Platform Integration:** 
  - Tenants from Dropiti platform → Customers in admin console
  - Landlords from Dropiti platform → Beneficiaries in admin console
- **KYC Processes:** Applied to both customer and beneficiary stakeholders
- **Payment Flow:** 
  - Customers create payment intents and define payment details
  - Company initiates transfer requests to Beneficiaries
- **Role Flexibility:** Users can be either Customers or Beneficiaries depending on their platform usage

## 5. Scaling Considerations

### 5.1. Administrator Expansion
- **Current State:** Single Super Admin user
- **Future State:** Multiple administrators with role-based access
- **Implementation:** Gradual scaling as operational needs grow
- **Security:** Role-based permissions and access controls

### 5.2. Stakeholder Growth
- **Customer Base:** Expected growth as Dropiti platform expands
- **Beneficiary Network:** Scaling with transaction volume
- **Management Complexity:** Addressed through admin console features

## 6. Compliance and Governance

### 6.1. Airwallex Integration
- **Stakeholder Definitions:** Aligned with Airwallex requirements
- **Compliance Standards:** Following Airwallex stakeholder guidelines
- **Documentation:** Maintaining stakeholder records as per Airwallex standards

### 6.2. Internal Governance
- **User Management:** Centralized through admin console
- **Access Control:** Role-based permissions for administrators
- **Audit Trail:** Tracking stakeholder interactions and changes

## 7. Future Considerations

### 7.1. Stakeholder Evolution
- **Additional Admin Roles:** Specialized administrator types as needed
- **Enhanced CRM Features:** Advanced stakeholder management capabilities
- **Integration Expansion:** Additional external stakeholder types

### 7.2. System Adaptability
- **Flexible Architecture:** Supporting stakeholder growth and changes
- **Scalable Management:** Admin console designed for expansion
- **Compliance Flexibility:** Adaptable to changing regulatory requirements

---

**Document Version:** v1  
**Last Updated:** [Current Date]  
**Next Review:** [Future Date]  
**Owner:** Project Management Team 