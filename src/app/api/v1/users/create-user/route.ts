import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = 'sha512';

function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST)
    .toString('hex');
  return { hash, salt };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      email, 
      password, 
      name, 
      phone, 
      avatar, 
      address,
      business_type,
      company_name,
      description,
      role_id, 
      status, 
      permissions 
    } = body;

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Hash password
    const { hash: password_hash, salt: password_salt } = hashPassword(password);

    const mutation = `
      mutation CreateAdministratorUser($object: real_estate_administrator_users_insert_input!) {
        insert_real_estate_administrator_users_one(object: $object) {
          id
          email
          name
          phone
          avatar
          address
          business_type
          company_name
          description
          status
          role_id
          permissions
          created_at
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
        query: mutation,
        variables: {
          object: {
            email: email.toLowerCase().trim(),
            password_hash,
            password_salt,
            name,
            phone: phone || null,
            avatar: avatar || null,
            address: address || null,
            business_type: business_type || null,
            company_name: company_name || null,
            description: description || null,
            role_id: role_id || 'viewer',
            status: status || 'active',
            permissions: permissions || [],
          },
        },
      }),
    });

    const data = await response.json();
    
    if (data.errors) {
      return NextResponse.json(
        { success: false, error: data.errors[0]?.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data.data?.insert_real_estate_administrator_users_one,
      message: "User created successfully",
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}
