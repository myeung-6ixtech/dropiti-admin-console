import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = 'sha512';

function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const passwordSalt = salt || crypto.randomBytes(32).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, passwordSalt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST)
    .toString('hex');
  return { hash, salt: passwordSalt };
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    // Build update object
    const updateObject: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) updateObject.name = updates.name;
    if (updates.email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updates.email)) {
        return NextResponse.json(
          { success: false, error: "Invalid email format" },
          { status: 400 }
        );
      }
      updateObject.email = updates.email.toLowerCase().trim();
    }
    if (updates.phone !== undefined) updateObject.phone = updates.phone || null;
    if (updates.avatar !== undefined) updateObject.avatar = updates.avatar || null;
    if (updates.address !== undefined) updateObject.address = updates.address || null;
    if (updates.business_type !== undefined) updateObject.business_type = updates.business_type || null;
    if (updates.company_name !== undefined) updateObject.company_name = updates.company_name || null;
    if (updates.description !== undefined) updateObject.description = updates.description || null;
    if (updates.status !== undefined) updateObject.status = updates.status;
    if (updates.role_id !== undefined) updateObject.role_id = updates.role_id;
    if (updates.permissions !== undefined) updateObject.permissions = updates.permissions;

    // Handle password update
    if (updates.password) {
      if (updates.password.length < 8) {
        return NextResponse.json(
          { success: false, error: "Password must be at least 8 characters" },
          { status: 400 }
        );
      }
      const { hash: password_hash, salt: password_salt } = hashPassword(updates.password);
      updateObject.password_hash = password_hash;
      updateObject.password_salt = password_salt;
    }

    const mutation = `
      mutation UpdateAdministratorUser($id: uuid!, $updates: real_estate_administrator_users_set_input!) {
        update_real_estate_administrator_users_by_pk(
          pk_columns: { id: $id },
          _set: $updates
        ) {
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
          updated_at
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
          id,
          updates: updateObject,
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
      data: data.data?.update_real_estate_administrator_users_by_pk,
      message: "User updated successfully",
    });
  } catch (error: unknown) {
    console.error('Update user error:', error);
    const errorObj = error as { message?: string };
    return NextResponse.json(
      { success: false, error: errorObj.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}
