import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

// PBKDF2 Configuration (matches documentation)
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = 'sha512';

// Session Configuration
const SESSION_EXPIRY_HOURS = 24;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

// Helper: Verify password using PBKDF2
function verifyPassword(password: string, hash: string, salt: string): boolean {
  const derivedHash = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST)
    .toString('hex');
  return derivedHash === hash;
}

// Helper: Generate cryptographically secure token
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Helper: Get client IP address
function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         request.headers.get('x-real-ip') || 
         request.ip ||
         'unknown';
}

// Helper: Check if user is rate limited
async function checkRateLimit(email: string): Promise<{ limited: boolean; reason?: string }> {
  try {
    const sinceTime = new Date(Date.now() - LOCKOUT_DURATION_MINUTES * 60 * 1000).toISOString();
    
    const query = `
      query CheckRateLimit($since: timestamptz!) {
        real_estate_user_login_history(
          where: {
            login_at: { _gte: $since },
            success: { _eq: false }
          }
        ) {
          id
        }
      }
    `;

    const response = await fetch(process.env.NEXT_PUBLIC_HASURA_GRAPHQL_API_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': process.env.NEXT_PUBLIC_HASURA_GRAPHQL_ADMIN_SECRET!,
      },
      body: JSON.stringify({
        query,
        variables: { since: sinceTime }
      }),
    });

    const data = await response.json();
    const failedAttempts = data.data?.real_estate_user_login_history?.length || 0;

    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
      return {
        limited: true,
        reason: `Too many failed attempts. Please try again in ${LOCKOUT_DURATION_MINUTES} minutes.`
      };
    }

    return { limited: false };
  } catch (error) {
    console.error('Rate limit check error:', error);
    return { limited: false }; // Fail open for availability
  }
}

// Helper: Log login attempt
async function logLoginAttempt(
  userId: string | null,
  email: string,
  ipAddress: string,
  userAgent: string,
  success: boolean,
  failureReason: string | null
) {
  try {
    const mutation = `
      mutation LogLoginAttempt($object: real_estate_user_login_history_insert_input!) {
        insert_real_estate_user_login_history_one(object: $object) {
          id
        }
      }
    `;

    await fetch(process.env.NEXT_PUBLIC_HASURA_GRAPHQL_API_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': process.env.NEXT_PUBLIC_HASURA_GRAPHQL_ADMIN_SECRET!,
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          object: {
            user_id: userId,
            ip_address: ipAddress,
            user_agent: userAgent,
            success,
            failure_reason: failureReason || `Attempt for email: ${email}`,
          }
        }
      }),
    });
  } catch (error) {
    console.error('Failed to log login attempt:', error);
  }
}

// Helper: Get role information
async function getRoleInfo(roleId: string) {
  try {
    const query = `
      query GetRole($id: String!) {
        real_estate_admin_roles_by_pk(id: $id) {
          id
          name
          permissions
        }
      }
    `;

    const response = await fetch(process.env.NEXT_PUBLIC_HASURA_GRAPHQL_API_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': process.env.NEXT_PUBLIC_HASURA_GRAPHQL_ADMIN_SECRET!,
      },
      body: JSON.stringify({
        query,
        variables: { id: roleId }
      }),
    });

    const data = await response.json();
    return data.data?.real_estate_admin_roles_by_pk || null;
  } catch (error) {
    console.error('Failed to get role info:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Get client info
    const ipAddress = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Check rate limiting
    const rateLimitCheck = await checkRateLimit(email);
    if (rateLimitCheck.limited) {
      return NextResponse.json(
        { error: rateLimitCheck.reason },
        { status: 429 }
      );
    }

    // Query administrator user from database
    const query = `
      query GetAdminUser($email: String!) {
        real_estate_administrator_users(
          where: {
            email: { _eq: $email }
          }
          limit: 1
        ) {
          id
          email
          password_hash
          password_salt
          name
          phone
          avatar
          status
          role_id
          permissions
          last_login_at
          email_verified_at
        }
      }
    `;

    // Execute GraphQL query
    const graphqlResponse = await fetch(process.env.NEXT_PUBLIC_HASURA_GRAPHQL_API_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': process.env.NEXT_PUBLIC_HASURA_GRAPHQL_ADMIN_SECRET!,
      },
      body: JSON.stringify({
        query,
        variables: { email: email.toLowerCase().trim() }
      }),
    });

    if (!graphqlResponse.ok) {
      throw new Error('Database query failed');
    }

    const graphqlData = await graphqlResponse.json();
    
    if (graphqlData.errors) {
      console.error('GraphQL errors:', graphqlData.errors);
      throw new Error('Database query failed');
    }

    const users = graphqlData.data?.real_estate_administrator_users || [];

    // User not found
    if (users.length === 0) {
      await logLoginAttempt(null, email, ipAddress, userAgent, false, 'Administrator account not found');
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const user = users[0];

    // Check account status
    if (user.status !== 'active') {
      await logLoginAttempt(user.id, email, ipAddress, userAgent, false, `Account status: ${user.status}`);
      return NextResponse.json(
        { error: `Account is ${user.status}. Please contact support.` },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = verifyPassword(
      password,
      user.password_hash,
      user.password_salt
    );

    if (!isPasswordValid) {
      await logLoginAttempt(user.id, email, ipAddress, userAgent, false, 'Invalid password');
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Get role information
    const role = user.role_id ? await getRoleInfo(user.role_id) : null;

    // Merge permissions (role permissions + user-specific overrides)
    const allPermissions = [
      ...(role?.permissions || []),
      ...(user.permissions || [])
    ];
    const uniquePermissions = [...new Set(allPermissions)];

    // Generate session tokens
    const sessionToken = generateToken();
    const refreshToken = generateToken();
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000);

    // Create session in database
    const createSessionMutation = `
      mutation CreateSession($object: real_estate_user_sessions_insert_input!) {
        insert_real_estate_user_sessions_one(object: $object) {
          id
          token
        }
      }
    `;

    const sessionResponse = await fetch(process.env.NEXT_PUBLIC_HASURA_GRAPHQL_API_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': process.env.NEXT_PUBLIC_HASURA_GRAPHQL_ADMIN_SECRET!,
      },
      body: JSON.stringify({
        query: createSessionMutation,
        variables: {
          object: {
            user_id: user.id,
            token: sessionToken,
            refresh_token: refreshToken,
            expires_at: expiresAt.toISOString(),
            ip_address: ipAddress,
            user_agent: userAgent,
            is_active: true,
          }
        }
      }),
    });

    if (!sessionResponse.ok) {
      throw new Error('Failed to create session');
    }

    // Update last login time
    const updateUserMutation = `
      mutation UpdateUserLastLogin($id: uuid!, $last_login_at: timestamptz!) {
        update_real_estate_administrator_users_by_pk(
          pk_columns: { id: $id },
          _set: { last_login_at: $last_login_at }
        ) {
          id
        }
      }
    `;

    await fetch(process.env.NEXT_PUBLIC_HASURA_GRAPHQL_API_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': process.env.NEXT_PUBLIC_HASURA_GRAPHQL_ADMIN_SECRET!,
      },
      body: JSON.stringify({
        query: updateUserMutation,
        variables: {
          id: user.id,
          last_login_at: new Date().toISOString()
        }
      }),
    });

    // Log successful login
    await logLoginAttempt(user.id, email, ipAddress, userAgent, true, null);

    // Create response
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        role: role ? { id: role.id, name: role.name } : null,
        permissions: uniquePermissions,
        lastLogin: user.last_login_at,
      }
    });

    // Set secure HTTP-only cookie with session token
    const cookieStore = await cookies();
    cookieStore.set("admin_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: SESSION_EXPIRY_HOURS * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Authentication failed. Please try again later." },
      { status: 500 }
    );
  }
}
