# 🚀 Administrator Authentication - Quick Start

Get your administrator authentication system up and running in 5 minutes!

## 📋 Prerequisites

- ✅ PostgreSQL database
- ✅ Hasura GraphQL endpoint
- ✅ Node.js installed (v14+)
- ✅ Environment variables configured

## 🎯 Quick Setup (5 Steps)

### Step 1: Create Database Schema (2 min)

```bash
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DATABASE \
  -f documentation/guides/administrator_users_export.sql
```

This creates all tables, roles, and indexes in the `real_estate` schema.

### Step 2: Configure Environment (30 sec)

Create or update `.env.local`:

```env
SDK_BACKEND_URL=https://your-hasura-instance.hasura.app/v1/graphql
SDK_HASURA_ADMIN_SECRET=your-hasura-admin-secret
NODE_ENV=development
```

### Step 3: Generate Admin Password (30 sec)

```bash
node scripts/generate-admin-password.js
```

Copy the entire SQL INSERT command from the output.

### Step 4: Insert Admin User (30 sec)

Run the SQL command from Step 3 in your PostgreSQL database:

```bash
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DATABASE
# Paste the SQL INSERT command and press Enter
```

### Step 5: Test Login (1 min)

```bash
# Start the development server
npm run dev

# Open browser to http://localhost:3000/signin

# Login with:
# Email: admin@dropiti.com
# Password: Admin@123 (or your custom password)
```

## 🎉 Success!

If you can log in and see the dashboard, you're all set!

## 📚 Detailed Documentation

For more detailed information:

- **Complete Setup Guide:** [`ADMIN_AUTH_SETUP.md`](./ADMIN_AUTH_SETUP.md)
- **Implementation Details:** [`IMPLEMENTATION_SUMMARY.md`](./IMPLEMENTATION_SUMMARY.md)
- **Schema Documentation:** [`documentation/guides/administrator_users.md`](./documentation/guides/administrator_users.md)
- **Scripts Guide:** [`scripts/README.md`](./scripts/README.md)

## 🔧 Common Issues

### "Cannot connect to database"
- Check `SDK_BACKEND_URL` in `.env.local`
- Verify Hasura is accessible

### "Invalid email or password"
- Verify user exists: 
  ```sql
  SELECT * FROM real_estate.administrator_users WHERE email = 'admin@dropiti.com';
  ```
- Check password hash was generated correctly
- Ensure exact email match (case-sensitive)

### "Schema does not exist"
- Run Step 1 again (database schema creation)
- Verify with: `\dn` in psql (should see `real_estate`)

## 🛡️ Security Notes

⚠️ **Important Security Steps:**

1. **Change default password immediately** after first login
2. **Never commit** `.env.local` to version control
3. **Use strong passwords** (12+ characters, mixed case, numbers, symbols)
4. **Enable HTTPS** in production
5. **Review login history** regularly

## 🔄 Next Steps

After successful login:

1. ✅ Change your password
2. ✅ Create additional administrator accounts
3. ✅ Assign appropriate roles
4. ✅ Configure Hasura permissions
5. ✅ Enable production security features

## 📊 Verify Installation

Check database records:

```sql
-- Verify admin user
SELECT id, email, name, status, role_id, created_at 
FROM real_estate.administrator_users;

-- Check active sessions
SELECT COUNT(*) FROM real_estate.user_sessions 
WHERE is_active = true AND expires_at > NOW();

-- Review login history
SELECT * FROM real_estate.user_login_history 
ORDER BY login_at DESC LIMIT 5;
```

## 🆘 Need Help?

1. Check the [Troubleshooting section](./ADMIN_AUTH_SETUP.md#troubleshooting) in ADMIN_AUTH_SETUP.md
2. Review [Common Issues](#common-issues) above
3. Verify all prerequisites are met
4. Check database and Hasura logs

## 📝 What Was Implemented

✅ Database-backed authentication  
✅ PBKDF2 password hashing (100k iterations)  
✅ Session management with tokens  
✅ Role-based access control (7 roles)  
✅ Login attempt tracking  
✅ Account status management  
✅ HTTP-only secure cookies  
✅ GraphQL integration  

## 🎓 Learn More

### Understanding the System

The authentication system consists of:

- **Database Layer:** PostgreSQL tables in `real_estate` schema
- **API Layer:** Next.js API routes (`/api/login`, `/api/auth/check`, `/api/auth/logout`)
- **Client Layer:** React Context for state management
- **Security Layer:** PBKDF2 hashing, session tokens, HTTP-only cookies

### Key Files

```
dropiti-admin-console/
├── src/
│   ├── app/api/
│   │   ├── login/route.ts          ← Login endpoint
│   │   └── auth/
│   │       ├── check/route.ts      ← Session verification
│   │       └── logout/route.ts     ← Logout endpoint
│   └── context/
│       └── AuthContext.tsx         ← Client-side auth state
├── scripts/
│   ├── generate-admin-password.js  ← Password generator
│   └── insert-admin-user.sql       ← SQL template
└── documentation/guides/
    └── administrator_users_export.sql  ← Database schema
```

## 🔐 Default Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **super_admin** | Full system access | All (*) |
| **system_admin** | System administration | System, users, roles |
| **user_admin** | User management | Users, merchants |
| **content_admin** | Content management | Restaurants, reviews |
| **analytics_admin** | Analytics access | Reports, metrics |
| **support_admin** | Customer support | Support tickets |
| **viewer** | Read-only | View only |

## 💡 Pro Tips

1. **Multiple Environments:** Use different `.env` files for dev/staging/prod
2. **Session Cleanup:** Set up a cron job to delete expired sessions
3. **Monitoring:** Track failed login attempts for security
4. **Backups:** Regular database backups before major changes
5. **Testing:** Test authentication in incognito mode

---

**Ready to get started?** Run the 5 steps above! 🚀

**Questions?** Check [`ADMIN_AUTH_SETUP.md`](./ADMIN_AUTH_SETUP.md) for detailed guidance.

---

*Last Updated: January 4, 2026*

