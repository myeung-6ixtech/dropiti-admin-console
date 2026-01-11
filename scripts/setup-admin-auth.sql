-- =====================================================================
-- Administrator Authentication System Setup
-- =====================================================================
-- This script sets up the complete database schema for the administrator
-- authentication system based on the documentation in:
-- documentation/guides/administrator_users.md
--
-- IMPORTANT: All tables are created in the 'real_estate' schema
-- =====================================================================

-- Ensure the real_estate schema exists
CREATE SCHEMA IF NOT EXISTS real_estate;

-- =====================================================================
-- 1. MAIN USERS TABLE
-- =====================================================================
-- Stores all users (administrators and merchants)
-- Administrators are distinguished by account_type = 'administrator'

CREATE TABLE IF NOT EXISTS real_estate.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  password_salt VARCHAR(255) NOT NULL,
  account_type VARCHAR(50) NOT NULL, -- 'administrator' or 'merchant'
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'pending', 'suspended'
  name VARCHAR(255),
  phone VARCHAR(50),
  avatar TEXT,
  role_id VARCHAR(50),
  permissions TEXT[] DEFAULT '{}',
  company_name VARCHAR(255), -- NULL for administrators
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  email_verified_at TIMESTAMPTZ,
  
  -- Constraint: administrators cannot have company_name
  CONSTRAINT check_admin_no_company CHECK (
    (account_type = 'administrator' AND company_name IS NULL) OR
    (account_type != 'administrator')
  )
);

-- =====================================================================
-- 2. ADMIN ROLES TABLE
-- =====================================================================
-- Defines available roles with their permissions

CREATE TABLE IF NOT EXISTS real_estate.admin_roles (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key after both tables are created
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_role_id_fkey'
  ) THEN
    ALTER TABLE real_estate.users 
    ADD CONSTRAINT users_role_id_fkey 
    FOREIGN KEY (role_id) REFERENCES real_estate.admin_roles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =====================================================================
-- 3. USER SESSIONS TABLE
-- =====================================================================
-- Stores active user sessions with tokens

CREATE TABLE IF NOT EXISTS real_estate.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  refresh_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  FOREIGN KEY (user_id) REFERENCES real_estate.users(id) ON DELETE CASCADE
);

-- =====================================================================
-- 4. USER ROLES TABLE (Junction Table)
-- =====================================================================
-- Many-to-many relationship between users and roles

CREATE TABLE IF NOT EXISTS real_estate.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role_id VARCHAR(50) NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID,
  
  UNIQUE(user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES real_estate.users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES real_estate.admin_roles(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES real_estate.users(id) ON DELETE SET NULL
);

-- =====================================================================
-- 5. USER PASSWORD RESETS TABLE
-- =====================================================================
-- Manages password reset tokens

CREATE TABLE IF NOT EXISTS real_estate.user_password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  FOREIGN KEY (user_id) REFERENCES real_estate.users(id) ON DELETE CASCADE
);

-- =====================================================================
-- 6. USER LOGIN HISTORY TABLE
-- =====================================================================
-- Audit trail of all login attempts

CREATE TABLE IF NOT EXISTS real_estate.user_login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  login_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  failure_reason VARCHAR(255),
  
  FOREIGN KEY (user_id) REFERENCES real_estate.users(id) ON DELETE CASCADE
);

-- =====================================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON real_estate.users(email);
CREATE INDEX IF NOT EXISTS idx_users_account_type ON real_estate.users(account_type);
CREATE INDEX IF NOT EXISTS idx_users_status ON real_estate.users(status);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON real_estate.users(role_id);

-- Sessions table indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON real_estate.user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON real_estate.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON real_estate.user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON real_estate.user_sessions(is_active);

-- User roles table indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON real_estate.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON real_estate.user_roles(role_id);

-- Password resets table indexes
CREATE INDEX IF NOT EXISTS idx_user_password_resets_token ON real_estate.user_password_resets(token);
CREATE INDEX IF NOT EXISTS idx_user_password_resets_user_id ON real_estate.user_password_resets(user_id);

-- Login history table indexes
CREATE INDEX IF NOT EXISTS idx_user_login_history_user_id ON real_estate.user_login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_login_history_login_at ON real_estate.user_login_history(login_at);
CREATE INDEX IF NOT EXISTS idx_user_login_history_success ON real_estate.user_login_history(success);

-- =====================================================================
-- DEFAULT ADMIN ROLES DATA
-- =====================================================================
-- Insert the 7 default administrator roles as defined in documentation

INSERT INTO real_estate.admin_roles (id, name, description, permissions, is_default) VALUES
('super_admin', 'Super Administrator', 'Full system access with all permissions', ARRAY['*'], false),
('system_admin', 'System Administrator', 'System configuration and management', ARRAY['system:*', 'users:*', 'settings:*'], false),
('user_admin', 'User Administrator', 'User and role management', ARRAY['users:*', 'roles:*'], false),
('content_admin', 'Content Administrator', 'Content management', ARRAY['content:*', 'media:*'], false),
('analytics_admin', 'Analytics Administrator', 'Analytics and reporting', ARRAY['analytics:*', 'reports:*', 'dashboard:view'], false),
('support_admin', 'Support Administrator', 'Customer support', ARRAY['support:*', 'users:view', 'content:view'], false),
('viewer', 'Viewer', 'Read-only access', ARRAY['system:view', 'users:view', 'content:view', 'analytics:view'], true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions,
  is_default = EXCLUDED.is_default,
  updated_at = NOW();

-- =====================================================================
-- CREATE VIEW: users_with_roles
-- =====================================================================
-- Convenient view for querying users with their role information

CREATE OR REPLACE VIEW real_estate.users_with_roles AS
SELECT 
  u.id,
  u.email,
  u.name,
  u.phone,
  u.avatar,
  u.account_type,
  u.status,
  u.role_id,
  u.permissions AS user_permissions,
  u.company_name,
  u.created_at,
  u.updated_at,
  u.last_login_at,
  u.email_verified_at,
  r.name AS role_name,
  r.description AS role_description,
  r.permissions AS role_permissions
FROM real_estate.users u
LEFT JOIN real_estate.admin_roles r ON u.role_id = r.id;

-- =====================================================================
-- HELPER FUNCTION: Clean up expired sessions
-- =====================================================================

CREATE OR REPLACE FUNCTION real_estate.cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM real_estate.user_sessions
  WHERE expires_at < NOW() OR is_active = false;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- HELPER FUNCTION: Clean up old login history (optional)
-- =====================================================================

CREATE OR REPLACE FUNCTION real_estate.cleanup_old_login_history(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM real_estate.user_login_history
  WHERE login_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- GRANTS (Optional - adjust based on your Hasura setup)
-- =====================================================================
-- Grant necessary permissions to Hasura role
-- Uncomment and adjust role name as needed

-- GRANT USAGE ON SCHEMA real_estate TO hasura_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA real_estate TO hasura_user;
-- GRANT SELECT ON real_estate.users_with_roles TO hasura_user;
-- GRANT EXECUTE ON FUNCTION real_estate.cleanup_expired_sessions() TO hasura_user;
-- GRANT EXECUTE ON FUNCTION real_estate.cleanup_old_login_history(INTEGER) TO hasura_user;

-- =====================================================================
-- VERIFICATION QUERIES
-- =====================================================================
-- Run these to verify the setup was successful

-- Check tables
SELECT 'Tables created:' AS status;
SELECT tablename FROM pg_tables WHERE schemaname = 'real_estate' ORDER BY tablename;

-- Check roles
SELECT 'Default roles:' AS status;
SELECT id, name, array_length(permissions, 1) as permission_count FROM real_estate.admin_roles ORDER BY id;

-- Check indexes
SELECT 'Indexes created:' AS status;
SELECT indexname FROM pg_indexes WHERE schemaname = 'real_estate' ORDER BY indexname;

-- =====================================================================
-- NOTES FOR HASURA SETUP
-- =====================================================================
-- After running this script, you need to:
-- 1. Track all tables in Hasura Console
-- 2. Track the 'users_with_roles' view
-- 3. Set up relationships:
--    - users.role → admin_roles (object relationship)
--    - users.sessions → user_sessions (array relationship)
--    - users.login_history → user_login_history (array relationship)
-- 4. Configure permissions for your Hasura roles
-- =====================================================================

-- Script completed successfully
SELECT 'Administrator authentication system setup completed!' AS status;
