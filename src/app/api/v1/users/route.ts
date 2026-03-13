import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/v1/users
 * Lists users from real_estate_user (Hasura).
 * Query params:
 *   - role (optional): filter by user_profile.defaultRole (e.g. 'user', 'admin'). Omit to return all users.
 *   - limit, offset, search: pagination and search (email, display_name, first_name, last_name).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");
    const search = (searchParams.get("search") || "").trim();
    const role = (searchParams.get("role") || "").trim() || null;

    const searchPattern = search ? `%${search}%` : "%";

    // Build where: optional role (via user_profile.defaultRole) + optional search
    const conditions: string[] = [];
    if (role) {
      conditions.push("{ user_profile: { defaultRole: { _eq: $role } } }");
    }
    if (search) {
      conditions.push(
        `{ _or: [ { email: { _ilike: $search } }, { display_name: { _ilike: $search } }, { first_name: { _ilike: $search } }, { last_name: { _ilike: $search } } ] }`
      );
    }
    const whereClause =
      conditions.length > 0 ? `where: { _and: [ ${conditions.join(", ")} ] }` : "";

    const varDecls: string[] = ["$limit: Int!", "$offset: Int!"];
    if (search) varDecls.push("$search: String!");
    if (role) varDecls.push("$role: String!");
    const variables: Record<string, unknown> = { limit, offset };
    if (search) variables.search = searchPattern;
    if (role) variables.role = role;

    const query = `
      query GetRealEstateUsers(${varDecls.join(", ")}) {
        real_estate_user(
          ${whereClause}
          limit: $limit
          offset: $offset
          order_by: { created_at: desc }
        ) {
          nhost_user_id
          uuid
          email
          display_name
          first_name
          last_name
          phone_number
          photo_url
          location
          created_at
          updated_at
          user_profile {
            defaultRole
          }
        }
        real_estate_user_aggregate( ${whereClause} ) {
          aggregate {
            count
          }
        }
      }
    `;

    const response = await fetch(process.env.HASURA_ENDPOINT!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET!,
      },
      body: JSON.stringify({ query, variables }),
    });

    const data = await response.json();

    if (data.errors?.length) {
      return NextResponse.json(
        { success: false, error: data.errors[0]?.message ?? "GraphQL error" },
        { status: 500 }
      );
    }

    const list = data.data?.real_estate_user ?? [];
    const total =
      data.data?.real_estate_user_aggregate?.aggregate?.count ?? list.length;

    // Map to a consistent API shape (id = nhost_user_id for URLs, name from display_name or first+last)
    const mapped = list.map(
      (u: {
        nhost_user_id?: string;
        uuid?: string;
        email?: string;
        display_name?: string;
        first_name?: string;
        last_name?: string;
        phone_number?: string;
        photo_url?: string;
        location?: string;
        created_at?: string;
        updated_at?: string;
        user_profile?: { defaultRole?: string } | null;
      }) => {
        const name =
          u.display_name?.trim() ||
          [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
          null;
        return {
          id: u.nhost_user_id ?? u.uuid,
          email: u.email ?? null,
          name,
          default_role: u.user_profile?.defaultRole ?? null,
          avatar: u.photo_url ?? null,
          phone: u.phone_number ?? null,
          address: u.location ?? null,
          created_at: u.created_at ?? null,
          updated_at: u.updated_at ?? null,
          status: null,
        };
      }
    );

    return NextResponse.json({
      success: true,
      data: mapped,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error: unknown) {
    console.error("List users error:", error);
    const errorObj = error as { message?: string };
    return NextResponse.json(
      { success: false, error: errorObj.message ?? "Failed to list users" },
      { status: 500 }
    );
  }
}
