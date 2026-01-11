# Administrator Users Module - Migration Guide

## Overview

This document provides a comprehensive guide for migrating the Administrator Users module from the TastyPlates Business Portal to another application. The Administrator Users module manages system administrators (not merchants) who have access to the admin dashboard with role-based permissions.

## Module Description

The Administrator Users module is a unified authentication and authorization system that:
- Manages administrator accounts separately from merchant accounts
- Implements role-based access control (RBAC)
- Handles session management and authentication
- Tracks login history and security events
- Provides granular permission management

### Key Features

1. **User Authentication**: Secure login/logout with session management
2. **Role-Based Access Control**: 7 predefined administrator roles with customizable permissions
3. **Session Management**: Token-based authentication with refresh tokens
4. **Security Tracking**: Login history, password resets, and audit trails
5. **Permission System**: 50+ granular permissions across 6 categories

## Database Schema

**Important**: All tables are created in the `real_estate` schema. All SQL commands must reference tables with the schema prefix: `real_estate.table_name`

### Core Tables

The Administrator Users module consists of five core tables:

#### 1. `real_estate.users` Table
**Purpose**: Main user accounts table for both administrators and merchants

**Key Fields for Administrators**:
- `id` (UUID) - Primary key
- `email` (VARCHAR) - Unique email address
- `password_hash` (VARCHAR) - Hashed password (PBKDF2)
- `password_salt` (VARCHAR) - Password salt
- `account_type` (VARCHAR) - Must be 'administrator' for admin users
- `status` (VARCHAR) - Account status: active, inactive, pending, suspended
- `name` (VARCHAR) - Administrator name
- `phone` (VARCHAR) - Contact phone
- `avatar` (TEXT) - Profile image URL
- `role_id` (VARCHAR) - Foreign key to admin_roles
- `permissions` (TEXT[]) - User-specific permissions override
- `created_at`, `updated_at`, `last_login_at`, `email_verified_at` (TIMESTAMP)

**Constraints**:
- Administrators must have `company_name` as NULL
- Email must be unique
- `role_id` must exist in `real_estate.admin_roles` table

#### 2. `real_estate.user_sessions` Table
**Purpose**: Active session management with token-based authentication

**Fields**:
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to users
- `token` (VARCHAR) - Access token (unique)
- `refresh_token` (VARCHAR) - Refresh token (unique)
- `expires_at` (TIMESTAMP) - Token expiration
- `ip_address` (INET) - Client IP address
- `user_agent` (TEXT) - Client user agent
- `is_active` (BOOLEAN) - Session status
- `created_at` (TIMESTAMP)

**Relationships**:
- `user_id` → `real_estate.users(id)` ON DELETE CASCADE

#### 3. `real_estate.user_roles` Table
**Purpose**: Role assignments (many-to-many relationship)

**Fields**:
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to users
- `role_id` (VARCHAR) - Foreign key to admin_roles
- `assigned_at` (TIMESTAMP) - Assignment timestamp
- `assigned_by` (UUID) - Foreign key to users (who assigned)

**Constraints**:
- UNIQUE(user_id, role_id) - One role per user
- Both foreign keys cascade on delete

#### 4. `real_estate.admin_roles` Table
**Purpose**: Role definitions with permissions

**Fields**:
- `id` (VARCHAR) - Primary key (role identifier)
- `name` (VARCHAR) - Role display name
- `description` (TEXT) - Role description
- `permissions` (TEXT[]) - Array of permission strings
- `is_default` (BOOLEAN) - Default role flag
- `created_at`, `updated_at` (TIMESTAMP)

**Default Roles**:
1. `super_admin` - Full system access (`*` permission)
2. `system_admin` - System administration
3. `user_admin` - User management
4. `content_admin` - Content management
5. `analytics_admin` - Analytics and reporting
6. `support_admin` - Customer support
7. `viewer` - Read-only access (default)

#### 5. `real_estate.users_with_roles` View
**Purpose**: Joined view for easy querying of users with their roles

**Definition**: Combines `real_estate.users`, `real_estate.admin_roles`, and displays complete user profile with role information

### Supporting Tables

#### 6. `real_estate.user_password_resets` Table
**Purpose**: Password reset token management

**Fields**:
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to users
- `token` (VARCHAR) - Reset token (unique)
- `expires_at` (TIMESTAMP) - Token expiration
- `used_at` (TIMESTAMP) - When token was used
- `ip_address` (INET) - Request IP
- `created_at` (TIMESTAMP)

#### 7. `real_estate.user_login_history` Table
**Purpose**: Login attempt tracking and audit trail

**Fields**:
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to users
- `login_at` (TIMESTAMP) - Login timestamp
- `ip_address` (INET) - Client IP
- `user_agent` (TEXT) - Client user agent
- `success` (BOOLEAN) - Login success/failure
- `failure_reason` (VARCHAR) - Failure description

## Dependencies and Relationships

### Internal Dependencies

1. **real_estate.users** ← **real_estate.user_sessions**: One-to-many (user has multiple sessions)
2. **real_estate.users** ← **real_estate.user_password_resets**: One-to-many (user can have multiple reset requests)
3. **real_estate.users** ← **real_estate.user_login_history**: One-to-many (user has login history)
4. **real_estate.users** ↔ **real_estate.admin_roles**: Many-to-one through role_id field
5. **real_estate.user_roles**: Junction table connecting **real_estate.users** and **real_estate.admin_roles**

### External Dependencies

The Administrator Users module is independent but may have references from:
- `real_estate.merchant_restaurants` table (for merchant users, not administrators)
- Any audit log tables
- Application-level authentication middleware

### Data Integrity Constraints

All foreign keys use `ON DELETE CASCADE` to ensure referential integrity:
- Deleting a user removes all their sessions, password resets, login history
- Deleting a role removes role assignments but not users
- User deletion triggers are managed automatically

## Permission System

### Permission Categories

1. **System Permissions** (2 permissions)
   - `system:view`, `system:manage`

2. **User Management** (19 permissions)
   - Users, merchants, administrators, roles management

3. **Content Management** (10 permissions)
   - Restaurants, reviews, categories

4. **Analytics** (8 permissions)
   - Analytics, reports, metrics, dashboard

5. **Settings** (2 permissions)
   - `settings:view`, `settings:edit`

6. **Support** (7 permissions)
   - Support tickets and issue resolution

### Permission Checking

Permissions are checked using:
- Role-based permissions from `real_estate.admin_roles.permissions`
- User-specific overrides from `real_estate.users.permissions`
- Wildcard `*` grants all permissions

## Migration Steps

### Phase 1: Preparation (Before Migration)

1. **Audit Current System**
   ```sql
   -- Count administrators
   SELECT COUNT(*) FROM real_estate.users WHERE account_type = 'administrator';
   
   -- List all administrators with roles
   SELECT * FROM real_estate.users_with_roles WHERE account_type = 'administrator';
   
   -- Check active sessions
   SELECT COUNT(*) FROM real_estate.user_sessions 
   JOIN real_estate.users ON real_estate.user_sessions.user_id = real_estate.users.id 
   WHERE real_estate.users.account_type = 'administrator';
   ```

2. **Backup Data**
   - Export all administrator users
   - Export user sessions (if needed for migration)
   - Export login history (for audit trail)
   - Export role definitions and assignments

3. **Document Custom Roles**
   - List any custom roles beyond the 7 defaults
   - Document custom permissions
   - Map role assignments

### Phase 2: Export Data

1. **Export User Data**
   ```bash
   # See administrator_users_export.sql for complete export script
   ```

2. **Export Configuration**
   - Role definitions from `real_estate.admin_roles`
   - Permission mappings
   - Security policies and constraints

3. **Export Relationships**
   - Role assignments from `real_estate.user_roles`
   - Active sessions (if needed)

### Phase 3: Target System Setup

1. **Create Database Schema**
   - Run the complete SQL schema creation script
   - Apply all indexes and constraints
   - Create views and helper functions
   - **Ensure the `real_estate` schema exists in target database**

2. **Configure Security**
   - Set up Row Level Security (RLS) policies if using PostgreSQL
   - Configure authentication mechanisms
   - Set up encryption for sensitive fields

3. **Import Data**
   - Import role definitions first
   - Import users with account_type filtering
   - Import role assignments
   - Import supporting data (sessions, login history)

### Phase 4: Application Migration

1. **Update Authentication Logic**
   - Adapt authentication endpoints to new database
   - Update session management code
   - Migrate password hashing (ensure PBKDF2 compatibility)
   - **Update all table references to include `real_estate` schema**

2. **Update Authorization Logic**
   - Implement permission checking functions
   - Update role-based guards
   - Migrate middleware for route protection

3. **Update User Management**
   - Adapt user CRUD operations
   - Update role assignment functionality
   - Migrate profile management

### Phase 5: Verification

1. **Data Integrity Checks**
   ```sql
   -- Verify all administrators have roles
   SELECT COUNT(*) FROM real_estate.users 
   WHERE account_type = 'administrator' AND role_id IS NULL;
   
   -- Verify foreign key integrity
   SELECT COUNT(*) FROM real_estate.user_roles ur
   WHERE NOT EXISTS (SELECT 1 FROM real_estate.users WHERE id = ur.user_id);
   ```

2. **Functional Testing**
   - Test login/logout flows
   - Test permission checking
   - Test role assignments
   - Test session management

3. **Security Testing**
   - Test password hashing
   - Test token generation
   - Test RLS policies (if applicable)
   - Test audit logging

### Phase 6: Cutover

1. **Parallel Run** (recommended)
   - Run both systems simultaneously
   - Compare results
   - Validate data consistency

2. **Incremental Migration**
   - Migrate administrators in batches
   - Verify each batch
   - Roll back if issues occur

3. **Final Cutover**
   - Update DNS/routing
   - Invalidate old sessions
   - Force re-login for all users

## Migration Checklist

### Pre-Migration
- [ ] Audit current administrator accounts
- [ ] Document all custom roles and permissions
- [ ] Backup all data
- [ ] Review dependencies
- [ ] Test export scripts
- [ ] Prepare rollback plan
- [ ] Verify `real_estate` schema exists in target database

### Database Migration
- [ ] Create target database schema
- [ ] Ensure `real_estate` schema exists
- [ ] Apply all indexes and constraints
- [ ] Create views and functions
- [ ] Import role definitions
- [ ] Import administrator users
- [ ] Import role assignments
- [ ] Import supporting data
- [ ] Verify data integrity

### Application Migration
- [ ] Update authentication code (include schema prefix)
- [ ] Update authorization middleware
- [ ] Update user management features
- [ ] Update session handling
- [ ] Update password reset flows
- [ ] Update profile management
- [ ] Update all SQL queries to use `real_estate` schema

### Testing
- [ ] Test authentication flows
- [ ] Test authorization checks
- [ ] Test role management
- [ ] Test session management
- [ ] Test password resets
- [ ] Security audit
- [ ] Performance testing

### Post-Migration
- [ ] Monitor error logs
- [ ] Monitor authentication failures
- [ ] Verify audit trails
- [ ] Update documentation
- [ ] Train support team
- [ ] Clean up old system (after verification period)

## Security Considerations

### Password Security
- **Hashing**: Uses PBKDF2 with high iteration count
- **Salt**: Unique per user, stored separately
- **Strength**: Enforce minimum 8 characters, complexity requirements
- **Rotation**: Consider periodic password changes for high-privilege roles

### Session Security
- **Token Lifetime**: Access tokens expire in 15-30 minutes
- **Refresh Tokens**: Long-lived, must be rotated on use
- **Invalidation**: Support immediate session termination
- **Storage**: Tokens must be securely stored (httpOnly cookies recommended)

### Permission Security
- **Least Privilege**: Assign minimum necessary permissions
- **Audit Trail**: Log all permission changes
- **Review Cycle**: Regular role and permission reviews
- **Separation of Duties**: Critical operations require multiple roles

### Data Protection
- **PII**: Name, email, phone are personal data
- **Encryption**: Consider column-level encryption for sensitive fields
- **Compliance**: GDPR, CCPA considerations for user data
- **Retention**: Define data retention policies

## API Integration

### Required Endpoints

The target application should implement:

1. **Authentication**
   - `POST /api/auth/login` - User login
   - `POST /api/auth/logout` - User logout
   - `POST /api/auth/refresh` - Refresh token
   - `POST /api/auth/reset-password` - Request password reset
   - `PUT /api/auth/reset-password/:token` - Complete password reset

2. **User Management**
   - `GET /api/users` - List administrators
   - `GET /api/users/:id` - Get administrator details
   - `POST /api/users` - Create administrator
   - `PUT /api/users/:id` - Update administrator
   - `DELETE /api/users/:id` - Delete administrator

3. **Role Management**
   - `GET /api/roles` - List roles
   - `GET /api/roles/:id` - Get role details
   - `POST /api/roles` - Create role
   - `PUT /api/roles/:id` - Update role
   - `DELETE /api/roles/:id` - Delete role
   - `POST /api/users/:id/roles` - Assign role to user
   - `DELETE /api/users/:id/roles/:roleId` - Remove role from user

4. **Session Management**
   - `GET /api/sessions` - List user sessions
   - `DELETE /api/sessions/:id` - Terminate session
   - `DELETE /api/sessions` - Terminate all sessions

### GraphQL Alternative

If using GraphQL, refer to `USER_AUTHENTICATION_SYSTEM.md` for complete schema definitions.

## Troubleshooting

### Common Issues

1. **Password Hash Mismatch**
   - Ensure PBKDF2 algorithm matches
   - Verify salt is correctly applied
   - Check iteration count consistency

2. **Foreign Key Violations**
   - Import in correct order: roles → users → role_assignments
   - Verify all referenced IDs exist
   - Check cascade rules
   - **Ensure schema prefix is used in all foreign key references**

3. **Permission Checking Failures**
   - Verify role permissions array format
   - Check wildcard `*` handling
   - Validate user-specific permission overrides

4. **Session Issues**
   - Check token expiration handling
   - Verify refresh token rotation
   - Validate token uniqueness

5. **Schema Not Found Errors**
   - Verify `real_estate` schema exists: `CREATE SCHEMA IF NOT EXISTS real_estate;`
   - Check database user has access to the schema
   - Verify all table references include schema prefix

## Performance Optimization

### Recommended Indexes

All critical indexes are included in the export script:
- Email lookups: `idx_users_email`
- Account type filtering: `idx_users_account_type`
- Role lookups: `idx_users_role_id`
- Session queries: `idx_user_sessions_user_id`, `idx_user_sessions_token`
- Login history: `idx_user_login_history_user_id`

### Query Optimization Tips

1. Use `real_estate.users_with_roles` view for joined queries
2. Filter by `account_type = 'administrator'` early
3. Use pagination for large result sets
4. Consider materialized views for complex analytics
5. Always include schema prefix in queries for better performance

### Caching Strategy

- Cache role definitions (rarely change)
- Cache user permissions (invalidate on role change)
- Don't cache sensitive data (passwords, tokens)

## Support and Maintenance

### Monitoring

Monitor these metrics:
- Failed login attempts (security)
- Session count (resource usage)
- Token expiration errors (UX)
- Role assignment changes (audit)

### Regular Maintenance

- Clean up expired sessions (weekly)
- Archive old login history (monthly)
- Review and rotate administrator passwords (quarterly)
- Audit role assignments (quarterly)

## Additional Resources

### Related Documentation

- `USER_AUTHENTICATION_SYSTEM.md` - Complete authentication system overview
- `ROLES_AND_PERMISSIONS.md` - Detailed permission system documentation
- `USER_AUTHENTICATION_MIGRATION.sql` - Original migration script
- `USER_ROLE_MIGRATION.sql` - Role system migration script

### Source Code References

- `src/lib/auth.ts` - Authentication utilities
- `src/lib/unified-auth.ts` - Unified authentication logic
- `src/constants/roles.ts` - Role and permission definitions
- `src/app/api/auth/` - Authentication API endpoints

## Migration Timeframe Estimate

| Phase | Estimated Time | Notes |
|-------|---------------|-------|
| Preparation | 1-2 days | Audit, backup, planning |
| Database Setup | 4-8 hours | Schema creation, data import |
| Application Migration | 3-5 days | Code updates, testing |
| Testing | 2-3 days | Comprehensive testing |
| Parallel Run | 1-2 weeks | Optional but recommended |
| Final Cutover | 4-8 hours | DNS, monitoring |
| **Total** | **2-4 weeks** | Depends on complexity |

## Rollback Plan

If migration fails:

1. **Immediate Actions**
   - Revert DNS/routing to old system
   - Notify all administrators
   - Document failure reasons

2. **Data Recovery**
   - Restore from backups
   - Verify data integrity
   - Check for lost transactions

3. **Investigation**
   - Review error logs
   - Identify root cause
   - Plan corrective actions

4. **Retry**
   - Address identified issues
   - Retest in staging environment
   - Schedule new migration window

## Conclusion

This migration guide provides a comprehensive roadmap for moving the Administrator Users module to a new application. Follow the phases sequentially, verify at each step, and maintain backups throughout the process.

**Important**: All database operations must reference the `real_estate` schema. Ensure the schema exists in the target database before running migration scripts.

For questions or issues during migration, refer to the troubleshooting section or contact the system architects.

---

**Document Version**: 1.0  
**Last Updated**: January 3, 2026  
**Author**: TastyPlates Development Team

