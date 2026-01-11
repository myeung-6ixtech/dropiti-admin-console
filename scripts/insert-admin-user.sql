-- =====================================================================
-- Insert Administrator User
-- =====================================================================
-- This script inserts the default administrator user into the database
-- 
-- Credentials:
--   Email:    admin@dropiti.com
--   Password: Dropiti@123
--
-- IMPORTANT: Change the password after first login!
-- =====================================================================

INSERT INTO real_estate.users (
  email, 
  password_hash, 
  password_salt, 
  account_type,
  status, 
  name, 
  role_id,
  email_verified_at
) VALUES (
  'admin@dropiti.com',
  'ebed419a9115f5cad94c40f74183f301eea1a15e25552334cbbccac8274e5a35a7fcce24eb1f6c294721b0fea7cc41660757fae0741ae925e3a3aee6049b8d3f',
  '887e674c9f5a02893a668d53607feb17a027ccf6d33e5aa1d900b29182f0cc9f',
  'administrator',
  'active',
  'System Administrator',
  'super_admin',
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  password_salt = EXCLUDED.password_salt,
  account_type = EXCLUDED.account_type,
  status = EXCLUDED.status,
  role_id = EXCLUDED.role_id,
  updated_at = NOW()
RETURNING id, email, name, role_id, account_type, created_at;

-- =====================================================================
-- Verification Query
-- =====================================================================
-- Run this to verify the user was created successfully:

-- SELECT 
--   id,
--   email,
--   name,
--   account_type,
--   status,
--   role_id,
--   created_at
-- FROM real_estate.users 
-- WHERE email = 'admin@dropiti.com';
