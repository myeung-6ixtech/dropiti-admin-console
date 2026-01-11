# Administrator Authentication Setup Guide

This guide will help you set up the database-backed administrator authentication system for the Dropiti Admin Console.

## Overview

The authentication system uses:
- PostgreSQL database with Hasura GraphQL
- PBKDF2 password hashing (100,000 iterations)
- Session-based authentication with HTTP-only cookies
- Role-based access control (RBAC)
- Login history tracking and audit trails

## Prerequisites

- PostgreSQL database with Hasura GraphQL endpoint
- Node.js installed (for password generation script)
- Database credentials configured in `.env.local`

## Step 1: Configure Environment Variables

Ensure your `.env.local` file has these variables:

```env
# Database/Hasura Configuration
SDK_BACKEND_URL=https://your-hasura-instance.hasura.app/v1/graphql
SDK_HASURA_ADMIN_SECRET=your-admin-secret-here

# Optional: For backward compatibility (can be removed after migration)
ROOT_EMAIL=admin@dropiti.com
ROOT_PASSWORD=temporary-password
```

## Step 2: Set Up Database Schema

### Option A: Using the Export SQL File (Recommended)

Run the complete schema setup:

```bash
psql -h your-host -U your-user -d your-database -f documentation/guides/administrator_users_export.sql
```

This will create:
- ✅ `real_estate` schema
- ✅ All administrator tables (administrator_users, user_sessions, admin_roles, etc.)
- ✅ Default roles (super_admin, system_admin, user_admin, etc.)
- ✅ Indexes for performance
- ✅ Helper functions for permission checking
- ✅ Triggers for automatic timestamp updates

### Option B: Manual Setup

If you need to run sections individually:

1. **Create schema:**
   ```sql
   CREATE SCHEMA IF NOT EXISTS real_estate;
   ```

2. **Run sections 1-3** from `administrator_users_export.sql`:
   - Section 1: Schema Creation (tables)
   - Section 2: Triggers and Functions
   - Section 3: Default Data (admin roles)

## Step 3: Generate Administrator Password

Run the password generator script:

```bash
node scripts/generate-admin-password.js
```

This will output:
1. The generated salt and hash
2. An SQL INSERT command ready to use
3. Login credentials for testing

**Example output:**
```
============================================================
ADMINISTRATOR PASSWORD GENERATOR
============================================================

✅ Password hash generated successfully!

============================================================
CREDENTIALS
============================================================
Email:    admin@dropiti.com
Password: Admin@123

⚠️  IMPORTANT: Store these credentials securely!
⚠️  Change the password after first login!

============================================================
SQL INSERT COMMAND
============================================================

-- Copy and paste this into your PostgreSQL database:

INSERT INTO real_estate.administrator_users (
  email, 
  password_hash, 
  password_salt, 
  status, 
  name, 
  role_id,
  email_verified_at
) VALUES (
  'admin@dropiti.com',
  '8f3d2e5a7c1b9e4f6d8a2c5e9b7f3d1a6c8e2b4f7d9a3c5e8b1f4d6a9c2e5b8f',
  'a1b2c3d4e5f6g7h8i9j0',
  'active',
  'System Administrator',
  'super_admin',
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  password_salt = EXCLUDED.password_salt,
  updated_at = NOW()
RETURNING id, email, name, role_id, created_at;

============================================================
```

## Step 4: Insert Administrator User

Copy the SQL INSERT command from the script output and run it in your database:

```bash
psql -h your-host -U your-user -d your-database
```

Then paste and execute the INSERT command.

**Verify the insertion:**
```sql
SELECT id, email, name, status, role_id, created_at 
FROM real_estate.administrator_users 
WHERE email = 'admin@dropiti.com';
```

## Step 5: Configure Hasura Permissions (Optional)

If you're using Hasura and need to set up table permissions:

### For `real_estate_administrator_users` table:

**Select Permission (for authenticated admins):**
```json
{
  "id": {"_eq": "X-Hasura-User-Id"}
}
```

**Insert/Update/Delete Permission (for super_admin only):**
```json
{
  "role_id": {"_eq": "super_admin"}
}
```

### For `real_estate_user_sessions` table:

**Select Permission:**
```json
{
  "user_id": {"_eq": "X-Hasura-User-Id"}
}
```

**Insert Permission:**
```json
{} // Allow all authenticated users to create sessions
```

**Update/Delete Permission:**
```json
{
  "user_id": {"_eq": "X-Hasura-User-Id"}
}
```

## Step 6: Test the Authentication

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to the sign-in page:**
   ```
   http://localhost:3000/signin
   ```

3. **Log in with the generated credentials:**
   - Email: `admin@dropiti.com`
   - Password: `Admin@123` (or your custom password)

4. **Verify successful login:**
   - You should be redirected to `/dashboard`
   - Check the browser cookies for `admin_session`
   - Open the browser console and verify no errors

## Step 7: Verify Database Records

After a successful login, verify the database contains proper records:

```sql
-- Check the user record
SELECT id, email, name, status, role_id, last_login_at 
FROM real_estate.administrator_users 
WHERE email = 'admin@dropiti.com';

-- Check active sessions
SELECT id, user_id, token, expires_at, is_active, created_at 
FROM real_estate.user_sessions 
WHERE user_id = (
  SELECT id FROM real_estate.administrator_users 
  WHERE email = 'admin@dropiti.com'
) 
AND is_active = true;

-- Check login history
SELECT id, user_id, login_at, success, ip_address 
FROM real_estate.user_login_history 
WHERE user_id = (
  SELECT id FROM real_estate.administrator_users 
  WHERE email = 'admin@dropiti.com'
) 
ORDER BY login_at DESC 
LIMIT 5;
```

## Troubleshooting

### Issue: "Cannot connect to database"

**Solution:** Check your environment variables:
```bash
echo $SDK_BACKEND_URL
echo $SDK_HASURA_ADMIN_SECRET
```

Make sure they're correctly set in `.env.local` and restart your dev server.

### Issue: "Invalid email or password"

**Possible causes:**
1. User doesn't exist in database
2. Password hash was generated incorrectly
3. Email address doesn't match exactly

**Solution:**
```sql
-- Verify user exists
SELECT email, status FROM real_estate.administrator_users 
WHERE email = 'admin@dropiti.com';

-- If needed, regenerate password and update:
-- Run: node scripts/generate-admin-password.js
-- Then update the user record with new hash/salt
```

### Issue: "Account is inactive/suspended"

**Solution:** Activate the account:
```sql
UPDATE real_estate.administrator_users 
SET status = 'active' 
WHERE email = 'admin@dropiti.com';
```

### Issue: "Session expired immediately"

**Solution:** Check session expiration:
```sql
SELECT token, expires_at, is_active 
FROM real_estate.user_sessions 
WHERE user_id = (
  SELECT id FROM real_estate.administrator_users 
  WHERE email = 'admin@dropiti.com'
) 
ORDER BY created_at DESC 
LIMIT 1;
```

Make sure `expires_at` is in the future.

### Issue: GraphQL query errors

**Solution:** Verify Hasura tracking:
1. Open Hasura Console
2. Go to "Data" tab
3. Ensure these tables are tracked:
   - `real_estate_administrator_users`
   - `real_estate_user_sessions`
   - `real_estate_user_login_history`
   - `real_estate_admin_roles`

## Security Best Practices

### 1. Change Default Password

After first login, implement a password change feature or manually update:

```sql
-- Generate new password using the script
-- Then update:
UPDATE real_estate.administrator_users 
SET 
  password_hash = 'new_hash_here',
  password_salt = 'new_salt_here',
  updated_at = NOW()
WHERE email = 'admin@dropiti.com';
```

### 2. Enable HTTPS in Production

Ensure your `.env.production` has:
```env
NODE_ENV=production
```

This will set the `secure` flag on cookies, requiring HTTPS.

### 3. Regular Session Cleanup

Run this periodically (e.g., via cron job):

```sql
-- Clean up expired sessions
DELETE FROM real_estate.user_sessions 
WHERE expires_at < NOW() OR is_active = false;
```

### 4. Monitor Login Attempts

Check for suspicious activity:

```sql
-- Failed login attempts in last 24 hours
SELECT 
  user_id, 
  COUNT(*) as failed_attempts, 
  ip_address,
  MAX(login_at) as last_attempt
FROM real_estate.user_login_history 
WHERE success = false 
  AND login_at > NOW() - INTERVAL '24 hours'
GROUP BY user_id, ip_address
HAVING COUNT(*) > 5
ORDER BY failed_attempts DESC;
```

### 5. Implement Rate Limiting

Consider adding rate limiting at the API level or using Hasura rate limiting features.

## Additional Features

### Creating Additional Administrators

Use the password generator script and insert new users:

```bash
# Edit the script to change email and name
node scripts/generate-admin-password.js

# Then run the generated SQL INSERT
```

### Role Management

View all available roles:

```sql
SELECT id, name, description, permissions 
FROM real_estate.admin_roles 
ORDER BY name;
```

Assign a different role to a user:

```sql
UPDATE real_estate.administrator_users 
SET role_id = 'user_admin' 
WHERE email = 'admin@dropiti.com';
```

### Custom Permissions

Override permissions for a specific user:

```sql
UPDATE real_estate.administrator_users 
SET permissions = ARRAY['users:view', 'users:create', 'analytics:view'] 
WHERE email = 'admin@dropiti.com';
```

## API Endpoints Reference

The authentication system provides these endpoints:

### POST `/api/login`
Authenticate and create session

**Request:**
```json
{
  "email": "admin@dropiti.com",
  "password": "Admin@123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "admin@dropiti.com",
    "name": "System Administrator",
    "role": "super_admin",
    "permissions": ["*"]
  }
}
```

### GET `/api/auth/check`
Verify current session

**Response:**
```json
{
  "isAuthenticated": true,
  "user": {
    "id": "uuid",
    "email": "admin@dropiti.com",
    "name": "System Administrator",
    "role": "super_admin",
    "permissions": ["*"]
  }
}
```

### POST `/api/auth/logout`
Invalidate session

**Response:**
```json
{
  "success": true
}
```

## Support

For issues or questions:
1. Check this guide thoroughly
2. Review the database logs
3. Check Hasura GraphQL logs
4. Review browser console for errors
5. Refer to `documentation/guides/administrator_users.md` for detailed schema information

## Next Steps

After successful authentication setup:

1. ✅ Implement password reset functionality
2. ✅ Add profile management features
3. ✅ Implement permission-based UI components
4. ✅ Add two-factor authentication (2FA)
5. ✅ Set up automated session cleanup
6. ✅ Implement audit log viewing

---

**Last Updated:** January 4, 2026  
**Version:** 1.0

