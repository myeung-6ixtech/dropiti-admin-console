-- =====================================================
-- Administrator Users Module - Export Script
-- TastyPlates Business Portal
-- =====================================================
--
-- This script exports the complete Administrator Users module
-- for migration to another application.
--
-- IMPORTANT: All tables are created in the 'real_estate' schema.
-- Ensure the schema exists before running: CREATE SCHEMA IF NOT EXISTS real_estate;
--
-- TABLES INCLUDED:
-- 1. real_estate.administrator_users (administrators only)
-- 2. real_estate.user_sessions (administrator sessions only)
-- 3. real_estate.user_roles (administrator role assignments)
-- 4. real_estate.admin_roles (role definitions)
-- 5. real_estate.user_password_resets (administrator password resets)
-- 6. real_estate.user_login_history (administrator login history)
--
-- USAGE:
-- 1. Ensure real_estate schema exists: CREATE SCHEMA IF NOT EXISTS real_estate;
-- 2. Create tables in target database using schema creation section
-- 3. Export data using data export section
-- 4. Verify data integrity using verification section
--
-- =====================================================

-- =====================================================
-- SECTION 0: SCHEMA CREATION
-- =====================================================
-- Ensure the real_estate schema exists
CREATE SCHEMA IF NOT EXISTS real_estate;

-- =====================================================
-- SECTION 1: SCHEMA CREATION
-- =====================================================
-- Run these commands in the TARGET database to create the schema

-- -----------------------------------------------------
-- 1.1 Create administrator_users table
-- -----------------------------------------------------
CREATE TABLE real_estate.administrator_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    password_salt VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
    
    -- Profile information
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    avatar TEXT,
    
    -- Additional fields (optional)
    company_name VARCHAR(255),
    business_type VARCHAR(100),
    address TEXT,
    description TEXT,
    
    -- Role and permissions
    role_id VARCHAR(50),
    permissions TEXT[] DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    email_verified_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for administrator_users table
CREATE INDEX idx_administrator_users_email ON real_estate.administrator_users(email);
CREATE INDEX idx_administrator_users_status ON real_estate.administrator_users(status);
CREATE INDEX idx_administrator_users_created_at ON real_estate.administrator_users(created_at);
CREATE INDEX idx_administrator_users_role_id ON real_estate.administrator_users(role_id);
CREATE INDEX idx_administrator_users_status_role_id ON real_estate.administrator_users(status, role_id);

-- -----------------------------------------------------
-- 1.2 Create admin_roles table
-- -----------------------------------------------------
CREATE TABLE real_estate.admin_roles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    permissions TEXT[] NOT NULL DEFAULT '{}',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for admin_roles table
CREATE INDEX idx_admin_roles_name ON real_estate.admin_roles(name);
CREATE INDEX idx_admin_roles_is_default ON real_estate.admin_roles(is_default);

-- -----------------------------------------------------
-- 1.3 Create user_roles table (role assignments)
-- -----------------------------------------------------
CREATE TABLE real_estate.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES real_estate.administrator_users(id) ON DELETE CASCADE,
    role_id VARCHAR(50) NOT NULL REFERENCES real_estate.admin_roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES real_estate.administrator_users(id),
    UNIQUE(user_id, role_id)
);

-- Create indexes for user_roles table
CREATE INDEX idx_user_roles_user_id ON real_estate.user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON real_estate.user_roles(role_id);
CREATE INDEX idx_user_roles_assigned_at ON real_estate.user_roles(assigned_at);
CREATE INDEX idx_user_roles_user_id_role_id ON real_estate.user_roles(user_id, role_id);

-- -----------------------------------------------------
-- 1.4 Create user_sessions table
-- -----------------------------------------------------
CREATE TABLE real_estate.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES real_estate.administrator_users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for user_sessions table
CREATE INDEX idx_user_sessions_user_id ON real_estate.user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON real_estate.user_sessions(token);
CREATE INDEX idx_user_sessions_refresh_token ON real_estate.user_sessions(refresh_token);
CREATE INDEX idx_user_sessions_expires_at ON real_estate.user_sessions(expires_at);

-- -----------------------------------------------------
-- 1.5 Create user_password_resets table
-- -----------------------------------------------------
CREATE TABLE real_estate.user_password_resets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES real_estate.administrator_users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for user_password_resets table
CREATE INDEX idx_user_password_resets_user_id ON real_estate.user_password_resets(user_id);
CREATE INDEX idx_user_password_resets_token ON real_estate.user_password_resets(token);
CREATE INDEX idx_user_password_resets_expires_at ON real_estate.user_password_resets(expires_at);

-- -----------------------------------------------------
-- 1.6 Create user_login_history table
-- -----------------------------------------------------
CREATE TABLE real_estate.user_login_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES real_estate.administrator_users(id) ON DELETE CASCADE,
    login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(255)
);

-- Create indexes for user_login_history table
CREATE INDEX idx_user_login_history_user_id ON real_estate.user_login_history(user_id);
CREATE INDEX idx_user_login_history_login_at ON real_estate.user_login_history(login_at);
CREATE INDEX idx_user_login_history_success ON real_estate.user_login_history(success);

-- -----------------------------------------------------
-- 1.7 Add foreign key constraint for role_id in administrator_users table
-- -----------------------------------------------------
ALTER TABLE real_estate.administrator_users 
ADD CONSTRAINT fk_administrator_users_role_id 
FOREIGN KEY (role_id) REFERENCES real_estate.admin_roles(id) ON DELETE SET NULL;

-- -----------------------------------------------------
-- 1.8 Create views
-- -----------------------------------------------------

-- View: users_with_roles - Combines administrator_users with their role information
CREATE VIEW real_estate.users_with_roles AS
SELECT 
    u.id,
    u.email,
    u.status,
    u.name,
    u.phone,
    u.avatar,
    u.company_name,
    u.business_type,
    u.address,
    u.description,
    u.created_at,
    u.updated_at,
    u.last_login_at,
    u.email_verified_at,
    u.role_id,
    ar.name as role_name,
    ar.description as role_description,
    ar.permissions as role_permissions,
    u.permissions as user_permissions
FROM real_estate.administrator_users u
LEFT JOIN real_estate.admin_roles ar ON u.role_id = ar.id;

-- View: role_assignments - Role assignments with user details
CREATE VIEW real_estate.role_assignments AS
SELECT 
    ur.id as assignment_id,
    ur.user_id,
    u.name as user_name,
    u.email as user_email,
    ur.role_id,
    ar.name as role_name,
    ar.description as role_description,
    ur.assigned_at,
    ur.assigned_by,
    assigner.name as assigned_by_name
FROM real_estate.user_roles ur
JOIN real_estate.administrator_users u ON ur.user_id = u.id
JOIN real_estate.admin_roles ar ON ur.role_id = ar.id
LEFT JOIN real_estate.administrator_users assigner ON ur.assigned_by = assigner.id;

-- =====================================================
-- SECTION 2: TRIGGERS AND FUNCTIONS
-- =====================================================

-- -----------------------------------------------------
-- 2.1 Create function to update updated_at timestamp
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION real_estate.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for administrator_users table
CREATE TRIGGER update_administrator_users_updated_at 
    BEFORE UPDATE ON real_estate.administrator_users 
    FOR EACH ROW 
    EXECUTE FUNCTION real_estate.update_updated_at_column();

-- Create trigger for admin_roles table
CREATE TRIGGER update_admin_roles_updated_at 
    BEFORE UPDATE ON real_estate.admin_roles 
    FOR EACH ROW 
    EXECUTE FUNCTION real_estate.update_updated_at_column();

-- -----------------------------------------------------
-- 2.2 Create helper functions for permission checking
-- -----------------------------------------------------

-- Function to get combined user permissions
CREATE OR REPLACE FUNCTION real_estate.get_user_permissions(user_uuid UUID)
RETURNS TEXT[] AS $$
DECLARE
    role_perms TEXT[];
    user_perms TEXT[];
    combined_perms TEXT[];
BEGIN
    -- Get role permissions
    SELECT permissions INTO role_perms
    FROM real_estate.admin_roles ar
    JOIN real_estate.administrator_users u ON u.role_id = ar.id
    WHERE u.id = user_uuid;
    
    -- Get user-specific permissions
    SELECT permissions INTO user_perms
    FROM real_estate.administrator_users
    WHERE id = user_uuid;
    
    -- Combine permissions (user permissions override role permissions)
    combined_perms := COALESCE(role_perms, ARRAY[]::TEXT[]) || COALESCE(user_perms, ARRAY[]::TEXT[]);
    
    -- Remove duplicates
    SELECT ARRAY_AGG(DISTINCT perm) INTO combined_perms
    FROM UNNEST(combined_perms) AS perm;
    
    RETURN COALESCE(combined_perms, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION real_estate.has_permission(user_uuid UUID, required_permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_perms TEXT[];
BEGIN
    -- Get user permissions
    user_perms := real_estate.get_user_permissions(user_uuid);
    
    -- Check if user has the required permission or wildcard
    RETURN required_permission = ANY(user_perms) OR '*' = ANY(user_perms);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SECTION 3: DEFAULT DATA - ADMIN ROLES
-- =====================================================

-- Insert default admin roles
INSERT INTO real_estate.admin_roles (id, name, description, permissions, is_default) VALUES

-- Super Administrator - Full system access
('super_admin', 'Super Administrator', 'Full system access with complete control over all features and settings', 
    ARRAY['*'], 
    false),

-- System Administrator - System-level administration
('system_admin', 'System Administrator', 'System-level administration with access to user management and system settings', 
    ARRAY[
        'system:view', 'system:manage',
        'users:view', 'users:create', 'users:edit', 'users:delete',
        'roles:view', 'roles:create', 'roles:edit', 'roles:delete',
        'analytics:view', 'analytics:export',
        'settings:view', 'settings:edit'
    ], 
    false),

-- User Administrator - User management
('user_admin', 'User Administrator', 'Manages users, merchants, and administrator accounts', 
    ARRAY[
        'users:view', 'users:create', 'users:edit', 'users:delete',
        'merchants:view', 'merchants:create', 'merchants:edit', 'merchants:delete',
        'merchants:assign_restaurants', 'merchants:unassign_restaurants',
        'administrators:view', 'administrators:create', 'administrators:edit', 'administrators:delete',
        'roles:view', 'roles:assign'
    ], 
    false),

-- Content Administrator - Content management
('content_admin', 'Content Administrator', 'Manages restaurant listings, content, and reviews', 
    ARRAY[
        'restaurants:view', 'restaurants:create', 'restaurants:edit', 'restaurants:delete',
        'restaurants:approve', 'restaurants:reject',
        'reviews:view', 'reviews:moderate', 'reviews:delete',
        'content:view', 'content:edit',
        'categories:view', 'categories:manage'
    ], 
    false),

-- Analytics Administrator - Analytics and reporting
('analytics_admin', 'Analytics Administrator', 'Access to analytics, reports, and system metrics', 
    ARRAY[
        'analytics:view', 'analytics:export',
        'reports:view', 'reports:generate', 'reports:export',
        'metrics:view',
        'dashboard:view', 'dashboard:customize'
    ], 
    false),

-- Support Administrator - Customer support
('support_admin', 'Support Administrator', 'Customer support and issue resolution', 
    ARRAY[
        'users:view', 'merchants:view', 'restaurants:view',
        'support:view', 'support:respond', 'support:escalate',
        'tickets:view', 'tickets:create', 'tickets:update', 'tickets:close'
    ], 
    false),

-- Viewer - Read-only access (default role)
('viewer', 'Viewer', 'Read-only access to system information and reports', 
    ARRAY[
        'dashboard:view',
        'users:view', 'merchants:view', 'restaurants:view',
        'analytics:view', 'reports:view'
    ], 
    true);

-- =====================================================
-- SECTION 4: DATA EXPORT QUERIES
-- =====================================================
-- Use these queries to export data from SOURCE database
-- IMPORTANT: Update these queries to use real_estate schema if source also uses it

-- -----------------------------------------------------
-- 4.1 Export admin_roles (already included above)
-- -----------------------------------------------------
-- Already created with default roles in Section 3

-- -----------------------------------------------------
-- 4.2 Export administrator users
-- -----------------------------------------------------
-- EXPORT QUERY: Run this in SOURCE database and import into TARGET
-- If source uses real_estate schema with users table, use: SELECT ... FROM real_estate.users WHERE account_type = 'administrator'
-- If source uses different schema, adjust accordingly
-- NOTE: If exporting from old users table, filter by account_type = 'administrator'
SELECT 
    id, email, password_hash, password_salt, status,
    name, phone, avatar, company_name, business_type, address, description,
    role_id, permissions,
    created_at, updated_at, last_login_at, email_verified_at
FROM real_estate.administrator_users
ORDER BY created_at;

-- IMPORT TEMPLATE: Use this INSERT statement in TARGET database
-- INSERT INTO real_estate.administrator_users (
--     id, email, password_hash, password_salt, status,
--     name, phone, avatar, company_name, business_type, address, description,
--     role_id, permissions,
--     created_at, updated_at, last_login_at, email_verified_at
-- ) VALUES
-- (...values from export query...);

-- -----------------------------------------------------
-- 4.3 Export user_roles (administrator role assignments)
-- -----------------------------------------------------
-- EXPORT QUERY:
-- NOTE: If exporting from old users table, add: WHERE u.account_type = 'administrator'
SELECT 
    ur.id, ur.user_id, ur.role_id, ur.assigned_at, ur.assigned_by
FROM real_estate.user_roles ur
JOIN real_estate.administrator_users u ON ur.user_id = u.id
ORDER BY ur.assigned_at;

-- IMPORT TEMPLATE:
-- INSERT INTO real_estate.user_roles (id, user_id, role_id, assigned_at, assigned_by)
-- VALUES (...values from export query...);

-- -----------------------------------------------------
-- 4.4 Export user_sessions (administrator sessions)
-- -----------------------------------------------------
-- EXPORT QUERY:
-- NOTE: If exporting from old users table, add: WHERE u.account_type = 'administrator'
SELECT 
    s.id, s.user_id, s.token, s.refresh_token, s.expires_at,
    s.ip_address, s.user_agent, s.is_active, s.created_at
FROM real_estate.user_sessions s
JOIN real_estate.administrator_users u ON s.user_id = u.id
WHERE s.is_active = TRUE
  AND s.expires_at > NOW()
ORDER BY s.created_at DESC;

-- IMPORT TEMPLATE:
-- INSERT INTO real_estate.user_sessions (
--     id, user_id, token, refresh_token, expires_at,
--     ip_address, user_agent, is_active, created_at
-- ) VALUES (...values from export query...);

-- NOTE: Consider whether to migrate sessions or force re-login

-- -----------------------------------------------------
-- 4.5 Export user_password_resets (administrator resets)
-- -----------------------------------------------------
-- EXPORT QUERY:
-- NOTE: If exporting from old users table, add: WHERE u.account_type = 'administrator'
SELECT 
    pr.id, pr.user_id, pr.token, pr.expires_at, pr.used_at,
    pr.ip_address, pr.created_at
FROM real_estate.user_password_resets pr
JOIN real_estate.administrator_users u ON pr.user_id = u.id
WHERE pr.expires_at > NOW()
  AND pr.used_at IS NULL
ORDER BY pr.created_at DESC;

-- IMPORT TEMPLATE:
-- INSERT INTO real_estate.user_password_resets (
--     id, user_id, token, expires_at, used_at, ip_address, created_at
-- ) VALUES (...values from export query...);

-- NOTE: Consider whether to migrate pending reset tokens

-- -----------------------------------------------------
-- 4.6 Export user_login_history (administrator history)
-- -----------------------------------------------------
-- EXPORT QUERY: Last 90 days of login history
-- NOTE: If exporting from old users table, add: WHERE u.account_type = 'administrator'
SELECT 
    lh.id, lh.user_id, lh.login_at, lh.ip_address, lh.user_agent,
    lh.success, lh.failure_reason
FROM real_estate.user_login_history lh
JOIN real_estate.administrator_users u ON lh.user_id = u.id
WHERE lh.login_at > NOW() - INTERVAL '90 days'
ORDER BY lh.login_at DESC;

-- IMPORT TEMPLATE:
-- INSERT INTO real_estate.user_login_history (
--     id, user_id, login_at, ip_address, user_agent, success, failure_reason
-- ) VALUES (...values from export query...);

-- NOTE: Adjust time range as needed for audit requirements

-- =====================================================
-- SECTION 5: DATA VERIFICATION QUERIES
-- =====================================================
-- Run these queries in TARGET database after import

-- -----------------------------------------------------
-- 5.1 Verify administrator user count
-- -----------------------------------------------------
SELECT 
    'Administrator Users' as entity,
    COUNT(*) as total_count,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
    COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_count,
    COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_count
FROM real_estate.administrator_users;

-- -----------------------------------------------------
-- 5.2 Verify role assignments
-- -----------------------------------------------------
SELECT 
    'Role Assignments' as entity,
    COUNT(*) as total_assignments,
    COUNT(DISTINCT user_id) as users_with_roles,
    COUNT(DISTINCT role_id) as roles_in_use
FROM real_estate.user_roles ur
JOIN real_estate.administrator_users u ON ur.user_id = u.id;

-- -----------------------------------------------------
-- 5.3 Verify administrators by role
-- -----------------------------------------------------
SELECT 
    COALESCE(ar.name, 'No Role') as role_name,
    COUNT(*) as admin_count
FROM real_estate.administrator_users u
LEFT JOIN real_estate.admin_roles ar ON u.role_id = ar.id
GROUP BY ar.name
ORDER BY admin_count DESC;

-- -----------------------------------------------------
-- 5.4 Verify active sessions
-- -----------------------------------------------------
SELECT 
    'Active Sessions' as entity,
    COUNT(*) as total_sessions,
    COUNT(DISTINCT user_id) as users_with_sessions,
    COUNT(CASE WHEN expires_at < NOW() THEN 1 END) as expired_sessions,
    COUNT(CASE WHEN expires_at >= NOW() THEN 1 END) as valid_sessions
FROM real_estate.user_sessions s
JOIN real_estate.administrator_users u ON s.user_id = u.id;

-- -----------------------------------------------------
-- 5.5 Verify foreign key integrity
-- -----------------------------------------------------
-- Check for orphaned user_roles
SELECT COUNT(*) as orphaned_user_roles
FROM real_estate.user_roles ur
WHERE NOT EXISTS (SELECT 1 FROM real_estate.administrator_users WHERE id = ur.user_id)
   OR NOT EXISTS (SELECT 1 FROM real_estate.admin_roles WHERE id = ur.role_id);

-- Check for orphaned user_sessions
SELECT COUNT(*) as orphaned_sessions
FROM real_estate.user_sessions s
WHERE NOT EXISTS (SELECT 1 FROM real_estate.administrator_users WHERE id = s.user_id);

-- Check for invalid role_id in administrator_users
SELECT COUNT(*) as invalid_role_assignments
FROM real_estate.administrator_users u
WHERE u.role_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM real_estate.admin_roles WHERE id = u.role_id);

-- -----------------------------------------------------
-- 5.6 Verify data completeness
-- -----------------------------------------------------
SELECT 
    'Data Completeness' as check_type,
    COUNT(*) as total_admins,
    COUNT(CASE WHEN email IS NULL THEN 1 END) as missing_email,
    COUNT(CASE WHEN password_hash IS NULL THEN 1 END) as missing_password,
    COUNT(CASE WHEN name IS NULL THEN 1 END) as missing_name,
    COUNT(CASE WHEN role_id IS NULL THEN 1 END) as missing_role
FROM real_estate.administrator_users;

-- =====================================================
-- SECTION 6: POST-MIGRATION CLEANUP
-- =====================================================

-- -----------------------------------------------------
-- 6.1 Clean up expired sessions
-- -----------------------------------------------------
-- Run this after migration to remove old sessions
DELETE FROM real_estate.user_sessions 
WHERE expires_at < NOW() OR is_active = FALSE;

-- -----------------------------------------------------
-- 6.2 Clean up used password reset tokens
-- -----------------------------------------------------
-- Run this to clean up old password reset requests
DELETE FROM real_estate.user_password_resets 
WHERE used_at IS NOT NULL OR expires_at < NOW();

-- -----------------------------------------------------
-- 6.3 Update last_login_at for newly migrated users
-- -----------------------------------------------------
-- Optional: Force re-login by clearing last_login_at
-- UPDATE real_estate.administrator_users 
-- SET last_login_at = NULL;

-- =====================================================
-- SECTION 7: ROW LEVEL SECURITY (OPTIONAL)
-- =====================================================
-- Only needed if using PostgreSQL RLS

-- Enable RLS on administrator_users table
ALTER TABLE real_estate.administrator_users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON real_estate.administrator_users
    FOR SELECT USING (auth.uid() = id);

-- Policy: Administrators can view all users
CREATE POLICY "Administrators can view all users" ON real_estate.administrator_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM real_estate.administrator_users admin_user 
            WHERE admin_user.id = auth.uid()
        )
    );

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON real_estate.administrator_users
    FOR UPDATE USING (auth.uid() = id);

-- Policy: Administrators can update any user
CREATE POLICY "Administrators can update any user" ON real_estate.administrator_users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM real_estate.administrator_users admin_user 
            WHERE admin_user.id = auth.uid() 
            AND admin_user.role_id IN ('super_admin', 'system_admin', 'user_admin')
        )
    );

-- Enable RLS on admin_roles table
ALTER TABLE real_estate.admin_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Administrators can view all roles
CREATE POLICY "Administrators can view all roles" ON real_estate.admin_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM real_estate.administrator_users admin_user 
            WHERE admin_user.id = auth.uid()
        )
    );

-- Policy: Only super admins can manage roles
CREATE POLICY "Super admins can manage roles" ON real_estate.admin_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM real_estate.administrator_users admin_user 
            WHERE admin_user.id = auth.uid() 
            AND admin_user.role_id = 'super_admin'
        )
    );

-- Enable RLS on user_roles table
ALTER TABLE real_estate.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Administrators can view all role assignments
CREATE POLICY "Administrators can view all role assignments" ON real_estate.user_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM real_estate.administrator_users admin_user 
            WHERE admin_user.id = auth.uid()
        )
    );

-- Policy: Super admins and user admins can manage role assignments
CREATE POLICY "Admins can manage role assignments" ON real_estate.user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM real_estate.administrator_users admin_user 
            WHERE admin_user.id = auth.uid() 
            AND admin_user.role_id IN ('super_admin', 'user_admin')
        )
    );

-- Enable RLS on user_sessions table
ALTER TABLE real_estate.user_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own sessions
CREATE POLICY "Users can view own sessions" ON real_estate.user_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can manage their own sessions
CREATE POLICY "Users can manage own sessions" ON real_estate.user_sessions
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- SECTION 8: MIGRATION SUMMARY
-- =====================================================

-- Run this query to generate a migration summary
SELECT 
    'MIGRATION SUMMARY' as report_section,
    (SELECT COUNT(*) FROM real_estate.administrator_users) as total_administrators,
    (SELECT COUNT(*) FROM real_estate.admin_roles) as total_roles,
    (SELECT COUNT(*) FROM real_estate.user_roles ur JOIN real_estate.administrator_users u ON ur.user_id = u.id) as role_assignments,
    (SELECT COUNT(*) FROM real_estate.user_sessions s JOIN real_estate.administrator_users u ON s.user_id = u.id) as active_sessions,
    (SELECT COUNT(*) FROM real_estate.user_login_history lh JOIN real_estate.administrator_users u ON lh.user_id = u.id) as login_history_records,
    NOW() as migration_completed_at;

-- =====================================================
-- END OF SCRIPT
-- =====================================================
--
-- NEXT STEPS:
-- 1. Verify all data has been migrated correctly
-- 2. Test authentication flows in new application
-- 3. Test role-based permissions
-- 4. Monitor for errors in first 24-48 hours
-- 5. Keep backup of source database for 30 days
--
-- IMPORTANT REMINDERS:
-- - All tables are in the 'real_estate' schema
-- - Main table is 'real_estate.administrator_users' (not 'users')
-- - Ensure schema exists before running: CREATE SCHEMA IF NOT EXISTS real_estate;
-- - Update application code to use 'real_estate.administrator_users' table name
-- - Test all foreign key relationships after migration
--
-- For support, refer to administrator_users.md documentation
--
-- =====================================================

