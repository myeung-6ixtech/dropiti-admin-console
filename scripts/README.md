# Scripts Directory

This directory contains utility scripts for managing the Dropiti Admin Console.

## Available Scripts

### 1. generate-admin-password.js

Generates secure password hashes for administrator accounts using PBKDF2.

**Usage:**
```bash
node scripts/generate-admin-password.js
```

**What it does:**
- Generates a secure 32-byte random salt
- Creates a PBKDF2 hash with 100,000 iterations
- Outputs ready-to-use SQL INSERT command
- Displays credentials for testing

**Configuration:**
Edit the script to customize:
```javascript
const password = 'Admin@123';      // Change this
const adminEmail = 'admin@dropiti.com';  // Change this
const adminName = 'System Administrator'; // Change this
```

**Output:**
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

============================================================
SQL INSERT COMMAND
============================================================

INSERT INTO real_estate.administrator_users (...)
VALUES (...);
```

**Security:**
- Uses PBKDF2 with SHA-512
- 100,000 iterations (industry standard)
- 64-byte key length
- Unique random salt per password

---

### 2. insert-admin-user.sql

Template SQL script for inserting an administrator user.

**⚠️ Important:** This is a template only. You must:
1. Run `generate-admin-password.js` first
2. Copy the generated hash and salt
3. Replace the placeholders in this SQL file

**Usage:**
```bash
# 1. Generate password first
node scripts/generate-admin-password.js

# 2. Copy the generated SQL command, or manually edit insert-admin-user.sql
# 3. Run in PostgreSQL
psql -h your-host -U your-user -d your-database -f scripts/insert-admin-user.sql
```

**What it does:**
- Verifies schema and tables exist
- Checks that super_admin role exists
- Inserts the administrator user
- Displays verification query
- Shows next steps

---

## Quick Setup Guide

### Prerequisites
- PostgreSQL database with Hasura
- Node.js installed
- Database schema created (run `administrator_users_export.sql`)

### Step-by-Step Process

#### 1. Create Database Schema
```bash
psql -h your-host -U your-user -d your-database \
  -f documentation/guides/administrator_users_export.sql
```

This creates:
- `real_estate` schema
- All necessary tables
- Default admin roles
- Indexes and triggers

#### 2. Generate Password Hash
```bash
node scripts/generate-admin-password.js
```

Take note of the output, especially:
- The salt value
- The hash value
- The complete SQL INSERT command

#### 3. Insert Administrator User

**Option A - Quick (Recommended):**
Copy the entire SQL INSERT command from step 2 output and run it:
```bash
psql -h your-host -U your-user -d your-database
# Then paste the SQL command
```

**Option B - Using Template:**
1. Edit `scripts/insert-admin-user.sql`
2. Replace `YOUR_GENERATED_HASH_HERE` with the hash from step 2
3. Replace `YOUR_GENERATED_SALT_HERE` with the salt from step 2
4. Run: `psql -h your-host -U your-user -d your-database -f scripts/insert-admin-user.sql`

#### 4. Verify Installation
```sql
SELECT id, email, name, status, role_id 
FROM real_estate.administrator_users 
WHERE email = 'admin@dropiti.com';
```

#### 5. Test Login
1. Configure `.env.local`:
   ```env
   SDK_BACKEND_URL=https://your-hasura-instance.hasura.app/v1/graphql
   SDK_HASURA_ADMIN_SECRET=your-admin-secret
   ```

2. Start dev server:
   ```bash
   npm run dev
   ```

3. Navigate to: `http://localhost:3000/signin`

4. Login with your credentials:
   - Email: `admin@dropiti.com`
   - Password: `Admin@123` (or your custom password)

---

## Creating Additional Administrators

To create more administrator users:

1. **Edit the password generator script:**
   ```javascript
   const password = 'NewPassword@456';
   const adminEmail = 'john@dropiti.com';
   const adminName = 'John Smith';
   ```

2. **Run the script:**
   ```bash
   node scripts/generate-admin-password.js
   ```

3. **Execute the generated SQL command**

4. **Optionally assign a different role:**
   ```sql
   UPDATE real_estate.administrator_users 
   SET role_id = 'user_admin'  -- or any other role
   WHERE email = 'john@dropiti.com';
   ```

---

## Available Roles

| Role ID | Name | Description | Permissions |
|---------|------|-------------|-------------|
| `super_admin` | Super Administrator | Full system access | `*` (all) |
| `system_admin` | System Administrator | System-level admin | System, users, roles, analytics, settings |
| `user_admin` | User Administrator | User management | Users, merchants, administrators, roles |
| `content_admin` | Content Administrator | Content management | Restaurants, reviews, content, categories |
| `analytics_admin` | Analytics Administrator | Analytics access | Analytics, reports, metrics, dashboard |
| `support_admin` | Support Administrator | Customer support | Support, tickets, view-only on users |
| `viewer` | Viewer | Read-only access | View-only permissions |

---

## Security Best Practices

### 1. Change Default Passwords
Always change the password after first login:
```bash
# Generate new password
node scripts/generate-admin-password.js

# Update in database
psql -c "UPDATE real_estate.administrator_users 
SET password_hash = 'new_hash', password_salt = 'new_salt' 
WHERE email = 'admin@dropiti.com';"
```

### 2. Use Strong Passwords
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, symbols
- Avoid common words or patterns

### 3. Limit Super Admin Access
- Create specific roles for most users
- Only grant `super_admin` when necessary
- Review role assignments regularly

### 4. Monitor Login Activity
```sql
-- Check recent login attempts
SELECT * FROM real_estate.user_login_history 
ORDER BY login_at DESC LIMIT 20;

-- Check failed attempts
SELECT * FROM real_estate.user_login_history 
WHERE success = false 
ORDER BY login_at DESC;
```

### 5. Clean Up Old Sessions
```sql
-- Remove expired sessions
DELETE FROM real_estate.user_sessions 
WHERE expires_at < NOW() OR is_active = false;
```

---

## Troubleshooting

### Script Errors

**Error:** `Cannot find module 'crypto'`
- **Solution:** Crypto is built into Node.js, ensure you're running Node.js 14+
- **Check version:** `node --version`

**Error:** `Permission denied`
- **Solution:** Make script executable or run with `node`
- **Fix:** `chmod +x scripts/generate-admin-password.js`

### Database Errors

**Error:** `schema "real_estate" does not exist`
- **Solution:** Run the schema creation script first
- **Command:** `psql ... -f documentation/guides/administrator_users_export.sql`

**Error:** `relation "administrator_users" does not exist`
- **Solution:** Tables weren't created properly
- **Check:** `\dt real_estate.*` in psql
- **Fix:** Re-run schema creation script

**Error:** `duplicate key value violates unique constraint`
- **Solution:** User already exists
- **Check:** `SELECT * FROM real_estate.administrator_users WHERE email = 'admin@dropiti.com';`
- **Fix:** Update existing user or use different email

### Authentication Errors

**Error:** `Invalid email or password`
- **Possible causes:**
  1. User doesn't exist in database
  2. Password hash/salt mismatch
  3. Typo in email address

- **Debug:**
  ```sql
  -- Check if user exists
  SELECT email, status FROM real_estate.administrator_users 
  WHERE email = 'admin@dropiti.com';
  
  -- Check password hash
  SELECT LENGTH(password_hash), LENGTH(password_salt) 
  FROM real_estate.administrator_users 
  WHERE email = 'admin@dropiti.com';
  -- Should return: 128 (hash) and 64 (salt)
  ```

**Error:** `Account is inactive`
- **Solution:** Activate the account
- **Command:**
  ```sql
  UPDATE real_estate.administrator_users 
  SET status = 'active' 
  WHERE email = 'admin@dropiti.com';
  ```

---

## Support

For additional help:
- See `ADMIN_AUTH_SETUP.md` for detailed setup guide
- See `IMPLEMENTATION_SUMMARY.md` for system overview
- See `documentation/guides/administrator_users.md` for schema details

---

**Last Updated:** January 4, 2026

