import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "../../utils/response";

const APP_USER_FIELDS = `
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
`;

const GET_APP_USER = `
  query GetAppUser($id: uuid!) {
    real_estate_user(where: { nhost_user_id: { _eq: $id } }, limit: 1) {
      ${APP_USER_FIELDS}
    }
  }
`;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return errorResponse("id is required", undefined, 400);
    }

    const response = await fetch(process.env.HASURA_ENDPOINT!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET!,
      },
      body: JSON.stringify({
        query: GET_APP_USER,
        variables: { id },
      }),
    });

    const data = await response.json();

    if (data.errors?.length) {
      return errorResponse(
        data.errors[0]?.message ?? "GraphQL error",
        undefined,
        500
      );
    }

    const list = data.data?.real_estate_user ?? [];
    const u = list[0];

    if (!u) {
      return errorResponse("User not found", undefined, 404);
    }

    const name =
      u.display_name?.trim() ||
      [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
      null;

    const mapped = {
      id: u.nhost_user_id ?? u.uuid,
      uuid: u.uuid ?? null,
      email: u.email ?? null,
      name,
      default_role: u.user_profile?.defaultRole ?? null,
      avatar: u.photo_url ?? null,
      phone: u.phone_number ?? null,
      address: u.location ?? null,
      created_at: u.created_at ?? null,
      updated_at: u.updated_at ?? null,
    };

    return successResponse(mapped);
  } catch (error: unknown) {
    console.error("Get app user error:", error);
    const errorObj = error as { message?: string };
    return errorResponse(
      errorObj.message ?? "Failed to fetch app user",
      undefined,
      500
    );
  }
}
