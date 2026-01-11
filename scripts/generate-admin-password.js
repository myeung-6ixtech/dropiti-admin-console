// =====================================================
// Administrator Password Hash Generator
// =====================================================
// This script generates a secure password hash and salt
// for creating administrator users in the database.
//
// Usage:
//   node scripts/generate-admin-password.js
//
// You can modify the password variable below to generate
// a hash for your desired password.
// =====================================================

const crypto = require('crypto');

function generatePasswordHash(password) {
  const salt = crypto.randomBytes(32).toString('hex');
  const iterations = 100000;
  const keylen = 64;
  const digest = 'sha512';
  
  const hash = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest).toString('hex');
  
  return { hash, salt };
}

// =====================================================
// CONFIGURATION
// =====================================================
// Change this to your desired password
const password = 'Dropiti@123';
const adminEmail = 'admin@dropiti.com';
const adminName = 'System Administrator';

// =====================================================
// GENERATE HASH
// =====================================================
console.log('\n' + '='.repeat(60));
console.log('ADMINISTRATOR PASSWORD GENERATOR');
console.log('='.repeat(60));
console.log('\nGenerating secure password hash...\n');

const result = generatePasswordHash(password);

console.log('✅ Password hash generated successfully!\n');
console.log('='.repeat(60));
console.log('CREDENTIALS');
console.log('='.repeat(60));
console.log('Email:   ', adminEmail);
console.log('Password:', password);
console.log('\n⚠️  IMPORTANT: Store these credentials securely!');
console.log('⚠️  Change the password after first login!\n');

console.log('='.repeat(60));
console.log('GENERATED VALUES');
console.log('='.repeat(60));
console.log('\nSalt:');
console.log(result.salt);
console.log('\nHash:');
console.log(result.hash);

console.log('\n' + '='.repeat(60));
console.log('SQL INSERT COMMAND');
console.log('='.repeat(60));
console.log(`
-- Copy and paste this into your PostgreSQL database:

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
  '${adminEmail}',
  '${result.hash}',
  '${result.salt}',
  'administrator',
  'active',
  '${adminName}',
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
`);

console.log('='.repeat(60));
console.log('NEXT STEPS');
console.log('='.repeat(60));
console.log(`
1. Ensure the real_estate schema and tables exist
   (Run: documentation/guides/administrator_users_export.sql)

2. Copy the SQL INSERT command above

3. Execute it in your PostgreSQL database

4. Login with:
   Email:    ${adminEmail}
   Password: ${password}

5. IMPORTANT: Change the password after first login!
`);
console.log('='.repeat(60) + '\n');

